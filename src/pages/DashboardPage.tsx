import { Users, UserCheck, UserX, Gift, Users2, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import StatCard from '@/components/dashboard/StatCard'
import RecentMembersTable from '@/components/dashboard/RecentMembersTable'
import { useDashboard } from '@/hooks/useDashboard'
import { usePageLoading } from '@/hooks/usePageLoading'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { stats, recentMembers, isLoading, error, refetch } = useDashboard()
  usePageLoading(isLoading)

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {error} — is the backend running at the configured API URL?
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          iconClassName="bg-brand-50 text-brand-600"
          label={t('dashboard.totalMembers')}
          value={isLoading ? '—' : (stats?.total_members ?? 0)}
        />
        <StatCard
          icon={UserCheck}
          iconClassName="bg-emerald-50 text-emerald-600"
          label={t('dashboard.activeMembers')}
          value={isLoading ? '—' : (stats?.active_members ?? 0)}
        />
        <StatCard
          icon={UserX}
          iconClassName="bg-amber-50 text-amber-600"
          label={t('dashboard.expiredMembers')}
          value={isLoading ? '—' : (stats?.expired_members ?? 0)}
        />
        <StatCard
          icon={Gift}
          iconClassName="bg-violet-50 text-violet-600"
          label={t('dashboard.packages')}
          value={isLoading ? '—' : (stats?.packages ?? 0)}
        />
      </div>

      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <Users2 className="h-5 w-5 text-brand-600" />
            {t('dashboard.recentMembers')}
          </h2>
          <Button variant="ghost" className="h-auto px-2 text-sm text-brand-600 hover:bg-transparent hover:underline" onClick={() => navigate('/members')}>
            {t('dashboard.viewAllMembers')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <RecentMembersTable members={recentMembers} loading={isLoading} onAttendanceChange={refetch} />
      </Card>
    </div>
  )
}
