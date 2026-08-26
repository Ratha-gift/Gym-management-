import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  children: ReactNode
  className?: string
}

export default function Field({ label, children, className = '' }: FieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-gray-500">{label}</span>
      {children}
    </label>
  )
}
