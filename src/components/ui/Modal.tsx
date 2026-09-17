import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  // Escape closes the modal the same as Cancel/the backdrop/the × button —
  // matches every other dismissible overlay in the app (Select, Dropdown,
  // RowActionsMenu already do this).
  useEffect(() => {
    if (!open) return
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  if (!open) return null

  // Portalled to <body> — several callers (e.g. the sidebar's user menu)
  // sit inside an ancestor with a `transform` applied (even a no-op
  // translate-x-0 for the mobile slide-in), which makes `position: fixed`
  // descendants position relative to that ancestor instead of the
  // viewport. Rendering at the document root sidesteps that entirely.
  return createPortal(
    // print:contents on both wrappers below — a caller (PaymentViewModal) can
    // mark part of its content `.print-receipt` to print just that instead
    // of the whole app. `animate-modal-pop`'s transform makes the panel a
    // containing block for any fixed-position descendant, which would
    // otherwise trap a `position: fixed` print target inside the modal's own
    // small centered box instead of the real page — display:contents removes
    // that box (and its size/position constraints) entirely under print.
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:contents">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 bg-black/50 backdrop-blur-sm print:hidden"
      />
      <div
        className={`animate-modal-pop relative max-h-[90vh] w-full ${SIZES[size]} overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-navy-800 print:contents`}
      >
        <div className="mb-4 flex items-center justify-between print:hidden">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 active:scale-90 dark:hover:bg-white/5 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
