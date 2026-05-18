import { ChangeEvent } from "react";
import { playerOrchestrator } from "../../../core/player/player-orchestrator";
import { useAppStore, type RepeatMode } from "../../../app/store/useAppStore";
import { formatMsToClock } from "../../../shared/utils/format-time";

/* ── SVG icons (inline, no external deps) ─────────────────── */

function IconPrev() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 3h1.5v10H3V3zm2.5 5 7-4.5v9L5.5 8z" />
    </svg>
  );
}

function IconNext() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M11.5 3H13v10h-1.5V3zm-9 0 7 5-7 5V3z" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 2.5l11 5.5-11 5.5V2.5z" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 2h3.5v12H3V2zm6.5 0H13v12H9.5V2z" />
    </svg>
  );
}

function IconVolume({ muted }: { muted: boolean }) {
  return muted ? (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 2 4.5 5.5H1v5h3.5L8 14V2zm5.3 2.3-1.4 1.4A4 4 0 0 1 13 8a4 4 0 0 1-1.1 2.8l1.4 1.4A6 6 0 0 0 15 8a6 6 0 0 0-1.7-4.4zM2 2 1 3l2 2H1v6h3.5L8 14v-2.6L3.4 6.8 2 5.4V2z" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 2 4.5 5.5H1v5h3.5L8 14V2zm4.5 1.5a6 6 0 0 1 0 9M10.7 5.3a3.5 3.5 0 0 1 0 5.4" />
    </svg>
  );
}

function IconShuffle() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M0 3.5A.5.5 0 0 1 .5 3H1c2.202 0 3.827 1.24 4.874 2.418.49.552.865 1.102 1.126 1.532.26-.43.636-.98 1.126-1.532C9.173 4.24 10.798 3 13 3v1c-1.798 0-3.173 1.01-4.126 2.082A9.624 9.624 0 0 0 7.556 8a9.624 9.624 0 0 0 1.317 1.918C9.828 10.99 11.204 12 13 12v1c-2.202 0-3.827-1.24-4.874-2.418A10.595 10.595 0 0 1 7 9.05c-.26.43-.636.98-1.126 1.532C4.827 11.76 3.202 13 1 13H.5a.5.5 0 0 1 0-1H1c1.798 0 3.173-1.01 4.126-2.082A9.624 9.624 0 0 0 6.444 8a9.624 9.624 0 0 0-1.317-1.918C4.172 5.01 2.796 4 1 4H.5a.5.5 0 0 1-.5-.5z" />
      <path d="M13 5.466V2.5a.5.5 0 0 1 .854-.354l2.5 2.5a.5.5 0 0 1 0 .708l-2.5 2.5A.5.5 0 0 1 13 7.5V5.466c-.785.101-1.608.48-2.39 1.081A9.88 9.88 0 0 0 9.344 8a9.88 9.88 0 0 0 1.265 1.453C11.392 10.054 12.215 10.433 13 10.534V8.5a.5.5 0 0 1 .854-.354l2.5 2.5a.5.5 0 0 1 0 .708l-2.5 2.5A.5.5 0 0 1 13 13.5v-2.966c-1.073-.145-2.106-.68-3.015-1.419A11.095 11.095 0 0 1 8.625 8a11.094 11.094 0 0 1 1.36-1.115C10.894 6.147 11.927 5.61 13 5.466z" />
    </svg>
  );
}

