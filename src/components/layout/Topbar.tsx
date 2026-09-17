import type { ReactNode } from 'react'
import { Menu, Sun, Moon } from 'lucide-react'
import { AiOutlineMenuFold, AiOutlineMenuUnfold } from 'react-icons/ai'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/i18n/LanguageSwitcher'
import UserMenu from '@/components/layout/UserMenu'
import NotificationBell from '@/components/layout/NotificationBell'
import { useTheme } from '@/hooks/useTheme'

interface TopbarProps {
  title: string
  subtitle?: ReactNode
  onMenuClick: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export default function Topbar({ title, subtitle, onMenuClick, collapsed = false, onToggleCollapse }: TopbarProps) {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  return (
    <header className="flex h-20 items-center justify-between gap-4 border-b border-gray-100 bg-white px-4 transition-colors sm:px-8 dark:border-navy-700 dark:bg-navy-800">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 active:scale-90 lg:hidden dark:text-gray-400 dark:hover:bg-white/5"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? t('common.expandSidebar') : t('common.collapseSidebar')}
          title={collapsed ? t('common.expandSidebar') : t('common.collapseSidebar')}
          className="hidden h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition hover:bg-gray-100 active:scale-90 lg:flex dark:border-navy-700 dark:text-gray-400 dark:hover:bg-white/5"
        >
          {collapsed ? <AiOutlineMenuUnfold className="h-4.5 w-4.5" /> : <AiOutlineMenuFold className="h-4.5 w-4.5" />}
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
          {subtitle && <p className="text-sm text-gray-400 dark:text-gray-500">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <LanguageSwitcher />

        <button
          type="button"
          onClick={toggleTheme}
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 active:scale-90 dark:text-gray-400 dark:hover:bg-white/5"
          aria-label={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
          title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
        >
          <span className="grid place-items-center">
            <Sun
              className={`col-start-1 row-start-1 h-5 w-5 transition-all duration-300 ${theme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
            />
            <Moon
              className={`col-start-1 row-start-1 h-5 w-5 transition-all duration-300 ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`}
            />
          </span>
        </button>

        <NotificationBell />

        <UserMenu variant="topbar" />
      </div>
    </header>
  )
}
