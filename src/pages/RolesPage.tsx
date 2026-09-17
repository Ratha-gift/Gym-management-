import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, ShieldCheck, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import IconButton from '@/components/ui/IconButton'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import LoadingBlock from '@/components/ui/LoadingBlock'
import EmptyState from '@/components/ui/EmptyState'
import RoleFormModal from '@/components/roles/RoleFormModal'
import PermissionFormModal from '@/components/roles/PermissionFormModal'
import { usePageLoading } from '@/hooks/usePageLoading'
import { useToast } from '@/context/ToastContext'
import { api, ApiError } from '@/lib/api'
import type { Permission, Role } from '@/types/role'

export default function RolesPage() {
  const { t } = useTranslation()
  const toast = useToast()

  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [dirty, setDirty] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingRole, setIsLoadingRole] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  usePageLoading(isLoading)

  const [roleFormOpen, setRoleFormOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)
  const [isDeletingRole, setIsDeletingRole] = useState(false)

  const [permissionFormOpen, setPermissionFormOpen] = useState(false)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null)
  const [deletingPermission, setDeletingPermission] = useState<Permission | null>(null)
  const [isDeletingPermission, setIsDeletingPermission] = useState(false)

  function loadAll() {
    setIsLoading(true)
    setError(null)
    Promise.all([api.get<Role[]>('/roles'), api.get<Permission[]>('/permissions')])
      .then(([rolesData, permissionsData]) => {
        setRoles(rolesData)
        setPermissions(permissionsData)
        setSelectedRoleId((prev) => prev ?? rolesData[0]?.role_id ?? null)
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Failed to load roles.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(loadAll, [])

  useEffect(() => {
    if (!selectedRoleId) return
    setIsLoadingRole(true)
    api
      .get<Role>(`/roles/${selectedRoleId}`)
      .then((role) => {
        setCheckedIds(new Set((role.permissions ?? []).map((p) => p.permission_id)))
        setDirty(false)
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Failed to load role permissions.'))
      .finally(() => setIsLoadingRole(false))
  }, [selectedRoleId])

  const modules = useMemo(() => {
    const set = new Set<string>()
    permissions.forEach((p) => set.add(p.module || t('roles.uncategorized')))
    return Array.from(set)
  }, [permissions, t])

  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>()
    permissions.forEach((p) => {
      const key = p.module || t('roles.uncategorized')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    })
    return Array.from(map.entries())
  }, [permissions, t])

  const selectedRole = roles.find((r) => r.role_id === selectedRoleId) ?? null

  function togglePermission(id: number) {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setDirty(true)
  }

  async function savePermissions() {
    if (!selectedRoleId) return
    setIsSaving(true)
    setError(null)
    try {
      await api.patch(`/roles/${selectedRoleId}/permissions`, { permission_ids: Array.from(checkedIds) })
      setDirty(false)
      toast.success(t('roles.permissionsSavedSuccess'))
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save permissions.'
      setError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function confirmDeleteRole() {
    if (!deletingRole) return
    setIsDeletingRole(true)
    try {
      await api.delete(`/roles/${deletingRole.role_id}`)
      setDeletingRole(null)
      if (selectedRoleId === deletingRole.role_id) setSelectedRoleId(null)
      toast.success(t('roles.roleDeletedSuccess'))
      loadAll()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete role.'
      setError(message)
      toast.error(message)
    } finally {
      setIsDeletingRole(false)
    }
  }

  async function confirmDeletePermission() {
    if (!deletingPermission) return
    setIsDeletingPermission(true)
    try {
      await api.delete(`/permissions/${deletingPermission.permission_id}`)
      setDeletingPermission(null)
      setPermissions((prev) => prev.filter((p) => p.permission_id !== deletingPermission.permission_id))
      setCheckedIds((prev) => {
        const next = new Set(prev)
        next.delete(deletingPermission.permission_id)
        return next
      })
      toast.success(t('roles.permissionDeletedSuccess'))
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete permission.'
      setError(message)
      toast.error(message)
    } finally {
      setIsDeletingPermission(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-6">
      {error && <Card className="shrink-0 border-red-100 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10">{error}</Card>}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="flex min-h-0 flex-col p-5 sm:p-6">
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('roles.title')}</h2>
            <Button
              onClick={() => {
                setEditingRole(null)
                setRoleFormOpen(true)
              }}
              className="h-9 px-3 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('roles.addRole')}
            </Button>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <LoadingBlock />
            ) : roles.length === 0 ? (
              <EmptyState message={t('roles.noRolesYet')} />
            ) : (
              roles.map((role) => (
                <button
                  key={role.role_id}
                  type="button"
                  onClick={() => setSelectedRoleId(role.role_id)}
                  className={`group flex w-full items-start justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition active:scale-[0.98] ${
                    selectedRoleId === role.role_id
                      ? 'border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10'
                      : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-200">{role.role_name}</p>
                    {role.description && <p className="truncate text-xs text-gray-400 dark:text-gray-500">{role.description}</p>}
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <Users className="h-3 w-3" />
                      {t('roles.usersCount', { count: role.users_count ?? 0 })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <IconButton
                      icon={<Pencil className="h-3.5 w-3.5" />}
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingRole(role)
                        setRoleFormOpen(true)
                      }}
                      aria-label={t('common.edit')}
                      className="h-7 w-7"
                    />
                    <IconButton
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                      tone="danger"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeletingRole(role)
                      }}
                      aria-label={t('common.delete')}
                      className="h-7 w-7"
                    />
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        <Card className="flex min-h-0 flex-col p-5 sm:p-6">
          {!selectedRole ? (
            <EmptyState message={t('roles.selectRolePrompt')} />
          ) : (
            <>
              <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100">
                  <ShieldCheck className="h-5 w-5 text-brand-600" />
                  {t('roles.permissionsFor', { name: selectedRole.role_name })}
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="h-9 px-3 text-xs"
                    onClick={() => {
                      setEditingPermission(null)
                      setPermissionFormOpen(true)
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t('roles.addPermission')}
                  </Button>
                  <Button className="h-9 px-3 text-xs" onClick={savePermissions} disabled={!dirty || isSaving}>
                    {isSaving ? t('common.saving') : t('roles.savePermissions')}
                  </Button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
                {isLoadingRole ? (
                  <LoadingBlock />
                ) : permissions.length === 0 ? (
                  <EmptyState message={t('roles.noPermissionsYet')} />
                ) : (
                  <div className="space-y-5">
                    {grouped.map(([module, items]) => (
                      <div key={module}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{module}</p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {items.map((permission) => (
                            <div
                              key={permission.permission_id}
                              className="group flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2.5 dark:border-navy-700"
                            >
                              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={checkedIds.has(permission.permission_id)}
                                  onChange={() => togglePermission(permission.permission_id)}
                                  className="h-4 w-4 shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-500/40 dark:border-navy-700 dark:bg-navy-900"
                                />
                                <span className="truncate text-sm text-gray-700 dark:text-gray-300">{permission.permission_name}</span>
                              </label>
                              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <IconButton
                                  icon={<Pencil className="h-3.5 w-3.5" />}
                                  onClick={() => {
                                    setEditingPermission(permission)
                                    setPermissionFormOpen(true)
                                  }}
                                  aria-label={t('common.edit')}
                                  className="h-7 w-7"
                                />
                                <IconButton
                                  icon={<Trash2 className="h-3.5 w-3.5" />}
                                  tone="danger"
                                  onClick={() => setDeletingPermission(permission)}
                                  aria-label={t('common.delete')}
                                  className="h-7 w-7"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>

      <RoleFormModal
        open={roleFormOpen}
        role={editingRole}
        onClose={() => setRoleFormOpen(false)}
        onSaved={(role) => {
          setRoleFormOpen(false)
          setSelectedRoleId(role.role_id)
          loadAll()
        }}
      />

      <PermissionFormModal
        open={permissionFormOpen}
        permission={editingPermission}
        modules={modules}
        onClose={() => setPermissionFormOpen(false)}
        onSaved={() => {
          setPermissionFormOpen(false)
          loadAll()
        }}
      />

      <ConfirmDialog
        open={!!deletingRole}
        title={t('roles.deleteRoleTitle')}
        message={t('roles.deleteRoleMessage', { name: deletingRole?.role_name })}
        isLoading={isDeletingRole}
        onConfirm={confirmDeleteRole}
        onCancel={() => setDeletingRole(null)}
      />

      <ConfirmDialog
        open={!!deletingPermission}
        title={t('roles.deletePermissionTitle')}
        message={t('roles.deletePermissionMessage', { name: deletingPermission?.permission_name })}
        isLoading={isDeletingPermission}
        onConfirm={confirmDeletePermission}
        onCancel={() => setDeletingPermission(null)}
      />
    </div>
  )
}
