import React, { type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { ActiveView } from "./AppLayout";
import { useAppStore } from "../../app/store/useAppStore";
import { localPathToFileUri } from "../../shared/utils/local-file-uri";
import { useTranslation } from "../../shared/i18n/useTranslation";

function IconLibrary() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3A1.5 1.5 0 0 1 15 10.5v3A1.5 1.5 0 0 1 13.5 15h-3A1.5 1.5 0 0 1 9 13.5v-3z" />
    </svg>
  );
}

function IconQueue() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M2 2.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0 4a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 6.5zm0 4a.5.5 0 0 1 .5-.5H8a.5.5 0 0 1 0 1H2.5a.5.5 0 0 1-.5-.5zm9 .146 3.5 2-3.5 2v-4z" />
    </svg>
  );
}

function IconLogoMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="2" y="7" width="2.5" height="6" rx="1.25" fill="white" fillOpacity="0.9" />
      <rect x="6" y="4" width="2.5" height="12" rx="1.25" fill="white" fillOpacity="0.65" />
      <rect x="10" y="6" width="2.5" height="8" rx="1.25" fill="white" fillOpacity="0.45" />
      <rect x="14" y="9" width="2.5" height="5" rx="1.25" fill="white" fillOpacity="0.28" />
    </svg>
  );
}

function IconMusic() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13c0-1.104 1.12-2 2.5-2s2.5.896 2.5 2zm9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2z" />
      <path fillRule="evenodd" d="M14 11V2h1v9h-1zM6 3v10H5V3h1z" />
      <path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4V2.905z" />
    </svg>
  );
}

interface NavItemProps {
  icon: ReactNode;
  label: string;
  badge?: number;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

function NavItem({ icon, label, badge, active = false, disabled = false, onClick }: NavItemProps) {
  return (
    <div
      role="button"
      aria-current={active ? "page" : undefined}
      onClick={disabled ? undefined : onClick}
      className={[
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-100 select-none",
        active
          ? "bg-zinc-900 text-white"
          : disabled
            ? "cursor-not-allowed text-zinc-700"
            : "cursor-pointer text-zinc-500 hover:text-zinc-300",
      ].join(" ")}
    >
      <span className={["shrink-0 transition-colors duration-100", active ? "text-zinc-300" : "text-zinc-700"].join(" ")}>
        {icon}
      </span>
      <span className="font-medium tracking-tight flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-[10px] font-medium tabular-nums text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      {active && !badge && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
      )}
    </div>
  );
}

interface SidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  activePlaylistId: string | null;
  onPlaylistSelect: (id: string) => void;
  onCreatePlaylist: () => void;
}

