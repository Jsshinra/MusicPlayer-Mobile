import { useCallback, useState } from "react";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { useAppStore } from "../../../app/store/useAppStore";
import { localPathToFileUri } from "../../../shared/utils/local-file-uri";
import type { Track } from "../../../shared/types/music";
import type {
  ManifestPlaylist,
  ManifestTrack,
  PairingPayload,
  ShareManifest,
} from "../types";

const MUSIC_DIR = "music";
const ARTWORK_DIR = "artwork";
const PLAYLIST_COVER_DIR = "playlist-covers";

// Manifest IDs and Content-Types come from the (untrusted) desktop server and
// both get interpolated into Filesystem paths. Reject anything that could climb
// out of the target directory — path traversal from a tampered QR/server.
const SAFE_ID = /^[A-Za-z0-9._-]+$/;
function isSafeId(id: string): boolean {
  return SAFE_ID.test(id) && !id.includes("..");
}
function safeExt(mimeType: string): string {
  return mimeType.split("/")[1]?.match(/[a-z0-9]+/i)?.[0] ?? "jpg";
}

export interface TransferProgress {
  /** Number of tracks completed (including skipped). */
  completed: number;
  /** Total tracks the user asked to transfer. */
  total: number;
  /** Track currently being downloaded — undefined when not yet started. */
  currentTitle?: string;
  /** "downloading" while in progress, otherwise the terminal state. */
  phase: "idle" | "downloading" | "done" | "error";
  /** Last error message; only set when phase === "error". */
  error?: string;
  /** Counters for the summary toast. */
  downloaded: number;
  skipped: number;
  failed: number;
}

const INITIAL: TransferProgress = {
  completed: 0,
  total: 0,
  phase: "idle",
  downloaded: 0,
  skipped: 0,
  failed: 0,
};

function buildUrl(p: PairingPayload, path: string, query: Record<string, string> = {}): string {
  const params = new URLSearchParams({ token: p.token, ...query });
  return `http://${p.host}:${p.port}${path}?${params.toString()}`;
}

