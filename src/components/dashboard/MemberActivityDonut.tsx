import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/hooks/useTheme'
import EmptyState from '@/components/ui/EmptyState'

interface MemberActivityDonutProps {
  active: number
  frozen: number
  expired: number
  terminated: number
}

/** Membership-status breakdown as a donut — reuses the same status colors as
 * the <Badge> component elsewhere in the app, so the legend reads
 * consistently with every status pill in the tables. */
export default function MemberActivityDonut({ active, frozen, expired, terminated }: MemberActivityDonutProps) {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const data = [
    { key: 'active', label: t('common.active'), value: active, color: '#10b981' },
    { key: 'frozen', label: t('dashboard.frozenMembers'), value: frozen, color: '#0ea5e9' },
    { key: 'expired', label: t('common.expired'), value: expired, color: '#f59e0b' },
    { key: 'terminated', label: t('dashboard.terminatedMembers'), value: terminated, color: '#ef4444' },
  ]
  const total = active + frozen + expired + terminated

  if (total === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius="65%" outerRadius="100%" paddingAngle={3} stroke="none">
              {data.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: isDark ? '#141c31' : '#fff',
                border: 'none',
                borderRadius: 8,
                color: isDark ? '#e5e9f0' : '#1f2430',
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{total}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{t('dashboard.totalMembers')}</span>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1.5">
        {data.map((entry) => (
          <div key={entry.key} className="flex items-center gap-1.5 text-xs">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: entry.color }} />
            <span className="truncate text-gray-500 dark:text-gray-400">{entry.label}</span>
            <span className="ml-auto font-semibold text-gray-700 dark:text-gray-300">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
