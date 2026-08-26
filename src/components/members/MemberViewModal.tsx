import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { api } from '@/lib/api'
import type { Member, Membership } from '@/types/member'
import type { MembershipPackage } from '@/types/package'
import type { Payment } from '@/types/payment'

interface MemberDetail extends Member {
  memberships: (Membership & { package?: MembershipPackage })[]
  payments: Payment[]
}

export default function MemberViewModal({
  member,
  onClose,
}: {
  member: Member | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [detail, setDetail] = useState<MemberDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!member) {
      setDetail(null)
      return
    }
    setIsLoading(true)
    api
      .get<MemberDetail>(`/members/${member.member_id}`)
      .then(setDetail)
      .finally(() => setIsLoading(false))
  }, [member])

  if (!member) return null

  return (
    <Modal open={!!member} onClose={onClose} title={t('members.memberDetails')} size="lg">
      <div className="flex items-center gap-4">
        <Avatar name={member.name} size={56} />
        <div>
          <p className="text-lg font-bold text-gray-900">{member.name}</p>
          <p className="text-sm text-gray-400">
            {member.member_code} &middot; {member.phone ?? '—'} &middot; {member.email ?? '—'}
          </p>
        </div>
        <Badge status={member.membership_status} />
      </div>

      {isLoading && <p className="mt-6 text-sm text-gray-400">{t('members.loadingHistory')}</p>}

      {detail && (
        <div className="mt-6 space-y-6">
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{t('members.memberships')}</h4>
            {detail.memberships.length === 0 ? (
              <p className="text-sm text-gray-400">{t('members.noMembershipHistory')}</p>
            ) : (
              <ul className="space-y-2">
                {detail.memberships.map((m) => (
                  <li key={m.membership_id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <span className="font-medium text-gray-700">{m.package?.package_name ?? `Package #${m.package_id}`}</span>
                    <span className="text-gray-400">
                      {new Date(m.start_date).toLocaleDateString()} → {new Date(m.end_date).toLocaleDateString()}
                    </span>
                    <Badge status={m.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{t('members.payments')}</h4>
            {detail.payments.length === 0 ? (
              <p className="text-sm text-gray-400">{t('members.noPaymentsYet')}</p>
            ) : (
              <ul className="space-y-2">
                {detail.payments.map((p) => (
                  <li key={p.payment_id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <span className="text-gray-400">{new Date(p.payment_date).toLocaleDateString()}</span>
                    <span className="font-medium text-gray-700">{p.payment_method}</span>
                    <span className="font-semibold text-gray-900">${Number(p.net_amount).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Modal>
  )
}
