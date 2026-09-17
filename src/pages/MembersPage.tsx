import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Pagination from '@/components/ui/Pagination'
import ListPageTemplate from '@/components/ui/ListPageTemplate'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import RecentMembersTable from '@/components/dashboard/RecentMembersTable'
import MemberFormModal from '@/components/members/MemberFormModal'
import MemberViewModal from '@/components/members/MemberViewModal'
import { usePageLoading } from '@/hooks/usePageLoading'
import { useToast } from '@/context/ToastContext'
import { api, ApiError } from '@/lib/api'
import type { Member } from '@/types/member'
import type { Paginated } from '@/types/pagination'

export default function MembersPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [members, setMembers] = useState<Member[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  usePageLoading(isLoading)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [viewingMember, setViewingMember] = useState<Member | null>(null)
  const [deletingMember, setDeletingMember] = useState<Member | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  function load() {
    setIsLoading(true)
    setError(null)
    const params = new URLSearchParams({ page: String(page), per_page: String(entriesPerPage) })
    if (search) params.set('search', search)
    if (status) params.set('status', status)

    api
      .get<Paginated<Member>>(`/members?${params.toString()}`)
      .then((res) => {
        setMembers(res.data)
        setLastPage(res.last_page)
        setTotal(res.total)
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Failed to load members.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, entriesPerPage, search, status])

  function openCreate() {
    setEditingMember(null)
    setFormOpen(true)
  }

  function openEdit(member: Member) {
    setEditingMember(member)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!deletingMember) return
    setIsDeleting(true)
    try {
      await api.delete(`/members/${deletingMember.member_id}`)
      setDeletingMember(null)
      toast.success(t('members.deletedSuccess'))
      load()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete member.'
      setError(message)
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-6">
      {error && <Card className="shrink-0 border-red-100 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10">{error}</Card>}

      <ListPageTemplate
        fillContent
        searchSlot={
          <Input
            icon={<Search className="h-4 w-4" />}
            placeholder={t('members.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setPage(1)
              setSearch(e.target.value)
            }}
            className="sm:max-w-xs"
          />
        }
        filterSlot={
          <Select
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value)
            }}
            className="sm:max-w-40"
          >
            <option value="">{t('common.allStatuses')}</option>
            <option value="active">{t('common.active')}</option>
            <option value="inactive">{t('common.inactive')}</option>
          </Select>
        }
        actionButton={
          <Button onClick={openCreate} className="shrink-0">
            <Plus className="h-4 w-4" />
            {t('members.addMember')}
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
        <RecentMembersTable
          members={members}
          loading={isLoading}
          scroll
          onView={setViewingMember}
          onEdit={openEdit}
          onDelete={setDeletingMember}
          onAttendanceChange={load}
        />
      </ListPageTemplate>

      <MemberFormModal
        open={formOpen}
        member={editingMember}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false)
          load()
        }}
      />

      <MemberViewModal member={viewingMember} onClose={() => setViewingMember(null)} />

      <ConfirmDialog
        open={!!deletingMember}
        title={t('members.deleteTitle')}
        message={t('members.deleteMessage', { name: deletingMember?.name })}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingMember(null)}
      />
    </div>
  )
}
