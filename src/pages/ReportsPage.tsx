import { useEffect, useState } from 'react'
import { DollarSign, ShoppingBag, Receipt, Package } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Card from '@/components/ui/Card'
import StatCard from '@/components/dashboard/StatCard'
import Badge from '@/components/ui/Badge'
import Field from '@/components/ui/Field'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import LoadingBlock from '@/components/ui/LoadingBlock'
import { usePageLoading } from '@/hooks/usePageLoading'
import { api, ApiError } from '@/lib/api'
import type { Payment } from '@/types/payment'
import type { Sale } from '@/types/sale'
import type { MembershipStatus } from '@/types/member'

interface ReportSummary {
  membership_revenue: number
  sales_revenue: number
  payments_count: number
  sales_count: number
  revenue_by_method: Record<string, number>
  memberships_by_status: Record<string, number>
  recent_payments: Payment[]
  recent_sales: Sale[]
}

const METHOD_KEY: Record<string, string> = {
  Cash: 'common.cash',
  Card: 'common.card',
  'Bank Transfer': 'common.bankTransfer',
  Other: 'common.other',
}

type Period = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom'

/** Formats using LOCAL date components rather than toISOString() (which
 * converts to UTC and can shift the date by a day in any timezone ahead of
 * UTC — bit us once already in the membership end-date calculator). */
function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Resolves a period preset to a concrete [start, end] date pair (both
 * inclusive), or null for "all time" / "custom" (custom uses its own
 * explicit start/end state instead). */
function presetRange(period: Period): { start: string; end: string } | null {
  const now = new Date()
  const end = formatLocalDate(now)

  switch (period) {
    case 'today':
      return { start: end, end }
    case 'week': {
      // Monday-start week, matching common ISO-week convention.
      const dayIndex = (now.getDay() + 6) % 7
      const start = new Date(now)
      start.setDate(now.getDate() - dayIndex)
      return { start: formatLocalDate(start), end }
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: formatLocalDate(start), end }
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1)
      return { start: formatLocalDate(start), end }
    }
    default:
      return null
  }
}

export default function ReportsPage() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<Period>('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  usePageLoading(isLoading)

  useEffect(() => {
    setIsLoading(true)
    const params = new URLSearchParams()
    const range = period === 'custom' ? { start: customStart, end: customEnd } : presetRange(period)
    if (range?.start) params.set('start_date', range.start)
    if (range?.end) params.set('end_date', range.end)

    api
      .get<ReportSummary>(`/reports/summary?${params.toString()}`)
      .then(setSummary)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Failed to load reports.'))
      .finally(() => setIsLoading(false))
  }, [period, customStart, customEnd])

  const periodControls = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Field label={t('reports.period')} className="sm:w-48">
        <Select value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
          <option value="all">{t('reports.allTime')}</option>
          <option value="today">{t('reports.today')}</option>
          <option value="week">{t('reports.thisWeek')}</option>
          <option value="month">{t('reports.thisMonth')}</option>
          <option value="year">{t('reports.thisYear')}</option>
          <option value="custom">{t('reports.customRange')}</option>
        </Select>
      </Field>
      {period === 'custom' && (
        <>
          <Field label={t('reports.from')} className="sm:w-40">
            <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
          </Field>
          <Field label={t('reports.to')} className="sm:w-40">
            <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          </Field>
        </>
      )}
    </div>
  )

  if (isLoading && !summary) {
    return (
      <div className="space-y-6">
        {periodControls}
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingBlock message={t('reports.loadingReports')} />
        </div>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="space-y-6">
        {periodControls}
        <Card className="border-red-100 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10">
          {error ?? t('reports.noDataAvailable')}
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      {periodControls}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={DollarSign} iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" label={t('reports.membershipRevenue')} value={`$${summary.membership_revenue.toFixed(2)}`} />
        <StatCard icon={ShoppingBag} iconClassName="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400" label={t('reports.salesRevenue')} value={`$${summary.sales_revenue.toFixed(2)}`} />
        <StatCard icon={Receipt} iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" label={t('reports.paymentsRecorded')} value={summary.payments_count} />
        <StatCard icon={Package} iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400" label={t('reports.salesRecorded')} value={summary.sales_count} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">{t('reports.revenueByMethod')}</h2>
          {Object.keys(summary.revenue_by_method).length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">{t('reports.noPaymentsYet')}</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(summary.revenue_by_method).map(([method, total]) => (
                <li key={method} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-white/5">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{t(METHOD_KEY[method] ?? method)}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">${Number(total).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">{t('reports.membershipsByStatus')}</h2>
          {Object.keys(summary.memberships_by_status).length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">{t('reports.noMembershipsYet')}</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(summary.memberships_by_status).map(([status, count]) => (
                <li key={status} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-white/5">
                  <Badge status={status as MembershipStatus} />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">{t('reports.recentPayments')}</h2>
          {summary.recent_payments.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">{t('reports.noPaymentsYet')}</p>
          ) : (
            <ul className="space-y-2">
              {summary.recent_payments.map((p) => (
                <li key={p.payment_id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{p.member?.name ?? `Member #${p.member_id}`}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">${Number(p.net_amount).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">{t('reports.recentSales')}</h2>
          {summary.recent_sales.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">{t('reports.noSalesYet')}</p>
          ) : (
            <ul className="space-y-2">
              {summary.recent_sales.map((s) => (
                <li key={s.sale_id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{s.sale_no}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">${Number(s.net_amount).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
