import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost'
  fullWidth?: boolean
}

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/30 dark:shadow-none',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:text-gray-300 dark:hover:bg-white/5',
  ghost: 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5',
}

export default function Button({
  variant = 'primary',
  fullWidth,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition outline-none disabled:cursor-not-allowed disabled:opacity-60 active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 ${VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    />
  )
}
