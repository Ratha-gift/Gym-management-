import { Printer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import IconButton from '@/components/ui/IconButton'
import PaymentReceiptContent from './PaymentReceiptContent'
import type { Payment } from '@/types/payment'

export default function PaymentViewModal({ payment, onClose }: { payment: Payment | null; onClose: () => void }) {
  const { t } = useTranslation()
  if (!payment) return null

  return (
    <Modal open={!!payment} onClose={onClose} title={t('payments.receipt')} size="sm">
      <PaymentReceiptContent payment={payment} />

      <div className="mt-6 flex justify-end gap-3 print:hidden">
        <Button variant="outline" onClick={onClose}>
          {t('common.close')}
        </Button>
        <IconButton
          icon={<Printer className="h-4 w-4" />}
          tone="solid"
          onClick={() => window.print()}
          aria-label={t('payments.print')}
          title={t('payments.print')}
          className="h-11 w-11 rounded-lg"
        />
      </div>
    </Modal>
  )
}
