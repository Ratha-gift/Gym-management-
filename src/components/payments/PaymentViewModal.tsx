import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import type { Payment, PaymentMethod } from '@/types/payment'

const METHOD_KEY: Record<PaymentMethod, string> = {
  Cash: 'common.cash',
  Card: 'common.card',
  'Bank Transfer': 'common.bankTransfer',
  Other: 'common.other',
}

export default function PaymentViewModal({ payment, onClose }: { payment: Payment | null; onClose: () => void }) {
  const { t } = useTranslation()
  if (!payment) return null

  return (
    <Modal open={!!payment} onClose={onClose} title={t('payments.receipt')} size="sm">
      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">{t('payments.receiptNo')}</span>
          <span className="font-semibold text-gray-900">{payment.receipt?.receipt_no ?? '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">{t('membership.member')}</span>
          <span className="font-medium text-gray-800">{payment.member?.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">{t('payments.date')}</span>
          <span className="text-gray-700">{new Date(payment.payment_date).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">{t('payments.method')}</span>
          <span className="text-gray-700">{t(METHOD_KEY[payment.payment_method])}</span>
        </div>

        {payment.details && payment.details.length > 0 && (
          <div className="rounded-lg bg-gray-50 p-3">
            {payment.details.map((d) => (
              <div key={d.payment_detail_id} className="flex justify-between text-gray-600">
                <span>{d.description}</span>
                <span>${Number(d.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-gray-100 pt-3">
          <div className="flex justify-between text-gray-500">
            <span>{t('payments.subtotal')}</span>
            <span>${Number(payment.amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>{t('payments.discount')}</span>
            <span>-${Number(payment.discount).toFixed(2)}</span>
          </div>
          <div className="mt-1 flex justify-between text-base font-bold text-gray-900">
            <span>{t('payments.total')}</span>
            <span>${Number(payment.net_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}
