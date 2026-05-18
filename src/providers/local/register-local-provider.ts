import { playerOrchestrator } from "../../core/player/player-orchestrator";
import { localProvider } from "./local-provider";

let localProviderRegistered = false;

export function ensureLocalProviderRegistered(): void {
  if (localProviderRegistered) {
    return;
  }

  playerOrchestrator.registerProvider("local", localProvider);
  localProviderRegistered = true;
}
