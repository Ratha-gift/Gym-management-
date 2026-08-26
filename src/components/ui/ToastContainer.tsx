import { createPortal } from 'react-dom'
import { CheckCircle2, XCircle, X } from 'lucide-react'
import { useToast } from '@/context/ToastContext'

const STYLES = {
  success: { icon: CheckCircle2, iconClass: 'text-emerald-500', barClass: 'bg-emerald-500' },
  error: { icon: XCircle, iconClass: 'text-red-500', barClass: 'bg-red-500' },
}

/** Stacked, self-dismissing toast notifications for action feedback (save/delete/etc.)
 * across the whole app — portalled to <body> for the same reason as Modal. */
export default function ToastContainer() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => {
        const { icon: Icon, iconClass, barClass } = STYLES[toast.type]
        return (
          <div
            key={toast.id}
            className="animate-toast-in pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl bg-white py-3 pl-4 pr-3 shadow-2xl ring-1 ring-black/5"
          >
            <span className={`absolute inset-y-0 left-0 w-1 ${barClass}`} />
            <Icon className={`h-5 w-5 shrink-0 ${iconClass}`} />
            <p className="min-w-0 flex-1 pt-0.5 text-sm text-gray-700">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-300 transition hover:bg-gray-100 hover:text-gray-500 active:scale-90"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>,
    document.body,
  )
}
