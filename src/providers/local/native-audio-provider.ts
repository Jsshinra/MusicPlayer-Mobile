import { MusicProvider } from "../../core/player/music-provider";
import { Track, PlaybackState, SourceType } from "../../shared/types/music";
import {
  AudioEngine,
  type AudioEnginePositionEvent,
  type AudioEnginePlayingEvent,
  type AudioEngineStateEvent,
} from "../../shared/native/audio-engine";

/**
 * MusicProvider backed by the native ExoPlayer plugin (AudioEnginePlugin.java).
 *
 * Replaces the HTMLAudioElement-based LocalProvider on Capacitor builds.
 * Position/state come from plugin events; the orchestrator polls our getters
 * every 250ms so we cache the latest values from those events.
 */
export class NativeAudioProvider implements MusicProvider {
  public readonly source: SourceType = "local";

  private currentTrack: Track | null = null;
  private playbackState: PlaybackState = "idle";
  private positionMs = 0;
  private durationMs = 0;
  private volume = 100;
  private initialized = false;

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    await AudioEngine.addListener("position", (e: AudioEnginePositionEvent) => {
      this.positionMs = e.positionMs;
      if (e.durationMs > 0) this.durationMs = e.durationMs;
    });

    await AudioEngine.addListener("playingChanged", (e: AudioEnginePlayingEvent) => {
      // Guard against a trailing playingChanged(false) clobbering a terminal
      // state. When a track ends naturally, Media3 emits stateChanged("ended")
      // *and* playingChanged(false); the dispatch order is not guaranteed.
      // If we let isPlaying=false overwrite "idle" with "paused", the
      // orchestrator's track-end check (currentTrack===null && state==="idle")
      // never matches and the queue stops auto-advancing. "loading"/"playing"/
      // "paused" are live states we still want to react to.
      if (this.playbackState === "idle" || this.playbackState === "error") return;
      this.playbackState = e.isPlaying ? "playing" : "paused";
    });

    await AudioEngine.addListener("stateChanged", (e: AudioEngineStateEvent) => {
      if (e.state === "loading") this.playbackState = "loading";
      else if (e.state === "ended") {
        this.playbackState = "idle";
        this.currentTrack = null;
        this.positionMs = 0;
      } else if (e.state === "idle") {
        if (this.playbackState !== "playing" && this.playbackState !== "paused") {
          this.playbackState = "idle";
        }
      }
    });

    await AudioEngine.addListener("error", (e) => {
      console.error("[audio-engine] playback error", e);
      this.playbackState = "error";
    });

    await this.applyVolume();
  }

  public async search(_query: string): Promise<Track[]> {
    return [];
  }

  public async play(track: Track): Promise<void> {
    this.currentTrack = track;
    this.positionMs = 0;
    this.durationMs = 0;
    this.playbackState = "loading";
    // ExoPlayer reads file:// URIs directly from disk via FileDataSource.
    // Use localPath (file:///...) instead of track.uri (which is the
    // WebView-friendly https://localhost/_capacitor_file_/... that would
    // make ExoPlayer try to HTTP-fetch from a server that doesn't exist).
    const playUri = track.localPath
      ? (track.localPath.startsWith("file://") ? track.localPath : `file://${track.localPath}`)
      : track.uri;
    // artworkUrl can be a Capacitor convertFileSrc URL (https://localhost/...)
    // or a file:// path. Media3's notification provider accepts either.
    await AudioEngine.loadTrack({
      uri: playUri,
      title: track.title,
      artist: track.artist,
      album: track.album,
      artworkUri: track.artworkUrl,
    });
    await AudioEngine.play();
  }

  public async pause(): Promise<void> {
    await AudioEngine.pause();
  }

  public async resume(): Promise<void> {
    await AudioEngine.play();
  }

  public async next(): Promise<void> {
    /* handled at orchestrator level */
  }

  public async previous(): Promise<void> {
    /* handled at orchestrator level */
  }

  public async seek(positionMs: number): Promise<void> {
    this.positionMs = positionMs;
    await AudioEngine.seek({ positionMs });
  }

  public async setVolume(volume: number): Promise<void> {
    this.volume = Math.max(0, Math.min(100, volume));
    await this.applyVolume();
  }

  private async applyVolume(): Promise<void> {
    const v = this.volume / 100;
    // Perceptual taper — matches what the desktop LocalProvider does.
    await AudioEngine.setVolume({ volume: v * v });
  }

  public async getCurrentTrack(): Promise<Track | null> {
    return this.currentTrack;
  }

  public async getPlaybackState(): Promise<PlaybackState> {
    return this.playbackState;
  }

  public async getProgressMs(): Promise<number> {
    return this.positionMs;
  }

  public async getDurationMs(): Promise<number> {
    return this.durationMs;
  }

  public async dispose(): Promise<void> {
    await AudioEngine.stop();
    this.currentTrack = null;
    this.playbackState = "idle";
    this.positionMs = 0;
    this.durationMs = 0;
  }
}

export const nativeAudioProvider = new NativeAudioProvider();
