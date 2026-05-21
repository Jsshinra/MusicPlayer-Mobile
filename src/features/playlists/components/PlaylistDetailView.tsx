import { useMemo, useRef, useState } from "react";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { useAppStore } from "../../../app/store/useAppStore";
import { localPathToFileUri } from "../../../shared/utils/local-file-uri";
import { playerOrchestrator } from "../../../core/player/player-orchestrator";
import { formatMsToClock } from "../../../shared/utils/format-time";
import type { Track } from "../../../shared/types/music";
import { useTranslation } from "../../../shared/i18n/useTranslation";
import { EditPlaylistModal } from "./EditPlaylistModal";
import { AddToPlaylistButton } from "../../../shared/components/AddToPlaylistButton";

const PLAYLIST_COVER_DIR = "playlist-covers";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const comma = dataUrl.indexOf(",");
      resolve(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl);
    };
    reader.readAsDataURL(blob);
  });
}

interface Props {
  playlistId: string;
  onBack: () => void;
}

/** "5 horas y 12 minutos" / "47 minutos" / "1 hora y 1 minuto" — matches Spotify mobile vibe. */
function formatPlaylistDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hPart = hours > 0 ? `${hours} ${hours === 1 ? "hora" : "horas"}` : "";
  const mPart = minutes > 0 ? `${minutes} ${minutes === 1 ? "minuto" : "minutos"}` : "";
  if (hPart && mPart) return `${hPart} y ${mPart}`;
  return hPart || mPart || "0 minutos";
}

