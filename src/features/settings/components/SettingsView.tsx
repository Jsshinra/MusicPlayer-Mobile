import { useEffect, useState } from 'react'
import { useAppStore } from '../../../app/store/useAppStore'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import type { Language } from '../../../shared/i18n/translations'
import { AboutModal } from './AboutModal'

const ACCENT_PRESETS = [
  { label: 'Blanco',  value: '#ffffff' },
  { label: 'Azul',   value: '#3b82f6' },
  { label: 'Morado', value: '#a855f7' },
  { label: 'Verde',  value: '#22c55e' },
  { label: 'Naranja',value: '#f97316' },
  { label: 'Rosa',   value: '#ec4899' },
  { label: 'Rojo',   value: '#ef4444' },
  { label: 'Cyan',   value: '#06b6d4' },
]

const BG_PRESETS = [
  { label: 'Negro',         value: '#000000' },
  { label: 'Zinc',          value: '#09090b' },
  { label: 'Noche azul',    value: '#050d1a' },
  { label: 'Noche morada',  value: '#0d0520' },
  { label: 'Noche verde',   value: '#041a0a' },
  { label: 'Noche roja',    value: '#1a0505' },
  { label: 'Noche cálida',  value: '#120d00' },
  { label: 'Grafito',       value: '#111111' },
]

