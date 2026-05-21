import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "../../../app/store/useAppStore";
import { useLocalLibrary } from "../hooks/useLocalLibrary";
import type { Track } from "../../../shared/types/music";
import { formatMsToClock } from "../../../shared/utils/format-time";
import { localPathToFileUri } from "../../../shared/utils/local-file-uri";
import { useTranslation } from "../../../shared/i18n/useTranslation";

/* ── Icons ─────────────────────────────────────────────────── */

function IconPlay() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M3 2.5l11 5.5-11 5.5V2.5z" />
    </svg>
  );
}

function IconPlaying() {
  /* Animated bars — track is playing */
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <rect x="1"  y="5" width="3" height="6" rx="1" opacity="0.9" />
      <rect x="6"  y="3" width="3" height="10" rx="1" opacity="0.7" />
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

function IconMore() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <circle cx="3" cy="8" r="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="13" cy="8" r="1.5" />
    </svg>
  );
}

function IconQueue() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M2 4.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5H8a.5.5 0 0 1 0 1H2.5a.5.5 0 0 1-.5-.5z"/>
      <path d="M11.5 10a.5.5 0 0 1 .5.5v1.5h1.5a.5.5 0 0 1 0 1H12v1.5a.5.5 0 0 1-1 0V13H9.5a.5.5 0 0 1 0-1H11v-1.5a.5.5 0 0 1 .5-.5z"/>
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M5.5 3.5L10 8l-4.5 4.5-1-1L8 8 4.5 4.5z"/>
    </svg>
  );
}

function IconAdd() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 1.5a.5.5 0 0 1 .5.5v5.5H14a.5.5 0 0 1 0 1H8.5V14a.5.5 0 0 1-1 0V8.5H2a.5.5 0 0 1 0-1h5.5V2a.5.5 0 0 1 .5-.5z" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z" />
    </svg>
  );
}

/** Extracts the primary artist (first one) from strings like
 *  "A feat. B", "A, B & C", "A x B", "A ft B", etc. */
function primaryArtist(raw: string | undefined, unknownLabel = "Unknown Artist"): string {
  if (!raw?.trim()) return unknownLabel;
  // Split on common collaboration separators
  const first = raw.split(/\s*(?:feat\.?|ft\.?|vs\.?|&|,|;|\bx\b)\s*/i)[0];
  return first.trim() || "Unknown Artist";
}

function IconChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
    </svg>
  );
}

function IconMusicNote() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M9 3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h5v-1H3V3h5v1h1V3z"/>
      <path d="M13.5 2h-3a.5.5 0 0 0-.5.5V9a2.5 2.5 0 1 0 1 2V6h2.5a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5z"/>
    </svg>
  );
}

/* ── Artist card ───────────────────────────────────────────── */

interface ArtistCardProps {
  name: string;
  trackCount: number;
  artwork?: string;
  onClick: () => void;
}

function ArtistCard({ name, trackCount, artwork, onClick }: ArtistCardProps) {
  const t = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-3 rounded-xl p-4 text-center transition-colors hover:bg-zinc-800/50"
    >
      <div className="relative h-20 w-20 overflow-hidden rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
        {artwork ? (
          <img
            src={artwork}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-zinc-600">
            <IconMusicNote />
          </span>
        )}
      </div>
      <div className="min-w-0 w-full">
        <p className="truncate text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
          {name}
        </p>
        <p className="text-xs text-zinc-600 mt-0.5">
          {t.songCount(trackCount)}
        </p>
      </div>
    </button>
  );
}

/* ── Album card ───────────────────────────────────────────── */

interface AlbumCardProps {
  name: string;
  artist: string;
  trackCount: number;
  artwork?: string;
  onClick: () => void;
}

