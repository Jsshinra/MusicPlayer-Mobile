import { ChangeEvent } from "react";
import { playerOrchestrator } from "../../../core/player/player-orchestrator";
import { useAppStore, type RepeatMode } from "../../../app/store/useAppStore";
import { formatMsToClock } from "../../../shared/utils/format-time";

/* ── Icons ──────────────────────────────────────────────────────────────── */

function IconChevronDown() {
  return (
    <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
    </svg>
  );
}

const iconSize = {
  transport: { width: "clamp(22px,2.8vh,34px)", height: "clamp(22px,2.8vh,34px)" },
  play:      { width: "clamp(28px,3.6vh,44px)", height: "clamp(28px,3.6vh,44px)" },
  secondary: { width: "clamp(16px,2.1vh,26px)", height: "clamp(16px,2.1vh,26px)" },
  volume:    { width: "clamp(14px,1.8vh,22px)", height: "clamp(14px,1.8vh,22px)" },
} as const;

function IconPrev() {
  return (
    <svg style={iconSize.transport} viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 3h1.5v10H3V3zm2.5 5 7-4.5v9L5.5 8z" />
    </svg>
  );
}

function IconNext() {
  return (
    <svg style={iconSize.transport} viewBox="0 0 16 16" fill="currentColor">
      <path d="M11.5 3H13v10h-1.5V3zm-9 0 7 5-7 5V3z" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg style={iconSize.play} viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 2.5l11 5.5-11 5.5V2.5z" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg style={iconSize.play} viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 2h3.5v12H3V2zm6.5 0H13v12H9.5V2z" />
    </svg>
  );
}

function IconShuffle() {
  return (
    <svg style={iconSize.secondary} viewBox="0 0 16 16" fill="currentColor">
      <path d="M0 3.5A.5.5 0 0 1 .5 3H1c2.202 0 3.827 1.24 4.874 2.418.49.552.865 1.102 1.126 1.532.26-.43.636-.98 1.126-1.532C9.173 4.24 10.798 3 13 3v1c-1.798 0-3.173 1.01-4.126 2.082A9.624 9.624 0 0 0 7.556 8a9.624 9.624 0 0 0 1.317 1.918C9.828 10.99 11.204 12 13 12v1c-2.202 0-3.827-1.24-4.874-2.418A10.595 10.595 0 0 1 7 9.05c-.26.43-.636.98-1.126 1.532C4.827 11.76 3.202 13 1 13H.5a.5.5 0 0 1 0-1H1c1.798 0 3.173-1.01 4.126-2.082A9.624 9.624 0 0 0 6.444 8a9.624 9.624 0 0 0-1.317-1.918C4.172 5.01 2.796 4 1 4H.5a.5.5 0 0 1-.5-.5z" />
      <path d="M13 5.466V2.5a.5.5 0 0 1 .854-.354l2.5 2.5a.5.5 0 0 1 0 .708l-2.5 2.5A.5.5 0 0 1 13 7.5V5.466c-.785.101-1.608.48-2.39 1.081A9.88 9.88 0 0 0 9.344 8a9.88 9.88 0 0 0 1.265 1.453C11.392 10.054 12.215 10.433 13 10.534V8.5a.5.5 0 0 1 .854-.354l2.5 2.5a.5.5 0 0 1 0 .708l-2.5 2.5A.5.5 0 0 1 13 13.5v-2.966c-1.073-.145-2.106-.68-3.015-1.419A11.095 11.095 0 0 1 8.625 8a11.094 11.094 0 0 1 1.36-1.115C10.894 6.147 11.927 5.61 13 5.466z" />
    </svg>
  );
}

