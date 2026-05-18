import { useAppStore } from "../../app/store/useAppStore";
import { SourceType, Track, PlaybackState } from "../../shared/types/music";
import { MusicProvider } from "./music-provider";

export class PlayerOrchestrator {
  private static instance: PlayerOrchestrator;
  private providers: Map<SourceType, MusicProvider> = new Map();
  private initializedProviders: Set<SourceType> = new Set();
  private activeSource: SourceType | null = null;
  private syncIntervalId: number | null = null;
  private readonly syncIntervalMs = 250;
  private isAutoplayAdvancing = false;
  private crossfadeTriggeredAt: number | null = null;
  // Tracks the last track ID the provider actually reported during this session.
  // Used to detect real "track ended" events (provider had track → provider has null)
  // vs. the app-startup case where the store has a persisted currentTrack but the
  // provider has never had one yet.
  private lastProviderTrackId: string | null = null;

  private constructor() {}

  public static getInstance(): PlayerOrchestrator {
    if (!PlayerOrchestrator.instance) {
      PlayerOrchestrator.instance = new PlayerOrchestrator();
    }
    return PlayerOrchestrator.instance;
  }

  public registerProvider(source: SourceType, provider: MusicProvider): void {
    if (provider.source !== source) {
      throw new Error(
        `Provider source mismatch: expected ${source}, got ${provider.source}`
      );
    }

    this.providers.set(source, provider);
  }

  public async setActiveProvider(source: SourceType): Promise<void> {
    const provider = this.providers.get(source);

    if (!provider) {
      throw new Error(`Provider for source ${source} not registered.`);
    }

    if (this.activeSource && this.activeSource !== source) {
      const prevProvider = this.providers.get(this.activeSource);
      if (prevProvider) {
        try {
          await prevProvider.pause();
        } catch (error) {
          console.warn(`Could not pause previous provider ${this.activeSource}:`, error);
        }
      }
    }

    try {
      if (!this.initializedProviders.has(source)) {
        await provider.initialize();
        this.initializedProviders.add(source);
      }

      this.activeSource = source;
      const store = useAppStore.getState();
      store.setSource(source);
      await provider.setVolume(store.volume);

      await this.syncStoreWithProvider();
      this.startSyncLoop();
    } catch (error) {
      console.error(`Failed to initialize provider ${source}:`, error);
      throw error;
    }
  }

  private get activeProvider(): MusicProvider {
    if (!this.activeSource) {
      throw new Error("No active provider selected.");
    }

    const provider = this.providers.get(this.activeSource);

    if (!provider) {
      throw new Error(`Active provider ${this.activeSource} is not registered.`);
    }

    return provider;
  }

  private async syncStoreWithProvider(): Promise<void> {
    if (!this.activeSource) return;

    const provider = this.activeProvider;
    const store = useAppStore.getState();

    const [currentTrack, playbackState, progressMs, durationMs] = await Promise.all([
      provider.getCurrentTrack(),
      provider.getPlaybackState(),
      provider.getProgressMs(),
      provider.getDurationMs(),
    ]);

    // Capture and advance the provider-track-id cursor.
    const previousProviderTrackId = this.lastProviderTrackId;
    this.lastProviderTrackId = currentTrack?.id ?? null;

    const previousStoreTrack = store.currentTrack;

    // Only clear the store's currentTrack when the PROVIDER genuinely had a track
    // and lost it (real "track ended"). Otherwise — e.g. on the first sync after
    // app startup when the store has a persisted track but the provider is empty —
    // preserve what the store already has so the user can see and resume it.
    if (currentTrack !== null) {
      store.setCurrentTrack(currentTrack);
    } else if (previousProviderTrackId !== null) {
      store.setCurrentTrack(null);
    }
    store.setPlaybackState(playbackState);
    store.setProgressMs(progressMs);
    store.setDurationMs(durationMs);

    // Registrar en recientes cuando cambia el track y está reproduciendo
    const trackChanged = currentTrack !== null && previousStoreTrack?.id !== currentTrack.id;
    if (trackChanged && playbackState === "playing") {
      store.addRecentTrack(currentTrack);
    }

    await this.tryAutoplayNextOnTrackEnd(previousProviderTrackId, currentTrack, playbackState);
    this.tryCrossfade(progressMs, durationMs);
  }

