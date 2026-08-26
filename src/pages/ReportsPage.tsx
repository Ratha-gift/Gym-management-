import { useEffect, useState } from 'react'
import { DollarSign, ShoppingBag, Receipt, Package } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Card from '@/components/ui/Card'
import StatCard from '@/components/dashboard/StatCard'
import Badge from '@/components/ui/Badge'
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

export default function ReportsPage() {
  const { t } = useTranslation()
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  usePageLoading(isLoading)

  useEffect(() => {
    api
      .get<ReportSummary>('/reports/summary')
      .then(setSummary)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Failed to load reports.'))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoadingBlock message={t('reports.loadingReports')} />
      </div>
    )
  }

  if (error || !summary) {
    return <Card className="border-red-100 bg-red-50 p-4 text-sm text-red-600">{error ?? t('reports.noDataAvailable')}</Card>
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={DollarSign} iconClassName="bg-emerald-50 text-emerald-600" label={t('reports.membershipRevenue')} value={`$${summary.membership_revenue.toFixed(2)}`} />
        <StatCard icon={ShoppingBag} iconClassName="bg-brand-50 text-brand-600" label={t('reports.salesRevenue')} value={`$${summary.sales_revenue.toFixed(2)}`} />
        <StatCard icon={Receipt} iconClassName="bg-amber-50 text-amber-600" label={t('reports.paymentsRecorded')} value={summary.payments_count} />
        <StatCard icon={Package} iconClassName="bg-violet-50 text-violet-600" label={t('reports.salesRecorded')} value={summary.sales_count} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900">{t('reports.revenueByMethod')}</h2>
          {Object.keys(summary.revenue_by_method).length === 0 ? (
            <p className="text-sm text-gray-400">{t('reports.noPaymentsYet')}</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(summary.revenue_by_method).map(([method, total]) => (
                <li key={method} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <span className="font-medium text-gray-700">{t(METHOD_KEY[method] ?? method)}</span>
                  <span className="font-semibold text-gray-900">${Number(total).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900">{t('reports.membershipsByStatus')}</h2>
          {Object.keys(summary.memberships_by_status).length === 0 ? (
            <p className="text-sm text-gray-400">{t('reports.noMembershipsYet')}</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(summary.memberships_by_status).map(([status, count]) => (
                <li key={status} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <Badge status={status as MembershipStatus} />
                  <span className="font-semibold text-gray-900">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900">{t('reports.recentPayments')}</h2>
          {summary.recent_payments.length === 0 ? (
            <p className="text-sm text-gray-400">{t('reports.noPaymentsYet')}</p>
          ) : (
            <ul className="space-y-2">
              {summary.recent_payments.map((p) => (
                <li key={p.payment_id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{p.member?.name ?? `Member #${p.member_id}`}</span>
                  <span className="font-semibold text-gray-900">${Number(p.net_amount).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900">{t('reports.recentSales')}</h2>
          {summary.recent_sales.length === 0 ? (
            <p className="text-sm text-gray-400">{t('reports.noSalesYet')}</p>
          ) : (
            <ul className="space-y-2">
              {summary.recent_sales.map((s) => (
                <li key={s.sale_id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{s.sale_no}</span>
                  <span className="font-semibold text-gray-900">${Number(s.net_amount).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
