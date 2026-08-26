import { useState } from 'react'
import { ChevronDown, User, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Avatar from '@/components/ui/Avatar'
import Dropdown, { type DropdownItem } from '@/components/ui/Dropdown'
import EditProfileModal from '@/components/auth/EditProfileModal'
import { useAuth } from '@/hooks/useAuth'

interface UserMenuProps {
  /** 'sidebar' (default): full-width row with name/role text, opens upward-left.
   * 'sidebar-compact': just the avatar for the collapsed icon-rail sidebar —
   * same upward-left placement, just a smaller trigger.
   * 'topbar': just the avatar, sized to fit inline in the header, opens
   * downward toward the right. */
  variant?: 'sidebar' | 'sidebar-compact' | 'topbar'
}

export default function UserMenu({ variant = 'sidebar' }: UserMenuProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [editOpen, setEditOpen] = useState(false)
  const isTopbar = variant === 'topbar'
  const isCompact = variant !== 'sidebar'

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const items: (DropdownItem | 'divider')[] = [
    { key: 'edit-profile', label: t('userMenu.editProfile'), icon: <User className="h-4 w-4" />, onClick: () => setEditOpen(true) },
    'divider',
    { key: 'logout', label: t('userMenu.logOut'), icon: <LogOut className="h-4 w-4" />, danger: true, onClick: handleLogout },
  ]

  return (
    <>
      <Dropdown
        placement={isTopbar ? 'bottom' : 'top'}
        align={isTopbar ? 'right' : 'left'}
        inline={isCompact}
        trigger={
          isCompact ? (
            <span
              className={`block rounded-full transition hover:ring-2 hover:ring-white/20 ${isTopbar ? 'hover:ring-gray-200' : ''}`}
              aria-label={t('userMenu.editProfile')}
            >
              <Avatar name={user?.name ?? '—'} photo={user?.photo} size={38} />
            </span>
          ) : (
            <div className="flex w-full items-center gap-3 rounded-lg px-1 py-1 hover:bg-white/5">
              <Avatar name={user?.name ?? '—'} photo={user?.photo} size={38} />
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold text-white">{user?.name ?? t('common.loading')}</p>
                <p className="truncate text-xs text-gray-400">{user?.role?.role_name ?? ''}</p>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
            </div>
          )
        }
        items={items}
      />

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  )
}
