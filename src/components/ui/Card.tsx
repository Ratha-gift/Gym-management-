import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Drops the border/shadow so the card reads as a plain white panel instead
   * of a floating box — used for full-page containers (a table page's
   * toolbar+table) that sit on the thin gray gutter main provides, with just
   * a small border radius rather than the bigger "elevated" card look. */
  flat?: boolean
}

export default function Card({ className = '', flat = false, ...props }: CardProps) {
  return (
    <div
      className={`bg-white ${flat ? 'rounded-lg' : 'rounded-2xl border border-gray-100 shadow-sm shadow-gray-200/60'} ${className}`}
      {...props}
    />
  )
}
