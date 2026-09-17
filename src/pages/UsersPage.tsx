import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import RowActionsMenu, { type RowAction } from '@/components/ui/RowActionsMenu'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Table, { type Column } from '@/components/ui/Table'
import ListPageTemplate from '@/components/ui/ListPageTemplate'
import UserFormModal from '@/components/users/UserFormModal'
import { usePageLoading } from '@/hooks/usePageLoading'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { api, ApiError } from '@/lib/api'
import type { GymUser } from '@/types/user'
import type { Role } from '@/types/role'

export default function UsersPage() {
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()
  const toast = useToast()

  const [users, setUsers] = useState<GymUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  usePageLoading(isLoading)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<GymUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<GymUser | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  function load() {
    setIsLoading(true)
    setError(null)
    Promise.all([api.get<GymUser[]>('/users'), api.get<Role[]>('/roles')])
      .then(([usersData, rolesData]) => {
        setUsers(usersData)
        setRoles(rolesData)
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Failed to load users.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [])

  function openCreate() {
    setEditingUser(null)
    setFormOpen(true)
  }

  function openEdit(user: GymUser) {
    setEditingUser(user)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!deletingUser) return
    setIsDeleting(true)
    try {
      await api.delete(`/users/${deletingUser.user_id}`)
      setDeletingUser(null)
      toast.success(t('users.deletedSuccess'))
      load()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete user.'
      setError(message)
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: Column<GymUser>[] = [
    {
      header: t('common.name'),
      width: 220,
      render: (user) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={user.name} photo={user.photo} size={34} />
          <span className="truncate font-medium text-gray-800 dark:text-gray-200" title={user.name}>
            {user.name}
          </span>
        </div>
      ),
    },
    {
      header: t('common.email'),
      width: 200,
      render: (user) => <span className="truncate text-gray-600 dark:text-gray-400">{user.email}</span>,
    },
    {
      header: t('common.phone'),
      width: 140,
      render: (user) => user.phone ?? '—',
    },
    {
      header: t('users.role'),
      width: 150,
      render: (user) => <span className="text-gray-600 dark:text-gray-400">{user.role?.role_name ?? '—'}</span>,
    },
    {
      header: t('common.status'),
      width: 120,
      render: (user) => <Badge status={user.status === 'active' ? 'active' : 'terminated'} />,
    },
    {
      header: t('common.action'),
      width: 60,
      render: (user) => {
        const isSelf = currentUser?.user_id === user.user_id
        const actions: RowAction[] = [
          { key: 'edit', label: t('common.edit'), icon: <Pencil className="h-4 w-4" />, onClick: () => openEdit(user) },
          {
            key: 'delete',
            label: t('common.delete'),
            icon: <Trash2 className="h-4 w-4" />,
            danger: true,
            disabled: isSelf,
            onClick: () => setDeletingUser(user),
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
        actionButton={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t('users.addUser')}
          </Button>
        }
      >
        <Table data={users} columns={columns} loading={isLoading} fillParent emptyMessage={t('users.noUsersFound')} />
      </ListPageTemplate>

      <UserFormModal
        open={formOpen}
        user={editingUser}
        roles={roles}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false)
          load()
        }}
      />

      <ConfirmDialog
        open={!!deletingUser}
        title={t('users.deleteTitle')}
        message={t('users.deleteMessage', { name: deletingUser?.name })}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingUser(null)}
      />
    </div>
  )
}