export function PlaylistDetailView({ playlistId, onBack }: Props) {
  const t = useTranslation();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const playlists = useAppStore((s) => s.playlists);
  const libraryTracks = useAppStore((s) => s.libraryTracks);
  const updatePlaylist = useAppStore((s) => s.updatePlaylist);
  const deletePlaylist = useAppStore((s) => s.deletePlaylist);
  const currentTrack = useAppStore((s) => s.currentTrack);
  const playbackState = useAppStore((s) => s.playbackState);
  const appendToQueue = useAppStore((s) => s.appendToQueue);


  const playlist = playlists.find((p) => p.id === playlistId);

  const tracks = useMemo(() => {
    if (!playlist) return [];
    const byId = new Map(libraryTracks.map((t) => [t.id, t]));
    return playlist.trackIds.map((id) => byId.get(id)).filter((t): t is Track => t !== undefined);
  }, [playlist, libraryTracks]);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverBusy, setCoverBusy] = useState(false);

  const handleCoverClick = () => {
    coverInputRef.current?.click();
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file later
    if (!file) return;
    setCoverBusy(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const base64 = await blobToBase64(file);
      const res = await Filesystem.writeFile({
        path: `${PLAYLIST_COVER_DIR}/${playlistId}-${Date.now()}.${ext}`,
        data: base64,
        directory: Directory.Data,
        recursive: true,
      });
      // Store the file:// URI so localPathToFileUri can rewrite it to the
      // WebView-friendly https://localhost form when we render the <img>.
      updatePlaylist(playlistId, { coverPath: res.uri });
    } catch (err) {
      console.error("[playlist] cover update failed", err);
    } finally {
      setCoverBusy(false);
    }
  };

  const handleRemoveTrack = (trackId: string) => {
    if (!playlist) return;
    updatePlaylist(playlistId, {
      trackIds: playlist.trackIds.filter((id) => id !== trackId),
    });
  };

  const handlePlayAll = async () => {
    if (tracks.length === 0) return;
    useAppStore.getState().setPlaybackOrigin('playlist');
    await playerOrchestrator.playFromQueue(tracks[0], tracks);
  };

  const handleDelete = () => {
    if (!playlist) return;
    const confirmed = window.confirm(t.deletePlaylistConfirm(playlist.name));
    if (!confirmed) return;
    deletePlaylist(playlistId);
    onBack();
  };

  const totalDurationMs = useMemo(
    () => tracks.reduce((acc, tr) => acc + (tr.durationMs || 0), 0),
    [tracks],
  );

  if (!playlist) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">
        {t.playlistNotFound}
      </div>
    );
  }

  return (
    <section>
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors mb-6"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
        </svg>
        {t.playlists}
      </button>

      {/* Header — mobile hero layout: cover, title, meta, action row */}
      <div className="flex flex-col items-center text-center mb-7">
        {/* Cover — tap to pick a new image from the device */}
        <button
          type="button"
          onClick={handleCoverClick}
          disabled={coverBusy}
          aria-label={t.change}
          className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-800 mb-4 shadow-xl active:scale-[0.98] transition-transform"
          style={{ width: "min(48vw, 240px)" }}
        >
          {playlist.coverPath ? (
            <img
              src={localPathToFileUri(playlist.coverPath)}
              alt={playlist.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-zinc-900 flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor" className="text-zinc-700">
                <path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13c0-1.104 1.12-2 2.5-2s2.5.896 2.5 2zm9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2z" />
                <path fillRule="evenodd" d="M14 11V2h1v9h-1zM6 3v10H5V3h1z" />
                <path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4V2.905z" />
              </svg>
            </div>
          )}
          {/* "Cambiar" overlay — soft indicator that the cover is interactive */}
          <div className="absolute inset-0 flex items-end justify-end p-2 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-70">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M12.146 0.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
              </svg>
            </div>
          </div>
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleCoverChange(e)}
        />

        {/* Title */}
        <h2 className="text-2xl font-bold text-white tracking-tight mb-2 truncate max-w-full px-4">
          {playlist.name}
        </h2>

        {/* Meta: "N pistas · duration" */}
        <p className="text-xs text-zinc-500 mb-6 px-4">
          {t.songCount(tracks.length)}
          {totalDurationMs > 0 ? ` · ${formatPlaylistDuration(totalDurationMs)}` : ""}
        </p>

        {/* Action row */}
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            aria-label={t.addSongsLabel}
            className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.146 0.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => void handlePlayAll()}
            disabled={tracks.length === 0}
            aria-label={t.playAll}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-lg disabled:opacity-40 active:scale-95 transition-transform"
          >
            <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 2.5l11 5.5-11 5.5V2.5z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            aria-label={t.deletePlaylist}
            className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-400 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6 2a1 1 0 0 0-1 1H2.5a.5.5 0 0 0 0 1H3v9a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4h.5a.5.5 0 0 0 0-1H11a1 1 0 0 0-1-1H6zm1 3.5a.5.5 0 0 1 1 0v6a.5.5 0 0 1-1 0v-6zm3 0a.5.5 0 0 1 1 0v6a.5.5 0 0 1-1 0v-6z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Track list */}
      {tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-14 text-center">
          <p className="text-sm text-zinc-600">{t.noSongsInPlaylist}</p>
        </div>
      ) : (
        <>
          {/* Column header */}
          <div className="mb-1 flex items-center gap-3 px-3">
            <span className="w-6" />
            <span className="flex-1 text-[10px] font-medium uppercase tracking-widest text-zinc-700">{t.titleColumn}</span>
          </div>

          <ul className="space-y-px">
            {tracks.map((track, index) => {
              const isCurrentTrack = currentTrack?.id === track.id;
              const isPlaying = isCurrentTrack && playbackState === "playing";

              return (
                <li key={track.id} className="group relative">
                  <div className={[
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-100",
                    isCurrentTrack ? "bg-zinc-800/70" : "hover:bg-zinc-800/40",
                  ].join(" ")}>
                    {/* Index / playing indicator */}
                    <div className="flex w-6 shrink-0 items-center justify-center">
                      {isCurrentTrack ? (
                        <span className={isPlaying ? "text-white" : "text-zinc-400"}>
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                            <rect x="1"  y="5" width="3" height="6" rx="1" opacity="0.9" />
                            <rect x="6"  y="3" width="3" height="10" rx="1" opacity="0.7" />
                            <rect x="11" y="6" width="3" height="5" rx="1" opacity="0.5" />
                          </svg>
                        </span>
                      ) : (
                        <>
                          <span className="text-xs text-zinc-600 tabular-nums group-hover:hidden">
                            {index + 1}
                          </span>
                          <span className="hidden text-zinc-400 group-hover:block">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M3 2.5l11 5.5-11 5.5V2.5z" />
                            </svg>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Click to play */}
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => { useAppStore.getState().setPlaybackOrigin('playlist'); void playerOrchestrator.playFromQueue(track, tracks); }}
                    >
                      <span className={[
                        "block truncate text-sm font-medium leading-tight",
                        isCurrentTrack ? "text-white" : "text-zinc-200",
                      ].join(" ")}>
                        {track.title}
                      </span>
                      <span className="block truncate text-xs text-zinc-500 leading-tight mt-0.5">
                        {track.artist}
                      </span>
                    </button>

                    {/* Duration */}
                    {track.durationMs > 0 && (
                      <span className="shrink-0 text-[11px] tabular-nums text-zinc-600 group-hover:opacity-0 transition-opacity">
                        {formatMsToClock(track.durationMs)}
                      </span>
                    )}

                    {/* Actions */}
                    <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <AddToPlaylistButton trackId={track.id} />
                      <button
                        type="button"
                        aria-label="Add to queue"
                        onClick={() => appendToQueue(track)}
                        className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 1.5a.5.5 0 0 1 .5.5v5.5H14a.5.5 0 0 1 0 1H8.5V14a.5.5 0 0 1-1 0V8.5H2a.5.5 0 0 1 0-1h5.5V2a.5.5 0 0 1 .5-.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        aria-label="Remove from playlist"
                        onClick={() => handleRemoveTrack(track.id)}
                        className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                      >
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M6 2a1 1 0 0 0-1 1H2.5a.5.5 0 0 0 0 1H3v9a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4h.5a.5.5 0 0 0 0-1H11a1 1 0 0 0-1-1H6zm1 3.5a.5.5 0 0 1 1 0v6a.5.5 0 0 1-1 0v-6zm3 0a.5.5 0 0 1 1 0v6a.5.5 0 0 1-1 0v-6z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {isEditOpen && (
        <EditPlaylistModal
          playlistId={playlistId}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </section>
  );
}
