import type { LucideIcon } from 'lucide-react'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import Card from '@/components/ui/Card'

interface StatCardProps {
  icon: LucideIcon
  iconClassName: string
  label: string
  value: string | number
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' }
}

const TREND_STYLES = {
  up: 'text-emerald-500',
  down: 'text-red-500',
  neutral: 'text-gray-400',
}

const TREND_ICON = {
  up: ArrowUp,
  down: ArrowDown,
  neutral: Minus,
}

export default function StatCard({ icon: Icon, iconClassName, label, value, trend }: StatCardProps) {
  const TrendIcon = trend ? TREND_ICON[trend.direction] : null

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}>
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      {trend && (
        <p className={`mt-3 flex items-center gap-1 text-xs font-medium ${TREND_STYLES[trend.direction]}`}>
          {TrendIcon && <TrendIcon className="h-3.5 w-3.5" />}
          {trend.value}
        </p>
      )}
    </Card>
  )
}