function IconRepeat({ mode }: { mode: RepeatMode }) {
  if (mode === "one") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M11 4v1.466a.25.25 0 0 0 .41.192l2.36-1.966a.25.25 0 0 0 0-.384l-2.36-1.966a.25.25 0 0 0-.41.192V3H5a5 5 0 0 0-4.48 7.223.5.5 0 0 0 .896-.446A4 4 0 0 1 5 4h6zm4.48 1.777a.5.5 0 0 0-.896.446A4 4 0 0 1 11 12H5v-1.466a.25.25 0 0 0-.41-.192l-2.36 1.966a.25.25 0 0 0 0 .384l2.36 1.966a.25.25 0 0 0 .41-.192V13h6a5 5 0 0 0 4.48-7.223z" />
        <path d="M9 5.5a.5.5 0 0 0-.854-.354l-1.5 1.5a.5.5 0 1 0 .708.708L8 6.707V10.5a.5.5 0 0 0 1 0v-5z" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M11 4v1.466a.25.25 0 0 0 .41.192l2.36-1.966a.25.25 0 0 0 0-.384l-2.36-1.966a.25.25 0 0 0-.41.192V3H5a5 5 0 0 0-4.48 7.223.5.5 0 0 0 .896-.446A4 4 0 0 1 5 4h6zm4.48 1.777a.5.5 0 0 0-.896.446A4 4 0 0 1 11 12H5v-1.466a.25.25 0 0 0-.41-.192l-2.36 1.966a.25.25 0 0 0 0 .384l2.36 1.966a.25.25 0 0 0 .41-.192V13h6a5 5 0 0 0 4.48-7.223z" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────── */

function IconMiniPlayer() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h13A1.5 1.5 0 0 1 16 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 12.5v-9zM1.5 3a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-13z"/>
      <path d="M8 8.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5v-3z"/>
    </svg>
  );
}

