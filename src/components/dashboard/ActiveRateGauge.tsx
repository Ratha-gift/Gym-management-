import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { useTranslation } from 'react-i18next'

interface ActiveRateGaugeProps {
  /** 0–100 — the share of members whose membership is currently active. */
  percent: number
}

/** Half-donut "gauge" of the active-member rate — a genuinely meaningful
 * ratio (active / total members) rather than an arbitrary invented target,
 * styled after the radial "goal" gauges common on gym-dashboard mockups. */
export default function ActiveRateGauge({ percent }: ActiveRateGaugeProps) {
  const { t } = useTranslation()
  const clamped = Math.max(0, Math.min(100, percent))
  const data = [{ value: clamped, fill: '#2563eb' }]

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="relative h-full w-full max-w-40">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={data}
            innerRadius="75%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            barSize={14}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar dataKey="value" cornerRadius={999} background={{ fill: 'currentColor', opacity: 0.08 }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{clamped.toFixed(1)}%</span>
        </div>
      </div>
      <p className="mt-1 text-center text-xs text-gray-400 dark:text-gray-500">{t('dashboard.ofMembersActive')}</p>
    </div>
  )
}
