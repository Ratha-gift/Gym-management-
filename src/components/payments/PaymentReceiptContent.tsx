import { useTranslation } from 'react-i18next'
import { useSetting } from '@/hooks/useSetting'
import type { Payment, PaymentMethod } from '@/types/payment'

const METHOD_KEY: Record<PaymentMethod, string> = {
  Cash: 'common.cash',
  Card: 'common.card',
  'Bank Transfer': 'common.bankTransfer',
  Other: 'common.other',
}

/** The actual printable receipt markup — shared between the on-screen View
 * Receipt modal and the row-level "quick print" action, so both produce the
 * exact same `.print-receipt` output without duplicating this JSX. */
export default function PaymentReceiptContent({ payment }: { payment: Payment }) {
  const { t } = useTranslation()
  const gymName = useSetting('gym_name')
  const gymPhone = useSetting('gym_phone')
  const gymAddress = useSetting('gym_address')
  const contactLine = [gymAddress, gymPhone].filter(Boolean).join(' · ')

  return (
    <div className="print-receipt space-y-4 text-sm">
      {/* Business header — printed receipts leave the modal's own title bar
          behind (it's print:hidden), so the identity of who issued the
          receipt has to live inside the printable content itself. */}
      <div className="text-center">
        <p className="text-base font-bold text-gray-900 dark:text-gray-100">{gymName || t('app.name')}</p>
        {contactLine && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{contactLine}</p>}
        <div className="mt-3 border-t border-dashed border-gray-200 dark:border-navy-700" />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-gray-400 dark:text-gray-500">{t('payments.receiptNo')}</span>
        <span className="font-semibold text-gray-900 dark:text-gray-100">{payment.receipt?.receipt_no ?? '—'}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-400 dark:text-gray-500">{t('membership.member')}</span>
        <span className="font-medium text-gray-800 dark:text-gray-200">{payment.member?.name}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-400 dark:text-gray-500">{t('payments.date')}</span>
        <span className="text-gray-700 dark:text-gray-300">{new Date(payment.payment_date).toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-400 dark:text-gray-500">{t('payments.method')}</span>
        <span className="text-gray-700 dark:text-gray-300">{t(METHOD_KEY[payment.payment_method])}</span>
      </div>

      {payment.details && payment.details.length > 0 && (
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-white/5">
          {payment.details.map((d) => (
            <div key={d.payment_detail_id} className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>{d.description}</span>
              <span>${Number(d.amount).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-gray-100 pt-3 dark:border-navy-700">
        <div className="flex justify-between text-gray-500 dark:text-gray-400">
          <span>{t('payments.subtotal')}</span>
          <span>${Number(payment.amount).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-500 dark:text-gray-400">
          <span>{t('payments.discount')}</span>
          <span>-${Number(payment.discount).toFixed(2)}</span>
        </div>
        <div className="mt-1 flex justify-between text-base font-bold text-gray-900 dark:text-gray-100">
          <span>{t('payments.total')}</span>
          <span>${Number(payment.net_amount).toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-gray-200 pt-3 text-center text-xs text-gray-400 dark:border-navy-700 dark:text-gray-500">
        {t('payments.thankYou')}
      </div>
    </div>
  )
}