  private async tryAutoplayNextOnTrackEnd(
    previousProviderTrackId: string | null,
    currentTrack: Track | null,
    playbackState: PlaybackState
  ): Promise<void> {
    if (this.isAutoplayAdvancing) {
      return;
    }

    // Only a real "provider track ended" event triggers autoplay — not the
    // app-open case where the store has a persisted track and the provider is empty.
    const trackEnded =
      previousProviderTrackId !== null && currentTrack === null && playbackState === "idle";
    if (!trackEnded) {
      return;
    }

    const store = useAppStore.getState();
    const { repeatMode, queue, currentQueueIndex, shuffleEnabled, shuffleOrder } = store;

    if (repeatMode === "one") {
      // Replay the track at the current queue index
      const trackToReplay = currentQueueIndex >= 0 ? queue[currentQueueIndex] : null;
      if (!trackToReplay) return;
      this.isAutoplayAdvancing = true;
      try {
        await this.play(trackToReplay);
      } finally {
        this.isAutoplayAdvancing = false;
      }
      return;
    }

    const shuffleActive = shuffleEnabled && queue.length > 1;
    const nextIndex = currentQueueIndex + 1;
    const isLastTrack = nextIndex >= queue.length;

    if (isLastTrack && repeatMode === "all" && queue.length > 0 && !shuffleActive) {
      // Non-shuffle: loop back to start
      this.isAutoplayAdvancing = true;
      try {
        store.setCurrentQueueIndex(0);
        await this.play(queue[0]);
      } finally {
        this.isAutoplayAdvancing = false;
      }
      return;
    }

    // Non-shuffle: no more tracks
    if (!shuffleActive && (nextIndex < 0 || isLastTrack)) {
      return;
    }

    // Shuffle exhausted with no repeat
    if (shuffleActive && shuffleOrder.length === 0 && repeatMode !== "all") {
      return;
    }

    this.isAutoplayAdvancing = true;
    try {
      await this.next();
    } finally {
      this.isAutoplayAdvancing = false;
    }
  }

  private tryCrossfade(progressMs: number, durationMs: number): void {
    const store = useAppStore.getState();
    const crossfadeDurationMs = store.crossfadeDuration * 1000;
    if (crossfadeDurationMs <= 0 || durationMs <= 0 || store.playbackState !== "playing") return;

    // Only crossfade if song is longer than 2x the crossfade duration
    if (durationMs < crossfadeDurationMs * 2) return;

    const remainingMs = durationMs - progressMs;
    if (remainingMs <= 0 || remainingMs > crossfadeDurationMs) return;

    // Debounce — don't trigger again within crossfade window
    const now = Date.now();
    if (this.crossfadeTriggeredAt !== null && now - this.crossfadeTriggeredAt < crossfadeDurationMs + 1000) return;

    const { queue, currentQueueIndex, repeatMode } = store;
    const nextIndex = currentQueueIndex + 1;
    const hasNext = nextIndex < queue.length || (repeatMode === "all" && queue.length > 0);
    if (!hasNext) return;

    this.crossfadeTriggeredAt = now;
    void this.next();
  }

  private startSyncLoop(): void {
    this.stopSyncLoop();

    this.syncIntervalId = window.setInterval(() => {
      void this.syncStoreWithProvider();
    }, this.syncIntervalMs);
  }

  private stopSyncLoop(): void {
    if (this.syncIntervalId === null) {
      return;
    }

    window.clearInterval(this.syncIntervalId);
    this.syncIntervalId = null;
  }

  public async play(track: Track): Promise<void> {
    if (track.source !== this.activeSource) {
      await this.setActiveProvider(track.source);
    }

    await this.activeProvider.play(track);
    await this.syncStoreWithProvider();
  }

