import { useAppStore } from "../../../app/store/useAppStore";
import { playerOrchestrator } from "../../../core/player/player-orchestrator";

function IconPlay() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function IconNext() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 5v14l9-7L6 5z" />
      <rect x="16" y="5" width="2" height="14" rx="1" />
    </svg>
  );
}

function IconMusicNote() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

interface MobilePlayerBarProps {
  onExpand: () => void;
}

export function MobilePlayerBar({ onExpand }: MobilePlayerBarProps) {
  const currentTrack = useAppStore((s) => s.currentTrack);
  const playbackState = useAppStore((s) => s.playbackState);
  const progressMs = useAppStore((s) => s.progressMs);
  const durationMs = useAppStore((s) => s.durationMs);

  const hasTrack = currentTrack !== null;
  const isPlaying = playbackState === "playing";
  const progressPct = durationMs > 0 ? (progressMs / durationMs) * 100 : 0;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasTrack) return;
    if (isPlaying) void playerOrchestrator.pause();
    else void playerOrchestrator.resume();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasTrack) return;
    void playerOrchestrator.next();
  };

  return (
    <div
      role="button"
      onClick={hasTrack ? onExpand : undefined}
      className={[
        "relative border-t border-zinc-800/60 bg-zinc-950/95 backdrop-blur-md",
        hasTrack ? "cursor-pointer active:bg-zinc-900" : "opacity-60",
      ].join(" ")}
    >
      {/* Thin progress bar at very top */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-zinc-800">
        <div
          className="h-full transition-all"
          style={{ width: `${progressPct}%`, backgroundColor: "var(--accent)" }}
        />
      </div>

      <div className="flex items-center gap-3 px-3 py-2">
        {/* Artwork */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-900 text-zinc-700">
          {currentTrack?.artworkUrl ? (
            <img src={currentTrack.artworkUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <IconMusicNote />
          )}
        </div>

        {/* Track info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium tracking-tight text-white">
            {currentTrack?.title ?? "Nada sonando"}
          </p>
          {currentTrack && (
            <p className="truncate text-[11px] text-zinc-500">
              {currentTrack.artist ?? ""}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={handlePlayPause}
            disabled={!hasTrack}
            aria-label={isPlaying ? "Pausar" : "Reproducir"}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white disabled:text-zinc-700 active:bg-zinc-800"
          >
            {isPlaying ? <IconPause /> : <IconPlay />}
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!hasTrack}
            aria-label="Siguiente"
            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 disabled:text-zinc-700 active:bg-zinc-800"
          >
            <IconNext />
          </button>
        </div>
      </div>
    </div>
  );
}
