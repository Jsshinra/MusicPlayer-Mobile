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

## Estado actual — `2026-05-18`

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

## 🚧 Próximo paso — Paso 3b: Audio en background + lock screen

**Por qué:** ExoPlayer solo corre en memoria del proceso de la activity. Cuando Android suspende la app, la música se corta a los pocos segundos. Hay que mover el `ExoPlayer` adentro de un `MediaSessionService` que corra como **foreground service**.

**Qué hay que hacer concretamente:**

1. **Crear `LumenMediaSessionService.java`**
   - Extends `MediaSessionService` (de `androidx.media3.session`)
   - Aloja el `ExoPlayer` (mover de `AudioEnginePlugin` al service)
   - Expone una `MediaSession` que el sistema usa para controles
   - `onTaskRemoved` → stopSelf cuando el usuario cierra la app del recents

2. **Declarar el service en `AndroidManifest.xml`**
   ```xml
   <service
       android:name=".LumenMediaSessionService"
       android:foregroundServiceType="mediaPlayback"
       android:exported="true">
       <intent-filter>
           <action android:name="androidx.media3.session.MediaSessionService" />
       </intent-filter>
   </service>
   ```

3. **Refactorizar `AudioEnginePlugin.java`**
   - Ya no instancia `ExoPlayer` directo; bindea al service con un `MediaController` (cliente liviano)
   - Los métodos (`loadTrack`, `play`, `pause`, etc.) pasan por el controller → llegan al `ExoPlayer` del service
   - El controller también se suscribe a eventos para emitirlos al JS

4. **`PlayerNotificationManager`** (opcional pero recomendado)
   - Notificación persistente con artwork + título + play/pause/next/prev
   - `MediaSessionService` lo provee casi gratis vía `MediaNotification.Provider`

5. **Verificar en el celu:**
   - Reproducir, bloquear pantalla → debe seguir sonando
   - Aparecen controles en lock screen + barra de notificaciones
   - Tap en pause/next desde lock screen funciona
   - Sacar la app del recents → la música se corta y se libera el service

**Archivos que vamos a tocar:**
- ➕ `android/app/src/main/java/com/lumen/mobile/LumenMediaSessionService.java`
- 📝 `android/app/src/main/java/com/lumen/mobile/AudioEnginePlugin.java` (refactor — bindear al service)
- 📝 `android/app/src/main/AndroidManifest.xml` (declarar `<service>`)

---

## ⏳ Pasos siguientes (después de background audio)

### Paso 4 — Persistencia async (`@capacitor/preferences`)
- Reemplazar el `localStorage` stub de `electronStore` por el plugin Capacitor
- Adaptar Zustand a `createJSONStorage` async
- Migrar el `merge()` para que rehidrate funcione con `Capacitor.convertFileSrc` (ya pasa por `localPathToFileUri`)
- **Por qué:** localStorage en WebView Android puede ser limpiado por Android cuando el sistema necesita memoria. Preferences es persistencia real.

### Paso 5 — WiFi Transfer (PC + Mobile)
La feature principal. Requiere trabajo en los dos proyectos:

**Lado PC (Lumen Electron):**
- Servidor Express interno
- Endpoint para listar la biblioteca (con metadata + checksums)
- Endpoint para descargar un track + su artwork
- Endpoint para playlists completas (estructura + tracks)
- Panel UI con checkboxes + QR code con la IP local
- Indicador de tracks ya transferidos al celular

**Lado mobile:**
- Pantalla "Importar desde PC" (probablemente en Settings o como FAB alternativo)
- Lector de QR (probablemente `@capacitor-mlkit/barcode-scanning` o similar)
- Cliente HTTP que descarga al sandbox via `@capacitor/filesystem`
- Barra de progreso
- Detección de duplicados (no re-descargar lo que ya está)

### Paso 6 — Pantalla "Acerca de"
- Modal desktop dentro de Settings
- Pantalla mobile dentro de Settings
- Contenido: texto en primera persona + Discord + Cafecito + Ko-fi
- **Nota:** ya existe `AboutModal.tsx` portado del desktop. Falta rebrandearlo para mobile (Cafecito + Ko-fi).

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

---

## Quirks técnicos a recordar

- **JDK 17 vs 21:** Capacitor 8 Android plugins exigen toolchain Java 21. El `JAVA_HOME` del usuario es 17 (correcto para el resto del dev). Para `./gradlew` desde CLI: `JAVA_HOME="C:/Program Files/Android/Android Studio/jbr" ./gradlew ...`. Desde Android Studio no hace falta (usa su JBR bundleado).
- **Safe-area-inset-top en AVD:** `env(safe-area-inset-top)` devuelve 0 en el Pixel 8 emulator. Para elementos en el borde superior, usar `max(32px, env(safe-area-inset-top, 0px))` como fallback.
- **URIs:**
  - `track.localPath` = `file:///data/user/0/com.lumen.mobile/files/music/...mp3` → usar para ExoPlayer / native plugins
  - `track.uri` = `https://localhost/_capacitor_file_/data/...` (vía `Capacitor.convertFileSrc`) → usar para `<audio>` / `<img>` / fetch desde JS
- **`music-metadata-browser`** dispara `ReferenceError: Buffer is not defined` en WebView Android. El parsing funciona igual (try/catch), pero falla silenciosamente — el título queda como el nombre del archivo. Hay que migrarlo eventualmente (probablemente a `music-metadata` con polyfill de Buffer, o a un parser nativo).
- **React onClick + WebView Android:** algunos AVDs pierden `onClick` para elementos en el borde de la pantalla. Para botones críticos, agregar `onPointerUp` como fallback.

---

## V2 (futuro)

- Descarga directa de YouTube desde el celular via servidor en la nube (Railway/Render con yt-dlp)
- Posible soporte iOS
