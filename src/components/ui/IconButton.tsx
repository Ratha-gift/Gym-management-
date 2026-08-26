import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  tone?: 'default' | 'brand' | 'danger' | 'success' | 'warning'
}

const TONES: Record<NonNullable<IconButtonProps['tone']>, string> = {
  default: 'bg-gray-50 text-gray-500 hover:bg-gray-100',
  brand: 'bg-brand-50 text-brand-600 hover:bg-brand-100',
  danger: 'bg-red-50 text-red-500 hover:bg-red-100',
  success: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
  warning: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
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
