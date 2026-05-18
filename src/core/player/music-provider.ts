import { Track, PlaybackState, SourceType } from "../../shared/types/music";

export interface MusicProvider {
  readonly source: SourceType;

  initialize(): Promise<void>;
  search(query: string): Promise<Track[]>;
  play(track: Track): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  seek(positionMs: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
  getCurrentTrack(): Promise<Track | null>;
  getPlaybackState(): Promise<PlaybackState>;
  getProgressMs(): Promise<number>;
  getDurationMs(): Promise<number>;
  dispose(): Promise<void>;
}
