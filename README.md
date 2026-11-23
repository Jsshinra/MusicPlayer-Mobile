# Lumen Mobile

Reproductor de música local para Android. Es la versión móvil de **Lumen**, un reproductor de escritorio (Electron), y se sincroniza con él por WiFi: sin nube, sin cuentas y sin streaming.

> La PC es donde se descarga y organiza la música; el celular la recibe por WiFi y la reproduce offline.

## Características

- **Biblioteca local**: importá MP3 y otros formatos de audio desde el celular. Lee título, artista, álbum y carátula de los tags ID3.
- **Reproducción nativa en segundo plano**: motor de audio propio sobre **Media3 / ExoPlayer** con `MediaSession`, así que sigue sonando con la pantalla bloqueada y se controla desde la notificación y el lock screen.
- **Playlists**: crear, editar, cambiar la portada y reproducir. Cola, shuffle y repeat (off / una / todas).
- **Favoritos y recientes**.
- **Importar desde la PC por WiFi**: escaneás un QR que muestra Lumen Desktop y elegís qué canciones y playlists traer.
- **Sync en ambos sentidos con la PC**: favoritos, playlists y reproducciones se combinan en los dos dispositivos (gana el cambio más reciente, y las playlists borradas no vuelven a aparecer).
- **Español e inglés**.

## Cómo funciona el sync WiFi

```
 Lumen Desktop                                Lumen Mobile
 ─────────────                                ────────────
 Configuración → Compartir por WiFi
   └─ servidor HTTP en la red local  ── QR ──▶  escanea host, puerto y token
                                                   │
      GET  /api/manifest   ◀───────────────────────┤  lista de canciones y playlists
      GET  /api/track/:id  ◀───────────────────────┤  descarga de audio (con Range)
      GET  /api/artwork/:id ◀──────────────────────┤  carátulas
      POST /api/sync       ◀───────────────────────┘  favoritos, playlists, reproducciones
```

- Los dos dispositivos tienen que estar **en la misma red WiFi**.
- Cada vez que el servidor arranca genera un **token aleatorio**, que viaja en el QR. Sin ese token no se puede hacer ninguna petición.
- El servidor del escritorio se apaga solo tras 10 minutos sin actividad.
- La conexión es HTTP plano dentro de la red local, así que conviene usarlo en redes de confianza (tu casa, no un WiFi público).

## Stack

| Capa | Tecnología |
|---|---|
| UI | React 19 + TypeScript + Tailwind CSS v4 |
| Build | Vite 8 |
| Contenedor nativo | Capacitor 8 (Android) |
| Estado | Zustand 5, persistido con `@capacitor/preferences` |
| Audio | Plugin nativo propio en Java (`AudioEnginePlugin` + `LumenMediaSessionService`, Media3 1.5) |
| Archivos | `@capacitor/filesystem` (sandbox privado de la app, sin permisos de almacenamiento) |
| Metadata | `music-metadata` v11 |
| QR | `html5-qrcode` |

## Estructura

```
src/
  app/              layout (BottomNav, AppLayout) y stores de Zustand
  core/player/      orquestador del reproductor (cola, autoplay, shuffle, repeat)
  providers/local/  proveedor de audio nativo (Android) y HTMLAudio (web)
  features/
    library/        biblioteca, importación de archivos, cola, recientes
    player/         barra del reproductor y pantalla "Reproduciendo"
    playlists/      vista, creación y edición de playlists
    wifi-import/    escaneo QR, importación y sync con la PC
    settings/       configuración, almacenamiento y "Acerca de"
  shared/           tipos, i18n, utilidades y puentes nativos
android/            proyecto Android (incluye el plugin de audio en Java)
```

## Desarrollo

### Requisitos

- Node.js 20+
- Android Studio (con un SDK de Android; la app apunta a API 36 y soporta desde API 24 / Android 7.0)
- JDK 21: Capacitor 8 lo exige. Android Studio ya trae uno (JBR), que es el más fácil de usar.

### Comandos

```bash
npm install

npm run dev           # UI en el navegador (el audio usa HTMLAudioElement, sin plugin nativo)
npm run cap:sync      # build web + copia al proyecto Android
npm run android:open  # abre el proyecto en Android Studio
npm run android:run   # build e instala en un dispositivo o emulador conectado
```

Para compilar con Gradle desde la terminal usando el JDK de Android Studio:

```bash
JAVA_HOME="C:/Program Files/Android/Android Studio/jbr" ./android/gradlew -p android assembleDebug
```

### Notas para el emulador

- **Memoria**: con 2 GB de RAM el emulador puede matar la app. Subila a 4 GB en la configuración del AVD.
- **Cámara**: la cámara por defecto del emulador (`virtualscene`) no sirve para leer QRs. Usá `webcam0`, un celular físico o la opción *"Pegar código manualmente"* del modal de importación.

## Permisos de Android

| Permiso | Para qué |
|---|---|
| `INTERNET`, `ACCESS_NETWORK_STATE` | Conectarse al servidor WiFi de la PC |
| `CAMERA` | Escanear el QR de emparejamiento |
| `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `WAKE_LOCK` | Seguir reproduciendo en segundo plano |
| `POST_NOTIFICATIONS` | Controles de reproducción en la notificación |

## Estado

Proyecto personal en desarrollo activo (v0.1). Pendiente: auto-actualizador desde GitHub Releases y builds firmadas para distribución.
