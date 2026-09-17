import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Camera, Eye, EyeOff, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import Field from '@/components/ui/Field'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import type { GymUser } from '@/types/user'
import type { Role } from '@/types/role'

const MAX_PHOTO_BYTES = 2 * 1024 * 1024 // 2MB — stored as a base64 string on the user row, so keep it modest.

interface UserFormValues {
  first_name: string
  last_name: string
  email: string
  phone: string
  password: string
  role_id: string
  status: string
}

const EMPTY: UserFormValues = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  role_id: '',
  status: 'active',
}

interface UserFormModalProps {
  open: boolean
  user: GymUser | null
  roles: Role[]
  onClose: () => void
  onSaved: () => void
}

export default function UserFormModal({ open, user, roles, onClose, onSaved }: UserFormModalProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [values, setValues] = useState<UserFormValues>(EMPTY)
  const [photo, setPhoto] = useState<string | null>(null)
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setPhoto(user?.photo ?? null)
    setValues(
      user
        ? {
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone ?? '',
            password: '',
            role_id: user.role_id ? String(user.role_id) : '',
            status: user.status,
          }
        : EMPTY,
    )
    setPasswordConfirmation('')
    setShowPassword(false)
  }, [open, user])

  function set<K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('Image must be smaller than 2MB.')
      return
    }

    setError(null)
    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (values.password || passwordConfirmation) {
      if (values.password !== passwordConfirmation) {
        setError('Passwords do not match.')
        return
      }
    }

    setIsSubmitting(true)
    setError(null)

    const payload: Record<string, unknown> = {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      phone: values.phone || null,
      role_id: values.role_id ? Number(values.role_id) : null,
      photo,
      status: values.status,
    }
    if (values.password) payload.password = values.password

    try {
      if (user) {
        await api.patch(`/users/${user.user_id}`, payload)
      } else {
        await api.post('/users', payload)
      }
      toast.success(t('users.savedSuccess'))
      onSaved()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save user.'
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={user ? t('users.editUser') : t('users.addUser')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">{error}</p>}

        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar name={`${values.first_name} ${values.last_name}`.trim() || '—'} photo={photo} size={64} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm ring-2 ring-white transition hover:bg-brand-700 active:scale-90"
              aria-label={t('profile.changePhoto')}
              title={t('profile.changePhoto')}
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-semibold text-brand-600 transition hover:underline active:scale-95"
            >
              {t('profile.changePhoto')}
            </button>
            {photo && (
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="ml-3 inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-red-500 active:scale-95 dark:text-gray-500"
              >
                <X className="h-3.5 w-3.5" />
                {t('profile.removePhoto')}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('members.firstName')}>
            <Input value={values.first_name} onChange={(e) => set('first_name', e.target.value)} required />
          </Field>
          <Field label={t('members.lastName')}>
            <Input value={values.last_name} onChange={(e) => set('last_name', e.target.value)} required />
          </Field>
        </div>

        <Field label={t('common.email')}>
          <Input type="email" value={values.email} onChange={(e) => set('email', e.target.value)} required />
        </Field>

        <Field label={t('common.phone')}>
          <Input value={values.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={user ? t('users.newPasswordOptional') : t('password.new')}>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={values.password}
              onChange={(e) => set('password', e.target.value)}
              autoComplete="new-password"
              required={!user}
              placeholder={user ? t('users.leaveBlankToKeep') : undefined}
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-gray-400 transition hover:text-gray-600 active:scale-90 dark:text-gray-500 dark:hover:text-gray-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
          </Field>
          <Field label={t('password.confirm')}>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              autoComplete="new-password"
              required={!user}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('users.role')}>
            <Select value={values.role_id} onChange={(e) => set('role_id', e.target.value)}>
              <option value="">—</option>
              {roles.map((role) => (
                <option key={role.role_id} value={role.role_id}>
                  {role.role_name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('common.status')}>
            <Select value={values.status} onChange={(e) => set('status', e.target.value)}>
              <option value="active">{t('common.active')}</option>
              <option value="inactive">{t('common.inactive')}</option>
            </Select>
          </Field>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('common.saving') : user ? t('common.saveChanges') : t('users.addUser')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
