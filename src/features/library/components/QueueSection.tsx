import { useAppStore } from "../../../app/store/useAppStore";
import { playerOrchestrator } from "../../../core/player/player-orchestrator";
import { formatMsToClock } from "../../../shared/utils/format-time";
import type { Track } from "../../../shared/types/music";
import { useTranslation } from "../../../shared/i18n/useTranslation";
import { AddToPlaylistButton } from "../../../shared/components/AddToPlaylistButton";

function IconPlay() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M3 2.5l11 5.5-11 5.5V2.5z" />
    </svg>
  );
}

function IconPlaying() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <rect x="1" y="5" width="3" height="6" rx="1" opacity="0.9" />
      <rect x="6" y="3" width="3" height="10" rx="1" opacity="0.7" />
      <rect x="11" y="6" width="3" height="5" rx="1" opacity="0.5" />
    </svg>
  );
}

function IconRemove() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M6 2a1 1 0 0 0-1 1H2.5a.5.5 0 0 0 0 1H3v9a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4h.5a.5.5 0 0 0 0-1H11a1 1 0 0 0-1-1H6zm1 3.5a.5.5 0 0 1 1 0v6a.5.5 0 0 1-1 0v-6zm3 0a.5.5 0 0 1 1 0v6a.5.5 0 0 1-1 0v-6z" />
    </svg>
  );
}

function IconAddToEnd() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M2 2.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0 4a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 6.5zm0 4a.5.5 0 0 1 .5-.5H8a.5.5 0 0 1 0 1H2.5a.5.5 0 0 1-.5-.5zm9 .146 3.5 2-3.5 2v-4z" />
    </svg>
  );
}

interface QueueRowProps {
  track: Track;
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  /** When true the row acts as "add to end of queue" instead of "play now" */
  addToEnd?: boolean;
  unknownArtist: string;
  onPlay: () => void;
  onAddToEnd?: () => void;
  onRemove: () => void;
}

function QueueRow({
  track,
  index,
  isCurrent,
  isPlaying,
  addToEnd = false,
  unknownArtist,
  onPlay,
  onAddToEnd,
  onRemove,
}: QueueRowProps) {
  const handleMainClick = addToEnd ? (onAddToEnd ?? onPlay) : onPlay;

  return (
    <li className="group relative">
      <div
        className={[
          "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-100",
          isCurrent ? "bg-zinc-800/70" : "hover:bg-zinc-800/40",
        ].join(" ")}
      >
        {/* Index / indicator */}
        <div className="flex w-6 shrink-0 items-center justify-center">
          {isCurrent ? (
            <span className={isPlaying ? "text-white" : "text-zinc-400"}>
              <IconPlaying />
            </span>
          ) : (
            <>
              <span className="text-xs text-zinc-600 tabular-nums group-hover:hidden">
                {index + 1}
              </span>
              <span className="hidden text-zinc-400 group-hover:block">
                {addToEnd ? <IconAddToEnd /> : <IconPlay />}
              </span>
            </>
          )}
        </div>

        {/* Info */}
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={handleMainClick}
          aria-label={addToEnd ? `Add ${track.title} to end of queue` : `Play ${track.title}`}
        >
          <span
            className={[
              "block truncate text-sm font-medium leading-tight",
              isCurrent ? "text-white" : "text-zinc-200",
            ].join(" ")}
          >
            {track.title}
          </span>
          <span className="block truncate text-xs text-zinc-500 leading-tight mt-0.5">
            {track.artist ?? unknownArtist}
          </span>
        </button>

        {/* Duration */}
        {track.durationMs > 0 && (
          <span className="shrink-0 text-[11px] tabular-nums text-zinc-600 group-hover:opacity-0 transition-opacity duration-100">
            {formatMsToClock(track.durationMs)}
          </span>
        )}

        {/* Actions */}
        <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
          <AddToPlaylistButton trackId={track.id} />
          <button
            type="button"
            aria-label={`Remove ${track.title} from queue`}
            onClick={onRemove}
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            <IconRemove />
          </button>
        </div>
      </div>
    </li>
  );
}

