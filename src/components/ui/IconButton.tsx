import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  tone?: 'default' | 'brand' | 'danger' | 'success' | 'warning' | 'solid'
}

const TONES: Record<NonNullable<IconButtonProps['tone']>, string> = {
  default: 'bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10',
  brand: 'bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:hover:bg-brand-500/20',
  danger: 'bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20',
  success: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20',
  warning: 'bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20',
  /** Filled brand-blue square, white icon — for a solo icon action that
   * should read as the primary/main action (e.g. "Print" in a modal
   * footer), rather than the muted pastel tones meant for row actions. */
  solid: 'bg-brand-600 text-white shadow-sm shadow-brand-600/30 hover:bg-brand-700 dark:shadow-none',
}

export default function IconButton({ icon, tone = 'default', className = '', ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition outline-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-90 focus-visible:ring-2 focus-visible:ring-brand-500/40 ${TONES[tone]} ${className}`}
      {...props}
    >
      {icon}
    </button>
  )
}
