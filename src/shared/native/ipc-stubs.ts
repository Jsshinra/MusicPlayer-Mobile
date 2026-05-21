import { Browser } from "@capacitor/browser";

/**
 * Temporary stubs for the Electron IPC globals the desktop app uses.
 *
 * These exist so the ported desktop code compiles and runs in the WebView
 * unchanged during the early porting phase. Each stub will be replaced as
 * we wire its mobile equivalent:
 *
 *  - electronStore  → @capacitor/preferences (DONE — useAppStore uses preferencesStorage)
 *  - libraryAPI     → @capacitor/filesystem + WiFi transfer (Paso 5)
 *  - shellAPI       → @capacitor/browser
 *  - updaterAPI     → GitHub Releases poll (Paso 6)
 *  - playlistAPI    → @capacitor/filesystem picker
 *  - mediaAPI       → DEAD (global hotkeys don't exist on Android)
 *  - discordAPI     → DEAD
 *  - voiceAPI       → DEAD
 *  - miniPlayerAPI  → DEAD
 *
 * Until a stub is replaced, callers get safe no-ops / empty results.
 */

function noop(): void {}
async function asyncNoop(): Promise<void> {}

if (!window.libraryAPI) {
  window.libraryAPI = {
    pickFiles: async () => [],
    importFromPath: async (filePath) => ({
      path: filePath,
      title: filePath.split(/[\\/]/).pop() ?? 'unknown',
      artist: 'unknown',
      durationMs: 0,
    }),
    writeAlbumTag: asyncNoop,
    readYoutubeId: async () => undefined,
    checkPaths: async () => [],
    deleteFile: asyncNoop,
    scanMusicDir: async () => [],
    getMusicDir: async () => '',
    pickMusicDir: async () => null,
    resetMusicDir: async () => ({ newDir: '', oldDir: '' }),
    getDominantColor: async () => null,
    onFileDeleted: noop,
    removeFileDeletedListener: noop,
  }
}

if (!window.playlistAPI) {
  window.playlistAPI = { pickCover: async () => null }
}

if (!window.shellAPI) {
  window.shellAPI = {
    // @capacitor/browser opens in an in-app Custom Tab on Android and SFSafariViewController on iOS.
    // On the web dev server (Browser plugin's web fallback) it falls back to window.open.
    openExternal: (url) => {
      void Browser.open({ url })
    },
  }
}

if (!window.updaterAPI) {
  window.updaterAPI = {
    onUpdateAvailable: noop,
    onUpdateDownloaded: noop,
    onError: noop,
    install: noop,
    removeAllListeners: noop,
  }
}

if (!window.mediaAPI) {
  window.mediaAPI = {
    onPlayPause: noop,
    onNext: noop,
    onPrevious: noop,
    onPause: noop,
    removeAllListeners: noop,
  }
}

if (!window.discordAPI) {
  window.discordAPI = {
    update: noop,
    setEnabled: noop,
    setView: noop,
    onReconnected: noop,
    removeReconnectedListener: noop,
  }
}

if (!window.voiceAPI) {
  window.voiceAPI = {
    isLoaded: async () => false,
    load: asyncNoop,
    transcribe: async () => '',
    onProgress: noop,
    removeProgressListeners: noop,
    registerShortcut: noop,
    unregisterShortcut: noop,
    onTrigger: noop,
    removeTriggerListener: noop,
  }
}

if (!window.miniPlayerAPI) {
  window.miniPlayerAPI = {
    open: noop,
    close: noop,
    sendState: noop,
    sendCommand: noop,
    onState: noop,
    onCommand: noop,
    onClosed: noop,
    removeAllListeners: noop,
  }
}

if (!window.downloadAPI) {
  window.downloadAPI = {
    checkDeps: async () => ({ ytdlp: false, ffmpeg: false }),
    getMusicDir: async () => '',
    search: async () => [],
    searchPlaylists: async () => [],
    searchAlbumTracklist: async () => [],
    start: noop,
    startSpotify: noop,
    startBatchUrls: noop,
    cancel: noop,
    onProgress: noop,
    onDone: noop,
    onBatchDone: noop,
    onError: noop,
    removeAllListeners: noop,
  }
}

if (!window.radioAPI) {
  window.radioAPI = {
    resolveSeed: async () => null,
    getMixIds: async () => [],
    downloadTrack: noop,
    cancel: noop,
    onTrackReady: noop,
    onDownloadDone: noop,
    removeAllListeners: noop,
  }
}

if (!window.mixAPI) {
  window.mixAPI = {
    start: noop,
    cancel: noop,
    onProgress: noop,
    onTrackReady: noop,
    onDone: noop,
    onError: noop,
    removeAllListeners: noop,
  }
}

if (!window.spotifyAPI) {
  window.spotifyAPI = {
    scrapePlaylist: async () => ({ name: '', tracks: [] }),
  }
}

if (!window.fileUtils) {
  window.fileUtils = { getPathForFile: () => '' }
}

export {}