function AlbumCard({ name, artist, trackCount, artwork, onClick }: AlbumCardProps) {
  const t = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-3 rounded-xl p-4 text-center transition-colors hover:bg-zinc-800/50"
    >
      <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
        {artwork ? (
          <img
            src={artwork}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-zinc-600">
            <IconMusicNote />
          </span>
        )}
      </div>
      <div className="min-w-0 w-full">
        <p className="truncate text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
          {name}
        </p>
        <p className="truncate text-xs text-zinc-500 mt-0.5">{artist}</p>
        <p className="text-xs text-zinc-600 mt-0.5">
          {t.songCount(trackCount)}
        </p>
      </div>
    </button>
  );
}

/* ── Album title matching ─────────────────────────────────── */

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\(.*?\)|\[.*?\]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function wordSet(s: string): Set<string> {
  return new Set(normalizeForMatch(s).split(" ").filter((w) => w.length > 1));
}

function isTrackOwned(ytTitle: string, ownedTracks: Track[]): boolean {
  const ytWords = wordSet(ytTitle);
  if (ytWords.size === 0) {
    const ytNorm = normalizeForMatch(ytTitle);
    return ownedTracks.some((t) => normalizeForMatch(t.title) === ytNorm);
  }
  return ownedTracks.some((t) => {
    const ownedWords = wordSet(t.title);
    if (ownedWords.size === 0) return false;
    let intersection = 0;
    for (const w of ytWords) if (ownedWords.has(w)) intersection++;
    const smaller = Math.min(ytWords.size, ownedWords.size);
    const larger = Math.max(ytWords.size, ownedWords.size);
    return intersection / smaller >= 0.7 && intersection / larger >= 0.4;
  });
}

/* ── Album completion state ───────────────────────────────── */

type AlbumCompletionState =
  | { status: "idle" }
  | { status: "searching" }
  | { status: "found"; ytTracks: AlbumTrackInfo[]; missingTracks: { title: string; url: string }[] }
  | { status: "not-found" }
  | { status: "downloading"; total: number }
  | { status: "done"; downloaded: number }
  | { status: "error"; message: string };

/* ── Track row kebab menu ──────────────────────────────────── */

interface TrackRowMenuProps {
  track: Track;
  onAddToQueue: (track: Track) => void;
  onRemove: (track: Track) => void;
  onToast?: (msg: string) => void;
}

