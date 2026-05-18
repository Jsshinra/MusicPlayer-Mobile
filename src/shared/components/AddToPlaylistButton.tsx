import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../../app/store/useAppStore";
import { useTranslation } from "../i18n/useTranslation";

interface Props {
  trackId: string;
  onToast?: (msg: string) => void;
}

function IconPlaylist() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M2 2.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0 4a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 6.5zm0 4a.5.5 0 0 1 .5-.5H8a.5.5 0 0 1 0 1H2.5a.5.5 0 0 1-.5-.5z"/>
      <path d="M12.5 10a.5.5 0 0 1 .5.5v1.5h1.5a.5.5 0 0 1 0 1H13v1.5a.5.5 0 0 1-1 0V13H10.5a.5.5 0 0 1 0-1H12v-1.5a.5.5 0 0 1 .5-.5z"/>
    </svg>
  );
}

export function AddToPlaylistButton({ trackId, onToast }: Props) {
  const t = useTranslation();
  const playlists = useAppStore((s) => s.playlists);
  const appendTrackToPlaylist = useAppStore((s) => s.appendTrackToPlaylist);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Playlists that don't already contain this track
  const available = playlists.filter((p) => !p.trackIds.includes(trackId));

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (playlists.length === 0) return null;

  const handleAdd = (playlistId: string, playlistName: string) => {
    appendTrackToPlaylist(playlistId, trackId);
    setOpen(false);
    onToast?.(`${t.addedToPlaylist} "${playlistName}"`);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Add to playlist"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:text-white transition-colors"
      >
        <IconPlaylist />
      </button>

      {open && (
        <div
          className="absolute bottom-full right-0 mb-1 z-50 min-w-[160px] max-w-[220px] rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-medium uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
            Añadir a playlist
          </p>
          {available.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-zinc-500 italic">
              {t.alreadyInAllPlaylists}
            </p>
          ) : (
            <ul className="max-h-48 overflow-y-auto">
              {available.map((pl) => (
                <li key={pl.id}>
                  <button
                    type="button"
                    onClick={() => handleAdd(pl.id, pl.name)}
                    className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors truncate"
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
  );
}
