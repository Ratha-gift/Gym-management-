import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export interface RowAction {
  key: string
  label: string
  icon?: ReactNode
  danger?: boolean
  disabled?: boolean
  onClick?: () => void
}

interface Position {
  top: number
  bottom: number
  right: number
  openUpward: boolean
}

const CLOSE_ANIMATION_MS = 150

/**s
 * Compact "⋮" trigger that opens a small action menu (Edit/Delete/etc.) —
 * replaces a row of separate icon buttons in a table's Action column.
 *
 * Portalled to <body> and positioned via the trigger's own bounding rect,
 * rather than a normal position:absolute child — a table row lives inside
 * the Table component's scrolling container, which would otherwise clip the
 * menu for any row near the bottom of the visible area (the same class of
 * bug Modal.tsx already works around for the sidebar's transform).
 */
export default function RowActionsMenu({ actions }: { actions: RowAction[] }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [position, setPosition] = useState<Position | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  function openMenu() {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const estimatedHeight = actions.length * 40 + 16
    const spaceBelow = window.innerHeight - rect.bottom
    const openUpward = spaceBelow < estimatedHeight && rect.top > spaceBelow
    setPosition({ top: rect.top, bottom: rect.bottom, right: window.innerWidth - rect.right, openUpward })
    setClosing(false)
    setOpen(true)
  }

  // Plays the exit animation before actually unmounting, instead of just
  // vanishing instantly — mirrors how a native context menu closes.
  function requestClose() {
    setClosing(true)
    setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, CLOSE_ANIMATION_MS)
  }

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      // The menu panel is portalled to <body>, outside the trigger's own DOM
      // subtree — without also checking it here, a mousedown on any menu
      // item would count as "outside" and unmount the panel before the
      // item's own click handler ever gets to fire.
      if (triggerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      requestClose()
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') requestClose()
    }
    // Capture phase — the Table's internal scroll container doesn't bubble
    // scroll events, so this is the only reliable way to catch it closing.
    function handleScroll() {
      requestClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('scroll', handleScroll, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? requestClose() : openMenu())}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition outline-none active:scale-90 focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
          open && !closing ? 'bg-brand-50 text-brand-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
        }`}
        aria-label={t('common.action')}
        aria-haspopup="menu"
        aria-expanded={open && !closing}
      >
        <MoreVertical className={`h-4 w-4 transition-transform duration-200 ${open && !closing ? 'rotate-90' : ''}`} />
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className={`fixed z-50 w-44 overflow-hidden rounded-xl border cursor-pointer border-gray-100 bg-white py-1.5 shadow-xl ${
              closing ? 'animate-menu-pop-out' : 'animate-modal-pop'
            }`}
            style={{
              right: position.right,
              transformOrigin: position.openUpward ? 'bottom right' : 'top right',
              ...(position.openUpward
                ? { bottom: window.innerHeight - position.top + 4 }
                : { top: position.bottom + 4 }),
            }}
          >
            {actions.map((action) => (
              <button
                key={action.key}
                type="button"
                role="menuitem"
                disabled={action.disabled}
                onClick={() => {
                  requestClose()
                  action.onClick?.()
                }}
                className={`group flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm outline-none transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 focus-visible:bg-gray-100 ${
                  action.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="inline-flex transition-transform duration-200 group-hover:translate-x-0.5 group-hover:scale-110">
                  {action.icon}
                </span>
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">{action.label}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
