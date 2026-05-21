/// <reference types="vite/client" />

interface TrackMeta {
  path: string
  title: string
  artist: string
  album?: string
  durationMs: number
  artworkPath?: string
  youtubeId?: string
}

interface SpotifyTrack {
  title: string
  artist: string
}

interface SpotifyPlaylist {
  name: string
  tracks: SpotifyTrack[]
}

interface YoutubeSearchResult {
  id: string
  title: string
  url: string
  thumbnail: string
  duration: number | null
  channel: string
  viewCount: number | null
}

interface YoutubePlaylistResult {
  id: string
  title: string
  url: string
  thumbnail: string
  trackCount: number | null
  channel: string
}

interface AlbumTrackInfo {
  id: string
  title: string
  url: string
  duration: number | null
}

interface MiniPlayerState {
  title: string
  artist: string
  artworkUrl: string | null
  isPlaying: boolean
  progressMs: number
  durationMs: number
  canGoPrev: boolean
  canGoNext: boolean
}

type MiniPlayerCommand =
  | { type: 'play-pause' }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'seek'; value: number }
  | { type: 'close' }
  | { type: 'show-main' }

interface Window {
  miniPlayerAPI: {
    open(): void
    close(): void
    sendState(state: MiniPlayerState): void
    sendCommand(cmd: MiniPlayerCommand): void
    onState(cb: (state: MiniPlayerState) => void): void
    onCommand(cb: (cmd: MiniPlayerCommand) => void): void
    onClosed(cb: () => void): void
    removeAllListeners(): void
  }
  radioAPI: {
    resolveSeed(title: string, artist: string): Promise<string | null>
    getMixIds(seedId: string): Promise<Array<{ id: string; title: string; uploader: string }>>
    downloadTrack(videoId: string, outputDir: string): void
    cancel(): void
    onTrackReady(cb: (data: { filePath: string; youtubeId: string }) => void): void
    onDownloadDone(cb: () => void): void
    removeAllListeners(): void
  }
  mixAPI: {
    start(videoId: string, outputDir: string, knownIds: string[]): void
    cancel(): void
    onProgress(cb: (data: { done: number; total: number; stage: string }) => void): void
    onTrackReady(cb: (data: { filePath: string }) => void): void
    onDone(cb: (data: { count: number }) => void): void
    onError(cb: (msg: string) => void): void
    removeAllListeners(): void
  }
  updaterAPI: {
    onUpdateAvailable(cb: () => void): void
    onUpdateDownloaded(cb: () => void): void
    onError(cb: (msg: string) => void): void
    install(): void
    removeAllListeners(): void
  }
  discordAPI: {
    update(track: { title: string; artist?: string; album?: string; progressMs: number; durationMs: number; youtubeId?: string } | null, playing: boolean): void
    setEnabled(value: boolean): void
    setView(view: string, playlistName?: string): void
    onReconnected(cb: () => void): void
    removeReconnectedListener(): void
  }
  spotifyAPI: {
    scrapePlaylist(url: string): Promise<SpotifyPlaylist>
  }
  shellAPI: {
    openExternal(url: string): void
  }
  mediaAPI: {
    onPlayPause(cb: () => void): void
    onNext(cb: () => void): void
    onPrevious(cb: () => void): void
    onPause(cb: () => void): void
    removeAllListeners(): void
  }
  fileUtils: {
    getPathForFile(file: File): string
  }
  libraryAPI: {
    pickFiles(): Promise<TrackMeta[]>
    importFromPath(filePath: string): Promise<TrackMeta>
    writeAlbumTag(filePath: string, album: string): Promise<void>
    readYoutubeId(filePath: string): Promise<string | undefined>
    checkPaths(paths: string[]): Promise<string[]>
    deleteFile(filePath: string): Promise<void>
    scanMusicDir(): Promise<string[]>
    getMusicDir(): Promise<string>
    pickMusicDir(): Promise<{ newDir: string; oldDir: string } | null>
    resetMusicDir(): Promise<{ newDir: string; oldDir: string }>
    getDominantColor(artworkUrl: string): Promise<string | null>
    onFileDeleted(cb: (data: { filePath: string }) => void): void
    removeFileDeletedListener(): void
  }
  playlistAPI: {
    pickCover(): Promise<string | null>
  }
  voiceAPI: {
    isLoaded(): Promise<boolean>
    load(): Promise<void>
    transcribe(audioData: number[], language: string): Promise<string>
    onProgress(cb: (data: { status: string; file?: string; progress?: number }) => void): void
    removeProgressListeners(): void
    registerShortcut(key: string): void
    unregisterShortcut(): void
    onTrigger(cb: () => void): void
    removeTriggerListener(): void
  }
  downloadAPI: {
    checkDeps(): Promise<{ ytdlp: boolean; ffmpeg: boolean }>
    getMusicDir(): Promise<string>
    search(query: string, count: number): Promise<YoutubeSearchResult[]>
    searchPlaylists(query: string, count: number): Promise<YoutubePlaylistResult[]>
    searchAlbumTracklist(artist: string, album: string): Promise<AlbumTrackInfo[]>
    start(url: string, outputDir: string): void
    startSpotify(tracks: SpotifyTrack[], outputDir: string): void
    startBatchUrls(urls: string[], outputDir: string): void
    cancel(): void
    onProgress(cb: (data: { percent: number; speed: string; eta: string; playlistIndex?: number; playlistCount?: number }) => void): void
    onDone(cb: (data: { filePath: string }) => void): void
    onBatchDone(cb: (data: { count: number }) => void): void
    onError(cb: (data: { message: string }) => void): void
    removeAllListeners(channel: 'download:progress' | 'download:done' | 'download:batch-done' | 'download:error'): void
  }
}
