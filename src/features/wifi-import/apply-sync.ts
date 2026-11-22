import type { Playlist } from "../../shared/types/music";
import {
  SYNC_PROTOCOL_VERSION,
  type FavoriteState,
  type SyncRequest,
  type SyncResponse,
} from "./sync-protocol";

/** The phone store slices the sync touches. */
export interface PhoneSyncState {
  favoriteTrackIds: string[];
  favoriteUpdatedAt: Record<string, number>;
  playlists: Playlist[];
  deletedPlaylists: Record<string, number>;
  playCounts: Record<string, number>;
  lastPlayedAt: Record<string, number>;
  syncedPlayCounts: Record<string, number>;
}

const stamp = (p: { createdAt: number; updatedAt?: number }) => p.updatedAt ?? p.createdAt ?? 0;

export function buildSyncRequest(s: PhoneSyncState): SyncRequest {
  const favorites: Record<string, FavoriteState> = {};
  for (const [id, at] of Object.entries(s.favoriteUpdatedAt)) favorites[id] = { fav: false, at };
  for (const id of s.favoriteTrackIds) favorites[id] = { fav: true, at: s.favoriteUpdatedAt[id] ?? 0 };

  // Only the plays since the last sync — the PC adds them to its totals
  const playCountDeltas: Record<string, number> = {};
  for (const [id, count] of Object.entries(s.playCounts)) {
    const delta = count - (s.syncedPlayCounts[id] ?? 0);
    if (delta > 0) playCountDeltas[id] = delta;
  }

  return {
    version: SYNC_PROTOCOL_VERSION,
    favorites,
    playlists: s.playlists.map((p) => ({
      id: p.id,
      name: p.name,
      trackIds: p.trackIds,
      createdAt: p.createdAt,
      updatedAt: stamp(p),
    })),
    deletedPlaylists: s.deletedPlaylists,
    playCountDeltas,
    lastPlayedAt: s.lastPlayedAt,
  };
}

/**
 * Applies the PC's merged state to the phone.
 * - `sent` is the state the request was built from; `now` is the current one,
 *   so plays / favorites changed WHILE the request was in flight aren't lost.
 * - PC-only playlists are not added here: importing them stays opt-in in the
 *   import screen (their songs may not be on the phone).
 */
export function applySyncResponse(
  sent: PhoneSyncState,
  now: PhoneSyncState,
  res: SyncResponse,
): Partial<PhoneSyncState> {
  // Favorites — skip IDs the user toggled again during the request
  const changedMeanwhile = (id: string) => (now.favoriteUpdatedAt[id] ?? 0) !== (sent.favoriteUpdatedAt[id] ?? 0);
  const favoriteUpdatedAt = { ...now.favoriteUpdatedAt };
  const favSet = new Set(now.favoriteTrackIds);
  for (const [id, f] of Object.entries(res.favorites ?? {})) {
    if (changedMeanwhile(id)) continue;
    if (f.fav) favSet.add(id);
    else favSet.delete(id);
    if (f.at > 0 || !f.fav) favoriteUpdatedAt[id] = f.at;
  }
  const newlyFav = [...favSet]
    .filter((id) => !now.favoriteTrackIds.includes(id))
    .sort((a, b) => (favoriteUpdatedAt[a] ?? 0) - (favoriteUpdatedAt[b] ?? 0));
  const favoriteTrackIds = [...now.favoriteTrackIds.filter((id) => favSet.has(id)), ...newlyFav];

  // Playlists the phone has: take the PC's merged version (keep our cover file)
  const remote = new Map((res.playlists ?? []).map((p) => [p.id, p]));
  const deletedPlaylists = { ...now.deletedPlaylists, ...res.deletedPlaylists };
  const sentStamp = new Map(sent.playlists.map((p) => [p.id, stamp(p)]));
  const playlists: Playlist[] = [];
  for (const mine of now.playlists) {
    const editedMeanwhile = sentStamp.get(mine.id) !== stamp(mine);
    const r = remote.get(mine.id);
    if (editedMeanwhile) {
      playlists.push(mine);
    } else if (r) {
      playlists.push({ ...mine, name: r.name, trackIds: r.trackIds, updatedAt: r.updatedAt });
    } else if ((deletedPlaylists[mine.id] ?? -1) >= stamp(mine)) {
      continue; // deleted on the PC
    } else {
      playlists.push(mine);
    }
  }

  // Play counts: PC totals + plays that happened during the request
  const playCounts = { ...now.playCounts };
  const syncedPlayCounts = { ...now.syncedPlayCounts };
  for (const [id, total] of Object.entries(res.playCounts ?? {})) {
    const playedMeanwhile = (now.playCounts[id] ?? 0) - (sent.playCounts[id] ?? 0);
    playCounts[id] = total + Math.max(0, playedMeanwhile);
    syncedPlayCounts[id] = total;
  }
  const lastPlayedAt = { ...now.lastPlayedAt };
  for (const [id, at] of Object.entries(res.lastPlayedAt ?? {})) {
    if (at > (lastPlayedAt[id] ?? 0)) lastPlayedAt[id] = at;
  }

  return { favoriteTrackIds, favoriteUpdatedAt, playlists, deletedPlaylists, playCounts, lastPlayedAt, syncedPlayCounts };
}
