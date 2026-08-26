import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import Greeting from '@/components/layout/Greeting'
import TopLoadingBar from '@/components/ui/TopLoadingBar'

/** Route pathname -> nav i18n key, so the shared layout below can label the
 * Topbar for whichever page is currently mounted in its <Outlet/>. */
const PAGE_TITLE_KEYS: Record<string, string> = {
  '/dashboard': 'nav.dashboard',
  '/members': 'nav.members',
  '/packages': 'nav.packages',
  '/membership': 'nav.membership',
  '/attendance': 'nav.attendance',
  '/payments': 'nav.payments',
  '/reports': 'nav.reports',
  '/users': 'nav.users',
  '/roles': 'nav.roles',
  '/settings': 'nav.settings',
}

const COLLAPSE_STORAGE_KEY = 'gym_pro_sidebar_collapsed'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_STORAGE_KEY) === 'true')
  const { t } = useTranslation()
  const { pathname } = useLocation()

  const titleKey = PAGE_TITLE_KEYS[pathname] ?? 'nav.dashboard'
  const subtitle = pathname === '/dashboard' ? <Greeting /> : undefined

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next))
      return next
    })
  }

  return (
    <div className="h-screen overflow-hidden bg-[#f3f5f9]">
      <TopLoadingBar />
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} collapsed={collapsed} />

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <div className={`flex h-full min-w-0 flex-col transition-[padding] ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <Topbar
          title={t(titleKey)}
          subtitle={subtitle}
          notificationCount={3}
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />
        <main className="flex-1 overflow-y-auto bg-[#f3f5f9] p-1.5 sm:p-2">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
