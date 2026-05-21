import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export type AudioEngineState = "idle" | "loading" | "ready" | "ended";

export interface AudioEngineStateEvent {
  state: AudioEngineState;
}

export interface AudioEnginePlayingEvent {
  isPlaying: boolean;
}

export interface AudioEnginePositionEvent {
  positionMs: number;
  durationMs: number;
}

export interface AudioEngineErrorEvent {
  code: number;
  message: string;
}

export interface AudioEngineSnapshot {
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  state: AudioEngineState;
}

export interface AudioEngineLoadOptions {
  uri: string;
  title?: string;
  artist?: string;
  album?: string;
  artworkUri?: string;
}

export interface AudioEnginePlugin {
  loadTrack(options: AudioEngineLoadOptions): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  seek(options: { positionMs: number }): Promise<void>;
  setVolume(options: { volume: number }): Promise<void>;
  getState(): Promise<AudioEngineSnapshot>;

  addListener(
    eventName: "stateChanged",
    cb: (event: AudioEngineStateEvent) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: "playingChanged",
    cb: (event: AudioEnginePlayingEvent) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: "position",
    cb: (event: AudioEnginePositionEvent) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: "error",
    cb: (event: AudioEngineErrorEvent) => void,
  ): Promise<PluginListenerHandle>;
}

export const AudioEngine = registerPlugin<AudioEnginePlugin>("AudioEngine");
