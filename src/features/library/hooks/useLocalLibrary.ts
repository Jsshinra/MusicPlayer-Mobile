import { useCallback } from "react";
import { useAppStore } from "../../../app/store/useAppStore";
import { playerOrchestrator } from "../../../core/player/player-orchestrator";
import { Track } from "../../../shared/types/music";
import { localPathToFileUri } from "../../../shared/utils/local-file-uri";
import { mapFilesToLocalTracks } from "../model/local-library-mapper";

interface UseLocalLibraryResult {
  tracks: Track[];
  pickAndImport: () => Promise<void>;
  importDroppedFiles: (files: File[]) => Promise<void>;
  playTrackFromLibrary: (track: Track) => Promise<void>;
  playTrackFromPool: (track: Track, pool: Track[]) => Promise<void>;
  removeTrackFromLibrary: (track: Track) => Promise<void>;
}

function trackMetaToTrack(meta: TrackMeta): Track {
  return {
    id: `local-${meta.path}`,
    source: "local",
    title: meta.title,
    artist: meta.artist,
    album: meta.album,
    durationMs: meta.durationMs,
    uri: localPathToFileUri(meta.path),
    localPath: meta.path,
    artworkUrl: meta.artworkPath ? localPathToFileUri(meta.artworkPath) : undefined,
    youtubeId: meta.youtubeId,
  };
}

export function useLocalLibrary(): UseLocalLibraryResult {
  const tracks = useAppStore((state) => state.libraryTracks);
  const appendLibraryTracks = useAppStore((state) => state.appendLibraryTracks);
  const setLibraryTracks = useAppStore((state) => state.setLibraryTracks);

  // Primary import: opens native file dialog, reads metadata in main process
  const pickAndImport = useCallback(async () => {
    const metas = await window.libraryAPI.pickFiles();
    if (metas.length > 0) {
      appendLibraryTracks(metas.map(trackMetaToTrack));
    }
  }, [appendLibraryTracks]);

  // Drag & drop: prefer the main-process handler (proper metadata + persistence).
  // Falls back to renderer-side parsing when file.path is unavailable.
  const importDroppedFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const AUDIO_EXTS = new Set(["mp3", "wav", "ogg", "m4a", "flac", "aac", "webm"]);
    const isAudio = (f: File) => {
      if (f.type.startsWith("audio/")) return true;
      const ext = f.name.split(".").pop()?.toLowerCase();
      return ext ? AUDIO_EXTS.has(ext) : false;
    };

    const audioFiles = files.filter(isAudio);
    if (audioFiles.length === 0) return;

    // Split files into those with a real path (Electron drag-from-OS) and those without.
    // Use webUtils.getPathForFile — the correct API for Electron with contextIsolation.
    const withPath: Array<{ file: File; path: string }> = [];
    const withoutPath: File[] = [];

    for (const file of audioFiles) {
      try {
        const path = window.fileUtils.getPathForFile(file);
        if (path) {
          withPath.push({ file, path });
        } else {
          withoutPath.push(file);
        }
      } catch {
        withoutPath.push(file);
      }
    }

    // Files with path: read metadata via main process (persists correctly)
    const mainProcessResults = await Promise.allSettled(
      withPath.map(async ({ path }) => {
        const meta = await window.libraryAPI.importFromPath(path);
        return trackMetaToTrack(meta);
      })
    );

    const tracksFromMain = mainProcessResults
      .filter((r): r is PromiseFulfilledResult<Track> => r.status === "fulfilled")
      .map((r) => r.value);

    // Files without path: fall back to renderer-side parsing (session-only, won't persist)
    const tracksFromRenderer = withoutPath.length > 0
      ? await mapFilesToLocalTracks(withoutPath)
      : [];

    const allTracks = [...tracksFromMain, ...tracksFromRenderer];
    if (allTracks.length > 0) {
      appendLibraryTracks(allTracks);
    }
  }, [appendLibraryTracks]);

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

      // Delete the file from disk (main process guards against paths outside MusicApp)
      if (track.localPath) {
        window.libraryAPI.deleteFile(track.localPath).catch(() => {})
      }
    },
    [setLibraryTracks, tracks]
  );

  return {
    tracks,
    pickAndImport,
    importDroppedFiles,
    playTrackFromLibrary,
    playTrackFromPool,
    removeTrackFromLibrary,
  };
}
