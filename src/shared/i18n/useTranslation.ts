import { useAppStore } from '../../app/store/useAppStore'
import { translations } from './translations'

export function useTranslation() {
  const lang = useAppStore((s) => s.appLanguage)
  return translations[lang]
}
