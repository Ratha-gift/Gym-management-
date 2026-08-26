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
import type { MembershipPackage } from '@/types/package'

interface PackageFormValues {
  package_name: string
  duration_type: 'days' | 'weeks' | 'months'
  duration_value: string
  price: string
  description: string
  status: 'active' | 'inactive'
}

const EMPTY: PackageFormValues = {
  package_name: '',
  duration_type: 'months',
  duration_value: '1',
  price: '',
  description: '',
  status: 'active',
}

interface PackageFormModalProps {
  open: boolean
  pkg: MembershipPackage | null
  onClose: () => void
  onSaved: () => void
}

export default function PackageFormModal({ open, pkg, onClose, onSaved }: PackageFormModalProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const [values, setValues] = useState<PackageFormValues>(EMPTY)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setValues(
      pkg
        ? {
            package_name: pkg.package_name,
            duration_type: pkg.duration_type,
            duration_value: String(pkg.duration_value),
            price: String(pkg.price),
            description: pkg.description ?? '',
            status: pkg.status,
          }
        : EMPTY,
    )
  }, [open, pkg])

  function set<K extends keyof PackageFormValues>(key: K, value: PackageFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const payload = {
      package_name: values.package_name,
      duration_type: values.duration_type,
      duration_value: Number(values.duration_value),
      price: Number(values.price),
      description: values.description || null,
      status: values.status,
    }

    try {
      if (pkg) {
        await api.patch(`/membership-packages/${pkg.package_id}`, payload)
      } else {
        await api.post('/membership-packages', payload)
      }
      toast.success(t('packages.savedSuccess'))
      onSaved()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save package.'
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={pkg ? t('packages.editPackage') : t('packages.addPackage')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <Field label={t('packages.packageName')}>
          <Input value={values.package_name} onChange={(e) => set('package_name', e.target.value)} required />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t('packages.duration')}>
            <Input
              type="number"
              min={1}
              value={values.duration_value}
              onChange={(e) => set('duration_value', e.target.value)}
              required
            />
          </Field>
          <Field label={t('packages.unit')}>
            <Select value={values.duration_type} onChange={(e) => set('duration_type', e.target.value as PackageFormValues['duration_type'])}>
              <option value="days">{t('common.days')}</option>
              <option value="weeks">{t('common.weeks')}</option>
              <option value="months">{t('common.months')}</option>
            </Select>
          </Field>
        </div>

        <Field label={t('packages.price')}>
          <Input type="number" min={0} step="0.01" value={values.price} onChange={(e) => set('price', e.target.value)} required />
        </Field>

        <Field label={t('common.status')}>
          <Select value={values.status} onChange={(e) => set('status', e.target.value as PackageFormValues['status'])}>
            <option value="active">{t('common.active')}</option>
            <option value="inactive">{t('common.inactive')}</option>
          </Select>
        </Field>

        <Field label={t('common.description')}>
          <Textarea value={values.description} onChange={(e) => set('description', e.target.value)} />
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('common.saving') : pkg ? t('common.saveChanges') : t('packages.addPackage')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
