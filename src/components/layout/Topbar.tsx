import type { ReactNode } from 'react'
import { Menu, Bell } from 'lucide-react'
import { AiOutlineMenuFold, AiOutlineMenuUnfold } from 'react-icons/ai'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/i18n/LanguageSwitcher'
import UserMenu from '@/components/layout/UserMenu'

interface TopbarProps {
  title: string
  subtitle?: ReactNode
  onMenuClick: () => void
  notificationCount?: number
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export default function Topbar({ title, subtitle, onMenuClick, notificationCount = 0, collapsed = false, onToggleCollapse }: TopbarProps) {
  const { t } = useTranslation()
  return (
    <header className="flex h-20 items-center justify-between gap-4 border-b border-gray-100 bg-white px-4 sm:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 active:scale-90 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? t('common.expandSidebar') : t('common.collapseSidebar')}
          title={collapsed ? t('common.expandSidebar') : t('common.collapseSidebar')}
          className="hidden h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition hover:bg-gray-100 active:scale-90 lg:flex"
        >
          {collapsed ? <AiOutlineMenuUnfold className="h-4.5 w-4.5" /> : <AiOutlineMenuFold className="h-4.5 w-4.5" />}
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <LanguageSwitcher />

        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 active:scale-90"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
              {notificationCount}
            </span>
          )}
        </button>

        <UserMenu variant="topbar" />
      </div>
    </header>
  )
}
