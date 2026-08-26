import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import Field from '@/components/ui/Field'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import type { Member } from '@/types/member'
import type { MembershipPackage } from '@/types/package'
import type { MembershipRecord } from '@/types/membership'
import type { Paginated } from '@/types/pagination'

interface MembershipFormModalProps {
  open: boolean
  membership: MembershipRecord | null
  onClose: () => void
  onSaved: () => void
}

export default function MembershipFormModal({ open, membership, onClose, onSaved }: MembershipFormModalProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const [members, setMembers] = useState<Member[]>([])
  const [packages, setPackages] = useState<MembershipPackage[]>([])
  const [memberId, setMemberId] = useState('')
  const [packageId, setPackageId] = useState('')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [status, setStatus] = useState<MembershipRecord['status']>('active')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)

    if (!membership) {
      Promise.all([
        api.get<Paginated<Member>>('/members?per_page=500'),
        api.get<MembershipPackage[]>('/membership-packages'),
      ]).then(([memberRes, packageRes]) => {
        setMembers(memberRes.data)
        setPackages(packageRes.filter((p) => p.status === 'active'))
      })
      setMemberId('')
      setPackageId('')
      setStartDate(new Date().toISOString().slice(0, 10))
      setStatus('active')
    } else {
      setStatus(membership.status)
    }
  }, [open, membership])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (membership) {
        await api.patch(`/memberships/${membership.membership_id}`, { status })
      } else {
        await api.post('/memberships', {
          member_id: Number(memberId),
          package_id: Number(packageId),
          start_date: startDate,
        })
      }
      toast.success(t('membership.savedSuccess'))
      onSaved()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save membership.'
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={membership ? t('membership.updateMembership') : t('membership.newMembership')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        {membership ? (
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
            <p className="font-semibold text-gray-800">{membership.member?.name}</p>
            <p>{membership.package?.package_name}</p>
            <p className="text-gray-400">
              {new Date(membership.start_date).toLocaleDateString()} → {new Date(membership.end_date).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <>
            <Field label={t('membership.member')}>
              <Select value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
                <option value="">{t('membership.selectMember')}</option>
                {members.map((m) => (
                  <option key={m.member_id} value={m.member_id}>
                    {m.member_code} — {m.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('membership.package')}>
              <Select value={packageId} onChange={(e) => setPackageId(e.target.value)} required>
                <option value="">{t('membership.selectPackage')}</option>
                {packages.map((p) => (
                  <option key={p.package_id} value={p.package_id}>
                    {p.package_name} — ${Number(p.price).toFixed(2)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('membership.startDate')}>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </Field>
          </>
        )}

        {membership && (
          <Field label={t('common.status')}>
            <Select value={status} onChange={(e) => setStatus(e.target.value as MembershipRecord['status'])}>
              <option value="active">{t('common.active')}</option>
              <option value="frozen">{t('common.frozen')}</option>
              <option value="expired">{t('common.expired')}</option>
              <option value="terminated">{t('common.terminated')}</option>
            </Select>
          </Field>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('common.saving') : membership ? t('common.saveChanges') : t('membership.newMembership')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
