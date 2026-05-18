import { useAppStore } from "../../../app/store/useAppStore";
import { localPathToFileUri } from "../../../shared/utils/local-file-uri";
import { useTranslation } from "../../../shared/i18n/useTranslation";

interface PlaylistsViewProps {
  onPlaylistSelect: (id: string) => void;
  onCreatePlaylist: () => void;
}

function IconPlus() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconMusic() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

export function PlaylistsView({ onPlaylistSelect, onCreatePlaylist }: PlaylistsViewProps) {
  const t = useTranslation();
  const playlists = useAppStore((s) => s.playlists);

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-white">{t.playlists}</h2>
        <button
          type="button"
          onClick={onCreatePlaylist}
          aria-label="Crear playlist"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 active:bg-zinc-800"
        >
          <IconPlus />
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60 text-zinc-600">
            <IconMusic />
          </div>
          <p className="mb-1 text-sm font-medium text-white">{t.noPlaylistsYet}</p>
          <p className="mb-5 text-xs text-zinc-500">
            Tocá el + para crear tu primera playlist
          </p>
          <button
            type="button"
            onClick={onCreatePlaylist}
            className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-white active:bg-zinc-800"
          >
            Crear playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              type="button"
              onClick={() => onPlaylistSelect(pl.id)}
              className="flex flex-col items-stretch gap-2 text-left active:opacity-70 transition-opacity"
            >
              <div className="aspect-square overflow-hidden rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-600">
                {pl.coverPath ? (
                  <img
                    src={localPathToFileUri(pl.coverPath)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <IconMusic />
                )}
              </div>
              <div className="px-1">
                <p className="text-sm font-medium tracking-tight text-white line-clamp-1">
                  {pl.name}
                </p>
                <p className="text-[11px] text-zinc-500">
                  {pl.trackIds.length} {pl.trackIds.length === 1 ? "canción" : "canciones"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
