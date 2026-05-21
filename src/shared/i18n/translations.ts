export type Language = 'es' | 'en'

type Translations = {
  browse: string
  library: string
  queue: string
  recentlyPlayed: string
  buscador: string
  buscadorDescription: string
  buscadorSongs: string
  buscadorAlbums: string
  buscadorSongPlaceholder: string
  buscadorPlaylistPlaceholder: string
  buscadorAlbumPlaceholder: string
  buscadorSearchButton: string
  buscadorSearching: string
  buscadorNoResults: string
  buscadorDownloadAll: string
  buscadorNewSearch: string
  buscadorTracksLabel: (n: number) => string
  buscadorAddedOne: string
  buscadorAddedMany: (n: number) => string
  buscadorAddedPlaylist: (n: number, name: string) => string
  buscadorError: string
  youtubeDownloader: string
  spotifyDownloader: string
  playlists: string
  noPlaylistsYet: string
  settings: string
  addSongs: string
  songs: string
  artists: string
  albums: string
  titleColumn: string
  backToArtists: string
  backToAlbums: string
  unknownAlbum: string
  albumCount: (n: number) => string
  completeAlbum: string
  searchingAlbum: string
  albumNotFound: string
  allTracksOwned: string
  downloadMissing: (n: number) => string
  albumDownloading: (done: number, total: number) => string
  albumDownloadDone: (n: number) => string
  albumTracksOwned: (owned: number, total: number) => string
  noTracksImported: string
  noSongsYet: string
  addFirstSong: string
  dragDropHint: string
  searchPlaceholder: string
  clearSearch: string
  noResultsFor: string
  dropAudioHere: string
  unknownArtist: string
  removedFromLibrary: (title: string) => string
  addedToQueue: (title: string) => string
  addedToPlaylist: string
  alreadyInAllPlaylists: string
  trackCount: (n: number) => string
  artistCount: (n: number) => string
  songCount: (n: number) => string
  queueTitle: string
  noTracksInQueue: string
  queueEmpty: string
  playFromLibraryHint: string
  nowPlaying: string
  upNext: string
  alreadyPlayed: string
  tapToAddToEnd: string
  recentlyPlayedTitle: string
  nothingPlayedYet: string
  songsWillAppearHere: string
  clear: string
  playlist: string
  playAll: string
  deletePlaylist: string
  deletePlaylistConfirm: (name: string) => string
  noSongsInPlaylist: string
  playlistNotFound: string
  change: string
  newPlaylist: string
  nameLabel: string
  myPlaylistPlaceholder: string
  addSongsLabel: string
  selectedCount: (n: number) => string
  noSongsInLibraryYet: string
  searchSongs: string
  cancel: string
  create: string
  settingsTitle: string
  voiceSearch: string
  voiceSearchDescription: string
  triggerKey: string
  triggerKeyDescription: string
  microphone: string
  microphoneDescription: string
  allowMicrophone: string
  systemDefault: string
  recognitionLanguage: string
  recognitionLanguageDescription: string
  voiceModel: string
  voiceModelDescription: string
  commandReference: string
  discordRichPresence: string
  discordRichPresenceDescription: string
  personalization: string
  personalizationDescription: string
  accentColorLabel: string
  accentColorDescription: string
  backgroundColorLabel: string
  backgroundColorDescription: string
  dynamicVibeLabel: string
  dynamicVibeDescription: string
  vibeIntensityLabel: string
  density: string
  densityDescription: string
  normalDensity: string
  compactDensity: string
  showAlbumCovers: string
  showAlbumCoversDescription: string
  audioFocusLabel: string
  audioFocusDescription: string
  storageLabel: string
  storageDescription: string
  storageMusic: string
  storageArtwork: string
  storageCovers: string
  storageOrphansLabel: string
  storageOrphansHint: string
  storageCleanButton: string
  storageCleaningButton: string
  storageCleanResult: (n: number, bytes: string) => string
  storageNoOrphans: string
  crossfade: string
  crossfadeDescription: string
  musicFolder: string
  musicFolderDescription: string
  changeFolder: string
  resetFolder: string
  appLanguageLabel: string
  appLanguageDescription: string
  loadingVoiceModel: string
  firstTimeSetup: string
  listening: string
  secondsRemaining: (n: number) => string
  transcribing: string
  noCommandMatched: string
  clickToClose: string
  downloadingUpdate: string
  newVersionReady: string
  installAndRestart: string
  of: string
  queueCounter: (current: number, total: number) => string
  // Radio
  radio: string
  radioActive: string
  radioDownloads: string
  radioDownloadsTitle: string
  radioViewDownloadsTitle: string
  radioNewSession: string
  radioStop: string
  radioStopTitle: string
  radioSelectSeedHint: string
  radioSearchingLong: string
  radioSearchingShort: string
  radioNoLibrary: string
  radioDownloadingNext: string
  radioSeedLabel: string
  radioRemoveFromQueue: string
  radioDeleteTrack: string
  radioDownloadsEmpty: string
  radioBack: string
  radioDeleteAll: string
  radioDeleteAllTitle: string
  radioDeleteAllMessage: (n: number) => string
  radioDeleteAllConfirmButton: string
  radioSeedSearch: string
  radioChangeSeed: string
  radioChangeSeedTitle: string
  radioCreatePlaylist: string
  sortMostRecent: string
  sortOldest: string
  sortTitle: string
  sortArtist: string
  yesLabel: string
  noLabel: string
  // YoutubeDownloader
  ytDownloaderDescription: string
  ytSettingUpTools: string
  ytPlaylistNotice: string
  ytPlaylistNoticeBold: string
  ytPlaylistNoticeEnd: string
  ytPlaylistNamePlaceholder: string
  ytDownloading: string
  ytDownloadingTrack: (index: number | string, total: number) => string
  ytCancelButton: string
  ytDownloadButton: string
  ytDoneAddedOne: string
  ytDoneAddedMany: (n: number) => string
  ytDoneAddedPlaylist: (n: number, name: string) => string
  // Library album editing
  albumSaved: string
  setAlbum: string
  albumNamePlaceholder: string
  save: string
  ytDownloadAnother: string
  ytErrorTitle: string
  ytRetry: string
  ytSavingTo: string
  // About
  aboutTitle: string
  aboutDescription: string
  aboutBody: string
  aboutCommunityLabel: string
  aboutDiscord: string
  aboutDiscordBadge: string
  aboutCafecito: string
  aboutCrypto: string
  aboutCryptoNetwork: string
  aboutCryptoCopied: string
  aboutSupportBadge: string
}

