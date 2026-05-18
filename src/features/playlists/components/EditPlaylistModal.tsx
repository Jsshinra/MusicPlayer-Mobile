import { useState, useMemo } from "react";
import { useAppStore } from "../../../app/store/useAppStore";
import { useTranslation } from "../../../shared/i18n/useTranslation";

interface Props {
  playlistId: string;
  onClose: () => void;
}

export function EditPlaylistModal({ playlistId, onClose }: Props) {
  const t = useTranslation();
  const libraryTracks = useAppStore((s) => s.libraryTracks);
  const playlists = useAppStore((s) => s.playlists);
  const updatePlaylist = useAppStore((s) => s.updatePlaylist);

  const playlist = playlists.find((p) => p.id === playlistId);
  const existingIds = useMemo(
    () => new Set(playlist?.trackIds ?? []),
    [playlist]
  );

  // Only show tracks NOT already in the playlist
  const availableTracks = useMemo(
    () => libraryTracks.filter((t) => !existingIds.has(t.id)),
    [libraryTracks, existingIds]
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableTracks;
    return availableTracks.filter(
      (track) =>
        track.title.toLowerCase().includes(q) ||
        (track.artist ?? "").toLowerCase().includes(q)
    );
  }, [availableTracks, query]);

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleSave = () => {
    if (!playlist || selectedIds.size === 0) { onClose(); return; }
    updatePlaylist(playlistId, {
      trackIds: [...playlist.trackIds, ...Array.from(selectedIds)],
    });
    onClose();
  };

  if (!playlist) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col max-h-[85vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              {t.addSongsLabel}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-[260px]">
              {playlist.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z" />
            </svg>
          </button>
        </div>

        {/* Song picker */}
        <div className="flex flex-col flex-1 min-h-0 px-6 pb-4">
          {availableTracks.length === 0 ? (
            <p className="text-sm text-zinc-600 py-8 text-center">
              {t.noSongsInLibraryYet}
            </p>
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

              {/* Count */}
              {selectedIds.size > 0 && (
                <p className="text-[11px] text-zinc-500 mb-2 shrink-0">
                  {t.selectedCount(selectedIds.size)}
                </p>
              )}

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
                          checked ? "border-white bg-white" : "border-zinc-600 bg-transparent",
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
            onClick={handleSave}
            disabled={selectedIds.size === 0}
            className="px-4 py-2 text-sm font-medium text-black bg-white rounded-lg hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {selectedIds.size > 0 ? t.addSongsLabel : t.addSongsLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
