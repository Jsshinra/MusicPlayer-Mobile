import { useAppStore } from "../../../app/store/useAppStore";
import { localPathToFileUri } from "../../../shared/utils/local-file-uri";
import { useTranslation } from "../../../shared/i18n/useTranslation";
import { LocalLibrarySection } from "./LocalLibrarySection";

interface LibraryViewProps {
  onToast: (message: string) => void;
  onPlaylistSelect: (id: string) => void;
  onCreatePlaylist: () => void;
}

function IconPlus() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconMusic() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

export function LibraryView({ onToast, onPlaylistSelect, onCreatePlaylist }: LibraryViewProps) {
  const t = useTranslation();
  const playlists = useAppStore((s) => s.playlists);

  return (
    <div className="flex flex-col gap-4">
      {/* Playlists row */}
      <section className="-mx-4 px-4">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            {t.playlists}
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={onCreatePlaylist}
            className="flex shrink-0 flex-col items-center gap-2 w-24 active:opacity-70 transition-opacity"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 text-zinc-500">
              <IconPlus />
            </div>
            <span className="text-[11px] font-medium tracking-tight text-zinc-400 line-clamp-1">
              Nueva
            </span>
          </button>

          {playlists.map((pl) => (
            <button
              key={pl.id}
              type="button"
              onClick={() => onPlaylistSelect(pl.id)}
              className="flex shrink-0 flex-col items-start gap-2 w-24 active:opacity-70 transition-opacity"
            >
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-zinc-800 text-zinc-600">
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
              <div className="w-full text-left">
                <p className="text-[12px] font-medium tracking-tight text-white line-clamp-1">
                  {pl.name}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {pl.trackIds.length}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* All tracks */}
      <LocalLibrarySection onToast={onToast} />
    </div>
  );
}
