import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Camera, Eye, EyeOff, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import Field from '@/components/ui/Field'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import { api, ApiError } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import type { AuthUser } from '@/types/auth'

const MAX_PHOTO_BYTES = 2 * 1024 * 1024 // 2MB — stored as a base64 string on the user row, so keep it modest.

export default function EditProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, setUser } = useAuth()
  const { t } = useTranslation()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !user) return
    setError(null)
    setFirstName(user.first_name)
    setLastName(user.last_name)
    setEmail(user.email)
    setPhone(user.phone ?? '')
    setPhoto(user.photo ?? null)
    setCurrentPassword('')
    setNewPassword('')
    setNewPasswordConfirmation('')
    setShowPasswords(false)
  }, [open, user])

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

    const wantsPasswordChange = currentPassword || newPassword || newPasswordConfirmation
    if (wantsPasswordChange && (!currentPassword || !newPassword || !newPasswordConfirmation)) {
      setError('Fill in all three password fields to change your password.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const updated = await api.patch<AuthUser>('/me', {
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        photo,
      })
      setUser(updated)
      toast.success(t('profile.savedSuccess'))
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update profile.'
      setError(message)
      toast.error(message)
      setIsSubmitting(false)
      return
    }

    if (wantsPasswordChange) {
      try {
        await api.patch('/me/password', {
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: newPasswordConfirmation,
        })
        toast.success(t('profile.passwordChangedSuccess'))
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to update password.'
        setError(message)
        toast.error(message)
        setIsSubmitting(false)
        return
      }
    }

    setIsSubmitting(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={t('profile.title')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">{error}</p>}

        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar name={`${firstName} ${lastName}`.trim() || '—'} photo={photo} size={64} />
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
          <Field label={t('profile.firstName')}>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </Field>
          <Field label={t('profile.lastName')}>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </Field>
        </div>

        <Field label={t('profile.email')}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>

        <Field label={t('profile.phone')}>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>

        <div className="border-t border-gray-100 pt-4 dark:border-navy-700">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t('profile.changePassword')}</p>

          <div className="space-y-4">
            <Field label={t('password.current')}>
              <Input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t('password.new')}>
                <Input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  endAdornment={
                    <button
                      type="button"
                      onClick={() => setShowPasswords((v) => !v)}
                      className="text-gray-400 transition hover:text-gray-600 active:scale-90 dark:text-gray-500 dark:hover:text-gray-300"
                      tabIndex={-1}
                    >
                      {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
              </Field>
              <Field label={t('password.confirm')}>
                <Input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPasswordConfirmation}
                  onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                  autoComplete="new-password"
                />
              </Field>
            </div>
          </div>
        </div>

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
