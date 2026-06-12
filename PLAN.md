# Lumen Mobile — Plan de Desarrollo

Port de la app de escritorio Lumen (Electron) a Android como APK independiente usando Capacitor.
La app de PC sigue siendo la herramienta principal de descarga y gestión.
La app mobile es reproductor + receptor de biblioteca vía WiFi.

- **Proyecto de escritorio:** `C:\Users\nacho\Documents\GitHub\MusicPlayer`
- **Proyecto mobile:** `C:\Users\nacho\Documents\GitHub\MusicPlayer Mobile`

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| UI | React 19 + Tailwind CSS v4 (reutilizado del desktop) |
| Estado | Zustand 5 (persistencia async pendiente) |
| Persistencia | localStorage temporal → `@capacitor/preferences` (pendiente) |
| Audio | Plugin nativo propio: Media3 / ExoPlayer (Capacitor 8) |
| Archivos | `@capacitor/filesystem` (sandbox privado, sin permisos extra) |
| Distribución | APK via GitHub Releases |

---

## Features

### Se mantienen
- Reproducción de biblioteca local
- Playlists (crear, editar, reproducir)
- Cola, shuffle, repeat
- Settings (tema, idioma, etc.)
- **WiFi Transfer** — importar biblioteca desde la PC
- Auto-updater via GitHub Releases
- Pantalla "Acerca de" con Discord + donaciones

### Descartados (no aplican en mobile)
- Descarga directa de YouTube desde el celular (v1 — ver v2)
- Radio mode
- Mix mode
- Whisper / búsqueda por voz
- Discord RPC
- Crossfade
- Mini player flotante
- Hotkeys globales

---

## Estado actual — `2026-05-19`

### ✅ Paso 1 — Scaffolding (completado)
- Capacitor 8.3.4 + React 19.2.4 + Vite 8.0.7 + Tailwind v4
- `android/` generado, Gradle sync OK, AVD Pixel 8 corriendo
- 0 vulnerabilidades en `npm audit`
- JDK 17 para dev general, Android Studio usa su JBR 21 internamente para gradle
- Commit: `d40c3c6`

### ✅ Paso 2 — UI port + stubs IPC (completado, no era el plan original)
- `src/` del desktop copiado, features muertas borradas (downloader, mix, radio, voice, mini-player)
- `src/shared/native/ipc-stubs.ts` con stubs no-op de los `window.*API` globales
- `electronStore` apuntando a `localStorage` como persistencia temporal — sobrevive restarts pero no app-kills
- Sidebar de desktop reemplazada por **BottomNav** con 4 tabs: Biblioteca · Playlists · Cola · Configuración
- **MobilePlayerBar** compacto encima del bottom nav (artwork + título + play/next; tap para expandir NowPlaying)
- **NowPlayingPanel** full-screen con close button (botón `⌄` con padding-top fijo de 32px porque `env(safe-area-inset-top)` devuelve 0 en el AVD)
- Hardware back button cierra modales / NowPlaying / vuelve de playlist-detail
- Configuración con cards limpiadas (sin voice / Discord / crossfade / music folder)
- AmbientGlow simplificado para WebView mobile (orbes más chicos, sin animate-pulse, GPU layers)
- Playlists tab dedicada con grid 2-col
- Commits: `c888bfd → 833499b`

### ✅ Paso 3a — Import + reproducción foreground (completado)
- FAB `+` en Biblioteca abre file picker nativo de Android (`<input type=file accept=audio/*>`)
- `useFileImport` parsea metadata con `music-metadata-browser`, escribe MP3 + artwork al sandbox via `@capacitor/filesystem`, agrega al store
- **Plugin nativo `AudioEngine`** propio:
  - Java sobre `androidx.media3.exoplayer:1.5.0`
  - `ExoPlayer` corre en el main thread; eventos `position`/`stateChanged`/`playingChanged`/`error` emitidos a JS cada 250ms
  - Permisos manifest: `WAKE_LOCK`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `POST_NOTIFICATIONS` (ya declarados aunque el service todavía no esté creado)
