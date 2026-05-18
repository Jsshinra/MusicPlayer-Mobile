/**
 * Temporary stubs for the Electron IPC globals the desktop app uses.
 *
 * These exist so the ported desktop code compiles and runs in the WebView
 * unchanged during the early porting phase. Each stub will be replaced as
 * we wire its mobile equivalent:
 *
 *  - electronStore  → @capacitor/preferences (Paso 2)
 *  - libraryAPI     → @capacitor/filesystem + WiFi transfer (Paso 4)
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

// ── electronStore — backed by localStorage so persistence "works" in WebView ──
if (!window.electronStore) {
  window.electronStore = {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    removeItem: (key) => window.localStorage.removeItem(key),
  }
}

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
    openExternal: (url) => {
      window.open(url, '_blank', 'noopener,noreferrer')
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

if (!window.fileUtils) {
  window.fileUtils = { getPathForFile: () => '' }
}

export {}
