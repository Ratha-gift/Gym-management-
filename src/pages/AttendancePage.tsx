import { useEffect, useState } from 'react'
import { Search, LogIn, LogOut, UserCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import IconButton from '@/components/ui/IconButton'
import Pagination from '@/components/ui/Pagination'
import Table, { type Column } from '@/components/ui/Table'
import { usePageLoading } from '@/hooks/usePageLoading'
import { useToast } from '@/context/ToastContext'
import { api, ApiError } from '@/lib/api'
import type { Member } from '@/types/member'
import type { Attendance } from '@/types/attendance'
import type { Paginated } from '@/types/pagination'

const METHOD_KEY: Record<Attendance['method'], string> = {
  QR: 'attendance.qr',
  Manual: 'attendance.manual',
}

function formatTime(value: string) {
  return new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AttendancePage() {
  const { t } = useTranslation()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Member[]>([])
  const [searching, setSearching] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [log, setLog] = useState<Attendance[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  usePageLoading(isLoading)

  function loadLog() {
    setIsLoading(true)
    api
      .get<Paginated<Attendance>>(`/attendance?page=${page}&per_page=${entriesPerPage}`)
      .then((res) => {
        setLog(res.data)
        setLastPage(res.last_page)
        setTotal(res.total)
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Failed to load attendance.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(loadLog, [page, entriesPerPage])

  // Debounced member search.
  useEffect(() => {
    if (!search.trim()) {
      setResults([])
      return
    }
    setSearching(true)
    const timeout = setTimeout(() => {
      api
        .get<Paginated<Member>>(`/members?search=${encodeURIComponent(search)}&per_page=6`)
        .then((res) => setResults(res.data))
        .catch(() => setResults([]))
        .finally(() => setSearching(false))
    }, 300)
    return () => clearTimeout(timeout)
  }, [search])

  async function toggleAttendance(member: Member) {
    setBusyId(member.member_id)
    setError(null)
    try {
      if (member.open_attendance) {
        await api.patch(`/attendance/${member.open_attendance.attendance_id}`, { check_out: new Date().toISOString() })
        toast.success(t('attendance.checkedOutSuccess', { name: member.name }))
      } else {
        await api.post('/attendance', { member_id: member.member_id, method: 'Manual' })
        toast.success(t('attendance.checkedInSuccess', { name: member.name }))
      }
      setResults((prev) => prev.filter((m) => m.member_id !== member.member_id))
      loadLog()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update attendance.'
      setError(message)
      toast.error(message)
    } finally {
      setBusyId(null)
    }
  }

  const columns: Column<Attendance>[] = [
    {
      header: t('attendance.member'),
      width: 220,
      render: (a) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={a.member?.name ?? '—'} size={32} />
          <span className="truncate font-medium text-gray-800" title={a.member?.name ?? `Member #${a.member_id}`}>
            {a.member?.name ?? `Member #${a.member_id}`}
          </span>
        </div>
      ),
    },
    {
      header: t('attendance.checkIn'),
      width: 160,
      render: (a) => <span className="text-gray-500">{formatTime(a.check_in)}</span>,
    },
    {
      header: t('attendance.checkOut'),
      width: 160,
      render: (a) =>
        a.check_out ? (
          <span className="text-gray-500">{formatTime(a.check_out)}</span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t('attendance.stillCheckedIn')}
          </span>
        ),
    },
    {
      header: t('attendance.method'),
      width: 110,
      render: (a) => <span className="text-gray-600">{t(METHOD_KEY[a.method])}</span>,
    },
    {
      header: t('common.action'),
      width: 90,
      render: (a) =>
        !a.check_out && (
          <IconButton
            icon={<LogOut className="h-4 w-4" />}
            tone="warning"
            onClick={() => a.member && toggleAttendance(a.member)}
            disabled={!a.member || busyId === a.member_id}
            aria-label={t('common.checkOut')}
            title={t('common.checkOut')}
          />
        ),
    },
  ]

  return (
    <div className="flex h-full flex-col gap-6">
      {error && <Card className="shrink-0 border-red-100 bg-red-50 p-4 text-sm text-red-600">{error}</Card>}

      <Card flat className="shrink-0 p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
          <UserCheck className="h-5 w-5 text-brand-600" />
          {t('attendance.findMember')}
        </h2>

        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder={t('attendance.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-md"
        />

        {search.trim() && (
          <div className="mt-4 divide-y divide-gray-100 border-t border-gray-100">
            {searching ? (
              <p className="py-4 text-sm text-gray-400">{t('common.loading')}</p>
            ) : results.length === 0 ? (
              <p className="py-4 text-sm text-gray-400">{t('attendance.noMembersFound')}</p>
            ) : (
              results.map((member) => {
                const checkedIn = !!member.open_attendance
                return (
                  <div key={member.member_id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={member.name} size={36} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-800">{member.name}</p>
                        <p className="truncate text-xs text-gray-400">
                          {member.member_code}
                          {member.phone ? ` · ${member.phone}` : ''}
                          {checkedIn && member.open_attendance
                            ? ` · ${t('attendance.checkedInSince', { time: formatTime(member.open_attendance.check_in) })}`
                            : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleAttendance(member)}
                      disabled={busyId === member.member_id}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                        checkedIn ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {checkedIn ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                      {checkedIn ? t('common.checkOut') : t('common.checkIn')}
                    </button>
                  </div>
                )
              })
            )}
          </div>
        )}
      </Card>

      <Card flat className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
        <h2 className="mb-4 shrink-0 text-lg font-bold text-gray-900">{t('attendance.recentActivity')}</h2>

        <div className="min-h-0 flex-1">
          <Table data={log} columns={columns} loading={isLoading} fillParent emptyMessage={t('attendance.noRecordsFound')} />
        </div>

        <div className="shrink-0">
          <Pagination
            currentPage={page}
            lastPage={lastPage}
            total={total}
            entriesPerPage={entriesPerPage}
            onPageChange={setPage}
            onEntriesPerPageChange={(size) => {
              setEntriesPerPage(size)
              setPage(1)
            }}
            loading={isLoading}
          />
        </div>
      </Card>
    </div>
  )
}