const es: Translations = {
  browse: 'Explorar',
  library: 'Biblioteca',
  queue: 'Cola',
  recentlyPlayed: 'Reproducidas recientemente',
  buscador: 'Buscador',
  buscadorDescription: 'Busca canciones, playlists o álbumes de YouTube y descárgalos como MP3.',
  buscadorSongs: 'Canciones',
  buscadorAlbums: 'Álbumes',
  buscadorSongPlaceholder: 'Artista, título de canción…',
  buscadorPlaylistPlaceholder: 'Nombre de playlist…',
  buscadorAlbumPlaceholder: 'Nombre de álbum, artista…',
  buscadorSearchButton: 'Buscar',
  buscadorSearching: 'Buscando…',
  buscadorNoResults: 'No se encontraron resultados.',
  buscadorDownloadAll: 'Todo',
  buscadorNewSearch: 'Nueva búsqueda',
  buscadorTracksLabel: (n) => `${n} ${n === 1 ? 'canción' : 'canciones'}`,
  buscadorAddedOne: 'Añadido a la biblioteca',
  buscadorAddedMany: (n) => `${n} canciones añadidas a la biblioteca`,
  buscadorAddedPlaylist: (n, name) => `${n} pistas añadidas · playlist "${name}" creada`,
  buscadorError: 'Error al descargar',
  youtubeDownloader: 'Descargar de YouTube',
  spotifyDownloader: 'Descargar de Spotify',
  playlists: 'Playlists',
  noPlaylistsYet: 'Aún no hay playlists',
  settings: 'Configuración',
  addSongs: 'Agregar canciones',
  songs: 'Canciones',
  artists: 'Artistas',
  albums: 'Álbumes',
  titleColumn: 'Título',
  backToArtists: 'Artistas',
  backToAlbums: 'Álbumes',
  unknownAlbum: 'Álbum desconocido',
  albumCount: (n) => `${n} ${n === 1 ? 'álbum' : 'álbumes'}`,
  completeAlbum: 'Completar álbum',
  searchingAlbum: 'Buscando álbum en YouTube…',
  albumNotFound: 'No se encontró el álbum en YouTube',
  allTracksOwned: 'Ya tenés todas las canciones',
  downloadMissing: (n) => `Descargar ${n} ${n === 1 ? 'faltante' : 'faltantes'}`,
  albumDownloading: (done, total) => `Descargando… ${done} de ${total}`,
  albumDownloadDone: (n) => `${n} ${n === 1 ? 'canción descargada' : 'canciones descargadas'}`,
  albumTracksOwned: (owned, total) => `${owned} de ${total} en tu biblioteca`,
  noTracksImported: 'Sin canciones importadas',
  noSongsYet: 'Aún no hay canciones',
  addFirstSong: 'Agrega tu primera canción',
  dragDropHint: 'o arrastra archivos aquí',
  searchPlaceholder: 'Buscar por título o artista…',
  clearSearch: 'Limpiar búsqueda',
  noResultsFor: 'Sin resultados para',
  dropAudioHere: 'Suelta archivos de audio aquí',
  unknownArtist: 'Artista desconocido',
  removedFromLibrary: (title) => `"${title}" eliminado de la biblioteca`,
  addedToQueue: (title) => `"${title}" añadido a la cola`,
  addedToPlaylist: 'Agregado a',
  alreadyInAllPlaylists: 'Ya está en todas las playlists',
  trackCount: (n) => `${n} ${n === 1 ? 'pista' : 'pistas'}`,
  artistCount: (n) => `${n} ${n === 1 ? 'artista' : 'artistas'}`,
  songCount: (n) => `${n} ${n === 1 ? 'canción' : 'canciones'}`,
  queueTitle: 'Cola',
  noTracksInQueue: 'Sin pistas en cola',
  queueEmpty: 'La cola está vacía',
  playFromLibraryHint: 'Reproduce una canción de tu biblioteca para empezar',
  nowPlaying: 'Reproduciendo ahora',
  upNext: 'A continuación',
  alreadyPlayed: 'Ya reproducidas',
  tapToAddToEnd: 'Toca una pista para añadirla al final de la cola',
  recentlyPlayedTitle: 'Reproducidas recientemente',
  nothingPlayedYet: 'Nada reproducido aún',
  songsWillAppearHere: 'Las canciones que reproduzcas aparecerán aquí',
  clear: 'Limpiar',
  playlist: 'Playlist',
  playAll: 'Reproducir todo',
  deletePlaylist: 'Eliminar playlist',
  deletePlaylistConfirm: (name) => `¿Eliminar "${name}"? Esta acción no se puede deshacer.`,
  noSongsInPlaylist: 'No hay canciones en esta playlist',
  playlistNotFound: 'Playlist no encontrada',
  change: 'Cambiar',
  newPlaylist: 'Nueva playlist',
  nameLabel: 'Nombre',
  myPlaylistPlaceholder: 'Mi playlist',
  addSongsLabel: 'Agregar canciones',
  selectedCount: (n) => `${n} seleccionada${n === 1 ? '' : 's'}`,
  noSongsInLibraryYet: 'Aún no hay canciones en la biblioteca',
  searchSongs: 'Buscar canciones...',
  cancel: 'Cancelar',
  create: 'Crear',
  settingsTitle: 'Configuración',
  voiceSearch: 'Búsqueda por voz',
  voiceSearchDescription: 'Presiona una tecla para escuchar. Di una canción o comando.',
  triggerKey: 'Tecla de activación',
  triggerKeyDescription: 'Tecla que activa la búsqueda por voz',
  microphone: 'Micrófono',
  microphoneDescription: 'Dispositivo de entrada para el reconocimiento de voz',
  allowMicrophone: 'Permitir micrófono',
  systemDefault: 'Predeterminado del sistema',
  recognitionLanguage: 'Idioma de reconocimiento',
  recognitionLanguageDescription: 'Idioma utilizado para el reconocimiento de voz',
  voiceModel: 'Modelo de voz',
  voiceModelDescription: 'Whisper Base · ~74 MB · sin conexión · descarga en primer uso',
  commandReference: 'Referencia de comandos',
  discordRichPresence: 'Discord Rich Presence',
  discordRichPresenceDescription: 'Muestra la canción que estás escuchando como actividad en Discord',
  personalization: 'Personalización',
  personalizationDescription: 'Color de acento y densidad de la interfaz',
  accentColorLabel: 'Color de acento',
  accentColorDescription: 'Afecta la barra de progreso y los indicadores activos',
  backgroundColorLabel: 'Color de fondo',
  backgroundColorDescription: 'Cambia el color base de la interfaz',
  dynamicVibeLabel: 'Vibe dinámico',
  dynamicVibeDescription: 'El fondo cambia de color según el artwork de la canción actual',
  vibeIntensityLabel: 'Intensidad del fondo',
  density: 'Densidad',
  densityDescription: 'Espaciado entre canciones en la biblioteca',
  normalDensity: 'Normal',
  compactDensity: 'Compacto',
  showAlbumCovers: 'Portadas de álbum',
  showAlbumCoversDescription: 'Muestra las portadas en la biblioteca y en la radio',
  audioFocusLabel: 'Pausar con otras apps',
  audioFocusDescription: 'Cuando entra una llamada o suena otra app, la música pausa o baja el volumen.',
  storageLabel: 'Almacenamiento',
  storageDescription: 'Qué está ocupando espacio en este celular',
  storageMusic: 'Música',
  storageArtwork: 'Portadas',
  storageCovers: 'Portadas de playlist',
  storageOrphansLabel: 'Archivos huérfanos',
  storageOrphansHint: 'Archivos que ya no pertenecen a ninguna pista o playlist',
  storageCleanButton: 'Limpiar huérfanos',
  storageCleaningButton: 'Limpiando…',
  storageCleanResult: (n, bytes) => `${n} archivos eliminados · ${bytes} liberados`,
  storageNoOrphans: 'Nada que limpiar',
  crossfade: 'Crossfade',
  crossfadeDescription: 'Transición suave entre canciones',
  musicFolder: 'Carpeta de música',
  musicFolderDescription: 'Carpeta donde se guardan las canciones importadas y descargadas',
  changeFolder: 'Cambiar carpeta',
  resetFolder: 'Restablecer',
  appLanguageLabel: 'Idioma',
  appLanguageDescription: 'Idioma de la interfaz',
  loadingVoiceModel: 'Cargando modelo de voz…',
  firstTimeSetup: 'Primera vez — descarga de ~74 MB',
  listening: 'Escuchando…',
  secondsRemaining: (n) => `${n}s restantes`,
  transcribing: 'Transcribiendo…',
  noCommandMatched: 'Comando no reconocido',
  clickToClose: 'Haz clic en cualquier lugar para cerrar',
  downloadingUpdate: 'Descargando actualización...',
  newVersionReady: 'Nueva versión lista para instalar',
  installAndRestart: 'Instalar y reiniciar',
  of: 'de',
  queueCounter: (current, total) => `${current} de ${total}`,
  radio: 'Radio',
  radioActive: 'Activa',
  radioDownloads: 'Descargas',
  radioDownloadsTitle: 'Descargas de la radio',
  radioViewDownloadsTitle: 'Ver descargas de la radio',
  radioNewSession: 'Nueva sesión',
  radioStop: 'Detener',
  radioStopTitle: 'Detener radio',
  radioSelectSeedHint: 'Selecciona una canción para iniciar la radio',
  radioSearchingLong: 'Buscando canciones similares en YouTube…',
  radioSearchingShort: 'Buscando canciones similares…',
  radioNoLibrary: 'No hay canciones en la biblioteca.',
  radioDownloadingNext: 'Descargando próxima canción…',
  radioSeedLabel: 'seed',
  radioRemoveFromQueue: 'Quitar de la cola de la radio',
  radioDeleteTrack: 'Eliminar canción',
  radioDownloadsEmpty: 'Aún no hay canciones descargadas por la radio.',
  radioBack: 'Radio',
  radioDeleteAll: 'Borrar todas',
  radioDeleteAllTitle: 'Borrar todas las descargas de la radio',
  radioDeleteAllMessage: (n) =>
    `Se eliminarán ${n} ${n === 1 ? 'canción' : 'canciones'} de tu biblioteca y sus archivos del disco. Esta acción no se puede deshacer.`,
  radioDeleteAllConfirmButton: 'Sí, borrar todas',
  radioSeedSearch: 'Buscar canción…',
  radioChangeSeed: 'Cambiar seed',
  radioChangeSeedTitle: 'Elegir nueva canción seed',
  radioCreatePlaylist: 'Crear playlist',
  sortMostRecent: 'Más recientes',
  sortOldest: 'Más antiguas',
  sortTitle: 'Título',
  sortArtist: 'Artista',
  yesLabel: 'Sí',
  noLabel: 'No',
  ytDownloaderDescription: 'Pega un link de YouTube para descargar como MP3.',
  ytSettingUpTools: 'Configurando herramientas…',
  ytPlaylistNotice: 'Este parece un link de playlist — ',
  ytPlaylistNoticeBold: 'todas las pistas serán descargadas',
  ytPlaylistNoticeEnd: ' y agrupadas en una playlist.',
  ytPlaylistNamePlaceholder: 'Nombre de la playlist (opcional)',
  ytDownloading: 'Descargando…',
  ytDownloadingTrack: (index, total) => `Descargando pista ${index} de ${total}…`,
  ytCancelButton: 'Cancelar',
  ytDownloadButton: 'Descargar',
  ytDoneAddedOne: 'Añadido a la biblioteca',
  ytDoneAddedMany: (n) => `${n} canciones añadidas a la biblioteca`,
  ytDoneAddedPlaylist: (n, name) => `${n} pistas añadidas · playlist "${name}" creada`,
  albumSaved: 'Álbum guardado',
  setAlbum: 'Cambiar álbum',
  albumNamePlaceholder: 'Nombre del álbum',
  save: 'Guardar',
  ytDownloadAnother: 'Descargar otra',
  ytErrorTitle: 'Error al descargar',
  ytRetry: 'Intentar de nuevo',
  ytSavingTo: 'Guardando en:',
  aboutTitle: 'Acerca de',
  aboutDescription: 'Información sobre Lumen',
  aboutBody: '¡Hola! Soy Shinra, hago apps y cualquier apoyo significa mucho 👾\n\nAhora mismo estoy con Lumen — una biblioteca de música local para PC (¡y pronto mobile!) donde podés descargar música directo desde la app, con buscador y recomendaciones propias.\n\nSi te gusta lo que hago, un cafecito ayuda un montón. ¡Gracias por estar acá!',
  aboutCommunityLabel: 'Comunidad & apoyo',
  aboutDiscord: 'Discord',
  aboutDiscordBadge: 'Para feedback',
  aboutCafecito: 'Cafecito',
  aboutCrypto: 'USDT',
  aboutCryptoNetwork: 'TRC-20',
  aboutCryptoCopied: 'Dirección copiada',
  aboutSupportBadge: 'Para apoyar la app',
}

