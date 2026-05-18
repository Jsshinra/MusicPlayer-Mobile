import { MusicProvider } from "../../core/player/music-provider";
import { Track, PlaybackState, SourceType } from "../../shared/types/music";
import { useAppStore } from "../../app/store/useAppStore";

export class LocalProvider implements MusicProvider {
  public readonly source: SourceType = "local";
  private audio: HTMLAudioElement | null = null;
  private currentTrack: Track | null = null;
  private playbackState: PlaybackState = "idle";
  private volume = 100;

  // ── Crossfade ────────────────────────────────────────────────────────────────
  private outgoingAudio: HTMLAudioElement | null = null;
  private isCrossfading = false;
  private fadeRafId: number | null = null;

  constructor() {}

  // Quadratic taper: perceived loudness scales more naturally than linear
  private scaledVolume(): number {
    const v = this.volume / 100;
    return v * v;
  }

  public async initialize(): Promise<void> {
    if (this.audio) return;
    this.audio = new Audio();
    this.audio.volume = this.scaledVolume();
    this.setupEventListeners(this.audio);
  }

  private setupEventListeners(audio: HTMLAudioElement) {
    audio.onplay = () => {
      this.playbackState = "playing";
    };
    audio.onpause = () => {
      this.playbackState = "paused";
    };
    audio.onended = () => {
      this.playbackState = "idle";
      this.currentTrack = null;
      audio.currentTime = 0;
    };
    audio.onerror = (e) => {
      console.error("LocalProvider Audio Error:", e);
      this.playbackState = "error";
    };
  }

  public async search(_query: string): Promise<Track[]> {
    return [];
  }

  public async play(track: Track): Promise<void> {
    if (!this.audio) await this.initialize();

    const crossfadeDurationMs = useAppStore.getState().crossfadeDuration * 1000;
    const isPlaying = this.playbackState === "playing";
    const isDifferentTrack = this.currentTrack?.id !== track.id;
    const shouldCrossfade = isPlaying && isDifferentTrack && crossfadeDurationMs > 0;

    if (shouldCrossfade) {
      await this.crossfadeTo(track, crossfadeDurationMs);
      return;
    }

    // Hard switch — cancel any ongoing crossfade first
    this.cancelCrossfade();

    this.currentTrack = track;
    this.audio!.src = track.uri;

    try {
      await this.audio!.play();
    } catch (error) {
      this.playbackState = "error";
      console.error("LocalProvider failed to play:", error);
      throw error;
    }
  }

  private async crossfadeTo(track: Track, durationMs: number): Promise<void> {
    if (this.isCrossfading) return;
    this.isCrossfading = true;

    const outgoing = this.audio!;
    // Silence the onended of outgoing so it doesn't trigger "track ended"
    outgoing.onended = null;

    const incoming = new Audio();
    incoming.volume = 0;
    incoming.src = track.uri;

    try {
      await incoming.play();
    } catch {
      // If incoming fails to play, abort crossfade
      this.isCrossfading = false;
      return;
    }

    // Swap: incoming is now the "current" audio
    this.audio = incoming;
    this.outgoingAudio = outgoing;
    this.currentTrack = track;
    this.playbackState = "playing";
    this.setupEventListeners(incoming);

    const targetVol = this.scaledVolume();
    const startTime = performance.now();

    const fade = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      if (this.outgoingAudio) {
        this.outgoingAudio.volume = Math.max(0, (1 - progress) * targetVol);
      }
      if (this.audio) {
        this.audio.volume = Math.min(progress * targetVol, targetVol);
      }

      if (progress < 1) {
        this.fadeRafId = requestAnimationFrame(fade);
      } else {
        // Crossfade complete
        this.finishCrossfade();
      }
    };

    this.fadeRafId = requestAnimationFrame(fade);
  }

  private finishCrossfade(): void {
    if (this.outgoingAudio) {
      this.outgoingAudio.pause();
      this.outgoingAudio.onplay = null;
      this.outgoingAudio.onpause = null;
      this.outgoingAudio.onended = null;
      this.outgoingAudio.onerror = null;
      this.outgoingAudio.src = "";
      this.outgoingAudio = null;
    }
    if (this.audio) {
      this.audio.volume = this.scaledVolume();
    }
    this.fadeRafId = null;
    this.isCrossfading = false;
  }

  private cancelCrossfade(): void {
    if (this.fadeRafId !== null) {
      cancelAnimationFrame(this.fadeRafId);
      this.fadeRafId = null;
    }
    if (this.outgoingAudio) {
      this.outgoingAudio.pause();
      this.outgoingAudio.onplay = null;
      this.outgoingAudio.onpause = null;
      this.outgoingAudio.onended = null;
      this.outgoingAudio.onerror = null;
      this.outgoingAudio.src = "";
      this.outgoingAudio = null;
    }
    if (this.audio) {
      this.audio.volume = this.scaledVolume();
    }
    this.isCrossfading = false;
  }

  public async pause(): Promise<void> {
    if (this.isCrossfading) this.cancelCrossfade();
    if (this.audio) this.audio.pause();
  }

  public async resume(): Promise<void> {
    if (this.audio) {
      try {
        await this.audio.play();
      } catch (error) {
        console.error("LocalProvider failed to resume:", error);
      }
    }
  }

  public async next(): Promise<void> {
    console.log("LocalProvider: next() placeholder executed");
  }

  public async previous(): Promise<void> {
    console.log("LocalProvider: previous() placeholder executed");
  }

  public async seek(positionMs: number): Promise<void> {
    if (this.isCrossfading) this.cancelCrossfade();
    if (this.audio) {
      this.audio.currentTime = positionMs / 1000;
    }
  }

  public async setVolume(volume: number): Promise<void> {
    this.volume = Math.max(0, Math.min(100, volume));
    if (this.audio && !this.isCrossfading) {
      this.audio.volume = this.scaledVolume();
    }
    // During crossfade the RAF handles volume scaling — it reads this.volume each frame
  }

  public setMuted(muted: boolean): void {
    if (this.audio) {
      this.audio.volume = muted ? 0 : this.scaledVolume();
    }
    if (this.isCrossfading && this.outgoingAudio) {
      this.outgoingAudio.volume = 0;
    }
  }

  public async getCurrentTrack(): Promise<Track | null> {
    return this.currentTrack;
  }

  public async getPlaybackState(): Promise<PlaybackState> {
    return this.playbackState;
  }

  public async getProgressMs(): Promise<number> {
    if (!this.audio) return 0;
    return Math.floor(this.audio.currentTime * 1000);
  }

  public async getDurationMs(): Promise<number> {
    if (!this.audio || !Number.isFinite(this.audio.duration) || this.audio.duration <= 0) {
      return 0;
    }
    return Math.floor(this.audio.duration * 1000);
  }

  public async dispose(): Promise<void> {
    this.cancelCrossfade();
    if (this.audio) {
      this.audio.pause();
      this.audio.onplay = null;
      this.audio.onpause = null;
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio = null;
    }
    this.currentTrack = null;
    this.playbackState = "idle";
  }
}

export const localProvider = new LocalProvider();