const LANGUAGES = [
  { code: 'es-ES', label: 'Spanish (Spain)' },
  { code: 'es-AR', label: 'Spanish (Argentina)' },
  { code: 'es-MX', label: 'Spanish (Mexico)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
]

interface MicDevice {
  deviceId: string
  label: string
}

function useMicDevices() {
  const [devices, setDevices] = useState<MicDevice[]>([])
  const [permissionNeeded, setPermissionNeeded] = useState(false)

  const enumerate = async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices()
      const mics = all
        .filter((d) => d.kind === 'audioinput')
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${i + 1}`,
        }))
      setDevices(mics)
      const hasLabels = all.some((d) => d.kind === 'audioinput' && d.label)
      setPermissionNeeded(!hasLabels)
    } catch {
      setDevices([])
    }
  }

  useEffect(() => { void enumerate() }, [])

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      await enumerate()
    } catch {
      // user denied
    }
  }

  return { devices, permissionNeeded, requestPermission }
}

interface SettingsViewProps {
  onMusicDirChange: (oldDir: string, newDir: string) => void
}

export function SettingsView({ onMusicDirChange }: SettingsViewProps) {
  const t = useTranslation()

  const voiceSearchEnabled  = useAppStore((s) => s.voiceSearchEnabled)
  const voiceSearchKey      = useAppStore((s) => s.voiceSearchKey)
  const voiceSearchLang     = useAppStore((s) => s.voiceSearchLang)
  const voiceMicDeviceId    = useAppStore((s) => s.voiceMicDeviceId)
  const accentColor           = useAppStore((s) => s.accentColor)
  const bgColor               = useAppStore((s) => s.bgColor)
  const dynamicVibeEnabled    = useAppStore((s) => s.dynamicVibeEnabled)
  const vibeIntensity         = useAppStore((s) => s.vibeIntensity)
  const uiDensity           = useAppStore((s) => s.uiDensity)
  const fontScale           = useAppStore((s) => s.fontScale)
  const discordRpcEnabled   = useAppStore((s) => s.discordRpcEnabled)
  const crossfadeDuration   = useAppStore((s) => s.crossfadeDuration)
  const showAlbumCovers     = useAppStore((s) => s.showAlbumCovers)
  const appLanguage         = useAppStore((s) => s.appLanguage)

  const setVoiceSearchEnabled = useAppStore((s) => s.setVoiceSearchEnabled)
  const setVoiceSearchKey     = useAppStore((s) => s.setVoiceSearchKey)
  const setVoiceSearchLang    = useAppStore((s) => s.setVoiceSearchLang)
  const setVoiceMicDeviceId   = useAppStore((s) => s.setVoiceMicDeviceId)
  const setAccentColor          = useAppStore((s) => s.setAccentColor)
  const setBgColor              = useAppStore((s) => s.setBgColor)
  const setDynamicVibeEnabled   = useAppStore((s) => s.setDynamicVibeEnabled)
  const setVibeIntensity        = useAppStore((s) => s.setVibeIntensity)
  const setUiDensity          = useAppStore((s) => s.setUiDensity)
  const setFontScale          = useAppStore((s) => s.setFontScale)
  const setDiscordRpcEnabled  = useAppStore((s) => s.setDiscordRpcEnabled)
  const setCrossfadeDuration  = useAppStore((s) => s.setCrossfadeDuration)
  const setShowAlbumCovers    = useAppStore((s) => s.setShowAlbumCovers)
  const setAppLanguage        = useAppStore((s) => s.setAppLanguage)

  const [capturing, setCapturing] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const personOpen          = useAppStore((s) => s.personalizationOpen)
  const setPersonOpen       = useAppStore((s) => s.setPersonalizationOpen)
  const [musicDir, setMusicDir] = useState<string>('')
  const { devices, permissionNeeded, requestPermission } = useMicDevices()

  useEffect(() => {
    window.libraryAPI.getMusicDir().then(setMusicDir)
  }, [])

  const handleKeyCapture = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return
    setVoiceSearchKey(e.key.toLowerCase())
    setCapturing(false)
  }

  return (
    <section className="max-w-xl mx-auto">
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      <h2 className="text-xl font-bold text-white tracking-tight mb-7">{t.settingsTitle}</h2>

      {/* About card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden mb-5">
        <button
          type="button"
          onClick={() => setShowAbout(true)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800/40 transition-colors text-left"
        >
          <div>
            <p className="text-sm font-semibold text-white">{t.aboutTitle}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{t.aboutDescription}</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="shrink-0 text-zinc-600">
            <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </button>
      </div>

      {/* Language card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden mb-5">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-white">{t.appLanguageLabel}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{t.appLanguageDescription}</p>
          </div>
          <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
            {(['es', 'en'] as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setAppLanguage(lang)}
                className={[
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  appLanguage === lang
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-500 hover:text-zinc-300",
                ].join(" ")}
              >
                {lang === 'es' ? 'Español' : 'English'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Voice search card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60">
          <div>
            <p className="text-sm font-semibold text-white">{t.voiceSearch}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{t.voiceSearchDescription}</p>
          </div>
          <button
            role="switch"
            aria-checked={voiceSearchEnabled}
            onClick={() => setVoiceSearchEnabled(!voiceSearchEnabled)}
            className={[
              "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
              voiceSearchEnabled ? "bg-white" : "bg-zinc-700",
            ].join(" ")}
          >
            <span
              className={[
                "inline-block h-3.5 w-3.5 rounded-full bg-black transition-transform shadow",
                voiceSearchEnabled ? "translate-x-4" : "translate-x-1",
              ].join(" ")}
            />
          </button>
        </div>

        {voiceSearchEnabled && (
          <div className="divide-y divide-zinc-800/60">

            {/* Trigger key */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm text-zinc-200">{t.triggerKey}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{t.triggerKeyDescription}</p>
              </div>
              <button
                onKeyDown={capturing ? handleKeyCapture : undefined}
                onClick={() => setCapturing(true)}
                onBlur={() => setCapturing(false)}
                className={[
                  "min-w-[2.5rem] rounded-lg border px-3 py-1.5 text-sm font-mono font-medium transition-colors outline-none",
                  capturing
                    ? "border-white text-white bg-zinc-800 animate-pulse"
                    : "border-zinc-700 text-zinc-300 bg-zinc-800 hover:border-zinc-500",
                ].join(" ")}
              >
                {capturing ? '…' : voiceSearchKey}
              </button>
            </div>

            {/* Microphone */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm text-zinc-200">{t.microphone}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{t.microphoneDescription}</p>
              </div>
              {permissionNeeded ? (
                <button
                  type="button"
                  onClick={() => void requestPermission()}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
                >
                  {t.allowMicrophone}
                </button>
              ) : (
                <select
                  value={voiceMicDeviceId}
                  onChange={(e) => setVoiceMicDeviceId(e.currentTarget.value)}
                  className="max-w-[200px] rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-zinc-500 transition-colors"
                >
                  <option value="">{t.systemDefault}</option>
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Language */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm text-zinc-200">{t.recognitionLanguage}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{t.recognitionLanguageDescription}</p>
              </div>
              <select
                value={voiceSearchLang}
                onChange={(e) => setVoiceSearchLang(e.currentTarget.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-zinc-500 transition-colors"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>

            {/* Model info */}
            <div className="px-5 py-4">
              <p className="text-sm text-zinc-200">{t.voiceModel}</p>
              <p className="text-xs text-zinc-600 mt-0.5">{t.voiceModelDescription}</p>
            </div>

            {/* Command reference */}
            <div className="px-5 py-4 border-t border-zinc-800/60">
              <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-600 mb-3">
                {t.commandReference}
              </p>
              <ul className="space-y-1.5 text-xs text-zinc-500">
                <li><span className="text-zinc-300 font-medium">Pon / Play [nombre]</span> — reproducir una canción</li>
                <li><span className="text-zinc-300 font-medium">Pon playlist [nombre]</span> — iniciar una playlist</li>
                <li><span className="text-zinc-300 font-medium">Pausa / Pause</span> — pausar</li>
                <li><span className="text-zinc-300 font-medium">Continuar / Resume</span> — reanudar</li>
                <li><span className="text-zinc-300 font-medium">Siguiente / Next</span> — siguiente canción</li>
                <li><span className="text-zinc-300 font-medium">Anterior / Previous</span> — canción anterior</li>
                <li><span className="text-zinc-300 font-medium">Sube el volumen / Volume up</span> — subir volumen</li>
                <li><span className="text-zinc-300 font-medium">Baja el volumen / Volume down</span> — bajar volumen</li>
              </ul>
            </div>

          </div>
        )}
      </div>

      {/* Discord Rich Presence card */}
      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-white">{t.discordRichPresence}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{t.discordRichPresenceDescription}</p>
          </div>
          <button
            role="switch"
            aria-checked={discordRpcEnabled}
            onClick={() => setDiscordRpcEnabled(!discordRpcEnabled)}
            className={[
              "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
              discordRpcEnabled ? "bg-white" : "bg-zinc-700",
            ].join(" ")}
          >
            <span
              className={[
                "inline-block h-3.5 w-3.5 rounded-full bg-black transition-transform shadow",
                discordRpcEnabled ? "translate-x-4" : "translate-x-1",
              ].join(" ")}
            />
          </button>
        </div>
      </div>

      {/* Personalización card */}
      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-white">{t.personalization}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{t.personalizationDescription}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={personOpen}
            onClick={() => setPersonOpen(!personOpen)}
            className={[
              "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
              personOpen ? "bg-white" : "bg-zinc-700",
            ].join(" ")}
          >
            <span
              className={[
                "inline-block h-3.5 w-3.5 rounded-full bg-black transition-transform shadow",
                personOpen ? "translate-x-4" : "translate-x-1",
              ].join(" ")}
            />
          </button>
        </div>

        {personOpen && (
          <div className="divide-y divide-zinc-800/60 border-t border-zinc-800/60">
            {/* Accent color */}
            <div className="px-5 py-4">
              <p className="text-sm text-zinc-200 mb-3">{t.accentColorLabel}</p>
              <p className="text-xs text-zinc-600 mb-3">{t.accentColorDescription}</p>
              <div className="flex gap-2.5 flex-wrap">
                {ACCENT_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    title={preset.label}
                    onClick={() => setAccentColor(preset.value)}
                    className="h-7 w-7 rounded-full transition-all"
                    style={{
                      backgroundColor: preset.value,
                      boxShadow: accentColor === preset.value
                        ? `0 0 0 2px #09090b, 0 0 0 4px ${preset.value}`
                        : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Background color */}
            <div className="px-5 py-4">
              <p className="text-sm text-zinc-200 mb-3">{t.backgroundColorLabel}</p>
              <p className="text-xs text-zinc-600 mb-3">{t.backgroundColorDescription}</p>
              <div className="flex gap-2.5 flex-wrap">
                {BG_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    title={preset.label}
                    onClick={() => setBgColor(preset.value)}
                    className="h-7 w-7 rounded-full transition-all border border-zinc-700"
                    style={{
                      backgroundColor: preset.value,
                      boxShadow: bgColor === preset.value
                        ? `0 0 0 2px #09090b, 0 0 0 4px #71717a`
                        : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Dynamic vibe */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm text-zinc-200">{t.dynamicVibeLabel}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{t.dynamicVibeDescription}</p>
              </div>
              <button
                role="switch"
                aria-checked={dynamicVibeEnabled}
                onClick={() => setDynamicVibeEnabled(!dynamicVibeEnabled)}
                className={[
                  "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                  dynamicVibeEnabled ? "bg-white" : "bg-zinc-700",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-block h-3.5 w-3.5 rounded-full bg-black transition-transform shadow",
                    dynamicVibeEnabled ? "translate-x-4" : "translate-x-1",
                  ].join(" ")}
                />
              </button>
            </div>

            {/* Vibe intensity slider */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-zinc-200">{t.vibeIntensityLabel}</p>
                <span className="text-xs text-zinc-500 tabular-nums">{vibeIntensity}%</span>
              </div>
              <div className="relative h-1.5 rounded-full bg-zinc-700 my-2">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${vibeIntensity}%`, backgroundColor: 'var(--accent)' }}
                />
                {/* Thumb */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full border-2 border-zinc-900 pointer-events-none"
                  style={{ left: `${vibeIntensity}%`, backgroundColor: 'var(--accent)' }}
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={vibeIntensity}
                  onChange={(e) => setVibeIntensity(Number(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  style={{ height: '100%' }}
                />
              </div>
            </div>

            {/* Density */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm text-zinc-200">{t.density}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{t.densityDescription}</p>
              </div>
              <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
                {(['normal', 'compact'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setUiDensity(d)}
                    className={[
                      "px-3 py-1.5 text-xs font-medium transition-colors",
                      uiDensity === d
                        ? "bg-zinc-700 text-white"
                        : "text-zinc-500 hover:text-zinc-300",
                    ].join(" ")}
                  >
                    {d === 'normal' ? t.normalDensity : t.compactDensity}
                  </button>
                ))}
              </div>
            </div>

            {/* Font size */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm text-zinc-200">Tamaño de fuente</p>
                <p className="text-xs text-zinc-600 mt-0.5">18px por defecto</p>
              </div>
              <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
                {([
                  { value: 'small',  label: 'A', title: 'Pequeño (16px)' },
                  { value: 'normal', label: 'A', title: 'Normal (18px)'  },
                  { value: 'large',  label: 'A', title: 'Grande (20px)'  },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    title={opt.title}
                    onClick={() => setFontScale(opt.value)}
                    className={[
                      "px-3 py-1.5 font-medium transition-colors",
                      opt.value === 'small' ? 'text-xs' : opt.value === 'large' ? 'text-base' : 'text-sm',
                      fontScale === opt.value
                        ? "bg-zinc-700 text-white"
                        : "text-zinc-500 hover:text-zinc-300",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Album covers */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm text-zinc-200">{t.showAlbumCovers}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{t.showAlbumCoversDescription}</p>
              </div>
              <button
                role="switch"
                aria-checked={showAlbumCovers}
                onClick={() => setShowAlbumCovers(!showAlbumCovers)}
                className={[
                  "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                  showAlbumCovers ? "bg-white" : "bg-zinc-700",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-block h-3.5 w-3.5 rounded-full bg-black transition-transform shadow",
                    showAlbumCovers ? "translate-x-4" : "translate-x-1",
                  ].join(" ")}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Crossfade card */}
      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-white">{t.crossfade}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{t.crossfadeDescription}</p>
          </div>
          <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
            {([0, 2, 4, 6, 8, 10] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setCrossfadeDuration(v)}
                className={[
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  crossfadeDuration === v
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-500 hover:text-zinc-300",
                ].join(" ")}
              >
                {v === 0 ? 'Off' : `${v}s`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Music library card */}
      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800/60">
          <p className="text-sm font-semibold text-white">{t.musicFolder}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{t.musicFolderDescription}</p>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-zinc-400 font-mono break-all">{musicDir}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                window.libraryAPI.pickMusicDir().then((result) => {
                  if (!result) return
                  setMusicDir(result.newDir)
                  onMusicDirChange(result.oldDir, result.newDir)
                })
              }}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
            >
              {t.changeFolder}
            </button>
            <button
              type="button"
              onClick={() => {
                window.libraryAPI.resetMusicDir().then((result) => {
                  setMusicDir(result.newDir)
                  onMusicDirChange(result.oldDir, result.newDir)
                })
              }}
              className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-600 hover:border-zinc-700 hover:text-zinc-400 transition-colors"
            >
              {t.resetFolder}
            </button>
          </div>
        </div>
      </div>

    </section>
  )
}
