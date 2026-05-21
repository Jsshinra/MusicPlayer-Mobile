/** Payload encoded in the QR shown by the desktop's WifiShareModal. */
export interface PairingPayload {
  v: 1;
  host: string;
  port: number;
  token: string;
  name: string;
}

/** Manifest returned by the desktop's GET /api/manifest. */
export interface ShareManifest {
  version: number;
  serverName: string;
  generatedAt: number;
  tracks: ManifestTrack[];
  playlists: ManifestPlaylist[];
}

export interface ManifestTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  durationMs: number;
  sizeBytes: number;
  hasArtwork: boolean;
}

export interface ManifestPlaylist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt?: number;
  /** True if the desktop has a cover file to serve via /api/playlist-cover/:id. */
  hasCover?: boolean;
}

export function isPairingPayload(value: unknown): value is PairingPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<PairingPayload>;
  return (
    v.v === 1 &&
    typeof v.host === "string" &&
    typeof v.port === "number" &&
    typeof v.token === "string" &&
    typeof v.name === "string"
  );
}
