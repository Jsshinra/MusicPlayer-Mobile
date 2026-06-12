import { useAppStore } from "../../../app/store/useAppStore";
import { usePlaybackStore } from "../../../app/store/usePlaybackStore";
import { playerOrchestrator } from "../../../core/player/player-orchestrator";
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

function IconClock() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
    </svg>
  );
}

interface RecentRowProps {
  track: Track;
  index: number;
  isCurrentTrack: boolean;
  playbackState: string;
  unknownArtist: string;
  onPlay: (track: Track) => void;
}

function RecentRow({ track, index, isCurrentTrack, playbackState, unknownArtist, onPlay }: RecentRowProps) {
  const isPlaying = isCurrentTrack && playbackState === "playing";

  return (
    <li className="group relative">
      <div
        className={[
          "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-100",
          isCurrentTrack ? "bg-zinc-800/70" : "hover:bg-zinc-800/40",
        ].join(" ")}
      >
        {/* Index / play indicator */}
        <div className="flex w-6 shrink-0 items-center justify-center">
          {isCurrentTrack ? (
            <span className={isPlaying ? "text-white" : "text-zinc-400"}>
              <IconPlaying />
            </span>
          ) : (
            <>
              <span className="text-xs text-zinc-600 tabular-nums group-hover:hidden">
                {index + 1}
              </span>
              <span className="hidden text-zinc-400 group-hover:block">
                <IconPlay />
              </span>
            </>
          )}
        </div>

        {/* Info — click to play */}
        <button
          type="button"
          onClick={() => onPlay(track)}
          aria-label={`Play ${track.title}`}
          className="min-w-0 flex-1 text-left"
        >
          <span
            className={[
              "block truncate text-sm font-medium leading-tight",
              isCurrentTrack ? "text-white" : "text-zinc-200",
            ].join(" ")}
          >
            {track.title}
          </span>
          <span className="block truncate text-xs text-zinc-500 leading-tight mt-0.5">
            {track.artist ?? unknownArtist}
          </span>
        </button>

        {/* Playlist button */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-100">
          <AddToPlaylistButton trackId={track.id} />
        </div>
      </div>
    </li>
  );
}

export function RecentTracksSection() {
  const t = useTranslation();
  const recentTracks = useAppStore((s) => s.recentTracks);
  const currentTrack = useAppStore((s) => s.currentTrack);
  const playbackState = usePlaybackStore((s) => s.playbackState);
  const clearRecentTracks = useAppStore((s) => s.clearRecentTracks);
  const libraryTracks = useAppStore((s) => s.libraryTracks);

  const handlePlay = async (track: Track) => {
    useAppStore.getState().setPlaybackOrigin('library');
    await playerOrchestrator.playFromQueue(track, libraryTracks);
  };

  if (recentTracks.length === 0) {
    return (
      <section>
        <div className="mb-5 flex items-center gap-2">
          <span className="text-zinc-600">
            <IconClock />
          </span>
          <h2 className="text-base font-semibold tracking-tight text-white">{t.recentlyPlayedTitle}</h2>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-12 text-center">
          <p className="text-sm text-zinc-500">{t.nothingPlayedYet}</p>
          <p className="mt-1 text-xs text-zinc-700">{t.songsWillAppearHere}</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-zinc-600">
            <IconClock />
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white">{t.recentlyPlayedTitle}</h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              {t.trackCount(recentTracks.length)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={clearRecentTracks}
          className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors"
        >
          {t.clear}
        </button>
      </div>

      {/* Lista */}
      <ul className="space-y-px">
        {recentTracks.map((track, index) => (
          <RecentRow
            key={`${track.id}-${index}`}
            track={track}
            index={index}
            isCurrentTrack={currentTrack?.id === track.id}
            playbackState={playbackState}
            unknownArtist={t.unknownArtist}
            onPlay={(tr) => void handlePlay(tr)}
          />
        ))}
      </ul>
    </section>
  );
}