export function PlayerBar({ onExpandNowPlaying, onToggleMiniPlayer, miniPlayerActive }: { onExpandNowPlaying?: () => void; onToggleMiniPlayer?: () => void; miniPlayerActive?: boolean }) {
  /* ── state ───────────────────────────────────────────────── */
  const currentTrack = useAppStore((s) => s.currentTrack);
  const playbackState = useAppStore((s) => s.playbackState);
  const progressMs = useAppStore((s) => s.progressMs);
  const durationMs = useAppStore((s) => s.durationMs);
  const volume = useAppStore((s) => s.volume);
  const queue = useAppStore((s) => s.queue);
  const currentQueueIndex = useAppStore((s) => s.currentQueueIndex);
  const shuffleEnabled = useAppStore((s) => s.shuffleEnabled);
  const shuffleHistory = useAppStore((s) => s.shuffleHistory);
  const repeatMode = useAppStore((s) => s.repeatMode);
  const setShuffleEnabled = useAppStore((s) => s.setShuffleEnabled);
  const setRepeatMode = useAppStore((s) => s.setRepeatMode);

  /* ── derived ─────────────────────────────────────────────── */
  const hasTrack = currentTrack !== null;
  const canGoPrevious = hasTrack && (shuffleEnabled ? shuffleHistory.length > 0 : currentQueueIndex > 0);
  const canGoNext = hasTrack;
  const queuePosition =
    queue.length > 0 && currentQueueIndex >= 0
      ? `${currentQueueIndex + 1} / ${queue.length}`
      : null;
  const seekMax = durationMs > 0 ? durationMs : 1;
  const seekValue = Math.min(progressMs, seekMax);
  const progressPct = ((seekValue / seekMax) * 100).toFixed(2);
  const isPlaying = playbackState === "playing";

  /* ── handlers (lógica sin tocar) ─────────────────────────── */
  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    void playerOrchestrator.seek(Number(e.currentTarget.value));
  };
  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    void playerOrchestrator.setVolume(Number(e.currentTarget.value));
  };
  const handlePlayPause = () => {
    if (isPlaying) void playerOrchestrator.pause();
    else void playerOrchestrator.resume();
  };

  const handleShuffleToggle = () => setShuffleEnabled(!shuffleEnabled);

  const handleRepeatCycle = () => {
    const next: RepeatMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
    setRepeatMode(next);
  };

  /* ── render ──────────────────────────────────────────────── */
  return (
    <footer className="border-t border-zinc-800/60 bg-zinc-950/95 px-6 py-3">

      {/* ── Progress bar (full width, top of footer) ── */}
      <div className="mb-3 flex items-center gap-3">
        <span className="w-9 text-right font-mono text-[11px] text-zinc-500 tabular-nums">
          {formatMsToClock(progressMs)}
        </span>

        <div className="relative flex-1 h-[3px] group">
          {/* Track */}
          <div className="absolute inset-0 rounded-full bg-zinc-800" />
          {/* Fill */}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-opacity duration-150 opacity-60 group-hover:opacity-100"
            style={{ width: `${progressPct}%`, backgroundColor: 'var(--accent)' }}
          />
          {/* Input */}
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

        <span className="w-9 font-mono text-[11px] text-zinc-500 tabular-nums">
          {formatMsToClock(durationMs)}
        </span>
      </div>

      {/* ── Three-column row ── */}
      <div className="grid grid-cols-3 items-center gap-4">

        {/* LEFT — artwork + track info */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Artwork — click to expand now playing */}
          <button
            type="button"
            onClick={onExpandNowPlaying}
            disabled={!hasTrack}
            aria-label="Open now playing"
            className="shrink-0 h-10 w-10 rounded-md overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center disabled:cursor-default hover:ring-1 hover:ring-zinc-600 transition-all"
          >
            {currentTrack?.artworkUrl ? (
              <img
                src={currentTrack.artworkUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-zinc-700">
                <path d="M9 3a1 1 0 0 0-2 0v5.5a2.5 2.5 0 1 0 2 2.45V3zM8 12.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
              </svg>
            )}
          </button>

          {/* Text */}
          <div className="min-w-0">
            {currentTrack ? (
              <div className="space-y-0.5">
                <p className="truncate text-sm font-medium text-white leading-tight">
                  {currentTrack.title}
                </p>
                <div className="flex items-center gap-2">
                  <p className="truncate text-xs text-zinc-500 leading-tight">
                    {currentTrack.artist ?? "Unknown artist"}
                  </p>
                  {queuePosition && (
                    <>
                      <span className="text-zinc-700 text-xs">·</span>
                      <span className="shrink-0 text-[11px] text-zinc-600 tabular-nums">
                        {queuePosition}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-600 italic">Nothing playing</p>
            )}
          </div>
        </div>

        {/* CENTER — transport controls */}
        <div className="flex items-center justify-center gap-4">
          {/* Shuffle */}
          <button
            type="button"
            aria-label="Toggle shuffle"
            onClick={handleShuffleToggle}
            className={[
              "transition-colors",
              shuffleEnabled
                ? "text-white"
                : "text-zinc-600 hover:text-zinc-400",
            ].join(" ")}
          >
            <IconShuffle />
          </button>

          {/* Prev */}
          <button
            type="button"
            aria-label="Previous track"
            onClick={() => void playerOrchestrator.previous()}
            disabled={!canGoPrevious}
            className="text-zinc-500 transition-colors hover:text-white disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <IconPrev />
          </button>

          {/* Play / Pause — principal CTA */}
          <button
            type="button"
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={handlePlayPause}
            disabled={!hasTrack}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-white transition-all hover:border-zinc-500 hover:bg-zinc-800 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isPlaying ? <IconPause /> : <IconPlay />}
          </button>

          {/* Next */}
          <button
            type="button"
            aria-label="Next track"
            onClick={() => void playerOrchestrator.next()}
            disabled={!canGoNext}
            className="text-zinc-500 transition-colors hover:text-white disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <IconNext />
          </button>

          {/* Repeat */}
          <button
            type="button"
            aria-label="Cycle repeat mode"
            onClick={handleRepeatCycle}
            className={[
              "transition-colors",
              repeatMode !== "off"
                ? "text-white"
                : "text-zinc-600 hover:text-zinc-400",
            ].join(" ")}
          >
            <IconRepeat mode={repeatMode} />
          </button>

        </div>

        {/* RIGHT — volume + mini player toggle */}
        <div className="flex items-center justify-end gap-3">
          {/* Mini player toggle */}
          <button
            type="button"
            aria-label="Toggle mini player"
            onClick={onToggleMiniPlayer}
            className={[
              "transition-colors",
              miniPlayerActive ? "text-white" : "text-zinc-600 hover:text-zinc-400",
            ].join(" ")}
          >
            <IconMiniPlayer />
          </button>

          {/* Volume */}
          <div className="flex items-center gap-2 ml-1">
            <span className="text-zinc-600">
              <IconVolume muted={volume === 0} />
            </span>

            <div className="relative h-[3px] w-24 group">
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

            <span className="w-6 text-right font-mono text-[11px] text-zinc-600 tabular-nums">
              {volume}
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