function TrackRowMenu({ track, onAddToQueue, onRemove, onToast }: TrackRowMenuProps) {
  const t = useTranslation();
  const playlists = useAppStore((s) => s.playlists);
  const appendTrackToPlaylist = useAppStore((s) => s.appendTrackToPlaylist);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"main" | "playlists">("main");
  const ref = useRef<HTMLDivElement>(null);

  const availablePlaylists = playlists.filter((p) => !p.trackIds.includes(track.id));

  useEffect(() => {
    if (!open) return;
    // Reset to main view whenever the menu reopens.
    setView("main");
    const handler = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  const close = () => setOpen(false);

  const handleAddToQueue = () => {
    onAddToQueue(track);
    close();
  };

  const handleAddToPlaylist = (playlistId: string, playlistName: string) => {
    appendTrackToPlaylist(playlistId, track.id);
    onToast?.(`${t.addedToPlaylist} "${playlistName}"`);
    close();
  };

  const handleRemove = () => {
    onRemove(track);
    close();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="More actions"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
      >
        <IconMore />
      </button>

      {open && (
        <div
          className="absolute bottom-full right-0 mb-1 z-50 w-56 rounded-xl border border-zinc-700 bg-zinc-900 py-1 shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {view === "main" && (
            <ul>
              <li>
                <button
                  type="button"
                  onClick={handleAddToQueue}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800 active:bg-zinc-800 transition-colors"
                >
                  <span className="text-zinc-400"><IconQueue /></span>
                  Agregar a la cola
                </button>
              </li>
              {playlists.length > 0 && (
                <li>
                  <button
                    type="button"
                    onClick={() => setView("playlists")}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800 active:bg-zinc-800 transition-colors"
                  >
                    <span className="text-zinc-400"><IconAdd /></span>
                    <span className="flex-1">Agregar a playlist</span>
                    <span className="text-zinc-600"><IconChevronRight /></span>
                  </button>
                </li>
              )}
              <li className="my-1 border-t border-zinc-800" aria-hidden />
              <li>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-red-400 hover:bg-zinc-800 active:bg-zinc-800 transition-colors"
                >
                  <span><IconRemove /></span>
                  Eliminar
                </button>
              </li>
            </ul>
          )}

          {view === "playlists" && (
            <div>
              <div className="flex items-center gap-1 px-2 pt-1 pb-1">
                <button
                  type="button"
                  onClick={() => setView("main")}
                  className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors -scale-x-100"
                  aria-label="Back"
                >
                  <IconChevronRight />
                </button>
                <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                  Agregar a playlist
                </p>
              </div>
              {availablePlaylists.length === 0 ? (
                <p className="px-3 py-2.5 text-xs text-zinc-500 italic">
                  {t.alreadyInAllPlaylists}
                </p>
              ) : (
                <ul className="max-h-48 overflow-y-auto">
                  {availablePlaylists.map((pl) => (
                    <li key={pl.id}>
                      <button
                        type="button"
                        onClick={() => handleAddToPlaylist(pl.id, pl.name)}
                        className="w-full truncate px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                      >
                        {pl.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Track row ─────────────────────────────────────────────── */

interface TrackRowProps {
  track: Track;
  index: number;
  isCurrentTrack: boolean;
  playbackState: string;
  compact: boolean;
  showCovers: boolean;
  unknownArtist: string;
  onPlay: (track: Track) => void;
  onRemove: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onToast?: (msg: string) => void;
}

function TrackRow({
  track,
  index,
  isCurrentTrack,
  playbackState,
  compact,
  showCovers,
  unknownArtist,
  onPlay,
  onRemove,
  onAddToQueue,
  onToast,
}: TrackRowProps) {
  const isPlaying = isCurrentTrack && playbackState === "playing";

  return (
    <li className="group relative">
      <div
        className={[
          "flex items-center gap-3 rounded-lg px-3 transition-colors duration-100",
          compact ? "py-1.5" : "py-2.5",
          isCurrentTrack
            ? "bg-zinc-800/70"
            : "hover:bg-zinc-800/40",
        ].join(" ")}
      >
        {/* Index / play indicator */}
        <button
          type="button"
          onClick={() => onPlay(track)}
          aria-label={`Play ${track.title}`}
          className="flex w-6 shrink-0 items-center justify-center"
        >
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
        </button>

        {/* Album cover */}
        {showCovers && (
          <div className="h-8 w-8 shrink-0 rounded overflow-hidden bg-zinc-800 flex items-center justify-center">
            {track.artworkUrl ? (
              <img src={track.artworkUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" className="text-zinc-600">
                <path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13c0-1.104 1.12-2 2.5-2s2.5.896 2.5 2zm9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2z" />
                <path fillRule="evenodd" d="M14 11V2h1v9h-1zM6 3v10H5V3h1z" />
                <path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4V2.905z" />
              </svg>
            )}
          </div>
        )}

        {/* Main click area */}
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => onPlay(track)}
          aria-label={`Play ${track.title}`}
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

        {/* Kebab menu (mobile-friendly replacement for the desktop hover
            actions). Contains queue, playlist, and remove. SetAlbumButton
            isn't included because writeAlbumTag is a no-op stub on mobile. */}
        <TrackRowMenu
          track={track}
          onAddToQueue={onAddToQueue}
          onRemove={onRemove}
          onToast={onToast}
        />
      </div>
    </li>
  );
}

/* ── Empty state ───────────────────────────────────────────── */

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const t = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-16 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-600">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
          <path d="M9 3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h5v-1H3V3h5v1h1V3zM13 8l-4-4v3H6v2h3v3l4-4z" />
        </svg>
      </div>
      <p className="text-sm text-zinc-500">{t.noSongsYet}</p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 text-xs text-zinc-600 underline underline-offset-4 hover:text-zinc-300 transition-colors"
      >
        {t.addFirstSong}
      </button>
      <p className="mt-2 text-xs text-zinc-700">{t.dragDropHint}</p>
    </div>
  );
}

/* ── No results ─────────────────────────────────────────────── */

function NoResults({ query, onClear }: { query: string; onClear: () => void }) {
  const t = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <p className="text-sm text-zinc-500">
        {t.noResultsFor}{" "}
        <span className="font-medium text-zinc-300">&ldquo;{query}&rdquo;</span>
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-3 text-xs text-zinc-600 underline underline-offset-4 hover:text-zinc-300 transition-colors"
      >
        {t.clearSearch}
      </button>
    </div>
  );
}

/* ── Main section ──────────────────────────────────────────── */

type LibraryTab = "songs" | "artists" | "albums";

export function LocalLibrarySection({ onToast }: { onToast?: (msg: string) => void }) {
  const t = useTranslation();
  const currentTrack = useAppStore((s) => s.currentTrack);
  const playbackState = useAppStore((s) => s.playbackState);
  const uiDensity = useAppStore((s) => s.uiDensity);
  const showAlbumCovers = useAppStore((s) => s.showAlbumCovers);
  const appendToQueue = useAppStore((s) => s.appendToQueue);
  const { tracks, pickAndImport, importDroppedFiles, playTrackFromLibrary, playTrackFromPool, removeTrackFromLibrary } =
    useLocalLibrary();

  const sectionRef = useRef<HTMLElement | null>(null);
  const [, setOpenMenuTrackId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const [activeTab, setActiveTab] = useState<LibraryTab>("songs");
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [albumCompletion, setAlbumCompletion] = useState<AlbumCompletionState>({ status: "idle" });
  const [albumDownloadCount, setAlbumDownloadCount] = useState(0);
  const albumDownloadActiveRef = useRef(false);
  const albumDownloadCountRef = useRef(0);
  const albumDownloadAlbumRef = useRef<string | null>(null);
  const showToast = (message: string) => onToast?.(message);

  const handleDragEnter = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) void importDroppedFiles(files);
  };

  const filteredTracks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.artist ?? "").toLowerCase().includes(q)
    );
  }, [tracks, query]);

  // Group tracks by artist for the artists tab
  const artistGroups = useMemo(() => {
    const map = new Map<string, Track[]>();
    for (const track of tracks) {
      const key = primaryArtist(track.artist, t.unknownArtist);
      const existing = map.get(key);
      if (existing) {
        existing.push(track);
      } else {
        map.set(key, [track]);
      }
    }
    return Array.from(map.entries())
      .map(([name, artistTracks]) => ({
        name,
        tracks: artistTracks,
        artwork: artistTracks.find((t) => t.artworkUrl)?.artworkUrl,
      }))
      .sort((a, b) => b.tracks.length - a.tracks.length);
  }, [tracks]);

  const artistTracks = useMemo(() => {
    if (!selectedArtist) return [];
    return tracks.filter(
      (track) => primaryArtist(track.artist, t.unknownArtist) === selectedArtist
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks, selectedArtist, t.unknownArtist]);

  const albumGroups = useMemo(() => {
    const map = new Map<string, Track[]>();
    for (const track of tracks) {
      if (!track.album?.trim()) continue;
      const rawName = track.album.trim();
      const lc = rawName.toLowerCase();
      let found = false;
      for (const k of map.keys()) {
        if (k.toLowerCase() === lc) { map.get(k)!.push(track); found = true; break; }
      }
      if (!found) map.set(rawName, [track]);
    }
    return Array.from(map.entries())
      .map(([name, albumTracks]) => ({
        name,
        tracks: albumTracks,
        artist: primaryArtist(albumTracks[0].artist, t.unknownArtist),
        artwork: albumTracks.find((tr) => tr.artworkUrl)?.artworkUrl,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tracks, t.unknownArtist]);

  const albumTracks = useMemo(() => {
    if (!selectedAlbum) return [];
    return tracks.filter((track) => track.album?.trim().toLowerCase() === selectedAlbum.toLowerCase());
  }, [tracks, selectedAlbum]);

  const albumArtist = useMemo(() => {
    if (!selectedAlbum || albumTracks.length === 0) return "";
    return primaryArtist(albumTracks[0].artist, t.unknownArtist);
  }, [selectedAlbum, albumTracks, t.unknownArtist]);

  const handleCompleteAlbum = async () => {
    if (!selectedAlbum || !albumArtist) return;
    setAlbumCompletion({ status: "searching" });
    try {
      const ytTracks = await window.downloadAPI.searchAlbumTracklist(albumArtist, selectedAlbum);
      if (ytTracks.length === 0) {
        setAlbumCompletion({ status: "not-found" });
        return;
      }
      const missingTracks = ytTracks
        .filter((yt) => !isTrackOwned(yt.title, albumTracks))
        .map((yt) => ({ title: yt.title, url: yt.url }));
      setAlbumCompletion({ status: "found", ytTracks, missingTracks });
    } catch {
      setAlbumCompletion({ status: "error", message: "Search failed" });
    }
  };

  const handleDownloadMissing = async () => {
    if (albumCompletion.status !== "found" || albumCompletion.missingTracks.length === 0) return;
    albumDownloadActiveRef.current = true;
    albumDownloadCountRef.current = 0;
    albumDownloadAlbumRef.current = selectedAlbum;
    setAlbumDownloadCount(0);
    setAlbumCompletion({ status: "downloading", total: albumCompletion.missingTracks.length });
    const urls = albumCompletion.missingTracks.map((mt) => mt.url);
    const dir = await window.downloadAPI.getMusicDir();
    window.downloadAPI.startBatchUrls(urls, dir);
  };

  // Album download event listeners (set up once on mount)
  useEffect(() => {
    window.downloadAPI.onDone(({ filePath }) => {
      if (!albumDownloadActiveRef.current) return;
      albumDownloadCountRef.current++;
      setAlbumDownloadCount(albumDownloadCountRef.current);
      const albumName = albumDownloadAlbumRef.current;
      const albumTag = albumName || undefined;
      const tagPromise = albumTag
        ? window.libraryAPI.writeAlbumTag(filePath, albumTag).catch(() => {})
        : Promise.resolve();
      tagPromise.then(() => window.libraryAPI.importFromPath(filePath)).then((meta) => {
        const track: Track = {
          id: `local-${meta.path}`,
          source: "local",
          title: meta.title,
          artist: meta.artist,
          album: albumName || meta.album,
          durationMs: meta.durationMs,
          uri: localPathToFileUri(meta.path),
          localPath: meta.path,
          artworkUrl: meta.artworkPath ? localPathToFileUri(meta.artworkPath) : undefined,
          youtubeId: meta.youtubeId,
        };
        useAppStore.getState().appendLibraryTracks([track]);
      }).catch(() => {});
    });

    window.downloadAPI.onBatchDone(() => {
      if (!albumDownloadActiveRef.current) return;
      albumDownloadActiveRef.current = false;
      setAlbumCompletion({ status: "done", downloaded: albumDownloadCountRef.current });
    });

    window.downloadAPI.onError(({ message }) => {
      if (!albumDownloadActiveRef.current) return;
      albumDownloadActiveRef.current = false;
      if (albumDownloadCountRef.current > 0) {
        setAlbumCompletion({ status: "done", downloaded: albumDownloadCountRef.current });
      } else {
        setAlbumCompletion({ status: "error", message });
      }
    });

    return () => { albumDownloadActiveRef.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!sectionRef.current?.contains(target)) {
        setOpenMenuTrackId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTabChange = (tab: LibraryTab) => {
    setActiveTab(tab);
    setSelectedArtist(null);
    setSelectedAlbum(null);
    setAlbumCompletion({ status: "idle" });
    setQuery("");
  };

  return (
    <section
      ref={sectionRef}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={isDragging ? "relative" : undefined}
    >
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-zinc-500 bg-zinc-900/80 backdrop-blur-sm">
          <p className="text-sm font-medium text-zinc-300">{t.dropAudioHere}</p>
        </div>
      )}

      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          {activeTab === "artists" && selectedArtist ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedArtist(null)}
                className="flex items-center gap-1 text-zinc-500 hover:text-white transition-colors"
                aria-label="Back to artists"
              >
                <IconChevronLeft />
                <span className="text-xs">{t.backToArtists}</span>
              </button>
              <span className="text-zinc-700">/</span>
              <h2 className="text-base font-semibold tracking-tight text-white truncate max-w-[200px]">
                {selectedArtist}
              </h2>
            </div>
          ) : activeTab === "albums" && selectedAlbum ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setSelectedAlbum(null); setAlbumCompletion({ status: "idle" }); }}
                className="flex items-center gap-1 text-zinc-500 hover:text-white transition-colors"
                aria-label="Back to albums"
              >
                <IconChevronLeft />
                <span className="text-xs">{t.backToAlbums}</span>
              </button>
              <span className="text-zinc-700">/</span>
              <h2 className="text-base font-semibold tracking-tight text-white truncate max-w-[200px]">
                {selectedAlbum}
              </h2>
            </div>
          ) : (
            <h2 className="text-base font-semibold tracking-tight text-white">
              {t.library}
            </h2>
          )}
          <p className="mt-0.5 text-xs text-zinc-600">
            {tracks.length === 0
              ? t.noTracksImported
              : activeTab === "artists" && selectedArtist
              ? t.trackCount(artistTracks.length)
              : activeTab === "artists"
              ? t.artistCount(artistGroups.length)
              : activeTab === "albums" && selectedAlbum
              ? `${albumArtist} · ${t.trackCount(albumTracks.length)}`
              : activeTab === "albums"
              ? t.albumCount(albumGroups.length)
              : t.trackCount(tracks.length)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab toggle — only shown when there are tracks */}
          {tracks.length > 0 && (
            <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/60 p-0.5">
              <button
                type="button"
                onClick={() => handleTabChange("songs")}
                className={[
                  "rounded px-3 py-1 text-xs font-medium transition-colors",
                  activeTab === "songs"
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-500 hover:text-zinc-300",
                ].join(" ")}
              >
                {t.songs}
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("artists")}
                className={[
                  "rounded px-3 py-1 text-xs font-medium transition-colors",
                  activeTab === "artists"
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-500 hover:text-zinc-300",
                ].join(" ")}
              >
                {t.artists}
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("albums")}
                className={[
                  "rounded px-3 py-1 text-xs font-medium transition-colors",
                  activeTab === "albums"
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-500 hover:text-zinc-300",
                ].join(" ")}
              >
                {t.albums}
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── Artists grid view ── */}
      {activeTab === "artists" && !selectedArtist && (
        <>
          {tracks.length === 0 ? (
            <EmptyState onAdd={() => void pickAndImport()} />
          ) : (
            <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {artistGroups.map((artist) => (
                <ArtistCard
                  key={artist.name}
                  name={artist.name}
                  trackCount={artist.tracks.length}
                  artwork={artist.artwork}
                  onClick={() => setSelectedArtist(artist.name)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Artist detail view ── */}
      {activeTab === "artists" && selectedArtist && (
        <>
          <div className="mb-1 flex items-center gap-3 px-3">
            <span className="w-6" />
            <span className="flex-1 text-[10px] font-medium uppercase tracking-widest text-zinc-700">
              {t.titleColumn}
            </span>
          </div>
          <ul className="space-y-px">
            {artistTracks.map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={index}
                isCurrentTrack={currentTrack?.id === track.id}
                playbackState={playbackState}
                compact={uiDensity === "compact"}
                showCovers={showAlbumCovers}
                unknownArtist={t.unknownArtist}
                onPlay={(tr) => void playTrackFromPool(tr, artistTracks)}
                onRemove={(tr) => { void removeTrackFromLibrary(tr); showToast(t.removedFromLibrary(tr.title)); }}
                onAddToQueue={(tr) => { appendToQueue(tr); showToast(t.addedToQueue(tr.title)); }}
                onToast={showToast}
              />
            ))}
          </ul>
        </>
      )}

      {/* ── Albums grid view ── */}
      {activeTab === "albums" && !selectedAlbum && (
        <>
          {albumGroups.length === 0 ? (
            tracks.length === 0 ? (
              <EmptyState onAdd={() => void pickAndImport()} />
            ) : (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <p className="text-sm text-zinc-500">{t.noTracksImported}</p>
              </div>
            )
          ) : (
            <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {albumGroups.map((album) => (
                <AlbumCard
                  key={album.name}
                  name={album.name}
                  artist={album.artist}
                  trackCount={album.tracks.length}
                  artwork={album.artwork}
                  onClick={() => setSelectedAlbum(album.name)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Album detail view ── */}
      {activeTab === "albums" && selectedAlbum && (
        <>
          {/* Complete album section */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {albumCompletion.status === "idle" && (
              <button
                type="button"
                onClick={() => void handleCompleteAlbum()}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
              >
                <IconAdd />
                {t.completeAlbum}
              </button>
            )}
            {albumCompletion.status === "searching" && (
              <span className="flex items-center gap-2 text-xs text-zinc-500">
                <svg className="animate-spin shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                {t.searchingAlbum}
              </span>
            )}
            {albumCompletion.status === "not-found" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">{t.albumNotFound}</span>
                <button
                  type="button"
                  onClick={() => setAlbumCompletion({ status: "idle" })}
                  className="text-xs text-zinc-600 underline underline-offset-4 hover:text-zinc-300 transition-colors"
                >
                  {t.cancel}
                </button>
              </div>
            )}
            {albumCompletion.status === "found" && (
              <div className="flex items-center gap-2">
                {albumCompletion.missingTracks.length === 0 ? (
                  <>
                    <span className="text-xs text-green-400">{t.allTracksOwned}</span>
                    <button
                      type="button"
                      onClick={() => setAlbumCompletion({ status: "idle" })}
                      className="text-xs text-zinc-600 underline underline-offset-4 hover:text-zinc-300 transition-colors"
                    >
                      OK
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-zinc-500">
                      {t.albumTracksOwned(albumTracks.length, albumCompletion.ytTracks.length)}
                    </span>
                    <button
                      type="button"
                      onClick={handleDownloadMissing}
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-zinc-200 transition-colors"
                    >
                      {t.downloadMissing(albumCompletion.missingTracks.length)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlbumCompletion({ status: "idle" })}
                      className="text-xs text-zinc-600 underline underline-offset-4 hover:text-zinc-300 transition-colors"
                    >
                      {t.cancel}
                    </button>
                  </>
                )}
              </div>
            )}
            {albumCompletion.status === "downloading" && (
              <span className="flex items-center gap-2 text-xs text-zinc-500">
                <svg className="animate-spin shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                {albumDownloadCount > 0
                  ? t.albumDownloading(albumDownloadCount, albumCompletion.total)
                  : t.searchingAlbum.replace("…", "...")}
              </span>
            )}
            {albumCompletion.status === "done" && (
              <div className="flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-green-400 shrink-0">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                </svg>
                <span className="text-xs text-green-400">{t.albumDownloadDone(albumCompletion.downloaded)}</span>
                <button
                  type="button"
                  onClick={() => setAlbumCompletion({ status: "idle" })}
                  className="text-xs text-zinc-600 underline underline-offset-4 hover:text-zinc-300 transition-colors"
                >
                  OK
                </button>
              </div>
            )}
            {albumCompletion.status === "error" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">{albumCompletion.message}</span>
                <button
                  type="button"
                  onClick={() => setAlbumCompletion({ status: "idle" })}
                  className="text-xs text-zinc-600 underline underline-offset-4 hover:text-zinc-300 transition-colors"
                >
                  OK
                </button>
              </div>
            )}
          </div>

          {/* YouTube tracklist preview */}
          {albumCompletion.status === "found" && albumCompletion.missingTracks.length > 0 && (
            <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-zinc-600">
                YouTube
              </p>
              <ul className="space-y-1">
                {albumCompletion.ytTracks.map((yt) => {
                  const owned = isTrackOwned(yt.title, albumTracks);
                  return (
                    <li key={yt.id} className="flex items-center gap-2 text-xs">
                      {owned ? (
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="text-green-400 shrink-0">
                          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                        </svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="text-zinc-600 shrink-0">
                          <path d="M8 1.5a.5.5 0 0 1 .5.5v5.5H14a.5.5 0 0 1 0 1H8.5V14a.5.5 0 0 1-1 0V8.5H2a.5.5 0 0 1 0-1h5.5V2a.5.5 0 0 1 .5-.5z" />
                        </svg>
                      )}
                      <span className={owned ? "text-zinc-500" : "text-zinc-300"}>
                        {yt.title}
                      </span>
                      {yt.duration != null && (
                        <span className="ml-auto text-zinc-700 tabular-nums">
                          {formatMsToClock(yt.duration * 1000)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Album track list */}
          <div className="mb-1 flex items-center gap-3 px-3">
            <span className="w-6" />
            <span className="flex-1 text-[10px] font-medium uppercase tracking-widest text-zinc-700">
              {t.titleColumn}
            </span>
          </div>
          <ul className="space-y-px">
            {albumTracks.map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={index}
                isCurrentTrack={currentTrack?.id === track.id}
                playbackState={playbackState}
                compact={uiDensity === "compact"}
                showCovers={showAlbumCovers}
                unknownArtist={t.unknownArtist}
                onPlay={(tr) => void playTrackFromPool(tr, albumTracks)}
                onRemove={(tr) => { void removeTrackFromLibrary(tr); showToast(t.removedFromLibrary(tr.title)); }}
                onAddToQueue={(tr) => { appendToQueue(tr); showToast(t.addedToQueue(tr.title)); }}
                onToast={showToast}
              />
            ))}
          </ul>
        </>
      )}

      {/* ── Songs view ── */}
      {activeTab === "songs" && (
        <>
          {/* Search — only shown when there are tracks */}
          {tracks.length > 0 && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 focus-within:border-zinc-700 transition-colors">
              <span className="shrink-0 text-zinc-600">
                <IconSearch />
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                placeholder={t.searchPlaceholder}
                aria-label="Search library"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                  className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Column header */}
          {tracks.length > 0 && (
            <div className="mb-1 flex items-center gap-3 px-3">
              <span className="w-6" />
              <span className="flex-1 text-[10px] font-medium uppercase tracking-widest text-zinc-700">
                {t.titleColumn}
              </span>
            </div>
          )}

          {/* Track list / empty state / no results */}
          {tracks.length === 0 ? (
            <EmptyState onAdd={() => void pickAndImport()} />
          ) : filteredTracks.length === 0 ? (
            <NoResults query={query} onClear={() => setQuery("")} />
          ) : (
            <ul className="space-y-px">
              {filteredTracks.map((track, index) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={index}
                  isCurrentTrack={currentTrack?.id === track.id}
                  playbackState={playbackState}
                  compact={uiDensity === "compact"}
                  showCovers={showAlbumCovers}
                  unknownArtist={t.unknownArtist}
                  onPlay={(tr) => void playTrackFromLibrary(tr)}
                  onRemove={(tr) => { void removeTrackFromLibrary(tr); showToast(t.removedFromLibrary(tr.title)); }}
                  onAddToQueue={(tr) => { appendToQueue(tr); showToast(t.addedToQueue(tr.title)); }}
                  onToast={showToast}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
