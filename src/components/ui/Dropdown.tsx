import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface DropdownItem {
  key: string
  label: ReactNode
  icon?: ReactNode
  danger?: boolean
  onClick?: () => void
}

interface DropdownProps {
  trigger: ReactNode
  items: (DropdownItem | 'divider')[]
  align?: 'left' | 'right'
  placement?: 'top' | 'bottom'
  /** Auto-width trigger instead of the default full-width block — for a
   * compact trigger (e.g. just an avatar) sitting inline among other
   * elements, like the topbar, rather than filling a sidebar footer. */
  inline?: boolean
}

export default function Dropdown({ trigger, items, align = 'right', placement = 'bottom', inline = false }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div className={`relative ${inline ? 'inline-block' : 'w-full'}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`cursor-pointer rounded-lg text-left transition outline-none active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-brand-500/40 ${inline ? '' : 'w-full'}`}
      >
        {trigger}
      </button>

      {open && (
        <div
          className={`animate-modal-pop absolute z-50 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl ${
            placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {items.map((item, index) =>
            item === 'divider' ? (
              <div key={`divider-${index}`} className="my-1.5 border-t border-gray-100" />
            ) : (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setOpen(false)
                  item.onClick?.()
                }}
                className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition outline-none active:scale-[0.98] focus-visible:bg-gray-100 ${
                  item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}
