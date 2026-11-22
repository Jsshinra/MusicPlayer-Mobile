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
import type { SyncResponse } from "../sync-protocol";
import { applySyncResponse, buildSyncRequest, type PhoneSyncState } from "../apply-sync";

export interface SyncSummary {
  favorites: number;
  playlists: number;
  /** Plays sent to the PC in this sync. */
  playsSent: number;
}

function syncSlice(): PhoneSyncState {
  const s = useAppStore.getState();
  return {
    favoriteTrackIds: s.favoriteTrackIds,
    favoriteUpdatedAt: s.favoriteUpdatedAt,
    playlists: s.playlists,
    deletedPlaylists: s.deletedPlaylists,
    playCounts: s.playCounts,
    lastPlayedAt: s.lastPlayedAt,
    syncedPlayCounts: s.syncedPlayCounts,
  };
}

const MUSIC_DIR = "music";
const ARTWORK_DIR = "artwork";
const PLAYLIST_COVER_DIR = "playlist-covers";

// Manifest IDs and Content-Types come from the (untrusted) desktop server and
// both get interpolated into Filesystem paths. Reject anything that could climb
// out of the target directory — path traversal from a tampered QR/server.

// Security check: block only genuine path-traversal attempts.
// The original regex allowlist was too strict — it rejected track IDs that
// include the full Windows file path (spaces, colons, backslashes, etc.).
function isSafeId(id: string): boolean {
  if (!id || id.length > 500) return false;
  // Normalize to forward slashes and reject any ".." path segment.
  return !id.replace(/\\/g, "/").split("/").some((seg) => seg === "..");
}

// cyrb53 — small, synchronous 53-bit string hash. Only used to tell IDs apart
// in filenames, not for security.
function hashId(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

// Converts a track/playlist ID into a filename that is safe on Android's
// filesystem AND unique per ID. Desktop track IDs are full paths
// ("local-C:\Users\...\Song.mp3"): only the file name is kept for readability,
// sanitized and capped, plus a hash of the whole ID. Sanitizing/truncating
// alone made different IDs collide ("a b" vs "a_b", long names sharing a
// prefix) and one song overwrote the other on the phone.
function idToFilename(id: string): string {
  const baseName = id.split(/[\/\\]/).pop() ?? id;
  const readable = baseName
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/[\/\\:*?"<>|\0]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80);
  return `${readable || "track"}-${hashId(id)}`;
}

// Maps the Content-Type returned by the desktop server to a file extension.
// audio/mpeg -> mp3, audio/mp4 -> m4a, audio/flac -> flac, etc.
function audioExtFromMime(mimeType: string): string {
  const base = (mimeType.split(";")[0] ?? "").trim().toLowerCase();
  const EXT: Record<string, string> = {
    "audio/mpeg":  "mp3",
    "audio/mp3":   "mp3",
    "audio/mp4":   "m4a",
    "audio/x-m4a": "m4a",
    "audio/aac":   "aac",
    "audio/x-aac": "aac",
    "audio/flac":  "flac",
    "audio/x-flac":"flac",
    "audio/ogg":   "ogg",
    "audio/wav":   "wav",
    "audio/x-wav": "wav",
    "audio/webm":  "webm",
  };
  return EXT[base] ?? "mp3";
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
          const audioExt = audioExtFromMime(audioBlob.type);
          const audioRes = await Filesystem.writeFile({
            path: `${MUSIC_DIR}/${idToFilename(t.id)}.${audioExt}`,
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
                path: `${ARTWORK_DIR}/${idToFilename(t.id)}.${artExt}`,
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

          // Add each track as soon as it's on disk: if the app is closed halfway
          // through a long transfer, what already downloaded stays in the library.
          const track: Track = {
            id: t.id,
            source: "local",
            title: t.title,
            artist: t.artist,
            album: t.album,
            durationMs: t.durationMs,
            uri: localPathToFileUri(audioRes.uri),
            localPath: audioRes.uri,
            artworkUrl,
          };
          appendLibraryTracks([track]);
          downloaded++;
        } catch (err) {
          console.error(`[wifi-import] failed track ${t.title}:`, err);
          failed++;
        }
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
              path: `${PLAYLIST_COVER_DIR}/${idToFilename(incoming.id)}.${ext}`,
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
          // Already synced — only touch it if something actually differs, so it
          // doesn't get a newer updatedAt and override the PC on the next sync
          const mine = playlists.find((p) => p.id === incoming.id);
          const same = mine && mine.name === incoming.name &&
            mine.trackIds.length === incoming.trackIds.length &&
            mine.trackIds.every((id, i) => id === incoming.trackIds[i]);
          if (!same || coverPath !== undefined) {
            updatePlaylist(incoming.id, {
              name: incoming.name,
              trackIds: incoming.trackIds,
              ...(coverPath !== undefined ? { coverPath } : {}),
            });
          }
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

  /**
   * Two-way sync of favorites, playlists and play counts with the PC.
   * Returns null when the PC's Lumen is too old to support it (no /api/sync).
   */
  const sync = useCallback(async (pairing: PairingPayload): Promise<SyncSummary | null> => {
    const sent = syncSlice();
    const request = buildSyncRequest(sent);
    const res = await fetch(buildUrl(pairing, "/api/sync"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Sync HTTP ${res.status}`);
    const response = (await res.json()) as SyncResponse;

    const next = applySyncResponse(sent, syncSlice(), response);
    useAppStore.getState().applySyncState(next);
    return {
      favorites: next.favoriteTrackIds?.length ?? 0,
      playlists: next.playlists?.length ?? 0,
      playsSent: Object.values(request.playCountDeltas).reduce((a, b) => a + b, 0),
    };
  }, []);

  const reset = useCallback(() => {
    setManifest(null);
    setProgress(INITIAL);
  }, []);

  return {
    manifest,
    progress,
    fetchManifest,
    transfer,
    sync,
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
