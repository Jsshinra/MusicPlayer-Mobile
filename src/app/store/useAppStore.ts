import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { SourceType, PlaybackState, Track, Playlist } from "../../shared/types/music";
import { localPathToFileUri } from "../../shared/utils/local-file-uri";
import { preferencesStorage } from "../../shared/native/preferences-storage";
import type { Language } from "../../shared/i18n/translations";
 
const MAX_RECENT_TRACKS = 20;

/** Minimal title cleanup applied when loading persisted tracks from the store. */
function cleanStoredTitle(title: string | undefined): string {
  if (!title) return ''
  return title
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\s*[\(\[][^\)\]]*(?:official|oficial|lyric|video|audio|visualizer|hd|hq|4k|mv|vevo|clip|explicit|clean|remix|version|edit|música?)s?[^\)\]]*[\)\]]\s*/gi, '')
    .replace(/[\s–—-]+(?:official(?:\s+(?:music\s+)?(?:video|audio))?|oficial(?:\s+(?:music\s+)?(?:video|audio))?|lyric\s+video|visualizer|mv)\s*$/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim() || title.trim()
}
 
export type RepeatMode = "off" | "one" | "all";
export type PlaybackOrigin = 'library' | 'radio' | 'playlist' | 'queue' | null;

interface AppState {
  source: SourceType;
  playbackState: PlaybackState;
  currentTrack: Track | null;
  libraryTracks: Track[];
  queue: Track[];
  currentQueueIndex: number;
  shuffleOrder: number[];
  shuffleHistory: number[];
  progressMs: number;
  durationMs: number;
  volume: number;
  isVoiceListening: boolean;
  recentTracks: Track[];
  searchQuery: string;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  playlists: Playlist[];
  voiceSearchEnabled: boolean;
  voiceSearchKey: string;
  voiceSearchLang: string;
  voiceMicDeviceId: string;
  accentColor: string;
  bgColor: string;
  vibeColor: string | null;
  dynamicVibeEnabled: boolean;
  vibeIntensity: number;
  personalizationOpen: boolean;
  uiDensity: 'compact' | 'normal';
  fontScale: 'small' | 'normal' | 'large';
  discordRpcEnabled: boolean;
  crossfadeDuration: number;
  showAlbumCovers: boolean;
  appLanguage: Language;
  audioFocusEnabled: boolean;
  // Playback origin — not persisted
  playbackOrigin: PlaybackOrigin;
  // Radio — not persisted
  radioActive: boolean;
  radioSeedTrackId: string | null;
  radioSessionTrackIds: string[];
  /** IDs of library tracks that were downloaded via radio (across all sessions, persisted). */
  radioDownloadedTrackIds: string[];

