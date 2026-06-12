import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { useAppStore } from "../../../app/store/useAppStore";
import { playerOrchestrator } from "../../../core/player/player-orchestrator";
import { Track } from "../../../shared/types/music";
import { deleteTrackFiles } from "../../settings/storage-utils";

interface UseLocalLibraryResult {
  tracks: Track[];
  playTrackFromLibrary: (track: Track) => Promise<void>;
  playTrackFromPool: (track: Track, pool: Track[]) => Promise<void>;
  removeTrackFromLibrary: (track: Track) => Promise<void>;
}

export function useLocalLibrary(): UseLocalLibraryResult {
  const tracks = useAppStore((state) => state.libraryTracks);
  const setLibraryTracks = useAppStore((state) => state.setLibraryTracks);

  const playTrackFromLibrary = useCallback(
    async (track: Track) => {
      useAppStore.getState().setPlaybackOrigin('library');
      await playerOrchestrator.playFromQueue(track, tracks);
    },
    [tracks]
  );

  const playTrackFromPool = useCallback(
    async (track: Track, pool: Track[]) => {
      useAppStore.getState().setPlaybackOrigin('library');
      await playerOrchestrator.playFromQueue(track, pool);
    },
    []
  );

  const removeTrackFromLibrary = useCallback(
    async (track: Track) => {
      const nextTracks = tracks.filter((item) => item.id !== track.id);
      setLibraryTracks(nextTracks);
      await playerOrchestrator.removeTrackFromQueue(track.id);

      if (track.uri.startsWith("blob:")) URL.revokeObjectURL(track.uri);
      if (track.artworkUrl?.startsWith("blob:")) URL.revokeObjectURL(track.artworkUrl);

      // Delete the files from disk so removal actually frees storage.
      if (Capacitor.isNativePlatform()) {
        // Mobile: files live in the Capacitor Data sandbox. window.libraryAPI
        // is a no-op stub here, so we delete via @capacitor/filesystem.
        await deleteTrackFiles(track);
      } else if (track.localPath) {
        // Desktop: main process guards against paths outside MusicApp.
        window.libraryAPI.deleteFile(track.localPath).catch(() => {})
      }
    },
    [setLibraryTracks, tracks]
  );

  return {
    tracks,
    playTrackFromLibrary,
    playTrackFromPool,
    removeTrackFromLibrary,
  };
}
