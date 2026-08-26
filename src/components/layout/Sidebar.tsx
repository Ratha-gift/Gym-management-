import {
  LayoutDashboard,
  Users,
  Package,
  CreditCard,
  Wallet,
  BarChart3,
  Settings,
  UserCheck,
  ShieldCheck,
  UserCog,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Logo from '@/components/ui/Logo'
import UserMenu from '@/components/layout/UserMenu'

const NAV_ITEMS = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/members', labelKey: 'nav.members', icon: Users },
  { to: '/packages', labelKey: 'nav.packages', icon: Package },
  { to: '/membership', labelKey: 'nav.membership', icon: CreditCard },
  { to: '/attendance', labelKey: 'nav.attendance', icon: UserCheck },
  { to: '/payments', labelKey: 'nav.payments', icon: Wallet },
  { to: '/reports', labelKey: 'nav.reports', icon: BarChart3 },
  { to: '/users', labelKey: 'nav.users', icon: UserCog },
  { to: '/roles', labelKey: 'nav.roles', icon: ShieldCheck },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
]

interface SidebarProps {
  open: boolean
  onNavigate?: () => void
  /** Desktop-only icon-rail mode — independent of `open`, which is the mobile drawer's visibility. */
  collapsed?: boolean
}

export default function Sidebar({ open, onNavigate, collapsed = false }: SidebarProps) {
  const { t } = useTranslation()

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy-900 transition-[transform,width] duration-200 lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      } ${collapsed ? 'lg:w-20' : 'lg:w-64'}`}
    >
      <div className={`flex h-20 shrink-0 items-center border-b border-white/5 px-6 ${collapsed ? 'lg:justify-center lg:px-2' : ''}`}>
        <Logo collapseTextAtLg={collapsed} />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-5">
        {NAV_ITEMS.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            title={collapsed ? t(labelKey) : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition active:scale-[0.97] ${
                collapsed ? 'lg:justify-center' : ''
              } ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
            <span className={collapsed ? 'lg:hidden' : ''}>{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/5 px-3 py-3">
        {/* Two instances, CSS-toggled by breakpoint — the mobile drawer always
            shows the full row regardless of the desktop collapse preference. */}
        <div className={`hidden ${collapsed ? 'lg:flex lg:justify-center' : ''}`}>
          <UserMenu variant="sidebar-compact" />
        </div>
        <div className={collapsed ? 'lg:hidden' : ''}>
          <UserMenu variant="sidebar" />
        </div>
      </div>
    </aside>
  )
}
