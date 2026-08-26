import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import Field from '@/components/ui/Field'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import type { Permission } from '@/types/role'

interface PermissionFormModalProps {
  open: boolean
  permission: Permission | null
  modules: string[]
  onClose: () => void
  onSaved: (permission: Permission) => void
}

export default function PermissionFormModal({ open, permission, modules, onClose, onSaved }: PermissionFormModalProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const [permissionName, setPermissionName] = useState('')
  const [module, setModule] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setPermissionName(permission?.permission_name ?? '')
    setModule(permission?.module ?? '')
  }, [open, permission])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const payload = { permission_name: permissionName, module: module || null }
      const saved = permission
        ? await api.patch<Permission>(`/permissions/${permission.permission_id}`, payload)
        : await api.post<Permission>('/permissions', payload)
      toast.success(t('roles.permissionSavedSuccess'))
      onSaved(saved)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save permission.'
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={permission ? t('roles.editPermission') : t('roles.addPermission')} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <Field label={t('roles.permissionName')}>
          <Input value={permissionName} onChange={(e) => setPermissionName(e.target.value)} required />
        </Field>

        <Field label={t('roles.module')}>
          <Input value={module} onChange={(e) => setModule(e.target.value)} list="permission-modules" placeholder={t('roles.modulePlaceholder')} />
          <datalist id="permission-modules">
            {modules.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('common.saving') : t('common.saveChanges')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