export function QueueSection() {
  const t = useTranslation();
  const queue = useAppStore((s) => s.queue);
  const currentQueueIndex = useAppStore((s) => s.currentQueueIndex);
  const currentTrack = useAppStore((s) => s.currentTrack);
  const playbackState = useAppStore((s) => s.playbackState);
  const shuffleEnabled = useAppStore((s) => s.shuffleEnabled);
  const shuffleOrder = useAppStore((s) => s.shuffleOrder);
  const isPlaying = playbackState === "playing";

  const upNext = shuffleEnabled && shuffleOrder.length > 0
    ? shuffleOrder.map((i) => queue[i]).filter(Boolean)
    : queue.slice(currentQueueIndex + 1);
  const played = shuffleEnabled ? [] : queue.slice(0, currentQueueIndex);

  const handlePlay = async (track: Track) => {
    useAppStore.getState().setPlaybackOrigin('queue');
    await playerOrchestrator.playFromQueue(track, queue);
  };

  const handleRemove = async (track: Track, queueIndex: number) => {
    await playerOrchestrator.removeTrackFromQueue(track.id, queueIndex);
  };

  /**
   * Move a track from "already played" to the end of the queue without
   * interrupting playback. Adjusts currentQueueIndex to compensate for
   * the removal so the current track keeps playing.
   */
  const handleAddToEnd = (track: Track) => {
    const store = useAppStore.getState();
    const { queue: q, currentQueueIndex: idx } = store;
    const trackIdx = q.findIndex((t) => t.id === track.id);
    if (trackIdx < 0) return;

    // Remove from its old position and append at the end
    const without = q.filter((_, i) => i !== trackIdx);
    const newQueue = [...without, track];

    // Since we removed a track before the current index, shift it down by 1
    const newIdx = trackIdx < idx ? idx - 1 : idx;

    store.setQueue(newQueue);
    store.setCurrentQueueIndex(newIdx);
  };

  if (queue.length === 0) {
    return (
      <section>
        <div className="mb-5">
          <h2 className="text-base font-semibold tracking-tight text-white">{t.queueTitle}</h2>
          <p className="mt-0.5 text-xs text-zinc-600">{t.noTracksInQueue}</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-16 text-center">
          <p className="text-sm text-zinc-500">{t.queueEmpty}</p>
          <p className="mt-1 text-xs text-zinc-700">{t.playFromLibraryHint}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-white">{t.queueTitle}</h2>
        <p className="mt-0.5 text-xs text-zinc-600">
          {t.trackCount(queue.length)}
          {currentQueueIndex >= 0 && ` · ${t.queueCounter(currentQueueIndex + 1, queue.length)}`}
        </p>
      </div>

      {/* Now playing */}
      {currentTrack && (
        <div>
          <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-widest text-zinc-700">
            {t.nowPlaying}
          </p>
          <ul>
            <QueueRow
              track={currentTrack}
              index={currentQueueIndex}
              isCurrent
              isPlaying={isPlaying}
              unknownArtist={t.unknownArtist}
              onPlay={() => void handlePlay(currentTrack)}
              onRemove={() => void handleRemove(currentTrack, currentQueueIndex)}
            />
          </ul>
        </div>
      )}

      {/* Up next */}
      {upNext.length > 0 && (
        <div>
          <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-widest text-zinc-700">
            {t.upNext}
          </p>
          <ul className="space-y-px">
            {upNext.map((track, i) => {
              const actualIndex = shuffleEnabled && shuffleOrder.length > 0
                ? shuffleOrder[i]
                : currentQueueIndex + 1 + i;
              return (
                <QueueRow
                  key={`${track.id}-upnext-${i}`}
                  track={track}
                  index={actualIndex}
                  isCurrent={false}
                  isPlaying={false}
                  unknownArtist={t.unknownArtist}
                  onPlay={() => void handlePlay(track)}
                  onRemove={() => void handleRemove(track, actualIndex)}
                />
              );
            })}
          </ul>
        </div>
      )}

      {/* Already played — click adds to end, does not restart from that position */}
      {played.length > 0 && (
        <div>
          <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-widest text-zinc-700">
            {t.alreadyPlayed}
          </p>
          <ul className="space-y-px">
            {played.map((track, i) => (
              <QueueRow
                key={`${track.id}-played-${i}`}
                track={track}
                index={i}
                isCurrent={false}
                isPlaying={false}
                addToEnd
                unknownArtist={t.unknownArtist}
                onPlay={() => void handlePlay(track)}
                onAddToEnd={() => handleAddToEnd(track)}
                onRemove={() => void handleRemove(track, i)}
              />
            ))}
          </ul>
          <p className="mt-2 px-3 text-[10px] text-zinc-700">
            {t.tapToAddToEnd}
          </p>
        </div>
      )}
    </section>
  );
}
