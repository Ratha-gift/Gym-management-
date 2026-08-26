import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import kh from './locales/kh.json'

export const STORAGE_KEY = 'gym_pro_language'
export type Language = 'en' | 'kh'

function getInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'en' ? 'en' : 'kh'
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      kh: { translation: kh },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'kh',
    interpolation: { escapeValue: false },
  })
}

export default i18n
