import { useState, useMemo } from "react";
import { useAppStore } from "../../../app/store/useAppStore";
import { localPathToFileUri } from "../../../shared/utils/local-file-uri";
import { useTranslation } from "../../../shared/i18n/useTranslation";

interface Props {
  onClose: () => void;
  initialSelectedIds?: string[];
  trackPool?: import('../../../shared/types/music').Track[];
}

export function CreatePlaylistModal({ onClose, initialSelectedIds, trackPool }: Props) {
  const t = useTranslation();
  const libraryTracks = useAppStore((s) => s.libraryTracks);
  const createPlaylist = useAppStore((s) => s.createPlaylist);

  const pool = trackPool ?? libraryTracks;

  const [name, setName] = useState("");
  const [coverPath, setCoverPath] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const [query, setQuery] = useState("");
  const [pickingCover, setPickingCover] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q)
    );
  }, [pool, query]);

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handlePickCover = async () => {
    setPickingCover(true);
    try {
      const path = await window.playlistAPI.pickCover();
      if (path) setCoverPath(path);
    } finally {
      setPickingCover(false);
    }
  };

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createPlaylist(trimmed, Array.from(selectedIds), coverPath ?? undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <h2 className="text-base font-semibold text-white tracking-tight">{t.newPlaylist}</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex gap-5 px-6 pb-4 shrink-0">
          {/* Cover picker */}
          <button
            onClick={handlePickCover}
            disabled={pickingCover}
            className="group relative h-24 w-24 shrink-0 rounded-xl overflow-hidden border border-zinc-700 hover:border-zinc-500 transition-colors"
          >
            {coverPath ? (
              <img
                src={localPathToFileUri(coverPath)}
                alt="Cover"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-zinc-800 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" className="text-zinc-600">
                  <path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13c0-1.104 1.12-2 2.5-2s2.5.896 2.5 2zm9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2z"/>
                  <path fillRule="evenodd" d="M14 11V2h1v9h-1zM6 3v10H5V3h1z"/>
                  <path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4V2.905z"/>
                </svg>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <span className="text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                {pickingCover ? "..." : t.change}
              </span>
            </div>
          </button>

          {/* Name input */}
          <div className="flex-1 flex flex-col justify-center">
            <label className="text-[10px] font-medium uppercase tracking-widest text-zinc-600 mb-2">
              {t.nameLabel}
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              placeholder={t.myPlaylistPlaceholder}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-500 transition-colors"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="mx-6 border-t border-zinc-800/60 shrink-0" />

        {/* Song picker */}
        <div className="flex flex-col flex-1 min-h-0 px-6 py-4">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">
              {t.addSongsLabel}
            </p>
            {selectedIds.size > 0 && (
              <span className="text-[11px] text-zinc-500">
                {t.selectedCount(selectedIds.size)}
              </span>
            )}
          </div>

          {pool.length === 0 ? (
            <p className="text-sm text-zinc-600 py-4 text-center">{t.noSongsInLibraryYet}</p>
          ) : (
            <>
              {/* Search */}
              <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 mb-3 shrink-0 focus-within:border-zinc-700 transition-colors">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="shrink-0 text-zinc-600">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.currentTarget.value)}
                  placeholder={t.searchSongs}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none"
                />
              </div>

              {/* Track list */}
              <ul className="flex-1 overflow-y-auto space-y-px min-h-0">
                {filtered.map((track) => {
                  const checked = selectedIds.has(track.id);
                  return (
                    <li key={track.id}>
                      <button
                        type="button"
                        onClick={() => toggle(track.id)}
                        className={[
                          "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                          checked ? "bg-zinc-800/80" : "hover:bg-zinc-800/40",
                        ].join(" ")}
                      >
                        {/* Checkbox */}
                        <div className={[
                          "h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors",
                          checked
                            ? "border-white bg-white"
                            : "border-zinc-600 bg-transparent",
                        ].join(" ")}>
                          {checked && (
                            <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor" className="text-black">
                              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                            </svg>
                          )}
                        </div>

                        {/* Artwork */}
                        <div className="h-8 w-8 shrink-0 rounded overflow-hidden bg-zinc-800">
                          {track.artworkUrl ? (
                            <img src={track.artworkUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-zinc-600">
                                <path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13c0-1.104 1.12-2 2.5-2s2.5.896 2.5 2zm9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2z"/>
                                <path fillRule="evenodd" d="M14 11V2h1v9h-1zM6 3v10H5V3h1z"/>
                                <path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4V2.905z"/>
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-200 leading-tight">
                            {track.title}
                          </p>
                          <p className="truncate text-xs text-zinc-500 leading-tight mt-0.5">
                            {track.artist}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800/60 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm font-medium text-black bg-white rounded-lg hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t.create}
          </button>
        </div>
      </div>
    </div>
  );
}
