import { Capacitor } from "@capacitor/core";
import { playerOrchestrator } from "../../core/player/player-orchestrator";
import { localProvider } from "./local-provider";
import { nativeAudioProvider } from "./native-audio-provider";

let localProviderRegistered = false;

export function ensureLocalProviderRegistered(): void {
  if (localProviderRegistered) return;

  // On Android/iOS we use the native ExoPlayer plugin. On web (vite dev or
  // desktop reference) we fall back to the HTMLAudioElement-based provider.
  const provider = Capacitor.isNativePlatform() ? nativeAudioProvider : localProvider;
  playerOrchestrator.registerProvider("local", provider);
  localProviderRegistered = true;
}