function IconRepeat({ mode }: { mode: RepeatMode }) {
  if (mode === "one") {
    return (
      <svg style={iconSize.secondary} viewBox="0 0 16 16" fill="currentColor">
        <path d="M11 4v1.466a.25.25 0 0 0 .41.192l2.36-1.966a.25.25 0 0 0 0-.384l-2.36-1.966a.25.25 0 0 0-.41.192V3H5a5 5 0 0 0-4.48 7.223.5.5 0 0 0 .896-.446A4 4 0 0 1 5 4h6zm4.48 1.777a.5.5 0 0 0-.896.446A4 4 0 0 1 11 12H5v-1.466a.25.25 0 0 0-.41-.192l-2.36 1.966a.25.25 0 0 0 0 .384l2.36 1.966a.25.25 0 0 0 .41-.192V13h6a5 5 0 0 0 4.48-7.223z" />
        <path d="M9 5.5a.5.5 0 0 0-.854-.354l-1.5 1.5a.5.5 0 1 0 .708.708L8 6.707V10.5a.5.5 0 0 0 1 0v-5z" />
      </svg>
    );
  }
  return (
    <svg style={iconSize.secondary} viewBox="0 0 16 16" fill="currentColor">
      <path d="M11 4v1.466a.25.25 0 0 0 .41.192l2.36-1.966a.25.25 0 0 0 0-.384l-2.36-1.966a.25.25 0 0 0-.41.192V3H5a5 5 0 0 0-4.48 7.223.5.5 0 0 0 .896-.446A4 4 0 0 1 5 4h6zm4.48 1.777a.5.5 0 0 0-.896.446A4 4 0 0 1 11 12H5v-1.466a.25.25 0 0 0-.41-.192l-2.36 1.966a.25.25 0 0 0 0 .384l2.36 1.966a.25.25 0 0 0 .41-.192V13h6a5 5 0 0 0 4.48-7.223z" />
    </svg>
  );
}

function IconVolume({ muted }: { muted: boolean }) {
  return muted ? (
    <svg style={iconSize.volume} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 2 4.5 5.5H1v5h3.5L8 14V2zm5.3 2.3-1.4 1.4A4 4 0 0 1 13 8a4 4 0 0 1-1.1 2.8l1.4 1.4A6 6 0 0 0 15 8a6 6 0 0 0-1.7-4.4zM2 2 1 3l2 2H1v6h3.5L8 14v-2.6L3.4 6.8 2 5.4V2z" />
    </svg>
  ) : (
    <svg style={iconSize.volume} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 2 4.5 5.5H1v5h3.5L8 14V2zm4.5 1.5a6 6 0 0 1 0 9M10.7 5.3a3.5 3.5 0 0 1 0 5.4" />
    </svg>
  );
}

function IconMusicNote() {
  return (
    <svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor" className="text-zinc-700">
      <path d="M9 3a1 1 0 0 0-2 0v5.5a2.5 2.5 0 1 0 2 2.45V3zM8 12.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
    </svg>
  );
}

/* ── Component ──────────────────────────────────────────────────────────── */

