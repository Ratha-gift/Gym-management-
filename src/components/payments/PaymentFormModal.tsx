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
import type { PaymentMethod } from '@/types/payment'
import type { Paginated } from '@/types/pagination'

interface PaymentFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export default function PaymentFormModal({ open, onClose, onSaved }: PaymentFormModalProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const [members, setMembers] = useState<Member[]>([])
  const [memberId, setMemberId] = useState('')
  const [amount, setAmount] = useState('')
  const [discount, setDiscount] = useState('0')
  const [method, setMethod] = useState<PaymentMethod>('Cash')
  const [referenceNo, setReferenceNo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setMemberId('')
    setAmount('')
    setDiscount('0')
    setMethod('Cash')
    setReferenceNo('')
    api.get<Paginated<Member>>('/members?per_page=500').then((res) => setMembers(res.data))
  }, [open])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await api.post('/payments', {
        member_id: Number(memberId),
        amount: Number(amount),
        discount: Number(discount || 0),
        payment_method: method,
        reference_no: referenceNo || null,
        details: [{ description: 'Membership payment', amount: Number(amount) }],
      })
      toast.success(t('payments.savedSuccess'))
      onSaved()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to record payment.'
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('payments.recordPayment')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

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

        <div className="grid grid-cols-2 gap-4">
          <Field label={t('payments.amount')}>
            <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </Field>
          <Field label={t('payments.discount')}>
            <Input type="number" min={0} step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </Field>
        </div>

        <Field label={t('payments.method')}>
          <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            <option value="Cash">{t('common.cash')}</option>
            <option value="Card">{t('common.card')}</option>
            <option value="Bank Transfer">{t('common.bankTransfer')}</option>
            <option value="Other">{t('common.other')}</option>
          </Select>
        </Field>

        <Field label={t('payments.referenceNo')}>
          <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} />
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('payments.recording') : t('payments.recordPayment')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