async function fetchAndStream(url: string): Promise<Blob> {
  const res = await fetch(url);
  // Don't include the URL — it carries the pairing token in its query string.
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.blob();
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const comma = dataUrl.indexOf(",");
      resolve(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl);
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * State + actions for pulling the desktop library across WiFi:
 *   pair → fetch manifest → user picks tracks/playlists → transfer.
 *
 * Dedup: we look at the current libraryTracks; any incoming track with the
 * same id is skipped (we already have it from a previous run). Same for
 * playlists by id.
 */
export function useWifiImport() {
  const libraryTracks = useAppStore((s) => s.libraryTracks);
  const playlists = useAppStore((s) => s.playlists);
  const appendLibraryTracks = useAppStore((s) => s.appendLibraryTracks);
  const createPlaylist = useAppStore((s) => s.createPlaylist);
  const updatePlaylist = useAppStore((s) => s.updatePlaylist);

  const [manifest, setManifest] = useState<ShareManifest | null>(null);
  const [progress, setProgress] = useState<TransferProgress>(INITIAL);

  const fetchManifest = useCallback(async (pairing: PairingPayload): Promise<ShareManifest> => {
    const url = buildUrl(pairing, "/api/manifest");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Manifest request failed (${res.status})`);
    const data = (await res.json()) as ShareManifest;
    setManifest(data);
    return data;
  }, []);

  const transfer = useCallback(
    async (
      pairing: PairingPayload,
      selectedTrackIds: string[],
      selectedPlaylistIds: string[],
      mf: ShareManifest,
    ): Promise<TransferProgress> => {
      const existingTrackIds = new Set(libraryTracks.map((t) => t.id));

      // Safety net: any track referenced by a selected playlist must be
      // fetched too, even if the user manually deselected it. Otherwise the
      // playlist ends up pointing at IDs that don't exist on the device.
      const requiredTrackIds = new Set(selectedTrackIds);
      for (const p of mf.playlists) {
        if (!selectedPlaylistIds.includes(p.id)) continue;
        for (const tid of p.trackIds) requiredTrackIds.add(tid);
      }
      const tracksToFetch = mf.tracks.filter((t) => requiredTrackIds.has(t.id));

      let downloaded = 0;
      let skipped = 0;
      let failed = 0;

      setProgress({
        completed: 0,
        total: tracksToFetch.length,
        phase: "downloading",
        downloaded: 0,
        skipped: 0,
        failed: 0,
      });

      const newTracks: Track[] = [];

      for (let i = 0; i < tracksToFetch.length; i++) {
        const t = tracksToFetch[i];
        setProgress((prev) => ({ ...prev, completed: i, currentTitle: t.title }));

        if (existingTrackIds.has(t.id)) {
          skipped++;
          continue;
        }

        try {
          if (!isSafeId(t.id)) throw new Error(`unsafe track id: ${t.id}`);
          // Download audio
          const audioBlob = await fetchAndStream(buildUrl(pairing, `/api/track/${encodeURIComponent(t.id)}`));
          const audioBase64 = await blobToBase64(audioBlob);
          const audioRes = await Filesystem.writeFile({
            path: `${MUSIC_DIR}/${t.id}.mp3`,
            data: audioBase64,
            directory: Directory.Data,
            recursive: true,
          });

          // Download artwork (if any)
          let artworkUrl: string | undefined;
          if (t.hasArtwork) {
            try {
              const artBlob = await fetchAndStream(buildUrl(pairing, `/api/artwork/${encodeURIComponent(t.id)}`));
              const artExt = safeExt(artBlob.type);
              const artBase64 = await blobToBase64(artBlob);
              const artRes = await Filesystem.writeFile({
                path: `${ARTWORK_DIR}/${t.id}.${artExt}`,
                data: artBase64,
                directory: Directory.Data,
                recursive: true,
              });
              artworkUrl = localPathToFileUri(artRes.uri);
            } catch (err) {
              // Track still imports without art.
              console.warn(`[wifi-import] artwork failed for ${t.title}:`, err);
            }
          }

          newTracks.push({
            id: t.id,
            source: "local",
            title: t.title,
            artist: t.artist,
            album: t.album,
            durationMs: t.durationMs,
            uri: localPathToFileUri(audioRes.uri),
            localPath: audioRes.uri,
            artworkUrl,
          });
          downloaded++;
        } catch (err) {
          console.error(`[wifi-import] failed track ${t.title}:`, err);
          failed++;
        }
      }

      if (newTracks.length > 0) {
        appendLibraryTracks(newTracks);
      }

      // Merge playlists: update existing-by-id, create new ones.
      // We do this after track imports so trackIds resolve against fresh state.
      const existingIds = new Set(playlists.map((p) => p.id));
      const selectedPlaylists: ManifestPlaylist[] = mf.playlists.filter((p) =>
        selectedPlaylistIds.includes(p.id),
      );
      for (const incoming of selectedPlaylists) {
        if (!isSafeId(incoming.id)) {
          console.warn(`[wifi-import] skipping playlist with unsafe id: ${incoming.id}`);
          continue;
        }
        // Try to pull the cover file too. Best-effort: playlist still imports if it fails.
        let coverPath: string | undefined;
        if (incoming.hasCover) {
          try {
            const coverBlob = await fetchAndStream(
              buildUrl(pairing, `/api/playlist-cover/${encodeURIComponent(incoming.id)}`),
            );
            const ext = safeExt(coverBlob.type);
            const coverBase64 = await blobToBase64(coverBlob);
            const coverRes = await Filesystem.writeFile({
              path: `${PLAYLIST_COVER_DIR}/${incoming.id}.${ext}`,
              data: coverBase64,
              directory: Directory.Data,
              recursive: true,
            });
            coverPath = localPathToFileUri(coverRes.uri);
          } catch (err) {
            console.warn(`[wifi-import] playlist cover failed for ${incoming.name}:`, err);
          }
        }

        if (existingIds.has(incoming.id)) {
          updatePlaylist(incoming.id, {
            name: incoming.name,
            trackIds: incoming.trackIds,
            ...(coverPath !== undefined ? { coverPath } : {}),
          });
        } else {
          createPlaylist(incoming.name, incoming.trackIds, coverPath, incoming.id);
        }
      }

      const final: TransferProgress = {
        completed: tracksToFetch.length,
        total: tracksToFetch.length,
        phase: "done",
        downloaded,
        skipped,
        failed,
      };
      setProgress(final);
      return final;
    },
    [libraryTracks, playlists, appendLibraryTracks, createPlaylist, updatePlaylist],
  );

  const reset = useCallback(() => {
    setManifest(null);
    setProgress(INITIAL);
  }, []);

  return {
    manifest,
    progress,
    fetchManifest,
    transfer,
    reset,
    isExistingTrackId: useCallback(
      (id: string): boolean => libraryTracks.some((t) => t.id === id),
      [libraryTracks],
    ),
    isExistingPlaylistId: useCallback(
      (id: string): boolean => playlists.some((p) => p.id === id),
      [playlists],
    ),
  };
}

export function manifestTrackKey(t: ManifestTrack): string {
  return t.id;
}
