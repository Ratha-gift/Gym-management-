import { useState } from 'react'
import { Users, UserCheck, UserX, Gift, Users2, ChevronRight, DollarSign, TrendingUp, Receipt } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import StatCard from '@/components/dashboard/StatCard'
import RecentMembersTable from '@/components/dashboard/RecentMembersTable'
import MemberActivityDonut from '@/components/dashboard/MemberActivityDonut'
import DashboardQuickStart, { type QuickStartStep } from '@/components/dashboard/DashboardQuickStart'
import SignupsTrendChart from '@/components/dashboard/SignupsTrendChart'
import ActiveRateGauge from '@/components/dashboard/ActiveRateGauge'
import MemberFormModal from '@/components/members/MemberFormModal'
import MembershipFormModal from '@/components/membership/MembershipFormModal'
import PaymentFormModal from '@/components/payments/PaymentFormModal'
import { useDashboard } from '@/hooks/useDashboard'
import { usePageLoading } from '@/hooks/usePageLoading'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { stats, recentMembers, isLoading, error, refetch } = useDashboard()
  usePageLoading(isLoading)

  // Which quick-start step's form modal is open — each one pops up right
  // here on the dashboard instead of navigating away to its own page.
  const [openStep, setOpenStep] = useState<QuickStartStep | null>(null)

  function closeStepModal() {
    setOpenStep(null)
  }

  function handleStepSaved() {
    setOpenStep(null)
    refetch()
  }

  // "Attendance" isn't a simple add-form like the other three steps — it's
  // the member search/check-in flow that already lives on its own page, so
  // that step navigates there directly instead of opening a modal here.
  function handleStepClick(step: QuickStartStep) {
    if (step === 'attendance') {
      navigate('/attendance')
      return
    }
    setOpenStep(step)
  }

  // Quick-start progress is scoped to the single most-recently-added member
  // (computed server-side) — not "has anyone, ever, done this" — so adding
  // one new member advances the card by exactly one step instead of every
  // step lighting up green at once because some other, earlier member
  // already has a membership and a payment on file.
  const quickStartCompleted: Record<QuickStartStep, boolean> = stats?.quick_start ?? {
    member: false,
    package: false,
    payment: false,
    attendance: false,
  }

  const activeRate = stats && stats.total_members > 0 ? (stats.active_members / stats.total_members) * 100 : 0

  // Real growth vs 30 days ago — no invented trend numbers.
  const growthPercent =
    stats && stats.members_before_this_month > 0
      ? (stats.new_members_this_month / stats.members_before_this_month) * 100
      : null
  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-red-100 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10">
          {error} — is the backend running at the configured API URL?
        </Card>
      )}

      {/* Getting-started steps + member activity breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardQuickStart onStepClick={handleStepClick} completed={quickStartCompleted} />
        </div>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-3 text-sm font-bold text-gray-900 dark:text-gray-100">{t('dashboard.memberActivity')}</h2>
          <div className="h-52">
            {isLoading ? null : (
              <MemberActivityDonut
                active={stats?.active_members ?? 0}
                frozen={stats?.frozen_members ?? 0}
                expired={stats?.expired_members ?? 0}
                terminated={stats?.terminated_members ?? 0}
              />
            )}
          </div>
        </Card>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          iconClassName="bg-gradient-to-br from-brand-500 to-brand-700 text-white"
          label={t('dashboard.totalMembers')}
          value={isLoading ? '—' : (stats?.total_members ?? 0)}
        />
        <StatCard
          icon={Users2}
          iconClassName="bg-gradient-to-br from-sky-400 to-sky-600 text-white"
          label={t('dashboard.newMembersThisMonth')}
          value={isLoading ? '—' : (stats?.new_members_this_month ?? 0)}
          trend={
            growthPercent === null
              ? undefined
              : {
                  value: `${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(1)}% ${t('dashboard.vsLast30Days')}`,
                  direction: growthPercent >= 0 ? 'up' : 'down',
                }
          }
        />
        <StatCard
          icon={UserCheck}
          iconClassName="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white"
          label={t('dashboard.activeMembers')}
          value={isLoading ? '—' : (stats?.active_members ?? 0)}
        />
        <StatCard
          icon={UserX}
          iconClassName="bg-gradient-to-br from-amber-400 to-amber-600 text-white"
          label={t('dashboard.expiredMembers')}
          value={isLoading ? '—' : (stats?.expired_members ?? 0)}
        />
      </div>

      {/* Revenue cards — real figures from recorded payments, not derived
          from membership status like the cards above. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={DollarSign}
          iconClassName="bg-gradient-to-br from-violet-400 to-violet-600 text-white"
          label={t('dashboard.totalRevenue')}
          value={isLoading ? '—' : `$${(stats?.total_revenue ?? 0).toFixed(2)}`}
        />
        <StatCard
          icon={TrendingUp}
          iconClassName="bg-gradient-to-br from-teal-400 to-teal-600 text-white"
          label={t('dashboard.revenueThisMonth')}
          value={isLoading ? '—' : `$${(stats?.revenue_this_month ?? 0).toFixed(2)}`}
        />
        <StatCard
          icon={Receipt}
          iconClassName="bg-gradient-to-br from-rose-400 to-rose-600 text-white"
          label={t('dashboard.paymentsThisMonth')}
          value={isLoading ? '—' : (stats?.payments_this_month ?? 0)}
        />
      </div>

      {/* Signups trend + active-rate gauge */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2 sm:p-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">{t('dashboard.signupsTrend')}</h2>
            <span className="text-xs text-gray-400 dark:text-gray-500">{t('dashboard.last6Months')}</span>
          </div>
          <div className="h-56">{isLoading ? null : <SignupsTrendChart data={stats?.monthly_signups ?? []} />}</div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-1 text-sm font-bold text-gray-900 dark:text-gray-100">{t('dashboard.activeRate')}</h2>
          <div className="h-52">{isLoading ? null : <ActiveRateGauge percent={activeRate} />}</div>
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100">
            <Gift className="h-5 w-5 text-brand-600" />
            {t('dashboard.recentMembers')}
          </h2>
          <Button variant="ghost" className="h-auto px-2 text-sm text-brand-600 hover:bg-transparent hover:underline" onClick={() => navigate('/members')}>
            {t('dashboard.viewAllMembers')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <RecentMembersTable members={recentMembers} loading={isLoading} onAttendanceChange={refetch} />
      </Card>

      <MemberFormModal open={openStep === 'member'} member={null} onClose={closeStepModal} onSaved={handleStepSaved} />
      <MembershipFormModal open={openStep === 'package'} membership={null} onClose={closeStepModal} onSaved={handleStepSaved} />
      <PaymentFormModal open={openStep === 'payment'} onClose={closeStepModal} onSaved={handleStepSaved} />
    </div>
  )
}
