import { useState } from 'react'
import { useAppStore } from '../../../app/store/useAppStore'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import type { Language } from '../../../shared/i18n/translations'
import { AboutModal } from './AboutModal'

const ACCENT_PRESETS = [
  { label: 'Blanco',  value: '#ffffff' },
  { label: 'Azul',    value: '#3b82f6' },
  { label: 'Morado',  value: '#a855f7' },
  { label: 'Verde',   value: '#22c55e' },
  { label: 'Naranja', value: '#f97316' },
  { label: 'Rosa',    value: '#ec4899' },
  { label: 'Rojo',    value: '#ef4444' },
  { label: 'Cyan',    value: '#06b6d4' },
]

const BG_PRESETS = [
  { label: 'Negro',        value: '#000000' },
  { label: 'Zinc',         value: '#09090b' },
  { label: 'Noche azul',   value: '#050d1a' },
  { label: 'Noche morada', value: '#0d0520' },
  { label: 'Noche verde',  value: '#041a0a' },
  { label: 'Noche roja',   value: '#1a0505' },
  { label: 'Noche cálida', value: '#120d00' },
  { label: 'Grafito',      value: '#111111' },
]

interface SettingsViewProps {
  // Kept for compatibility with the desktop signature; unused on mobile
  // (music dir picker doesn't apply — library comes via WiFi import).
  onMusicDirChange?: (oldDir: string, newDir: string) => void
}

export function SettingsView(_props: SettingsViewProps) {
  const t = useTranslation()

  const accentColor         = useAppStore((s) => s.accentColor)
  const bgColor             = useAppStore((s) => s.bgColor)
  const dynamicVibeEnabled  = useAppStore((s) => s.dynamicVibeEnabled)
  const vibeIntensity       = useAppStore((s) => s.vibeIntensity)
  const fontScale           = useAppStore((s) => s.fontScale)
  const showAlbumCovers     = useAppStore((s) => s.showAlbumCovers)
  const appLanguage         = useAppStore((s) => s.appLanguage)

  const setAccentColor        = useAppStore((s) => s.setAccentColor)
  const setBgColor            = useAppStore((s) => s.setBgColor)
  const setDynamicVibeEnabled = useAppStore((s) => s.setDynamicVibeEnabled)
  const setVibeIntensity      = useAppStore((s) => s.setVibeIntensity)
  const setFontScale          = useAppStore((s) => s.setFontScale)
  const setShowAlbumCovers    = useAppStore((s) => s.setShowAlbumCovers)
  const setAppLanguage        = useAppStore((s) => s.setAppLanguage)

  const personOpen          = useAppStore((s) => s.personalizationOpen)
  const setPersonOpen       = useAppStore((s) => s.setPersonalizationOpen)

  const [showAbout, setShowAbout] = useState(false)

  return (
    <section className="mx-auto max-w-xl">
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      <h2 className="mb-6 text-xl font-bold tracking-tight text-white">{t.settingsTitle}</h2>

      {/* About */}
      <div className="mb-4 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
        <button
          type="button"
          onClick={() => setShowAbout(true)}
          className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors active:bg-zinc-800/40"
        >
          <div>
            <p className="text-sm font-semibold text-white">{t.aboutTitle}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{t.aboutDescription}</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="shrink-0 text-zinc-600">
            <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
          </svg>
        </button>
      </div>

      {/* Language */}
      <div className="mb-4 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-white">{t.appLanguageLabel}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{t.appLanguageDescription}</p>
          </div>
          <div className="flex overflow-hidden rounded-lg border border-zinc-700">
            {(['es', 'en'] as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setAppLanguage(lang)}
                className={[
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  appLanguage === lang ? "bg-zinc-700 text-white" : "text-zinc-500 active:text-zinc-300",
                ].join(" ")}
              >
                {lang === 'es' ? 'Español' : 'English'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Personalization */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-white">{t.personalization}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{t.personalizationDescription}</p>
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
                "inline-block h-3.5 w-3.5 rounded-full bg-black shadow transition-transform",
                personOpen ? "translate-x-4" : "translate-x-1",
              ].join(" ")}
            />
          </button>
        </div>

        {personOpen && (
          <div className="divide-y divide-zinc-800/60 border-t border-zinc-800/60">
            {/* Accent color */}
            <div className="px-5 py-4">
              <p className="mb-1 text-sm text-zinc-200">{t.accentColorLabel}</p>
              <p className="mb-3 text-xs text-zinc-600">{t.accentColorDescription}</p>
              <div className="flex flex-wrap gap-2.5">
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
              <p className="mb-1 text-sm text-zinc-200">{t.backgroundColorLabel}</p>
              <p className="mb-3 text-xs text-zinc-600">{t.backgroundColorDescription}</p>
              <div className="flex flex-wrap gap-2.5">
                {BG_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    title={preset.label}
                    onClick={() => setBgColor(preset.value)}
                    className="h-7 w-7 rounded-full border border-zinc-700 transition-all"
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
                <p className="mt-0.5 text-xs text-zinc-500">{t.dynamicVibeDescription}</p>
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
                    "inline-block h-3.5 w-3.5 rounded-full bg-black shadow transition-transform",
                    dynamicVibeEnabled ? "translate-x-4" : "translate-x-1",
                  ].join(" ")}
                />
              </button>
            </div>

            {/* Vibe intensity */}
            <div className="px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-zinc-200">{t.vibeIntensityLabel}</p>
                <span className="text-xs tabular-nums text-zinc-500">{vibeIntensity}%</span>
              </div>
              <div className="relative my-2 h-1.5 rounded-full bg-zinc-700">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${vibeIntensity}%`, backgroundColor: 'var(--accent)' }}
                />
                <div
                  className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-900"
                  style={{ left: `${vibeIntensity}%`, backgroundColor: 'var(--accent)' }}
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={vibeIntensity}
                  onChange={(e) => setVibeIntensity(Number(e.target.value))}
                  className="absolute inset-0 w-full cursor-pointer opacity-0"
                  style={{ height: '100%' }}
                />
              </div>
            </div>

            {/* Font size */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm text-zinc-200">Tamaño de fuente</p>
                <p className="mt-0.5 text-xs text-zinc-600">16px por defecto</p>
              </div>
              <div className="flex overflow-hidden rounded-lg border border-zinc-700">
                {([
                  { value: 'small',  label: 'A', title: 'Pequeño' },
                  { value: 'normal', label: 'A', title: 'Normal'  },
                  { value: 'large',  label: 'A', title: 'Grande'  },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    title={opt.title}
                    onClick={() => setFontScale(opt.value)}
                    className={[
                      "px-3 py-1.5 font-medium transition-colors",
                      opt.value === 'small' ? 'text-xs' : opt.value === 'large' ? 'text-base' : 'text-sm',
                      fontScale === opt.value ? "bg-zinc-700 text-white" : "text-zinc-500 active:text-zinc-300",
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
                <p className="mt-0.5 text-xs text-zinc-600">{t.showAlbumCoversDescription}</p>
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
                    "inline-block h-3.5 w-3.5 rounded-full bg-black shadow transition-transform",
                    showAlbumCovers ? "translate-x-4" : "translate-x-1",
                  ].join(" ")}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
