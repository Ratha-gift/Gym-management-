import { useState } from 'react'
import { Eye, Pencil, Trash2, LogIn, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Member } from '@/types/member'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import RowActionsMenu, { type RowAction } from '@/components/ui/RowActionsMenu'
import Table, { type Column } from '@/components/ui/Table'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/context/ToastContext'

interface RecentMembersTableProps {
  members: Member[]
  loading?: boolean
  /** Scroll internally within the parent's available height instead of growing to fit all rows. */
  scroll?: boolean
  onView?: (member: Member) => void
  onEdit?: (member: Member) => void
  onDelete?: (member: Member) => void
  /** Called after a check-in/check-out completes, so the parent can refetch and pick up the new attendance state. */
  onAttendanceChange?: () => void
}
export default function RecentMembersTable({
  members,
  loading,
  scroll = false,
  onView,
  onEdit,
  onDelete,
  onAttendanceChange,
}: RecentMembersTableProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const [busyId, setBusyId] = useState<number | null>(null)

  async function toggleAttendance(member: Member) {
    setBusyId(member.member_id)
    try {
      if (member.open_attendance) {
        await api.patch(`/attendance/${member.open_attendance.attendance_id}`, { check_out: new Date().toISOString() })
        toast.success(t('attendance.checkedOutSuccess', { name: member.name }))
      } else {
        await api.post('/attendance', { member_id: member.member_id, method: 'Manual' })
        toast.success(t('attendance.checkedInSuccess', { name: member.name }))
      }
      onAttendanceChange?.()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update attendance.')
    } finally {
      setBusyId(null)
    }
  }

  const columns: Column<Member>[] = [
    { header: t('common.id'), accessor: 'member_code', width: 100 },
    {
      header: t('common.name'),
      accessor: 'name',
      width: 220,
      render: (member) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={member.name} size={34} />
          <span className="truncate font-medium text-gray-800 dark:text-gray-200" title={member.name}>
            {member.name}
          </span>
        </div>
      ),
    },
    {
      header: t('common.phone'),
      accessor: 'phone',
      width: 150,
      render: (member) => member.phone ?? '—',
    },
    {
      header: t('common.status'),
      accessor: 'membership_status',
      width: 130,
      render: (member) => <Badge status={member.membership_status} />,
    },
    {
      header: t('common.action'),
      width: 60,
      render: (member) => {
        const checkedIn = !!member.open_attendance
        const actions: RowAction[] = [
          {
            key: 'attendance',
            label: checkedIn ? t('common.checkOut') : t('common.checkIn'),
            icon: checkedIn ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />,
            disabled: busyId === member.member_id,
            onClick: () => toggleAttendance(member),
          },
          { key: 'view', label: t('common.view'), icon: <Eye className="h-4 w-4" />, onClick: () => onView?.(member) },
          { key: 'edit', label: t('common.edit'), icon: <Pencil className="h-4 w-4" />, onClick: () => onEdit?.(member) },
          {
            key: 'delete',
            label: t('common.delete'),
            icon: <Trash2 className="h-4 w-4" />,
            danger: true,
            onClick: () => onDelete?.(member),
          },
        ]
        return <RowActionsMenu actions={actions} />
      },
    },
  ]
  return (
    <Table
      data={members}
      columns={columns}
      loading={loading}
      autoHeight={!scroll}
      fillParent={scroll}
      emptyMessage={t('members.noMembersFound')}
    />
  )
}
