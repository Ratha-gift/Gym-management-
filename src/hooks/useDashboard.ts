import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '@/lib/api'
import type { Member } from '@/types/member'

interface MonthlySignup {
  month: string
  count: number
}

interface QuickStartProgress {
  member: boolean
  package: boolean
  payment: boolean
  attendance: boolean
}

interface DashboardStats {
  quick_start: QuickStartProgress
  total_members: number
  total_revenue: number
  revenue_this_month: number
  payments_this_month: number
  payments_count: number
  active_members: number
  frozen_members: number
  expired_members: number
  terminated_members: number
  packages: number
  new_members_this_month: number
  members_before_this_month: number
  monthly_signups: MonthlySignup[]
}

interface DashboardData {
  stats: DashboardStats | null
  recentMembers: Member[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useDashboard(): DashboardData {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentMembers, setRecentMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  const refetch = useCallback(() => setRefreshToken((prev) => prev + 1), [])

  useEffect(() => {
    let cancelled = false

    Promise.all([
      api.get<DashboardStats>('/dashboard/stats'),
      api.get<Member[]>('/dashboard/recent-members?limit=5'),
    ])
      .then(([statsData, membersData]) => {
        if (cancelled) return
        setStats(statsData)
        setRecentMembers(membersData)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Failed to load dashboard data.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [refreshToken])

  return { stats, recentMembers, isLoading, error, refetch }
}
