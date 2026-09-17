import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import PaymentReceiptContent from './PaymentReceiptContent'
import type { Payment } from '@/types/payment'

/**
 * Prints a receipt straight from a table row's Print action, without ever
 * flashing the full View Receipt modal open on screen first. Portaled
 * directly to <body> (a sibling of #root, not a descendant — same trick as
 * Modal.tsx's own print target) and kept `hidden` until `@media print`
 * switches it to `print:block`, so on screen it has zero footprint: no
 * backdrop, no dialog, nothing visible at all until the OS print dialog
 * itself appears.
 */
export default function QuickPrintReceipt({ payment, onDone }: { payment: Payment | null; onDone: () => void }) {
  useEffect(() => {
    if (!payment) return

    const timer = setTimeout(() => window.print(), 50)
    // `afterprint` fires once the print dialog is dismissed (printed or
    // cancelled either way) — that's the cue to unmount this again.
    window.addEventListener('afterprint', onDone)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('afterprint', onDone)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment])

  if (!payment) return null

  return createPortal(
    <div className="hidden print:block">
      <PaymentReceiptContent payment={payment} />
    </div>,
    document.body,
  )
}
