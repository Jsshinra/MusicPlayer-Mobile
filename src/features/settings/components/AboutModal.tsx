import { createPortal } from 'react-dom'
import { useTranslation } from '../../../shared/i18n/useTranslation'

interface Props {
  onClose: () => void
}

function openExternal(url: string) {
  window.shellAPI.openExternal(url)
}

export function AboutModal({ onClose }: Props) {
  const t = useTranslation()

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" className="text-zinc-200">
                <path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13c0-1.104 1.12-2 2.5-2s2.5.896 2.5 2zm9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2z"/>
                <path fillRule="evenodd" d="M14 11V2h1v9h-1zM6 3v10H5V3h1z"/>
                <path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4V2.905z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight leading-none">Lumen</h2>
              <p className="text-xs text-zinc-500 mt-0.5">{t.aboutTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="mx-6 border-t border-zinc-800/60" />

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-zinc-400 leading-relaxed">
            {t.aboutBody}
          </p>
        </div>

        {/* Divider */}
        <div className="mx-6 border-t border-zinc-800/60" />

        {/* Support buttons */}
        <div className="px-6 py-5 space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-600 mb-3">
            {t.aboutCommunityLabel}
          </p>

          <button
            type="button"
            onClick={() => openExternal('https://discord.gg/PLACEHOLDER')}
            className="w-full flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-800/40 px-4 py-3 text-sm text-zinc-300 hover:border-zinc-700 hover:text-white hover:bg-zinc-800 transition-colors text-left"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-[#5865F2]">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">{t.aboutDiscord}</span>
              <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                {t.aboutDiscordBadge}
              </span>
            </div>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="ml-auto shrink-0 text-zinc-600">
              <path fillRule="evenodd" d="M14 2.5a.5.5 0 0 0-.5-.5h-6a.5.5 0 0 0 0 1h4.793L2.146 13.146a.5.5 0 0 0 .708.708L13 3.707V8.5a.5.5 0 0 0 1 0v-6z"/>
            </svg>
          </button>

          <button
            type="button"
            onClick={() => openExternal('https://cafecito.app/PLACEHOLDER')}
            className="w-full flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-800/40 px-4 py-3 text-sm text-zinc-300 hover:border-zinc-700 hover:text-white hover:bg-zinc-800 transition-colors text-left"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-amber-400">
              <path d="M2 21h18v-2H2v2zm2-3h14v-1a7 7 0 0 0-7-7H9a7 7 0 0 0-7 7v1h2zm6-9a5 5 0 0 1 4.9 4H5.1A5 5 0 0 1 10 9zm10-1h-1V6h1a1 1 0 0 1 0 2zm0-4h-1V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1a1 1 0 0 0 0 2h1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6h1a3 3 0 0 0 0-6h-1V0z"/>
            </svg>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">{t.aboutCafecito}</span>
              <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                {t.aboutSupportBadge}
              </span>
            </div>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="ml-auto shrink-0 text-zinc-600">
              <path fillRule="evenodd" d="M14 2.5a.5.5 0 0 0-.5-.5h-6a.5.5 0 0 0 0 1h4.793L2.146 13.146a.5.5 0 0 0 .708.708L13 3.707V8.5a.5.5 0 0 0 1 0v-6z"/>
            </svg>
          </button>

          <button
            type="button"
            onClick={() => openExternal('https://ko-fi.com/PLACEHOLDER')}
            className="w-full flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-800/40 px-4 py-3 text-sm text-zinc-300 hover:border-zinc-700 hover:text-white hover:bg-zinc-800 transition-colors text-left"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-[#FF5E5B]">
              <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 4.814 3.943 5.025 5.975 5.023 2.243-.002 17.878-.002 17.878-.002 2.561-.028 3.939-2.323 4.062-5.055.179-3.913-.027-7.993-.056-7.993zm-2.818 7.155c-.113 1.9-1.222 2.894-2.133 2.894H2.979c-.945 0-2.043-.981-2.19-2.979-.122-1.677-.082-7.622-.082-7.622h18.322c.024 0 2.133.208 2.133 2.286v5.421zm-3.604-4.955c0 1.214-.986 2.197-2.203 2.197s-2.203-.983-2.203-2.197c0-1.212.986-2.196 2.203-2.196s2.203.984 2.203 2.196z"/>
            </svg>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">{t.aboutKofi}</span>
              <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                {t.aboutSupportBadge}
              </span>
            </div>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="ml-auto shrink-0 text-zinc-600">
              <path fillRule="evenodd" d="M14 2.5a.5.5 0 0 0-.5-.5h-6a.5.5 0 0 0 0 1h4.793L2.146 13.146a.5.5 0 0 0 .708.708L13 3.707V8.5a.5.5 0 0 0 1 0v-6z"/>
            </svg>
          </button>
        </div>

      </div>
    </div>,
    document.body
  )
}