  setSource: (source: SourceType) => void;
  setPlaybackState: (state: PlaybackState) => void;
  setCurrentTrack: (track: Track | null) => void;
  setLibraryTracks: (tracks: Track[]) => void;
  appendLibraryTracks: (tracks: Track[]) => void;
  updateLibraryTrack: (id: string, updates: Partial<Track>) => void;
  removeLibraryTracks: (ids: string[]) => void;
  setQueue: (queue: Track[]) => void;
  appendToQueue: (track: Track) => void;
  setShuffleOrder: (order: number[]) => void;
  setShuffleHistory: (history: number[]) => void;
  setCurrentQueueIndex: (index: number) => void;
  setProgressMs: (progressMs: number) => void;
  setDurationMs: (durationMs: number) => void;
  setVolume: (volume: number) => void;
  setIsVoiceListening: (isListening: boolean) => void;
  addRecentTrack: (track: Track) => void;
  clearRecentTracks: () => void;
  setSearchQuery: (query: string) => void;
  setShuffleEnabled: (enabled: boolean) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  createPlaylist: (name: string, trackIds: string[], coverPath?: string, id?: string) => void;
  appendTrackToPlaylist: (playlistId: string, trackId: string) => void;
  updatePlaylist: (id: string, updates: Partial<Pick<Playlist, 'name' | 'trackIds' | 'coverPath'>>) => void;
  deletePlaylist: (id: string) => void;
  setVoiceSearchEnabled: (enabled: boolean) => void;
  setVoiceSearchKey: (key: string) => void;
  setVoiceSearchLang: (lang: string) => void;
  setVoiceMicDeviceId: (id: string) => void;
  setAccentColor: (color: string) => void;
  setBgColor: (color: string) => void;
  setVibeColor: (color: string | null) => void;
  setDynamicVibeEnabled: (enabled: boolean) => void;
  setVibeIntensity: (intensity: number) => void;
  setPersonalizationOpen: (open: boolean) => void;
  setUiDensity: (density: 'compact' | 'normal') => void;
  setFontScale: (scale: 'small' | 'normal' | 'large') => void;
  setDiscordRpcEnabled: (enabled: boolean) => void;
  setCrossfadeDuration: (v: number) => void;
  setShowAlbumCovers: (v: boolean) => void;
  setAppLanguage: (lang: Language) => void;
  setAudioFocusEnabled: (enabled: boolean) => void;
  setPlaybackOrigin: (origin: PlaybackOrigin) => void;
  reorderPlaylists: (fromIndex: number, toIndex: number) => void;
  setRadioActive: (active: boolean) => void;
  setRadioSeedTrackId: (id: string | null) => void;
  appendRadioSessionTrack: (id: string) => void;
  clearRadioSession: () => void;
  appendRadioDownloadedTrack: (id: string) => void;
  removeRadioDownloadedTracks: (ids: string[]) => void;
  clearRadioDownloaded: () => void;
}
 
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      source: "local",
      playbackState: "idle",
      currentTrack: null,
      libraryTracks: [],
      queue: [],
      currentQueueIndex: -1,
      shuffleOrder: [],
      shuffleHistory: [],
      progressMs: 0,
      durationMs: 0,
      volume: 100,
      isVoiceListening: false,
      recentTracks: [],
      searchQuery: "",
      shuffleEnabled: false,
      repeatMode: "off" as RepeatMode,
      playlists: [],
      voiceSearchEnabled: false,
      voiceSearchKey: 'v',
      voiceSearchLang: 'es-ES',
      voiceMicDeviceId: '',
      accentColor: '#ffffff',
      bgColor: '#000000',
      vibeColor: null,
      dynamicVibeEnabled: true,
      vibeIntensity: 50,
      personalizationOpen: false,
      uiDensity: 'normal' as const,
      fontScale: 'normal' as const,
      discordRpcEnabled: true,
      crossfadeDuration: 0,
      showAlbumCovers: true,
      appLanguage: 'es' as Language,
      audioFocusEnabled: true,
      playbackOrigin: null,
      radioActive: false,
      radioSeedTrackId: null,
      radioSessionTrackIds: [],
      radioDownloadedTrackIds: [],
 
      setSource: (source) => set({ source }),
      setPlaybackState: (playbackState) => set({ playbackState }),
      setCurrentTrack: (currentTrack) => set({ currentTrack }),
      setLibraryTracks: (libraryTracks) => set({ libraryTracks }),
      removeLibraryTracks: (ids) =>
        set((state) => {
          const removed = new Set(ids)
          return {
            libraryTracks: state.libraryTracks.filter((t) => !removed.has(t.id)),
            recentTracks:  state.recentTracks.filter((t)  => !removed.has(t.id)),
            queue:         state.queue.filter((t)         => !removed.has(t.id)),
            radioSessionTrackIds:    state.radioSessionTrackIds.filter((id) => !removed.has(id)),
            radioDownloadedTrackIds: state.radioDownloadedTrackIds.filter((id) => !removed.has(id)),
            currentTrack:  state.currentTrack && removed.has(state.currentTrack.id)
              ? null
              : state.currentTrack,
          }
        }),
      appendLibraryTracks: (tracks) =>
        set((state) => {
          const existingIds = new Set(state.libraryTracks.map((t) => t.id));
          const existingPaths = new Set(
            state.libraryTracks.map((t) => t.localPath).filter(Boolean)
          );
          const newTracks = tracks.filter(
            (t) =>
              !existingIds.has(t.id) &&
              (!t.localPath || !existingPaths.has(t.localPath))
          );
          return { libraryTracks: [...state.libraryTracks, ...newTracks] };
        }),
      updateLibraryTrack: (id, updates) =>
        set((state) => ({
          libraryTracks: state.libraryTracks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      setQueue: (queue) => set({ queue }),
      appendToQueue: (track) =>
        set((state) => {
          const newIndex = state.queue.length;
          let newShuffleOrder = state.shuffleOrder;
          if (state.shuffleEnabled) {
            // Insert the new track at a random position in the remaining shuffle order
            const order = [...state.shuffleOrder];
            const insertAt = Math.floor(Math.random() * (order.length + 1));
            order.splice(insertAt, 0, newIndex);
            newShuffleOrder = order;
          }
          return { queue: [...state.queue, track], shuffleOrder: newShuffleOrder };
        }),
      setCurrentQueueIndex: (currentQueueIndex) => set({ currentQueueIndex }),
      setShuffleOrder: (shuffleOrder) => set({ shuffleOrder }),
      setShuffleHistory: (shuffleHistory) => set({ shuffleHistory }),
      setProgressMs: (progressMs) => set({ progressMs }),
      setDurationMs: (durationMs) => set({ durationMs }),
      setVolume: (volume) => set({ volume }),
      setIsVoiceListening: (isVoiceListening) => set({ isVoiceListening }),
 
      addRecentTrack: (track) =>
        set((state) => {
          // Sacar duplicado si ya estaba, poner al principio, limitar a MAX
          const filtered = state.recentTracks.filter((t) => t.id !== track.id);
          return {
            recentTracks: [track, ...filtered].slice(0, MAX_RECENT_TRACKS),
          };
        }),
 
      clearRecentTracks: () => set({ recentTracks: [] }),

      setSearchQuery: (searchQuery) => set({ searchQuery }),

      setShuffleEnabled: (shuffleEnabled) => set((state) => {
        if (!shuffleEnabled) return { shuffleEnabled, shuffleOrder: [], shuffleHistory: [] }
        const remaining = state.queue
          .map((_, i) => i)
          .filter((i) => i > state.currentQueueIndex)
        for (let i = remaining.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[remaining[i], remaining[j]] = [remaining[j], remaining[i]]
        }
        return { shuffleEnabled, shuffleOrder: remaining }
      }),
      setRepeatMode: (repeatMode) => set({ repeatMode }),

      createPlaylist: (name, trackIds, coverPath, id) =>
        set((state) => ({
          playlists: [
            ...state.playlists,
            { id: id ?? crypto.randomUUID(), name, trackIds, coverPath, createdAt: Date.now() },
          ],
        })),

      appendTrackToPlaylist: (playlistId, trackId) =>
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId ? { ...p, trackIds: [...p.trackIds, trackId] } : p
          ),
        })),

      updatePlaylist: (id, updates) =>
        set((state) => ({
          playlists: state.playlists.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      deletePlaylist: (id) =>
        set((state) => ({ playlists: state.playlists.filter((p) => p.id !== id) })),

      setVoiceSearchEnabled: (voiceSearchEnabled) => set({ voiceSearchEnabled }),
      setVoiceSearchKey: (voiceSearchKey) => set({ voiceSearchKey }),
      setVoiceSearchLang: (voiceSearchLang) => set({ voiceSearchLang }),
      setVoiceMicDeviceId: (voiceMicDeviceId) => set({ voiceMicDeviceId }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setBgColor: (bgColor) => set({ bgColor }),
      setVibeColor: (vibeColor) => set({ vibeColor }),
      setDynamicVibeEnabled: (dynamicVibeEnabled) => set({ dynamicVibeEnabled }),
      setVibeIntensity: (vibeIntensity) => set({ vibeIntensity }),
      setPersonalizationOpen: (personalizationOpen) => set({ personalizationOpen }),
      setUiDensity: (uiDensity) => set({ uiDensity }),
      setFontScale: (fontScale) => set({ fontScale }),
      setDiscordRpcEnabled: (discordRpcEnabled) => set({ discordRpcEnabled }),
      setCrossfadeDuration: (crossfadeDuration) => set({ crossfadeDuration }),
      setShowAlbumCovers: (showAlbumCovers) => set({ showAlbumCovers }),
      setAppLanguage: (appLanguage) => set({ appLanguage }),
      setAudioFocusEnabled: (audioFocusEnabled) => set({ audioFocusEnabled }),
      setPlaybackOrigin: (playbackOrigin) => set({ playbackOrigin }),
      reorderPlaylists: (fromIndex, toIndex) =>
        set((state) => {
          const next = [...state.playlists]
          const [moved] = next.splice(fromIndex, 1)
          next.splice(toIndex, 0, moved)
          return { playlists: next }
        }),
      setRadioActive: (radioActive) => set({ radioActive }),
      setRadioSeedTrackId: (radioSeedTrackId) => set({ radioSeedTrackId }),
      appendRadioSessionTrack: (id) =>
        set((s) => ({ radioSessionTrackIds: [...s.radioSessionTrackIds, id] })),
      clearRadioSession: () => set({ radioSessionTrackIds: [], radioActive: false, radioSeedTrackId: null }),
      appendRadioDownloadedTrack: (id) =>
        set((s) => (s.radioDownloadedTrackIds.includes(id)
          ? {}
          : { radioDownloadedTrackIds: [...s.radioDownloadedTrackIds, id] })),
      removeRadioDownloadedTracks: (ids) =>
        set((s) => {
          const toRemove = new Set(ids)
          return { radioDownloadedTrackIds: s.radioDownloadedTrackIds.filter((id) => !toRemove.has(id)) }
        }),
      clearRadioDownloaded: () => set({ radioDownloadedTrackIds: [] }),
    }),
    {
      name: "music-player-store",
      storage: createJSONStorage(() => preferencesStorage),
      partialize: (state) => {
        // Keep artworkUrl only if it points at a real file on disk we can
        // reload later. Drop blob: / data: URLs (session-only, huge).
        // Accept: file:// (desktop) and Capacitor-rewritten file URLs
        // (https://localhost/_capacitor_file_/... on Android, etc).
        const isPersistableArtwork = (url: string | undefined): url is string =>
          !!url && (url.startsWith('file://') || url.includes('_capacitor_file_'));
        const stripArtwork = ({ artworkUrl, ...track }: Track) => ({
          ...track,
          artworkUrl: isPersistableArtwork(artworkUrl) ? artworkUrl : undefined,
          uri: track.localPath ? localPathToFileUri(track.localPath) : track.uri,
        });

        const persistedLibrary = state.libraryTracks
          .filter((track) => Boolean(track.localPath))
          .map(stripArtwork);

        const persistedRecents = state.recentTracks
          .filter((track) => Boolean(track.localPath))
          .map(stripArtwork);

        const persistedQueue = state.queue.map(stripArtwork);

        const persistedCurrentTrack = state.currentTrack
          ? stripArtwork(state.currentTrack)
          : null;

        return {
          libraryTracks: persistedLibrary,
          recentTracks: persistedRecents,
          queue: persistedQueue,
          currentQueueIndex: state.currentQueueIndex,
          currentTrack: persistedCurrentTrack,
          volume: state.volume,
          searchQuery: state.searchQuery,
          shuffleEnabled: state.shuffleEnabled,
          repeatMode: state.repeatMode,
          playlists: state.playlists,
          voiceSearchEnabled: state.voiceSearchEnabled,
          voiceSearchKey: state.voiceSearchKey,
          voiceSearchLang: state.voiceSearchLang,
          voiceMicDeviceId: state.voiceMicDeviceId,
          accentColor: state.accentColor,
          bgColor: state.bgColor,
          dynamicVibeEnabled: state.dynamicVibeEnabled,
          vibeIntensity: state.vibeIntensity,
          personalizationOpen: state.personalizationOpen,
          uiDensity: state.uiDensity,
          fontScale: state.fontScale,
          discordRpcEnabled: state.discordRpcEnabled,
          crossfadeDuration: state.crossfadeDuration,
          showAlbumCovers: state.showAlbumCovers,
          radioDownloadedTrackIds: state.radioDownloadedTrackIds,
          appLanguage: state.appLanguage,
          audioFocusEnabled: state.audioFocusEnabled,
        };
      },
      merge: (persistedState, currentState) => {
        try {
          const typedPersisted = (persistedState as Partial<AppState>) ?? {};

          const migrateId = (id: string): string => {
            try {
              return /^local-.+-\d+-\d+$/.test(id) ? id.replace(/-\d+$/, "") : id;
            } catch {
              return id;
            }
          };

          const rehydrateTrack = (track: Track): Track => ({
            ...track,
            id: migrateId(track.id),
            uri: track.localPath ? localPathToFileUri(track.localPath) : track.uri,
            title: cleanStoredTitle(track.title),
          });

          const rawLibrary = typedPersisted.libraryTracks;
          const rawRecents = typedPersisted.recentTracks;
          const rawQueue = typedPersisted.queue;

          const persistedLibrary = Array.isArray(rawLibrary)
            ? rawLibrary.map(rehydrateTrack)
            : [];
          const persistedRecents = Array.isArray(rawRecents)
            ? rawRecents.map(rehydrateTrack)
            : [];
          const persistedQueue = Array.isArray(rawQueue)
            ? rawQueue.map(rehydrateTrack)
            : [];
          const persistedCurrentTrack = typedPersisted.currentTrack
            ? rehydrateTrack(typedPersisted.currentTrack)
            : null;

          const rawPlaylists = typedPersisted.playlists
          const persistedPlaylists: Playlist[] = Array.isArray(rawPlaylists)
            ? (rawPlaylists as Playlist[])
            : []

          return {
            ...currentState,
            ...typedPersisted,
            libraryTracks: persistedLibrary,
            recentTracks: persistedRecents,
            queue: persistedQueue,
            currentQueueIndex: typedPersisted.currentQueueIndex ?? -1,
            currentTrack: persistedCurrentTrack,
            playlists: persistedPlaylists,
            appLanguage: (typedPersisted.appLanguage === 'en' || typedPersisted.appLanguage === 'es')
              ? typedPersisted.appLanguage
              : currentState.appLanguage,
            playbackState: "idle",
            progressMs: 0,
            durationMs: 0,
          };
        } catch (err) {
          console.error("[store] merge failed, using current state:", err);
          return currentState;
        }
      },
    }
  )
);
