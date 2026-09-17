import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bell, AlertTriangle, Clock3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'

interface AppNotification {
  id: string
  type: 'expired' | 'expiring_soon'
  member_id: number
  member_name: string | null
  package_name: string | null
  end_date: string
}

interface Position {
  top: number
  right: number
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

/** A real notification bell — derived live from membership expiry dates
 * (no notifications table; see NotificationController) rather than the
 * hardcoded `notificationCount={3}` badge this replaced, which didn't open
 * anything when clicked. */
export default function NotificationBell() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<Position | null>(null)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  function load() {
    setIsLoading(true)
    api
      .get<{ total: number; notifications: AppNotification[] }>('/notifications')
      .then((res) => setNotifications(res.notifications))
      .catch(() => setNotifications([]))
      .finally(() => setIsLoading(false))
  }

  // Loaded once up front so the badge count is right even before the bell
  // is ever clicked, then refreshed every time the panel is opened.
  useEffect(load, [])

  function handleToggle() {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    setPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    setOpen((prev) => {
      if (!prev) load()
      return !prev
    })
  }

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (triggerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 active:scale-90 dark:text-gray-400 dark:hover:bg-white/5"
        aria-label={t('notifications.title')}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {notifications.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
            {notifications.length}
          </span>
        )}
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            className="animate-modal-pop fixed z-50 w-80 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl dark:border-navy-700 dark:bg-navy-800"
            style={{ top: position.top, right: position.right }}
          >
            <div className="border-b border-gray-100 px-4 py-3 dark:border-navy-700">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{t('notifications.title')}</p>
            </div>

            <div className="custom-scrollbar max-h-96 overflow-y-auto">
              {isLoading ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">{t('common.loading')}</p>
              ) : notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">{t('notifications.empty')}</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      navigate('/membership')
                    }}
                    className="flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition last:border-0 hover:bg-gray-50 dark:border-navy-700/60 dark:hover:bg-white/5"
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        n.type === 'expired'
                          ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400'
                          : 'bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400'
                      }`}
                    >
                      {n.type === 'expired' ? <AlertTriangle className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                        {n.member_name ?? t('membership.member')}
                      </span>
                      <span className="block text-xs text-gray-400 dark:text-gray-500">
                        {t(n.type === 'expired' ? 'notifications.expired' : 'notifications.expiringSoon', { package: n.package_name })}
                        {' · '}
                        {formatDate(n.end_date)}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
