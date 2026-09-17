import { useTranslation } from 'react-i18next'
import { STORAGE_KEY, type Language } from '@/i18n/index'

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'kh', label: 'ខ្មែរ' },
]

interface LanguageSwitcherProps {
  variant?: 'light' | 'dark'
}

export default function LanguageSwitcher({ variant = 'light' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation()

  function switchTo(lang: Language) {
    i18n.changeLanguage(lang)
    localStorage.setItem(STORAGE_KEY, lang)
  }

  const isDark = variant === 'dark'

  return (
    <div className={`inline-flex items-center gap-0.5 rounded-lg p-0.5 ${isDark ? 'bg-white/5' : 'bg-gray-100 dark:bg-white/5'}`}>
      {LANGUAGES.map(({ code, label }) => {
        const isActive = i18n.language === code
        return (
          <button
            key={code}
            type="button"
            onClick={() => switchTo(code)}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition active:scale-90 ${
              isActive
                ? 'bg-brand-600 text-white shadow-sm'
                : isDark
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
