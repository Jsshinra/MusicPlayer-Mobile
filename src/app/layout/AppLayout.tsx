import { useEffect, useRef, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { AudioEngine } from "../../shared/native/audio-engine";
import { LocalLibrarySection } from "../../features/library/components/LocalLibrarySection";
import { ImportFab } from "../../features/library/components/ImportFab";
import { QueueSection } from "../../features/library/components/QueueSection";
import { PlaylistDetailView } from "../../features/playlists/components/PlaylistDetailView";
import { PlaylistsView } from "../../features/playlists/components/PlaylistsView";
import { CreatePlaylistModal } from "../../features/playlists/components/CreatePlaylistModal";
import { SettingsView } from "../../features/settings/components/SettingsView";
import { MobilePlayerBar } from "../../features/player/components/MobilePlayerBar";
import { NowPlayingPanel } from "../../features/player/components/NowPlayingPanel";
import { AmbientGlow } from "../../shared/components/AmbientGlow";
import { BottomNav } from "./BottomNav";
import { useAppStore } from "../store/useAppStore";
import { usePlaybackStore } from "../store/usePlaybackStore";
import { playerOrchestrator } from "../../core/player/player-orchestrator";
import { handleBack } from "../../shared/utils/back-handler";

export type ActiveView = "library" | "playlists" | "queue" | "playlist-detail" | "settings";

function useStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useAppStore.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return;
    const unsubFinish = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAppStore.persist.hasHydrated()) setHydrated(true);
    return () => {
      unsubFinish();
    };
  }, [hydrated]);
  return hydrated;
}

export default function AppLayout() {
  const hydrated = useStoreHydrated();
  const bgColor = useAppStore((s) => s.bgColor);

  if (!hydrated) {
    // Blank splash with the user's chosen bg color while @capacitor/preferences
    // pulls persisted state off SharedPreferences. Shows for ~50-150ms on a
    // cold start; prevents the library from rendering "0 tracks" then flashing
    // to the real count.
    return (
      <div
        className="flex h-screen w-screen items-center justify-center"
        style={{ backgroundColor: bgColor }}
      />
    );
  }

  return <AppLayoutInner />;
}

