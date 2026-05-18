import { useEffect, useRef, useState } from "react";
import { LocalLibrarySection } from "../../features/library/components/LocalLibrarySection";
import { RecentTracksSection } from "../../features/library/components/RecentTracksSection";
import { QueueSection } from "../../features/library/components/QueueSection";
import { PlaylistDetailView } from "../../features/playlists/components/PlaylistDetailView";
import { CreatePlaylistModal } from "../../features/playlists/components/CreatePlaylistModal";
import { SettingsView } from "../../features/settings/components/SettingsView";
import { PlayerBar } from "../../features/player/components/PlayerBar";
import { NowPlayingPanel } from "../../features/player/components/NowPlayingPanel";
import { AmbientGlow } from "../../shared/components/AmbientGlow";
import { Sidebar } from "./Sidebar";
import { useAppStore } from "../store/useAppStore";
import { playerOrchestrator } from "../../core/player/player-orchestrator";

export type ActiveView = "library" | "recents" | "queue" | "playlist-detail" | "settings";

export default function AppLayout() {
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
  const playbackStateForRpc = useAppStore((s) => s.playbackState)

  const handlePlaylistSelect = (id: string) => {
    setActivePlaylistId(id);
    setActiveView("playlist-detail");
  };

  const handleBackFromPlaylist = () => {
    setActivePlaylistId(null);
    setActiveView("library");
  };

  const handleMusicDirChange = () => {
    // No-op on mobile — music dir picker isn't applicable. Settings will be
    // reworked to use WiFi import instead.
  };

  useEffect(() => {
    if (activeView === "settings") mainRef.current?.scrollTo({ top: 0 });
  }, [activeView]);

  // navigator.mediaSession — wires play/pause/next/prev controls in the
  // WebView. On Android this surfaces in the notification shade once we
  // ship the native audio plugin. For now it at least keeps the orchestrator
  // hooked up to in-page controls.
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
    const size = fontScale === 'small' ? '16px' : fontScale === 'large' ? '20px' : '18px'
    document.documentElement.style.fontSize = size
  }, [fontScale])

  return (
    <div className="relative flex h-screen overflow-hidden text-white gap-3 p-3" style={{ backgroundColor: bgColor }}>
      <AmbientGlow />
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        activePlaylistId={activePlaylistId}
        onPlaylistSelect={handlePlaylistSelect}
        onCreatePlaylist={() => setIsCreateModalOpen(true)}
      />
      <div className="relative z-10 flex flex-1 flex-col bg-black/10 rounded-xl overflow-hidden">
        <NowPlayingPanel open={isNowPlayingOpen} onClose={() => setIsNowPlayingOpen(false)} />
        <main ref={mainRef} className="flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-8">
          {activeView === "library" && <LocalLibrarySection onToast={showToast} />}
          {activeView === "recents" && <RecentTracksSection />}
          {activeView === "queue" && <QueueSection />}
          {activeView === "settings" && <SettingsView onMusicDirChange={handleMusicDirChange} />}
          {activeView === "playlist-detail" && activePlaylistId && (
            <PlaylistDetailView
              playlistId={activePlaylistId}
              onBack={handleBackFromPlaylist}
            />
          )}
        </main>
        {toast && (
          <div
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-lg whitespace-nowrap pointer-events-none"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-green-400 shrink-0">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
            </svg>
            {toast.message}
          </div>
        )}
        <PlayerBar
          onExpandNowPlaying={() => setIsNowPlayingOpen(true)}
        />
      </div>

      {isCreateModalOpen && (
        <CreatePlaylistModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  );
}