  public async playFromQueue(track: Track, queue: Track[]): Promise<void> {
    const normalizedQueue = queue.slice();
    const queueIndex = normalizedQueue.findIndex((queueTrack) => queueTrack.id === track.id);

    if (queueIndex < 0) {
      throw new Error(`Track ${track.id} is not present in the provided queue.`);
    }

    const store = useAppStore.getState();
    store.setQueue(normalizedQueue);
    store.setCurrentQueueIndex(queueIndex);

    store.setShuffleHistory([]);
    if (store.shuffleEnabled && normalizedQueue.length > 1) {
      const remaining = normalizedQueue.map((_, i) => i).filter((i) => i !== queueIndex);
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
      }
      store.setShuffleOrder(remaining);
    }

    await this.play(track);
  }

  public async removeTrackFromQueue(trackId: string, queueIndex?: number): Promise<void> {
    const store = useAppStore.getState();
    const { queue, currentQueueIndex, currentTrack, shuffleOrder } = store;

    // If a specific index is provided, remove only that slot.
    // Otherwise fall back to the first match (legacy behaviour for removeTrackFromLibrary).
    const removedIndex = queueIndex !== undefined
      ? (queue[queueIndex]?.id === trackId ? queueIndex : -1)
      : queue.findIndex((track) => track.id === trackId);

    if (removedIndex < 0) {
      return;
    }

    const nextQueue = queue.filter((_, i) => i !== removedIndex);
    store.setQueue(nextQueue);

    // Keep shuffleOrder consistent: drop the removed index and shift down any
    // index that was after it (since the queue array shrank by one slot).
    if (shuffleOrder.length > 0) {
      store.setShuffleOrder(
        shuffleOrder
          .filter((i) => i !== removedIndex)
          .map((i) => (i > removedIndex ? i - 1 : i))
      );
    }

    if (currentTrack?.id !== trackId || removedIndex !== currentQueueIndex) {
      if (nextQueue.length === 0) {
        store.setCurrentQueueIndex(-1);
      } else if (removedIndex < currentQueueIndex) {
        store.setCurrentQueueIndex(currentQueueIndex - 1);
      } else if (removedIndex === currentQueueIndex) {
        store.setCurrentQueueIndex(Math.min(currentQueueIndex, nextQueue.length - 1));
      }
      return;
    }

    if (nextQueue.length === 0) {
      if (this.activeSource) {
        const provider = this.providers.get(this.activeSource);
        if (provider) {
          await provider.dispose();
        }
        this.initializedProviders.delete(this.activeSource);
      }

      store.setCurrentQueueIndex(-1);
      store.setCurrentTrack(null);
      store.setPlaybackState("idle");
      store.setProgressMs(0);
      store.setDurationMs(0);
      return;
    }

    const autoplayIndex =
      removedIndex < nextQueue.length ? removedIndex : nextQueue.length - 1;
    store.setCurrentQueueIndex(autoplayIndex);

    await this.play(nextQueue[autoplayIndex]);
  }

  public async pause(): Promise<void> {
    if (!this.activeSource) return;
    await this.activeProvider.pause();
    await this.syncStoreWithProvider();
  }

  public async resume(): Promise<void> {
    if (!this.activeSource) {
      // Provider not yet initialized — treat as a cold play of the persisted track
      const { currentTrack } = useAppStore.getState();
      if (currentTrack) await this.play(currentTrack);
      return;
    }
    await this.activeProvider.resume();
    await this.syncStoreWithProvider();
  }

  public async next(): Promise<void> {
    const store = useAppStore.getState();
    const { queue, currentQueueIndex, shuffleEnabled, shuffleOrder, shuffleHistory, repeatMode } = store;

    if (queue.length === 0 || !this.activeSource) return;

    let nextIndex: number;

    if (shuffleEnabled && queue.length > 1) {
      // Filter stale indices and the current track so we never replay it
      const validOrder = shuffleOrder.filter((i) => i >= 0 && i < queue.length && i !== currentQueueIndex);

      if (validOrder.length > 0) {
        nextIndex = validOrder[0];
        store.setShuffleOrder(validOrder.slice(1));
      } else {
        // Exhausted OR shuffle was just enabled with empty order — regenerate.
        // In shuffle mode we always know there are songs; repeatMode only gates
        // the linear end-of-queue case.
        const remaining = queue.map((_, i) => i).filter((i) => i !== currentQueueIndex);
        if (remaining.length === 0) { await this.stopPlayback(); return; }
        for (let i = remaining.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
        }
        nextIndex = remaining[0];
        store.setShuffleOrder(remaining.slice(1));
      }

      // Push current position to history so previous() can come back
      if (currentQueueIndex >= 0) {
        store.setShuffleHistory([...shuffleHistory, currentQueueIndex]);
      }
    } else {
      nextIndex = currentQueueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') nextIndex = 0;
        else { await this.stopPlayback(); return; }
      }
    }

    store.setCurrentQueueIndex(nextIndex);
    await this.play(queue[nextIndex]);
  }

  private async stopPlayback(): Promise<void> {
    if (!this.activeSource) return;
    const provider = this.providers.get(this.activeSource);
    if (provider) {
      await provider.dispose();
      this.initializedProviders.delete(this.activeSource);
    }
    // Clear tracking state so the sync loop doesn't treat this as a natural
    // track-end and trigger autoplay.
    this.lastProviderTrackId = null;
    this.activeSource = null;
    const store = useAppStore.getState();
    store.setCurrentTrack(null);
    store.setPlaybackState('idle');
    store.setProgressMs(0);
    store.setDurationMs(0);
  }

  public async previous(): Promise<void> {
    const store = useAppStore.getState();
    const { queue, currentQueueIndex, shuffleEnabled, shuffleHistory, shuffleOrder } = store;

    if (queue.length === 0 || !this.activeSource) return;

    if (shuffleEnabled && queue.length > 1) {
      if (shuffleHistory.length === 0) return;
      const history = [...shuffleHistory];
      const previousIndex = history.pop()!;
      // Put current track back at the front of shuffleOrder so next() can reach it again
      store.setShuffleOrder([currentQueueIndex, ...shuffleOrder]);
      store.setShuffleHistory(history);
      store.setCurrentQueueIndex(previousIndex);
      await this.play(queue[previousIndex]);
    } else {
      const previousIndex = currentQueueIndex - 1;
      if (previousIndex < 0) return;
      store.setCurrentQueueIndex(previousIndex);
      await this.play(queue[previousIndex]);
    }
  }

  public async seek(positionMs: number): Promise<void> {
    await this.activeProvider.seek(positionMs);
    await this.syncStoreWithProvider();
  }

  public async setVolume(volume: number): Promise<void> {
    const normalizedVolume = Math.max(0, Math.min(100, volume));
    useAppStore.getState().setVolume(normalizedVolume);

    if (!this.activeSource) {
      return;
    }

    await this.activeProvider.setVolume(normalizedVolume);
  }

  public async getCurrentTrack(): Promise<Track | null> {
    try {
      return await this.activeProvider.getCurrentTrack();
    } catch {
      return null;
    }
  }

  public async getPlaybackState(): Promise<PlaybackState> {
    try {
      return await this.activeProvider.getPlaybackState();
    } catch {
      return "idle";
    }
  }

  public async dispose(): Promise<void> {
    this.stopSyncLoop();

    const providerDisposals = Array.from(this.providers.values()).map((provider) =>
      provider.dispose()
    );
    await Promise.allSettled(providerDisposals);

    this.initializedProviders.clear();
    this.activeSource = null;

    const store = useAppStore.getState();
    store.setCurrentTrack(null);
    store.setPlaybackState("idle");
    store.setQueue([]);
    store.setCurrentQueueIndex(-1);
    store.setProgressMs(0);
    store.setDurationMs(0);
  }
}

export const playerOrchestrator = PlayerOrchestrator.getInstance();
