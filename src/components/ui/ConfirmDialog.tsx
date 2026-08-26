import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <p className="text-sm text-gray-500">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          className="bg-red-600 shadow-red-600/30 hover:bg-red-700"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? t('common.deleting') : (confirmLabel ?? t('common.delete'))}
        </Button>
      </div>
    </Modal>
  )
}
