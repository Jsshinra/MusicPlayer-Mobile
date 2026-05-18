export type SourceType = "local" | "spotify" | "youtube";
export type PlaybackState = "idle" | "loading" | "playing" | "paused" | "error";

export interface Track {
  id: string;
  source: SourceType;
  title: string;
  artist: string;
  album?: string;
  durationMs: number;
  artworkUrl?: string;
  uri: string;
  localPath?: string;
  youtubeId?: string;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  coverPath?: string;
  createdAt: number;
}
