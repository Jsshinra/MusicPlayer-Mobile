import { Filesystem, Directory } from "@capacitor/filesystem";
import type { Track, Playlist } from "../../shared/types/music";

export const MUSIC_DIR = "music";
export const ARTWORK_DIR = "artwork";
export const PLAYLIST_COVER_DIR = "playlist-covers";

export interface DirSize {
  files: number;
  bytes: number;
}

export interface StorageBreakdown {
  music: DirSize;
  artwork: DirSize;
  covers: DirSize;
}

export interface OrphanCleanupResult {
  filesDeleted: number;
  bytesFreed: number;
}

interface DirEntry {
  name: string;
  size: number;
}

async function listDir(path: string): Promise<DirEntry[]> {
  try {
    const res = await Filesystem.readdir({ path, directory: Directory.Data });
    return res.files.map((f) => ({
      name: f.name,
      // size may be missing on some plugin versions; default to 0 so totals
      // still render.
      size: typeof f.size === "number" ? f.size : 0,
    }));
  } catch {
    // Directory likely doesn't exist yet (fresh install). Treat as empty.
    return [];
  }
}

function sum(entries: DirEntry[]): DirSize {
  return entries.reduce(
    (acc, e) => ({ files: acc.files + 1, bytes: acc.bytes + e.size }),
    { files: 0, bytes: 0 },
  );
}

export async function computeStorageBreakdown(): Promise<StorageBreakdown> {
  const [music, artwork, covers] = await Promise.all([
    listDir(MUSIC_DIR),
    listDir(ARTWORK_DIR),
    listDir(PLAYLIST_COVER_DIR),
  ]);
  return {
    music: sum(music),
    artwork: sum(artwork),
    covers: sum(covers),
  };
}

function fileBaseId(filename: string): string {
  // Strip the extension. We use full IDs as filenames, so the part before the
  // last "." is the ID (or "id-<ts>" for playlist covers).
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(0, dot) : filename;
}

export async function findOrphans(
  tracks: Track[],
  playlists: Playlist[],
): Promise<{ paths: string[]; bytes: number }> {
  const [music, artwork, covers] = await Promise.all([
    listDir(MUSIC_DIR),
    listDir(ARTWORK_DIR),
    listDir(PLAYLIST_COVER_DIR),
  ]);

  const trackIds = new Set(tracks.map((t) => t.id));
  const playlistIds = new Set(playlists.map((p) => p.id));

  const orphans: { path: string; size: number }[] = [];

  for (const f of music) {
    if (!trackIds.has(fileBaseId(f.name))) {
      orphans.push({ path: `${MUSIC_DIR}/${f.name}`, size: f.size });
    }
  }
  for (const f of artwork) {
    if (!trackIds.has(fileBaseId(f.name))) {
      orphans.push({ path: `${ARTWORK_DIR}/${f.name}`, size: f.size });
    }
  }
  for (const f of covers) {
    // Playlist covers are saved as `<id>-<ts>.<ext>`; the ID is the part
    // before the last dash.
    const base = fileBaseId(f.name);
    const dash = base.lastIndexOf("-");
    const id = dash > 0 ? base.slice(0, dash) : base;
    if (!playlistIds.has(id)) {
      orphans.push({ path: `${PLAYLIST_COVER_DIR}/${f.name}`, size: f.size });
    }
  }

  return {
    paths: orphans.map((o) => o.path),
    bytes: orphans.reduce((acc, o) => acc + o.size, 0),
  };
}

export async function deleteOrphans(paths: string[]): Promise<number> {
  let deleted = 0;
  for (const path of paths) {
    try {
      await Filesystem.deleteFile({ path, directory: Directory.Data });
      deleted++;
    } catch (err) {
      console.warn(`[storage] failed to delete ${path}:`, err);
    }
  }
  return deleted;
}

export function formatBytes(n: number): string {
  if (n <= 0) return "0 B";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