export function Sidebar({ activeView, onViewChange, activePlaylistId, onPlaylistSelect, onCreatePlaylist }: SidebarProps) {
  const t = useTranslation();
  const libraryCount = useAppStore((s) => s.libraryTracks.length);
  const playlists = useAppStore((s) => s.playlists);
  const reorderPlaylists = useAppStore((s) => s.reorderPlaylists);

  const dragIndexRef = React.useRef<number | null>(null);
  const [dropTarget, setDropTarget] = React.useState<number | null>(null);
  const [reorderMode, setReorderMode] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const updatePlaylist = useAppStore((s) => s.updatePlaylist);
  const deletePlaylist = useAppStore((s) => s.deletePlaylist);

  return (
    <>
    <aside className="relative z-10 flex w-64 shrink-0 flex-col rounded-xl border border-zinc-800/60 bg-black/50 backdrop-blur-md">
      {/* Header */}
      <div className="px-5 pt-7 pb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
            <IconLogoMark />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white leading-none">
              Lumen
            </h1>
            <p className="mt-0.5 text-[11px] text-zinc-600 leading-none">
              Local Player
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-zinc-800/60 shrink-0" />

      {/* Navigation — scrollable so many playlists don't overflow */}
      <nav className="flex-1 overflow-y-auto px-3 pt-5 pb-4">
        {/* Browse section */}
        <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-widest text-zinc-700">
          {t.browse}
        </p>
        <div className="space-y-0.5">
          <NavItem
            icon={<IconLibrary />}
            label={t.library}
            badge={libraryCount > 0 ? libraryCount : undefined}
            active={activeView === "library"}
            onClick={() => onViewChange("library")}
          />
          <NavItem
            icon={<IconQueue />}
            label={t.queue}
            active={activeView === "queue"}
            onClick={() => onViewChange("queue")}
          />
        </div>

        {/* Playlists section */}
        <div className="mt-5">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-700">
              {t.playlists}
            </p>
            <div className="flex items-center gap-1">
              {playlists.length > 1 && (
                <button
                  onClick={() => setReorderMode(!reorderMode)}
                  aria-label="Reorder playlists"
                  className={[
                    "flex h-5 w-5 items-center justify-center rounded transition-colors",
                    reorderMode ? "text-zinc-300 bg-zinc-800" : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800",
                  ].join(" ")}
                >
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                  </svg>
                </button>
              )}
              <button
                onClick={onCreatePlaylist}
                aria-label="Create playlist"
                className="flex h-5 w-5 items-center justify-center rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1.5a.5.5 0 0 1 .5.5v5.5H14a.5.5 0 0 1 0 1H8.5V14a.5.5 0 0 1-1 0V8.5H2a.5.5 0 0 1 0-1h5.5V2a.5.5 0 0 1 .5-.5z" />
                </svg>
              </button>
            </div>
          </div>

          {playlists.length === 0 ? (
            <p className="px-3 text-[11px] text-zinc-700 italic">{t.noPlaylistsYet}</p>
          ) : (
            <div className="space-y-0.5">
              {playlists.map((pl, idx) => {
                const isActive = activeView === "playlist-detail" && activePlaylistId === pl.id;
                const isDragOver = dropTarget === idx && dragIndexRef.current !== idx;
                const isDragging = dragIndexRef.current === idx;
                return (
                  <div
                    key={pl.id}
                    role="button"
                    draggable={reorderMode}
                    onDragStart={reorderMode ? (e) => {
                      dragIndexRef.current = idx;
                      e.dataTransfer.effectAllowed = 'move';
                    } : undefined}
                    onDragOver={reorderMode ? (e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      setDropTarget(idx);
                    } : undefined}
                    onDragLeave={reorderMode ? () => { if (dropTarget === idx) setDropTarget(null); } : undefined}
                    onDrop={reorderMode ? (e) => {
                      e.preventDefault();
                      const from = dragIndexRef.current;
                      if (from !== null && from !== idx) reorderPlaylists(from, idx);
                      dragIndexRef.current = null;
                      setDropTarget(null);
                    } : undefined}
                    onDragEnd={reorderMode ? () => { dragIndexRef.current = null; setDropTarget(null); } : undefined}
                    onClick={() => onPlaylistSelect(pl.id)}
                    className={[
                      "relative flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors duration-100 select-none cursor-pointer",
                      isActive ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-300",
                      isDragging ? "opacity-40" : "",
                    ].join(" ")}
                  >
                    {/* Drop indicator line */}
                    {isDragOver && (
                      <span className="absolute -top-px left-3 right-3 h-0.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                    )}

                    {/* Drag handle — visible in reorder mode */}
                    <span className={[
                      "overflow-hidden flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing text-zinc-600 transition-all duration-150",
                      reorderMode ? "w-4 mr-0" : "w-0 -mr-2.5",
                    ].join(" ")}>
                      <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor" aria-hidden>
                        <circle cx="2" cy="2" r="1" /><circle cx="6" cy="2" r="1" />
                        <circle cx="2" cy="6" r="1" /><circle cx="6" cy="6" r="1" />
                        <circle cx="2" cy="10" r="1" /><circle cx="6" cy="10" r="1" />
                      </svg>
                    </span>

                    {/* Mini cover */}
                    <div className="h-6 w-6 shrink-0 rounded overflow-hidden bg-zinc-800 flex items-center justify-center">
                      {pl.coverPath ? (
                        <img
                          src={localPathToFileUri(pl.coverPath)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-zinc-600">
                          <IconMusic />
                        </span>
                      )}
                    </div>

                    {reorderMode && editingId === pl.id ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => {
                          const trimmed = editName.trim();
                          if (trimmed && trimmed !== pl.name) updatePlaylist(pl.id, { name: trimmed });
                          setEditingId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 min-w-0 bg-zinc-800 text-white text-sm font-medium tracking-tight rounded px-1.5 py-0.5 outline-none border border-zinc-600 focus:border-zinc-400"
                      />
                    ) : (
                      <span
                        className="font-medium tracking-tight flex-1 truncate"
                        onDoubleClick={reorderMode ? (e) => {
                          e.stopPropagation();
                          setEditingId(pl.id);
                          setEditName(pl.name);
                        } : undefined}
                      >
                        {pl.name}
                      </span>
                    )}

                    {reorderMode ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(pl.id); }}
                        className="ml-auto shrink-0 text-zinc-700 hover:text-red-400 transition-colors"
                        aria-label="Delete playlist"
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                          <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H5.5l1-1h3l1 1h2a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                        </svg>
                      </button>
                    ) : isActive ? (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--accent)' }} />
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3 border-t border-zinc-800/40 shrink-0">
        <div
          role="button"
          onClick={() => onViewChange("settings")}
          className={[
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-100 select-none cursor-pointer",
            activeView === "settings"
              ? "bg-zinc-900 text-white"
              : "text-zinc-500 hover:text-zinc-300",
          ].join(" ")}
        >
          <span className={["shrink-0 transition-colors duration-100", activeView === "settings" ? "text-zinc-300" : "text-zinc-700"].join(" ")}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.474l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z" />
            </svg>
          </span>
          <span className="font-medium tracking-tight flex-1">{t.settings}</span>
          {activeView === "settings" && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
          )}
        </div>
        <p className="mt-2 px-3 text-[10px] text-zinc-700 tracking-wide">
          v1.1.8
        </p>
      </div>
    </aside>

    {/* Delete confirmation modal — portal to body so it centers on the full screen */}
    {confirmDeleteId && createPortal(
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={() => setConfirmDeleteId(null)}
      >
        <div
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-white text-sm font-semibold mb-2">{t.deletePlaylist}</h3>
          <p className="text-zinc-400 text-sm mb-5">
            {t.deletePlaylistConfirm(playlists.find((p) => p.id === confirmDeleteId)?.name ?? '')}
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="px-3 py-1.5 text-sm rounded-lg border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={() => {
                const remaining = playlists.length - 1;
                deletePlaylist(confirmDeleteId);
                setConfirmDeleteId(null);
                if (remaining < 2) setReorderMode(false);
                if (activePlaylistId === confirmDeleteId) onViewChange('library');
              }}
              className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors"
            >
              {t.deletePlaylist}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
