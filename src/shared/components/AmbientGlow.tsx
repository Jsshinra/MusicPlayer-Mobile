import { CSSProperties, useMemo } from "react";
import { useAppStore } from "../../app/store/useAppStore";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(128,128,128,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function AmbientGlow() {
  const playbackState  = useAppStore((s) => s.playbackState);
  const volume         = useAppStore((s) => s.volume);
  const progressMs     = useAppStore((s) => s.progressMs);
  const durationMs     = useAppStore((s) => s.durationMs);
  const vibeColor      = useAppStore((s) => s.vibeColor);
  const accentColor    = useAppStore((s) => s.accentColor);
  const vibeIntensity  = useAppStore((s) => s.vibeIntensity);

  const color = vibeColor ?? accentColor;
  const intensityFactor = clamp(vibeIntensity / 100, 0, 1);

  const progressRatio = durationMs > 0 ? clamp(progressMs / durationMs, 0, 1) : 0;
  const volumeRatio   = clamp(volume / 100, 0, 1);

  const params = useMemo(() => {
    const isPlaying = playbackState === "playing";
    const isPaused  = playbackState === "paused";

    const baseOpacity  = isPlaying ? 1 : isPaused ? 0.8 : 1;
    const opacity      = baseOpacity * (0.8 + volumeRatio * 0.2);
    const pulseDuration = isPlaying ? "3s" : isPaused ? "6s" : "12s";
    const orbe3Left    = 38 + progressRatio * 8;

    return { opacity, pulseDuration, orbe3Left };
  }, [playbackState, progressRatio, volumeRatio]);

  const sharedAnim: CSSProperties = { animationDuration: params.pulseDuration };
  const colorTransition = "background-color 1.5s ease";

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{ opacity: params.opacity, transition: "opacity 1.2s ease" }}
    >
      <div
        className="absolute top-[10%] left-[30%] w-[600px] h-[600px] rounded-full blur-[150px] animate-pulse"
        style={{ ...sharedAnim, backgroundColor: hexToRgba(color, 0.30 * intensityFactor), transition: colorTransition }}
      />
      <div
        className="absolute top-[40%] right-[15%] w-[700px] h-[700px] rounded-full blur-[160px] animate-pulse"
        style={{ ...sharedAnim, animationDelay: "0.8s", backgroundColor: hexToRgba(color, 0.24 * intensityFactor), transition: colorTransition }}
      />
      <div
        className="absolute bottom-[15%] w-[500px] h-[500px] rounded-full blur-[140px] animate-pulse"
        style={{
          ...sharedAnim,
          animationDelay: "1.6s",
          left: `${params.orbe3Left}%`,
          backgroundColor: hexToRgba(color, 0.27 * intensityFactor),
          transition: `left 2s ease, ${colorTransition}`,
        }}
      />
    </div>
  );
}