function AppLayoutInner() {
  const [activeView, setActiveView] = useState<ActiveView>("library");
  const mainRef = useRef<HTMLElement>(null);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, key: Date.now() });
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  const accentColor         = useAppStore((s) => s.accentColor)
  const bgColor             = useAppStore((s) => s.bgColor)
  const fontScale           = useAppStore((s) => s.fontScale)
  const currentTrackForRpc  = useAppStore((s) => s.currentTrack)
  const playbackStateForRpc = usePlaybackStore((s) => s.playbackState)
  const audioFocusEnabled   = useAppStore((s) => s.audioFocusEnabled)

  const handleViewChange = (view: ActiveView) => {
    if (view !== "playlist-detail") setActivePlaylistId(null);
    setActiveView(view);
  };

  const handlePlaylistSelect = (id: string) => {
    setActivePlaylistId(id);
    setActiveView("playlist-detail");
  };

  const handleBackFromPlaylist = () => {
    setActivePlaylistId(null);
    setActiveView("playlists");
  };

  const handleMusicDirChange = () => {
    // No-op on mobile — music dir picker doesn't apply. Settings will be
    // reworked to surface WiFi transfer instead.
  };

  useEffect(() => {
    if (activeView === "settings") mainRef.current?.scrollTo({ top: 0 });
  }, [activeView]);

  // Android hardware back button.
  // Priority: close NowPlayingPanel → close create-playlist modal →
  // exit playlist-detail → exit app. Mirrors typical Android nav stack
  // behaviour and gives the user a guaranteed way out of NowPlayingPanel
  // even if the on-screen close button is somehow non-tappable.
  useEffect(() => {
    const handle = CapacitorApp.addListener("backButton", () => {
      if (handleBack()) return;
      if (isNowPlayingOpen) {
        setIsNowPlayingOpen(false);
        return;
      }
      if (isCreateModalOpen) {
        setIsCreateModalOpen(false);
        return;
      }
      if (activeView === "playlist-detail") {
        handleBackFromPlaylist();
        return;
      }
      void CapacitorApp.exitApp();
    });
    return () => {
      void handle.then((h) => h.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNowPlayingOpen, isCreateModalOpen, activeView]);

  useEffect(() => {
    if (!navigator.mediaSession) return
    const ms = navigator.mediaSession
    ms.setActionHandler('play', () => void playerOrchestrator.resume())
    ms.setActionHandler('pause', () => void playerOrchestrator.pause())
    ms.setActionHandler('previoustrack', () => void playerOrchestrator.previous())
    ms.setActionHandler('nexttrack', () => void playerOrchestrator.next())
    ms.setActionHandler('stop', () => void playerOrchestrator.pause())
    return () => {
      ms.setActionHandler('play', null)
      ms.setActionHandler('pause', null)
      ms.setActionHandler('previoustrack', null)
      ms.setActionHandler('nexttrack', null)
      ms.setActionHandler('stop', null)
    }
  }, [])

  useEffect(() => {
    if (!navigator.mediaSession) return
    if (!currentTrackForRpc) {
      navigator.mediaSession.metadata = null
      return
    }
    const artwork: MediaImage[] = currentTrackForRpc.artworkUrl
      ? [{ src: currentTrackForRpc.artworkUrl }]
      : []
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrackForRpc.title,
      artist: currentTrackForRpc.artist ?? '',
      album: currentTrackForRpc.album ?? '',
      artwork,
    })
  }, [currentTrackForRpc])

  useEffect(() => {
    if (!navigator.mediaSession) return
    navigator.mediaSession.playbackState =
      playbackStateForRpc === 'playing' ? 'playing' :
      playbackStateForRpc === 'paused'  ? 'paused'  : 'none'
  }, [playbackStateForRpc])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor)
  }, [accentColor])

  useEffect(() => {
    document.documentElement.style.setProperty('--bg', bgColor)
  }, [bgColor])

  useEffect(() => {
    const size = fontScale === 'small' ? '15px' : fontScale === 'large' ? '18px' : '16px'
    document.documentElement.style.fontSize = size
  }, [fontScale])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    void AudioEngine.setAudioFocusEnabled({ enabled: audioFocusEnabled })
  }, [audioFocusEnabled])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const nextHandle = AudioEngine.addListener("skipNext", () => {
      void playerOrchestrator.next()
    })
    const prevHandle = AudioEngine.addListener("skipPrevious", () => {
      void playerOrchestrator.previous()
    })
    return () => {
      void nextHandle.then((h) => h.remove())
      void prevHandle.then((h) => h.remove())
    }
  }, [])

  return (
    <div
      className="relative flex h-screen flex-col overflow-hidden text-white"
      style={{
        backgroundColor: bgColor,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <AmbientGlow />
      <main
        ref={mainRef}
        className="relative z-10 flex-1 overflow-y-auto px-4 pt-4 pb-4"
      >
        {activeView === "library" && <LocalLibrarySection onToast={showToast} />}
        {activeView === "playlists" && (
          <PlaylistsView
            onPlaylistSelect={handlePlaylistSelect}
            onCreatePlaylist={() => setIsCreateModalOpen(true)}
          />
        )}
        {activeView === "queue" && <QueueSection />}
        {activeView === "settings" && <SettingsView onMusicDirChange={handleMusicDirChange} onToast={showToast} />}
        {activeView === "playlist-detail" && activePlaylistId && (
          <PlaylistDetailView
            playlistId={activePlaylistId}
            onBack={handleBackFromPlaylist}
          />
        )}
      </main>

      {toast && (
        <div className="pointer-events-none absolute bottom-32 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-lg">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="shrink-0 text-green-400">
            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
          </svg>
          {toast.message}
        </div>
      )}

      <div className="relative z-10 shrink-0">
        <MobilePlayerBar onExpand={() => setIsNowPlayingOpen(true)} />
      </div>

      <BottomNav activeView={activeView} onViewChange={handleViewChange} />

      {activeView === "library" && !isNowPlayingOpen && <ImportFab onToast={showToast} />}

      <NowPlayingPanel open={isNowPlayingOpen} onClose={() => setIsNowPlayingOpen(false)} />

      {isCreateModalOpen && (
        <CreatePlaylistModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  );
}
