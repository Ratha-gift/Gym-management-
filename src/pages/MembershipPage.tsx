import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import RowActionsMenu, { type RowAction } from '@/components/ui/RowActionsMenu'
import Avatar from '@/components/ui/Avatar'
import Pagination from '@/components/ui/Pagination'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Table, { type Column } from '@/components/ui/Table'
import ListPageTemplate from '@/components/ui/ListPageTemplate'
import MembershipFormModal from '@/components/membership/MembershipFormModal'
import { usePageLoading } from '@/hooks/usePageLoading'
import { useToast } from '@/context/ToastContext'
import { api, ApiError } from '@/lib/api'
import type { MembershipRecord } from '@/types/membership'
import type { Paginated } from '@/types/pagination'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function MembershipPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [memberships, setMemberships] = useState<MembershipRecord[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  usePageLoading(isLoading)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingMembership, setEditingMembership] = useState<MembershipRecord | null>(null)
  const [deletingMembership, setDeletingMembership] = useState<MembershipRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  function load() {
    setIsLoading(true)
    setError(null)
    const params = new URLSearchParams({ page: String(page), per_page: String(entriesPerPage) })
    if (status) params.set('status', status)

    api
      .get<Paginated<MembershipRecord>>(`/memberships?${params.toString()}`)
      .then((res) => {
        setMemberships(res.data)
        setLastPage(res.last_page)
        setTotal(res.total)
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Failed to load memberships.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [page, entriesPerPage, status])

  function openEdit(membership: MembershipRecord) {
    setEditingMembership(membership)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!deletingMembership) return
    setIsDeleting(true)
    try {
      await api.delete(`/memberships/${deletingMembership.membership_id}`)
      setDeletingMembership(null)
      toast.success(t('membership.deletedSuccess'))
      load()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete membership.'
      setError(message)
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: Column<MembershipRecord>[] = [
    {
      header: t('membership.member'),
      width: 220,
      render: (m) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={m.member?.name ?? '—'} size={32} />
          <span className="truncate font-medium text-gray-800 dark:text-gray-200" title={m.member?.name ?? `Member #${m.member_id}`}>
            {m.member?.name ?? `Member #${m.member_id}`}
          </span>
        </div>
      ),
    },
    {
      header: t('membership.package'),
      width: 160,
      render: (m) => <span className="text-gray-600 dark:text-gray-400">{m.package?.package_name ?? '—'}</span>,
    },
    {
      header: t('membership.start'),
      width: 130,
      render: (m) => <span className="text-gray-500 dark:text-gray-400">{formatDate(m.start_date)}</span>,
    },
    {
      header: t('membership.end'),
      width: 130,
      render: (m) => <span className="text-gray-500 dark:text-gray-400">{formatDate(m.end_date)}</span>,
    },
    {
      header: t('common.status'),
      width: 130,
      render: (m) => <Badge status={m.status} />,
    },
    {
      header: t('common.action'),
      width: 60,
      render: (m) => {
        const actions: RowAction[] = [
          { key: 'edit', label: t('common.edit'), icon: <Pencil className="h-4 w-4" />, onClick: () => openEdit(m) },
          {
            key: 'delete',
            label: t('common.delete'),
            icon: <Trash2 className="h-4 w-4" />,
            danger: true,
            onClick: () => setDeletingMembership(m),
          },
        ]
        return <RowActionsMenu actions={actions} />
      },
    },
  ]

  return (
    <div className="flex h-full flex-col gap-6">
      {error && <Card className="shrink-0 border-red-100 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10">{error}</Card>}

      <ListPageTemplate
        fillContent
        filterSlot={
          <Select
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value)
            }}
            className="sm:max-w-45"
          >
            <option value="">{t('common.allStatuses')}</option>
            <option value="active">{t('common.active')}</option>
            <option value="frozen">{t('common.frozen')}</option>
            <option value="expired">{t('common.expired')}</option>
            <option value="terminated">{t('common.terminated')}</option>
          </Select>
        }
        actionButton={
          <Button
            onClick={() => {
              setEditingMembership(null)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            {t('membership.newMembership')}
          </Button>
        }
        pagination={
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
        }
      >
        <Table data={memberships} columns={columns} loading={isLoading} fillParent emptyMessage={t('membership.noMembershipsFound')} />
      </ListPageTemplate>

      <MembershipFormModal
        open={formOpen}
        membership={editingMembership}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false)
          load()
        }}
      />

      <ConfirmDialog
        open={!!deletingMembership}
        title={t('membership.deleteTitle')}
        message={t('membership.deleteMessage')}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingMembership(null)}
      />
    </div>
  )
}