- `NativeAudioProvider` (TS) implementa `MusicProvider` usando el plugin
- `register-local-provider` elige nativo en Capacitor / `HTMLAudioElement` en web
- Bug clave resuelto: ExoPlayer necesita el `file://` directo de `track.localPath`, **no** la URL `https://localhost/_capacitor_file_/...` (esa era para HTMLAudioElement; con ExoPlayer hacía HTTP fetch a localhost:443 y fallaba)
- Commits: `2bfb130`, `5f8379e`

---

### ✅ Paso 3b — Audio en background + lock screen (completado)
- `LumenMediaSessionService.java` con ExoPlayer + MediaSession, foreground service con `foregroundServiceType="mediaPlayback"`
- `AudioEnginePlugin.java` refactorizado a usar `MediaController` (cliente liviano), conexión async vía `ListenableFuture`
- `loadTrack` ahora pasa título/artista/álbum/artworkUri al `MediaMetadata` para que la notif del lock screen muestre todo
- Service declarado en manifest con intent-filter de `androidx.media3.session.MediaSessionService`
- `onTaskRemoved` corta playback + libera service cuando el usuario hace swipe-close (decisión: swipe → stop; minimizar/bloquear pantalla → sigue sonando)

### ✅ Paso 4 — Persistencia async (`@capacitor/preferences`) (completado)
- `src/shared/native/preferences-storage.ts` con `StateStorage` async
- `useAppStore` usa `createJSONStorage(() => preferencesStorage)` en vez de `window.electronStore`
- `AppLayout` ahora monta un splash con `bgColor` hasta que `useAppStore.persist.hasHydrated()` es true (evita flicker de biblioteca vacía → poblada)
- Borrado: el stub de `electronStore` en `ipc-stubs.ts` + su tipo en `vite-env.d.ts`

### ✅ Fix metadata — `music-metadata-browser` → `music-metadata` v11 (completado)
- El paquete viejo crasheaba con `ReferenceError: Buffer is not defined` en WebView Android
- Migrado a `music-metadata` v11 (ESM, sin Node Buffer)
- Bundle bajó de 665KB → 411KB
- 3 vulnerabilidades resueltas
- Bug arreglado: `pic.data` es `Uint8Array` que puede ser view parcial de un buffer más grande — pasar `pic.data.buffer` al `Blob` incluía bytes basura. Ahora pasamos `pic.data` directo
- Normalización de `pic.format`: a veces viene como `"jpeg"` pero MIME debe ser `"image/jpeg"`

### ✅ UX fixes mobile (completado)
- Action buttons de TrackRow usaban `opacity-0 group-hover:opacity-100` → invisibles e intocables en mobile
- Reemplazado por un kebab "⋯" único que abre un popover con: "Agregar a la cola", "Agregar a playlist" (submenú), "Eliminar". `SetAlbumButton` descartado (writeAlbumTag stub no hace nada en mobile)
- Sacado "Agregar canciones" del header de Biblioteca (solo queda el FAB `+` flotante)
- NowPlayingPanel: artwork era `w-[clamp(180px,48vh,520px)]` que en viewport alto y angosto podía exceder el ancho → scroll horizontal. Ahora capped por `min(48vh, calc(100vw - 4rem))`. Body con `overflow-x-hidden`

### ✅ Paso 6 — Pantalla "Acerca de" (parcialmente completado)
- `AboutModal.tsx` (portado de desktop) ya existía + cableado en SettingsView
- Instalado `@capacitor/browser@8.0.3` para abrir URLs en Custom Tab
- `shellAPI.openExternal` ahora delega a `Browser.open()` en vez de `window.open` (que no anda en WebView)
- Hardware back button cierra el modal
- **Pendiente:** las URLs siguen en `PLACEHOLDER` (Discord/Cafecito/Ko-fi). Cuando el usuario las tenga, simple find-replace.

### ✅ Paso 5 — WiFi Transfer (MVP completado, falta probar end-to-end)

