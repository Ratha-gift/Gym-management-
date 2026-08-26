import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import Field from '@/components/ui/Field'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import type { Member } from '@/types/member'

interface MemberFormValues {
  first_name: string
  last_name: string
  gender: string
  date_of_birth: string
  phone: string
  email: string
  address: string
  status: string
}

const EMPTY: MemberFormValues = {
  first_name: '',
  last_name: '',
  gender: '',
  date_of_birth: '',
  phone: '',
  email: '',
  address: '',
  status: 'active',
}

interface MemberFormModalProps {
  open: boolean
  member: Member | null
  onClose: () => void
  onSaved: () => void
}

export default function MemberFormModal({ open, member, onClose, onSaved }: MemberFormModalProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const [values, setValues] = useState<MemberFormValues>(EMPTY)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setValues(
      member
        ? {
            first_name: member.first_name,
            last_name: member.last_name,
            gender: member.gender ?? '',
            date_of_birth: member.date_of_birth ?? '',
            phone: member.phone ?? '',
            email: member.email ?? '',
            address: member.address ?? '',
            status: member.status,
          }
        : EMPTY,
    )
  }, [open, member])

  function set<K extends keyof MemberFormValues>(key: K, value: MemberFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const payload = {
      ...values,
      gender: values.gender || null,
      date_of_birth: values.date_of_birth || null,
      email: values.email || null,
    }

    try {
      if (member) {
        await api.patch(`/members/${member.member_id}`, payload)
      } else {
        await api.post('/members', payload)
      }
      toast.success(t('members.savedSuccess'))
      onSaved()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save member.'
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={member ? t('members.editMember') : t('members.addMember')} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('members.firstName')}>
            <Input value={values.first_name} onChange={(e) => set('first_name', e.target.value)} required />
          </Field>
          <Field label={t('members.lastName')}>
            <Input value={values.last_name} onChange={(e) => set('last_name', e.target.value)} required />
          </Field>
          <Field label={t('members.gender')}>
            <Select value={values.gender} onChange={(e) => set('gender', e.target.value)}>
              <option value="">—</option>
              <option value="Male">{t('members.male')}</option>
              <option value="Female">{t('members.female')}</option>
              <option value="Other">{t('common.other')}</option>
            </Select>
          </Field>
          <Field label={t('members.dateOfBirth')}>
            <Input type="date" value={values.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)} />
          </Field>
          <Field label={t('common.phone')}>
            <Input value={values.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label={t('common.email')}>
            <Input type="email" value={values.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label={t('common.status')} className="sm:col-span-2">
            <Select value={values.status} onChange={(e) => set('status', e.target.value)}>
              <option value="active">{t('common.active')}</option>
              <option value="inactive">{t('common.inactive')}</option>
            </Select>
          </Field>
          <Field label={t('members.address')} className="sm:col-span-2">
            <Textarea value={values.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('common.saving') : member ? t('common.saveChanges') : t('members.addMember')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
