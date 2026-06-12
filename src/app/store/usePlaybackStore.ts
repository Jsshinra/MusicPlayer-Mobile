import { create } from "zustand";
import { PlaybackState } from "../../shared/types/music";

/**
 * Ephemeral playback state, deliberately kept OUT of useAppStore.
 *
 * The persist middleware on useAppStore re-serializes the whole partialized
 * state (full library, playlists, queue) and writes it through the native
 * bridge on EVERY set(). The orchestrator's 250ms sync loop updates
 * progress/duration/state 4x per second, so keeping these fields in the
 * persisted store meant a full-library JSON.stringify + SharedPreferences
 * write on every tick. None of these values need to survive a restart.
 */
interface PlaybackEphemeralState {
  playbackState: PlaybackState;
  progressMs: number;
  durationMs: number;
  setPlaybackState: (state: PlaybackState) => void;
  setProgressMs: (progressMs: number) => void;
  setDurationMs: (durationMs: number) => void;
}

export const usePlaybackStore = create<PlaybackEphemeralState>()((set) => ({
  playbackState: "idle",
  progressMs: 0,
  durationMs: 0,
  setPlaybackState: (playbackState) => set({ playbackState }),
  setProgressMs: (progressMs) => set({ progressMs }),
  setDurationMs: (durationMs) => set({ durationMs }),
}));
