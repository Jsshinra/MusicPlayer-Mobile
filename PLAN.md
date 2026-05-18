# Lumen Mobile — Plan de Desarrollo

## Qué es esto

Port de la app de escritorio Lumen (Electron) a Android como APK independiente usando Capacitor.
La app de PC sigue existiendo y es la herramienta principal de descarga y gestión.
La app mobile es el reproductor + receptor de biblioteca vía WiFi.

**Proyecto de escritorio:** `C:\Users\nacho\Documents\GitHub\MusicPlayer`
**Proyecto mobile:** `C:\Users\nacho\Documents\GitHub\MusicPlayer Mobile`

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| UI | React 19 + Tailwind CSS v4 (reutilizado del desktop) |
| Estado | Zustand 5 (adaptado a persistencia async) |
| Persistencia | `@capacitor/preferences` |
| Audio | Plugin nativo Capacitor (background + lock screen) |
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

## Feature Principal: WiFi Transfer

La PC actúa como servidor local. El celular se conecta por la misma red WiFi y descarga la biblioteca.

### Flujo
1. Usuario abre Lumen en la PC y activa **"Modo transferencia"**
2. La PC muestra un QR code con su IP local
3. Usuario escanea el QR desde la app mobile
4. **Desde la PC** se selecciona qué enviar (tracks individuales o playlists completas)
5. Los archivos y metadata viajan al sandbox del celular

### Qué viaja en cada transferencia
- Archivo `.mp3`
- Metadata del track (título, artista, álbum, duración)
- Artwork
- Si es playlist: estructura + cover + todos los tracks de la playlist

### UI en la PC (nuevo panel en Lumen desktop)
- Lista de toda la biblioteca con checkboxes
- Selección de playlists completas
- Indicador de qué tracks ya fueron transferidos al celular
- Botón "Enviar selección"
- Estado de conexión del celular

### UI en el celular
- Pantalla "Importar desde PC"
- Botón para escanear QR
- Barra de progreso de descarga
- La biblioteca importada queda disponible offline

---

## Pantalla "Acerca de"

Primera opción en Settings tanto en la app de PC como en mobile.

**Contenido:**
- Texto: por qué se hizo la app (en primera persona)
- Botón: Discord (link para feedback)
- Botón: Cafecito (donaciones — Argentina)
- Botón: Ko-fi (donaciones — internacional)

**PC:** se abre como modal sobre la pantalla de Settings
**Mobile:** navega a una nueva pantalla dentro de Settings

---

## Cambios en la App de PC (Lumen Desktop)

Además del port mobile, hay dos cosas nuevas que van en el desktop:

1. **Pantalla "Acerca de"** en Settings (modal)
2. **Panel de WiFi Transfer** — servidor Express interno + UI de selección + QR code

---

## Plan de Desarrollo

### Paso 1 — Scaffolding Capacitor
- Instalar Capacitor en el proyecto React
- Generar carpeta `/android`
- Configurar WebView y permisos básicos

### Paso 2 — Persistencia async
- Reemplazar `window.electronStore` por `@capacitor/preferences`
- Adaptar inicialización de Zustand a async
- Migrar `rehydrateTrack()` a rutas de sandbox Android

### Paso 3 — Motor de audio nativo
- Integrar plugin de audio con soporte background
- Adaptar `player-orchestrator.ts` a la nueva API
- Controles en lock screen

### Paso 4 — WiFi Transfer (PC + Mobile)
- **PC:** servidor Express interno, endpoints de biblioteca y archivos, QR code
- **Mobile:** lector de QR, pantalla de selección, descarga via `@capacitor/filesystem`

### Paso 5 — Pantalla "Acerca de" (PC + Mobile)
- Modal en desktop dentro de Settings
- Pantalla en mobile dentro de Settings
- Discord, Cafecito, Ko-fi

### Paso 6 — Auto-updater
- Consulta a GitHub Releases API al iniciar
- Modal con changelog si hay versión nueva
- Abre browser con URL del APK para que Android gestione la actualización

### Paso 7 — Build y distribución
- Build del frontend React
- Sync con Android Studio
- Compilar APK firmado
- Subir a GitHub Releases

---

## V2 (futuro)

- Descarga directa de YouTube desde el celular via servidor en la nube (Railway/Render con yt-dlp)
- Posible soporte iOS
