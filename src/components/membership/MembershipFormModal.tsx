import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import Field from '@/components/ui/Field'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import SearchableSelect from '@/components/ui/SearchableSelect'
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

/** Formats a Date using LOCAL components as a `date` input value
 * (`YYYY-MM-DD`) rather than toISOString() (which converts to UTC and can
 * shift the date in any timezone ahead of UTC — bit us once already). */
function formatDateLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parses a `date` input value (`YYYY-MM-DD`) into LOCAL midnight, rather
 * than `new Date(value)` — which treats a bare date string as UTC midnight
 * and can shift it a day in either direction once local timezone math
 * (getDate/setDate) is applied to it. */
function parseDateLocal(value: string): Date {
  const [y, m, day] = value.split('-').map(Number)
  return new Date(y, m - 1, day)
}

/** Mirrors the backend's own end-date math (MembershipController::store) so
 * the form can show it before submitting — the server remains the source of
 * truth and recomputes it independently on save. Membership is day-based
 * (actual visit times are tracked separately by Attendance), so this stays
 * a plain date with no time-of-day component. */
function computeEndDate(startDate: string, pkg: MembershipPackage | undefined): string {
  if (!pkg || !startDate) return ''
  const end = parseDateLocal(startDate)
  if (Number.isNaN(end.getTime())) return ''
  if (pkg.duration_type === 'days') end.setDate(end.getDate() + pkg.duration_value)
  else if (pkg.duration_type === 'weeks') end.setDate(end.getDate() + pkg.duration_value * 7)
  else if (pkg.duration_type === 'months') end.setMonth(end.getMonth() + pkg.duration_value)
  return formatDateLocal(end)
}

export default function MembershipFormModal({ open, membership, onClose, onSaved }: MembershipFormModalProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const [members, setMembers] = useState<Member[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [packages, setPackages] = useState<MembershipPackage[]>([])
  const [memberId, setMemberId] = useState('')
  const [packageId, setPackageId] = useState('')
  const [startDate, setStartDate] = useState(() => formatDateLocal(new Date()))
  const [status, setStatus] = useState<MembershipRecord['status']>('active')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedPackage = packages.find((p) => String(p.package_id) === packageId)
  const endDate = computeEndDate(startDate, selectedPackage)

  useEffect(() => {
    if (!open) return
    setError(null)

    if (!membership) {
      setIsLoadingMembers(true)
      Promise.all([
        api.get<Paginated<Member>>('/members?per_page=500'),
        api.get<MembershipPackage[]>('/membership-packages'),
      ])
        .then(([memberRes, packageRes]) => {
          setMembers(memberRes.data)
          setPackages(packageRes.filter((p) => p.status === 'active'))
        })
        .finally(() => setIsLoadingMembers(false))
      setMemberId('')
      setPackageId('')
      setStartDate(formatDateLocal(new Date()))
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
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">{error}</p>}

        {membership ? (
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-white/5 dark:text-gray-400">
            <p className="font-semibold text-gray-800 dark:text-gray-200">{membership.member?.name}</p>
            <p>{membership.package?.package_name}</p>
            <p className="text-gray-400 dark:text-gray-500">
              {new Date(membership.start_date).toLocaleDateString()} → {new Date(membership.end_date).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <>
            <Field label={t('membership.member')}>
              <SearchableSelect
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                placeholder={t('membership.selectMember')}
                loading={isLoadingMembers}
                options={members.map((m) => ({ value: String(m.member_id), label: `${m.member_code} — ${m.name}` }))}
              />
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
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('membership.startDate')}>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </Field>
              <Field label={t('membership.endDate')}>
                <Input type="date" value={endDate} disabled />
              </Field>
            </div>
            <p className="-mt-2 text-xs text-gray-400 dark:text-gray-500">{t('membership.endDateHint')}</p>
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