export function NowPlayingPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const currentTrack   = useAppStore((s) => s.currentTrack);
  const playbackState  = useAppStore((s) => s.playbackState);
  const progressMs     = useAppStore((s) => s.progressMs);
  const durationMs     = useAppStore((s) => s.durationMs);
  const volume         = useAppStore((s) => s.volume);
  const currentQueueIndex = useAppStore((s) => s.currentQueueIndex);
  const shuffleEnabled = useAppStore((s) => s.shuffleEnabled);
  const repeatMode     = useAppStore((s) => s.repeatMode);
  const setShuffleEnabled = useAppStore((s) => s.setShuffleEnabled);
  const setRepeatMode     = useAppStore((s) => s.setRepeatMode);

  const isPlaying    = playbackState === "playing";
  const hasTrack     = currentTrack !== null;
  const canGoPrev    = hasTrack && currentQueueIndex > 0;
  const canGoNext    = hasTrack;
  const seekMax      = durationMs > 0 ? durationMs : 1;
  const seekValue    = Math.min(progressMs, seekMax);
  const progressPct  = ((seekValue / seekMax) * 100).toFixed(2);

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) =>
    void playerOrchestrator.seek(Number(e.currentTarget.value));

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) =>
    void playerOrchestrator.setVolume(Number(e.currentTarget.value));

  const handlePlayPause = () => {
    if (isPlaying) void playerOrchestrator.pause();
    else void playerOrchestrator.resume();
  };

  const handleRepeatCycle = () => {
    const next: RepeatMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
    setRepeatMode(next);
  };

  return (
    <div
      className={[
        "absolute inset-0 z-40 flex flex-col bg-zinc-950 overflow-hidden",
        "transition-transform duration-300 ease-in-out",
        open ? "translate-y-0" : "translate-y-full",
        open ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
    >

      {/* Top bar — large tap target on the close button */}
      <div className="relative z-10 flex items-center justify-between px-3 pt-2 pb-2 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("[NowPlayingPanel] close tapped");
            onClose();
          }}
          className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full text-zinc-300 active:bg-zinc-800 active:text-white transition-colors"
          aria-label="Close now playing"
          style={{ touchAction: "manipulation" }}
        >
          <IconChevronDown />
        </button>
        <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">Now Playing</p>
        <div className="w-12" /> {/* spacer to balance the close button */}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-col items-center justify-center min-h-full px-8 py-6 gap-[clamp(1rem,2.2vh,2.5rem)]">

        {/* Artwork */}
        <div className="w-[clamp(180px,48vh,520px)] aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-2xl">
          {currentTrack?.artworkUrl ? (
            <img
              src={currentTrack.artworkUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <IconMusicNote />
          )}
        </div>

        {/* Title + artist */}
        <div className="text-center w-full max-w-sm space-y-1">
          <p className="text-[clamp(1rem,2.3vh,1.6rem)] font-semibold text-white leading-tight truncate">
            {currentTrack?.title ?? "Nothing playing"}
          </p>
          <p className="text-[clamp(0.8rem,1.7vh,1.1rem)] text-zinc-500 truncate">
            {currentTrack?.artist ?? "—"}
          </p>
        </div>

        {/* Progress */}
        <div className="w-full max-w-sm space-y-1.5">
          <div className="relative h-[clamp(3px,0.45vh,5px)] group">
            <div className="absolute inset-0 rounded-full bg-zinc-800" />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-zinc-400 group-hover:bg-white transition-colors duration-150"
              style={{ width: `${progressPct}%` }}
            />
            <input
              type="range"
              min={0}
              max={seekMax}
              step={250}
              value={seekValue}
              onChange={handleSeek}
              disabled={!hasTrack}
              aria-label="Seek"
              className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>
          <div className="flex justify-between font-mono text-[clamp(11px,1.4vh,14px)] text-zinc-600 tabular-nums">
            <span>{formatMsToClock(progressMs)}</span>
            <span>{formatMsToClock(durationMs)}</span>
          </div>
        </div>

        {/* Transport */}
        <div className="flex items-center justify-center gap-8 w-full max-w-sm">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => void playerOrchestrator.previous()}
            disabled={!canGoPrev}
            className="text-zinc-500 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <IconPrev />
          </button>

          <button
            type="button"
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={handlePlayPause}
            disabled={!hasTrack}
            className="flex h-[clamp(56px,7.5vh,84px)] w-[clamp(56px,7.5vh,84px)] items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-white hover:border-zinc-500 hover:bg-zinc-800 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {isPlaying ? <IconPause /> : <IconPlay />}
          </button>

          <button
            type="button"
            aria-label="Next"
            onClick={() => void playerOrchestrator.next()}
            disabled={!canGoNext}
            className="text-zinc-500 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <IconNext />
          </button>
        </div>

        {/* Shuffle + Repeat */}
        <div className="flex items-center justify-between w-full max-w-sm">
          <button
            type="button"
            aria-label="Toggle shuffle"
            onClick={() => setShuffleEnabled(!shuffleEnabled)}
            className={shuffleEnabled ? "text-white" : "text-zinc-600 hover:text-zinc-400 transition-colors"}
          >
            <IconShuffle />
          </button>

          <button
            type="button"
            aria-label="Cycle repeat"
            onClick={handleRepeatCycle}
            className={repeatMode !== "off" ? "text-white" : "text-zinc-600 hover:text-zinc-400 transition-colors"}
          >
            <IconRepeat mode={repeatMode} />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3 w-full max-w-sm">
          <span className="text-zinc-600 shrink-0"><IconVolume muted={volume === 0} /></span>
          <div className="relative flex-1 h-[clamp(3px,0.45vh,5px)] group">
            <div className="absolute inset-0 rounded-full bg-zinc-800" />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-zinc-500 group-hover:bg-zinc-300 transition-colors duration-150"
              style={{ width: `${volume}%` }}
            />
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={volume}
              onChange={handleVolumeChange}
              aria-label="Volume"
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <span className="w-6 text-right font-mono text-[clamp(11px,1.4vh,14px)] text-zinc-600 tabular-nums shrink-0">
            {volume}
          </span>
        </div>

        </div>
      </div>
    </div>
  );
}
