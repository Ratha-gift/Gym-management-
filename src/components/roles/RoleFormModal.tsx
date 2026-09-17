import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import Field from '@/components/ui/Field'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import type { Role } from '@/types/role'

interface RoleFormModalProps {
  open: boolean
  role: Role | null
  onClose: () => void
  onSaved: (role: Role) => void
}

export default function RoleFormModal({ open, role, onClose, onSaved }: RoleFormModalProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const [roleName, setRoleName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setRoleName(role?.role_name ?? '')
    setDescription(role?.description ?? '')
  }, [open, role])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const payload = { role_name: roleName, description: description || null }
      const saved = role
        ? await api.patch<Role>(`/roles/${role.role_id}`, payload)
        : await api.post<Role>('/roles', payload)
      toast.success(t('roles.roleSavedSuccess'))
      onSaved(saved)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save role.'
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={role ? t('roles.editRole') : t('roles.addRole')} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">{error}</p>}

        <Field label={t('roles.roleName')}>
          <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} required />
        </Field>

        <Field label={t('common.description')}>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
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