**Desktop (`C:\Users\nacho\Documents\GitHub\MusicPlayer`):**
- ➕ `electron/wifi-share-handler.ts` — server HTTP nativo (sin Express, usa `node:http`)
- 3 endpoints con token: `GET /api/manifest`, `GET /api/track/:id`, `GET /api/artwork/:id`, `GET /api/playlist-cover/:id`
- Token random por sesión via `crypto.randomBytes(12).toString('base64url')`, bindea a `0.0.0.0:0` (kernel asigna puerto libre)
- Soporta HTTP Range para seek
- `qrcode` instalado para generar QR del payload `{v:1, host, port, token, name}`
- ➕ `src/features/settings/components/WifiShareModal.tsx` — UI con start/stop + QR + URL + token visible
- IPC handlers en `main.ts` + API expuesta en `preload.ts` como `window.wifiShareAPI`
- Server se detiene al `before-quit` y al click explícito de "Detener" (NO al cerrar el modal — eso fue un bug que arreglamos: cerrar modal = mantener corriendo)

**Mobile:**
- Instalado `html5-qrcode` (usa `getUserMedia` del WebView, sin plugin nativo pesado)
- Permisos: `CAMERA` + `ACCESS_NETWORK_STATE` + `usesCleartextTraffic="true"` en manifest, `allowMixedContent: true` en `capacitor.config.ts` (server LAN es HTTP, WebView es HTTPS)
- ➕ `src/features/wifi-import/types.ts`, `hooks/useWifiImport.ts`, `components/QrScanner.tsx`, `components/WifiImportModal.tsx`
- Flow multi-stage: scan → connecting → select → transferring → done
- Selección con checkboxes (tracks + playlists separados), buscador en pistas (filtra por título/artista/álbum, sin tildes, case-insensitive), toggle "Todas/Ninguna" por sección con scope al filtro activo
- Auto-tildar pistas cuando se tilda una playlist; safety net en el hook que expande playlist trackIds aunque el user las haya destildado
- Dedup por ID: pistas/playlists con el mismo `id` que ya están localmente se saltean
- Cover de playlist se descarga si el manifest dice `hasCover: true`
- Fallback de test: "Pegar código manualmente (test)" porque el AVD no tiene cámara real (virtualscene no lee QRs)
- Card en Settings → "Importar desde PC"

### ✅ Playlist detail mobile-first redesign (completado)
- Layout estilo Spotify mobile: cover centrada arriba (`min(48vw, 240px)`), título grande, meta "N pistas · X horas y Y minutos" (sin "Lista de reproducción" ni "Pública" ni año), fila de 3 botones (edit · play grande circular · delete)
- Cover ahora es tappable y abre file picker nativo Android para cambiarla (se copia al sandbox como `playlist-covers/<id>-<ts>.<ext>`)
- Delete pregunta antes de borrar (`window.confirm` con `t.deletePlaylistConfirm`)

### ✅ Fixes críticos de lógica — `2026-06-11` (a verificar en device)
Encontrados en una auditoría de código. Ambos requieren prueba en dispositivo real.

- **Auto-avance de la cola roto en Android (race de eventos Media3).**
  `src/providers/local/native-audio-provider.ts`
  Al terminar una pista, Media3 emite `stateChanged("ended")` **y** `playingChanged(false)`, y el orden de despacho no está garantizado. El handler de `playingChanged` ponía `playbackState = "paused"`, pisando el `"idle"` que setea `"ended"`. El orquestador detecta fin de pista con `currentTrack===null && playbackState==="idle"` (`player-orchestrator.ts:143`), así que con `"paused"` **nunca auto-avanzaba**: la canción se quedaba frenada con la barra vacía. Fix: el handler de `playingChanged` ahora ignora el evento si el estado ya es terminal (`"idle"`/`"error"`). Robusto ante cualquier orden de los dos eventos.

- **"Eliminar" no borraba el archivo en mobile (fuga de almacenamiento).**
  `src/features/library/hooks/useLocalLibrary.ts` + `src/features/settings/storage-utils.ts`
  `removeTrackFromLibrary` borraba de disco con `window.libraryAPI.deleteFile`, que en mobile es un no-op stub → el `.mp3` y el artwork quedaban huérfanos y "Eliminar" nunca liberaba espacio. Fix: nuevo helper `deleteTrackFiles(track)` en `storage-utils` que borra audio (`music/<id>.<ext>`) y artwork (`artwork/<id>.<ext>`) vía `@capacitor/filesystem`, derivando el basename tanto del `file://` (localPath) como de la URL `_capacitor_file_` (artworkUrl). El hook ahora ramifica: nativo → `deleteTrackFiles`; desktop → `window.libraryAPI.deleteFile`.

---

## ⏳ Pasos siguientes

