/**
 * Two-way WiFi sync between desktop and the mobile app (POST /api/sync).
 * Copy of the desktop's src/features/sync/sync-protocol.ts —
 * keep both in sync.
 *
 * Conflict rules (each side stores WHEN things changed):
 * - Favorites: per track, the most recent mark/unmark wins (so unfavoriting
 *   on one device propagates instead of being re-added by the other).
 * - Playlists: the version with the latest updatedAt wins; a deletion
 *   (tombstone) newer than every edit deletes it on both sides.
 * - Play counts: the phone sends only the plays since the last sync (deltas),
 *   the desktop adds them and returns its totals.
 */

export const SYNC_PROTOCOL_VERSION = 1;

export interface FavoriteState {
  fav: boolean;
  /** When it was marked/unmarked (ms). 0 = unknown (from before sync existed). */
  at: number;
}

export interface SyncPlaylist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
  /** Response only: the desktop can serve a cover at /api/playlist-cover/:id. */
  hasCover?: boolean;
}

/** Phone → desktop. */
export interface SyncRequest {
  version: number;
  favorites: Record<string, FavoriteState>;
  playlists: SyncPlaylist[];
  deletedPlaylists: Record<string, number>;
  playCountDeltas: Record<string, number>;
  lastPlayedAt: Record<string, number>;
}

/** Desktop → phone: the merged state. */
export interface SyncResponse {
  version: number;
  favorites: Record<string, FavoriteState>;
  playlists: SyncPlaylist[];
  deletedPlaylists: Record<string, number>;
  playCounts: Record<string, number>;
  lastPlayedAt: Record<string, number>;
}
