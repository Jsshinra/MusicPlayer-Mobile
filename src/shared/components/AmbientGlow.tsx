import { CSSProperties } from "react";
import { useAppStore } from "../../app/store/useAppStore";
import { usePlaybackStore } from "../../app/store/usePlaybackStore";

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

/**
 * Mobile-tuned ambient glow.
 *
 * The desktop version animates 600-700px blurred orbs with `animate-pulse`,
 * which the Android WebView can't composite cheaply — every store update
 * triggered a visible flicker. Here we:
 *  - shrink the orbs to mobile-screen-appropriate sizes (280-360px)
 *  - drop the pulse animation entirely; color/opacity transitions are enough
 *  - pin each orb to its own GPU layer with translateZ(0)
 *  - keep the slow color transition so changing accent/vibe still feels smooth
 */
export function AmbientGlow() {
  const playbackState  = usePlaybackStore((s) => s.playbackState);
  const volume         = useAppStore((s) => s.volume);
  const vibeColor      = useAppStore((s) => s.vibeColor);
  const accentColor    = useAppStore((s) => s.accentColor);
  const vibeIntensity  = useAppStore((s) => s.vibeIntensity);

  const color = vibeColor ?? accentColor;
  const intensityFactor = clamp(vibeIntensity / 100, 0, 1);
  const volumeRatio = clamp(volume / 100, 0, 1);

  const baseOpacity = playbackState === "playing" ? 1 : playbackState === "paused" ? 0.8 : 1;
  const opacity = baseOpacity * (0.8 + volumeRatio * 0.2);

  const layerBase: CSSProperties = {
    transform: "translateZ(0)",
    willChange: "background-color",
    transition: "background-color 1.5s ease",
  };

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{ opacity, transition: "opacity 1.2s ease" }}
    >
      <div
        className="absolute -top-20 left-1/4 h-[320px] w-[320px] rounded-full blur-[100px]"
        style={{ ...layerBase, backgroundColor: hexToRgba(color, 0.28 * intensityFactor) }}
      />
      <div
        className="absolute top-1/3 -right-16 h-[360px] w-[360px] rounded-full blur-[110px]"
        style={{ ...layerBase, backgroundColor: hexToRgba(color, 0.22 * intensityFactor) }}
      />
      <div
        className="absolute -bottom-24 left-[20%] h-[280px] w-[280px] rounded-full blur-[90px]"
        style={{ ...layerBase, backgroundColor: hexToRgba(color, 0.24 * intensityFactor) }}
      />
    </div>
  );
}
