import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from '@/hooks/useTheme'
import EmptyState from '@/components/ui/EmptyState'

interface SignupsTrendChartProps {
  data: { month: string; count: number }[]
}

/** New-member signups over the last 6 real calendar months — an area chart
 * rather than the more common multi-line "status over time" chart, since we
 * only have one honest series (signup counts) to plot; a single smooth
 * gradient-filled line reads better than an empty multi-line legend. */
export default function SignupsTrendChart({ data }: SignupsTrendChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const gridColor = isDark ? '#1b243d' : '#f1f5f9'
  const axisColor = isDark ? '#6b7280' : '#9ca3af'

  if (data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState />
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="signupsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} width={30} />
        <Tooltip
          contentStyle={{
            background: isDark ? '#141c31' : '#fff',
            border: 'none',
            borderRadius: 8,
            color: isDark ? '#e5e9f0' : '#1f2430',
            fontSize: 12,
          }}
        />
        <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} fill="url(#signupsFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