const en: Translations = {
  browse: 'Browse',
  library: 'Library',
  queue: 'Queue',
  recentlyPlayed: 'Recently played',
  buscador: 'Search',
  buscadorDescription: 'Search YouTube for songs, playlists or albums and download as MP3.',
  buscadorSongs: 'Songs',
  buscadorAlbums: 'Albums',
  buscadorSongPlaceholder: 'Artist, song title…',
  buscadorPlaylistPlaceholder: 'Playlist name…',
  buscadorAlbumPlaceholder: 'Album name, artist…',
  buscadorSearchButton: 'Search',
  buscadorSearching: 'Searching…',
  buscadorNoResults: 'No results found.',
  buscadorDownloadAll: 'All',
  buscadorNewSearch: 'New search',
  buscadorTracksLabel: (n) => `${n} ${n === 1 ? 'song' : 'songs'}`,
  buscadorAddedOne: 'Added to library',
  buscadorAddedMany: (n) => `${n} songs added to library`,
  buscadorAddedPlaylist: (n, name) => `${n} tracks added · playlist "${name}" created`,
  buscadorError: 'Download failed',
  youtubeDownloader: 'YouTube Downloader',
  spotifyDownloader: 'Spotify Downloader',
  playlists: 'Playlists',
  noPlaylistsYet: 'No playlists yet',
  settings: 'Settings',
  addSongs: 'Add songs',
  songs: 'Songs',
  artists: 'Artists',
  albums: 'Albums',
  titleColumn: 'Title',
  backToArtists: 'Artists',
  backToAlbums: 'Albums',
  unknownAlbum: 'Unknown album',
  albumCount: (n) => `${n} album${n === 1 ? '' : 's'}`,
  completeAlbum: 'Complete album',
  searchingAlbum: 'Searching album on YouTube…',
  albumNotFound: 'Album not found on YouTube',
  allTracksOwned: 'You already have all tracks',
  downloadMissing: (n) => `Download ${n} missing`,
  albumDownloading: (done, total) => `Downloading… ${done} of ${total}`,
  albumDownloadDone: (n) => `${n} ${n === 1 ? 'song' : 'songs'} downloaded`,
  albumTracksOwned: (owned, total) => `${owned} of ${total} in your library`,
  noTracksImported: 'No tracks imported',
  noSongsYet: 'No songs imported yet',
  addFirstSong: 'Add your first song',
  dragDropHint: 'or drag & drop files here',
  searchPlaceholder: 'Search by title or artist…',
  clearSearch: 'Clear search',
  noResultsFor: 'No results for',
  dropAudioHere: 'Drop audio files here',
  unknownArtist: 'Unknown artist',
  removedFromLibrary: (title) => `"${title}" removed from library`,
  addedToQueue: (title) => `"${title}" added to queue`,
  addedToPlaylist: 'Added to',
  alreadyInAllPlaylists: 'Already in all playlists',
  trackCount: (n) => `${n} track${n === 1 ? '' : 's'}`,
  artistCount: (n) => `${n} artist${n === 1 ? '' : 's'}`,
  songCount: (n) => `${n} song${n === 1 ? '' : 's'}`,
  queueTitle: 'Queue',
  noTracksInQueue: 'No tracks in queue',
  queueEmpty: 'Queue is empty',
  playFromLibraryHint: 'Play a song from your library to start',
  nowPlaying: 'Now playing',
  upNext: 'Up next',
  alreadyPlayed: 'Already played',
  tapToAddToEnd: 'Tap a track to add it to the end of the queue',
  recentlyPlayedTitle: 'Recently played',
  nothingPlayedYet: 'Nothing played yet',
  songsWillAppearHere: 'Songs you play will appear here',
  clear: 'Clear',
  playlist: 'Playlist',
  playAll: 'Play all',
  deletePlaylist: 'Delete playlist',
  deletePlaylistConfirm: (name) => `Delete "${name}"? This action cannot be undone.`,
  noSongsInPlaylist: 'No songs in this playlist',
  playlistNotFound: 'Playlist not found',
  change: 'Change',
  newPlaylist: 'New playlist',
  nameLabel: 'Name',
  myPlaylistPlaceholder: 'My playlist',
  addSongsLabel: 'Add songs',
  selectedCount: (n) => `${n} selected`,
  noSongsInLibraryYet: 'No songs in library yet',
  searchSongs: 'Search songs...',
  cancel: 'Cancel',
  create: 'Create',
  settingsTitle: 'Settings',
  voiceSearch: 'Voice search',
  voiceSearchDescription: 'Press a key to start listening. Say a song or command.',
  triggerKey: 'Trigger key',
  triggerKeyDescription: 'Key that activates voice search',
  microphone: 'Microphone',
  microphoneDescription: 'Input device for voice recognition',
  allowMicrophone: 'Allow microphone',
  systemDefault: 'System default',
  recognitionLanguage: 'Recognition language',
  recognitionLanguageDescription: 'Language used for speech recognition',
  voiceModel: 'Voice model',
  voiceModelDescription: 'Whisper Base · ~74 MB · offline · downloaded on first use',
  commandReference: 'Command reference',
  discordRichPresence: 'Discord Rich Presence',
  discordRichPresenceDescription: 'Shows the song you\'re listening to as an activity on Discord',
  personalization: 'Personalization',
  personalizationDescription: 'Accent color and interface density',
  accentColorLabel: 'Accent color',
  accentColorDescription: 'Affects the progress bar and active indicators',
  backgroundColorLabel: 'Background color',
  backgroundColorDescription: 'Changes the base color of the interface',
  dynamicVibeLabel: 'Dynamic vibe',
  dynamicVibeDescription: 'Background glows change color based on the current track artwork',
  vibeIntensityLabel: 'Glow intensity',
  density: 'Density',
  densityDescription: 'Spacing between songs in the library',
  normalDensity: 'Normal',
  compactDensity: 'Compact',
  showAlbumCovers: 'Album covers',
  showAlbumCoversDescription: 'Show album artwork in the library and radio',
  audioFocusLabel: 'Yield to other apps',
  audioFocusDescription: 'When a call or another app starts playing, your music pauses or ducks.',
  storageLabel: 'Storage',
  storageDescription: "What's using space on this phone",
  storageMusic: 'Music',
  storageArtwork: 'Artwork',
  storageCovers: 'Playlist covers',
  storageOrphansLabel: 'Orphan files',
  storageOrphansHint: "Files that no longer belong to any track or playlist",
  storageCleanButton: 'Clean orphans',
  storageCleaningButton: 'Cleaning…',
  storageCleanResult: (n, bytes) => `${n} files deleted · ${bytes} freed`,
  storageNoOrphans: 'Nothing to clean',
  crossfade: 'Crossfade',
  crossfadeDescription: 'Smooth transition between songs',
  musicFolder: 'Music folder',
  musicFolderDescription: 'Folder where imported and downloaded songs are saved',
  changeFolder: 'Change folder',
  resetFolder: 'Reset',
  appLanguageLabel: 'Language',
  appLanguageDescription: 'Interface language',
  loadingVoiceModel: 'Loading voice model…',
  firstTimeSetup: 'First-time setup — ~74 MB download',
  listening: 'Listening…',
  secondsRemaining: (n) => `${n}s remaining`,
  transcribing: 'Transcribing…',
  noCommandMatched: 'No command matched',
  clickToClose: 'Click anywhere to close',
  downloadingUpdate: 'Downloading update...',
  newVersionReady: 'New version ready to install',
  installAndRestart: 'Install and restart',
  of: 'of',
  queueCounter: (current, total) => `${current} of ${total}`,
  radio: 'Radio',
  radioActive: 'Active',
  radioDownloads: 'Downloads',
  radioDownloadsTitle: 'Radio downloads',
  radioViewDownloadsTitle: 'View radio downloads',
  radioNewSession: 'New session',
  radioStop: 'Stop',
  radioStopTitle: 'Stop radio',
  radioSelectSeedHint: 'Pick a song to start the radio',
  radioSearchingLong: 'Looking for similar songs on YouTube…',
  radioSearchingShort: 'Looking for similar songs…',
  radioNoLibrary: 'No songs in library.',
  radioDownloadingNext: 'Downloading next song…',
  radioSeedLabel: 'seed',
  radioRemoveFromQueue: 'Remove from radio queue',
  radioDeleteTrack: 'Delete song',
  radioDownloadsEmpty: 'No radio downloads yet.',
  radioBack: 'Radio',
  radioDeleteAll: 'Delete all',
  radioDeleteAllTitle: 'Delete all radio downloads',
  radioDeleteAllMessage: (n) =>
    `${n} ${n === 1 ? 'song' : 'songs'} will be removed from your library and their files deleted from disk. This action cannot be undone.`,
  radioDeleteAllConfirmButton: 'Yes, delete all',
  radioSeedSearch: 'Search song…',
  radioChangeSeed: 'Change seed',
  radioChangeSeedTitle: 'Pick a new seed song',
  radioCreatePlaylist: 'Create playlist',
  sortMostRecent: 'Most recent',
  sortOldest: 'Oldest',
  sortTitle: 'Title',
  sortArtist: 'Artist',
  yesLabel: 'Yes',
  noLabel: 'No',
  ytDownloaderDescription: 'Paste a YouTube link to download as MP3.',
  ytSettingUpTools: 'Setting up tools…',
  ytPlaylistNotice: 'This looks like a playlist link — ',
  ytPlaylistNoticeBold: 'all tracks will be downloaded',
  ytPlaylistNoticeEnd: ' and grouped into a playlist.',
  ytPlaylistNamePlaceholder: 'Playlist name (optional)',
  ytDownloading: 'Downloading…',
  ytDownloadingTrack: (index, total) => `Downloading track ${index} of ${total}…`,
  ytCancelButton: 'Cancel',
  ytDownloadButton: 'Download',
  ytDoneAddedOne: 'Added to library',
  ytDoneAddedMany: (n) => `${n} songs added to library`,
  albumSaved: 'Album saved',
  setAlbum: 'Set album',
  albumNamePlaceholder: 'Album name',
  save: 'Save',
  ytDoneAddedPlaylist: (n, name) => `${n} tracks added · playlist "${name}" created`,
  ytDownloadAnother: 'Download another',
  ytErrorTitle: 'Download failed',
  ytRetry: 'Try again',
  ytSavingTo: 'Saving to:',
  aboutTitle: 'About',
  aboutDescription: 'Information about Lumen',
  aboutBody: "Hey! I'm Shinra, I build apps and any support means a lot 👾\n\nRight now I'm working on Lumen — a local music library for PC (and mobile soon!) where you can download music directly from the app, with its own search and recommendations.\n\nIf you enjoy what I make, a coffee goes a long way. Thanks for being here!",
  aboutCommunityLabel: 'Community & support',
  aboutDiscord: 'Discord',
  aboutDiscordBadge: 'For feedback',
  aboutCafecito: 'Cafecito',
  aboutCrypto: 'USDT',
  aboutCryptoNetwork: 'TRC-20',
  aboutCryptoCopied: 'Address copied',
  aboutSupportBadge: 'To support the app',
}

export const translations: Record<Language, Translations> = { es, en }