### Paso 7 — Auto-updater
- Consulta a GitHub Releases API al startup
- Modal con changelog si hay versión nueva
- `@capacitor/browser` para abrir la URL del APK; Android maneja la instalación

### Paso 8 — Build y distribución
- Generar keystore para firma
- Configurar `signingConfig` en `build.gradle`
- `./gradlew bundleRelease` o `assembleRelease`
- Subir AAB/APK a GitHub Releases
- (Opcional) Habilitar Play Store internal track

### Pendientes menores
- Track rows de PlaylistDetailView todavía usan hover-only actions — mismo problema que solucionamos en LocalLibrarySection. Falta darle el mismo tratamiento (kebab menu)
- AmbientGlow muestra banding feo en AVD (radial-gradient con alpha bajo). Quedó la versión original con `filter: blur(100px)` que también banda. En dispositivos físicos puede que se vea OK. Si no, candidato a borrar del mobile

---

## Quirks técnicos a recordar

- **JDK 17 vs 21:** Capacitor 8 Android plugins exigen toolchain Java 21. El `JAVA_HOME` del usuario es 17 (correcto para el resto del dev). Para `./gradlew` desde CLI: `JAVA_HOME="C:/Program Files/Android/Android Studio/jbr" ./gradlew ...`. Desde Android Studio no hace falta (usa su JBR bundleado).
- **Safe-area-inset-top en AVD:** `env(safe-area-inset-top)` devuelve 0 en el Pixel 8 emulator. Para elementos en el borde superior, usar `max(32px, env(safe-area-inset-top, 0px))` como fallback.
- **URIs:**
  - `track.localPath` = `file:///data/user/0/com.lumen.mobile/files/music/...mp3` → usar para ExoPlayer / native plugins
  - `track.uri` = `https://localhost/_capacitor_file_/data/...` (vía `Capacitor.convertFileSrc`) → usar para `<audio>` / `<img>` / fetch desde JS
- **music-metadata** (v11+ moderno): `pic.data` es `Uint8Array` que puede ser una view parcial de un buffer compartido. Pasar `pic.data.buffer` al `Blob` incluye bytes basura (artwork corrupto). Hay que pasar `pic.data` directo. Además `pic.format` viene a veces como `"jpeg"` y a veces como `"image/jpeg"`; normalizar antes de usar como MIME.
- **React onClick + WebView Android:** algunos AVDs pierden `onClick` para elementos en el borde de la pantalla. Para botones críticos, agregar `onPointerUp` como fallback.
- **AVD RAM:** el Pixel_8 AVD default trae 2GB y la app cae por `lowmemorykiller` antes de cargar. Subir a 4096 en `~/.android/avd/Pixel_8.avd/config.ini` y cold-bootear.
- **AVD cámara virtualscene:** por default `hw.camera.back=virtualscene` (escena 3D del emulador) — inservible para escanear QRs reales. Cambiar a `webcam0` para usar la cámara de la PC, o testear en celu físico, o usar el atajo "Pegar código manualmente" del WifiImportModal.
- **`adb push` desde Git Bash en Windows:** MSYS traduce `/sdcard/...` a `C:/Program Files/Git/sdcard/...` y el push reporta éxito pero el archivo nunca llega al device. Usar `MSYS_NO_PATHCONV=1 adb push ... /sdcard/...` o `//sdcard/...` (doble slash).
- **`allowMixedContent`:** la WebView de Capacitor sirve la app desde `https://localhost` y bloquea fetches a `http://` por mixed content. Hay que setear `android.allowMixedContent: true` en `capacitor.config.ts` Y `android:usesCleartextTraffic="true"` en el `<application>` del manifest para que el WiFi import contra el server LAN funcione.
- **`adb shell ls` con paths absolutos:** mismo problema que el push — Git Bash traduce. Usar `'ls //sdcard//Download//'` (doble slash, comilla simple).
- **`MediaController.Builder().buildAsync()`** devuelve `ListenableFuture<MediaController>`. Comandos antes de que la conexión termine hay que encolarlos con `future.addListener(...)`. No es una API sync.

---

## V2 (futuro)

- Descarga directa de YouTube desde el celular via servidor en la nube (Railway/Render con yt-dlp)
- Posible soporte iOS
