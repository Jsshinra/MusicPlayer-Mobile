import type { ActiveView } from "./AppLayout";
import { useTranslation } from "../../shared/i18n/useTranslation";

interface BottomNavProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

function IconLibrary() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 5h18M3 12h18M3 19h12" />
    </svg>
  );
}

function IconPlaylists() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="14" height="3" rx="1" />
      <rect x="3" y="10" width="14" height="3" rx="1" />
      <rect x="3" y="16" width="9" height="3" rx="1" />
      <circle cx="19" cy="17" r="3" />
    </svg>
  );
}

function IconQueue() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h13M3 12h13M3 18h9" />
      <path d="m19 8 4 4-4 4" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

interface TabProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function Tab({ icon, label, active, onClick }: TabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex flex-1 flex-col items-center justify-center gap-1 py-2 select-none transition-colors",
        active ? "text-white" : "text-zinc-500 active:text-zinc-300",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      {icon}
      <span className="text-[11px] font-medium tracking-tight">{label}</span>
    </button>
  );
}

export function BottomNav({ activeView, onViewChange }: BottomNavProps) {
  const t = useTranslation();

  // playlist-detail is a sub-view of the Playlists tab on mobile
  const playlistsActive = activeView === "playlists" || activeView === "playlist-detail";

  return (
    <nav
      className="shrink-0 border-t border-zinc-800/60 bg-black/85 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex">
        <Tab
          icon={<IconLibrary />}
          label={t.library}
          active={activeView === "library"}
          onClick={() => onViewChange("library")}
        />
        <Tab
          icon={<IconPlaylists />}
          label={t.playlists}
          active={playlistsActive}
          onClick={() => onViewChange("playlists")}
        />
        <Tab
          icon={<IconQueue />}
          label={t.queue}
          active={activeView === "queue"}
          onClick={() => onViewChange("queue")}
        />
        <Tab
          icon={<IconSettings />}
          label={t.settings}
          active={activeView === "settings"}
          onClick={() => onViewChange("settings")}
        />
      </div>
    </nav>
  );
}
