import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

/** Minimal event shape so existing call sites (`onChange={(e) => set(e.target.value)}`)
 * keep working unchanged even though this isn't a real native <select>. */
interface SelectChangeEvent {
  target: { value: string }
}

interface SelectProps {
  value?: string | number
  onChange?: (event: SelectChangeEvent) => void
  children: ReactNode
  className?: string
  disabled?: boolean
  required?: boolean
  'aria-label'?: string
}

interface OptionData {
  value: string
  label: ReactNode
  disabled?: boolean
}

interface Position {
  left: number
  width: number
  top: number
  bottom: number
  openUpward: boolean
}

/** Pulls {value, label} pairs out of plain <option> children, so callers can
 * keep writing normal JSX <option> lists exactly like a native <select>. */
function extractOptions(children: ReactNode): OptionData[] {
  const options: OptionData[] = []
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    const props = child.props as { value?: string | number; children?: ReactNode; disabled?: boolean }
    options.push({ value: String(props.value ?? ''), label: props.children, disabled: props.disabled })
  })
  return options
}

const PANEL_MAX_HEIGHT = 240

/**
 * Custom animated stand-in for a native <select> — the browser/OS renders a
 * native select's option list itself, which means it can never be animated
 * or restyled. This renders our own button + listbox instead, so it gets
 * the same pop-in animation as modals/menus, while keeping the same
 * value/onChange/<option> children API so existing forms don't need to
 * change. Native form-level "required" validation bubbles are not
 * available here — server-side validation still catches an empty value.
 *
 * The panel is portalled to <body> and positioned from the trigger's own
 * bounding rect, rather than a normal `position: absolute` child — several
 * callers use this inside <Modal>, whose panel is `overflow-y-auto`; an
 * absolutely-positioned panel there doesn't get clipped, but it does count
 * toward the modal's own scrollable content height, which grows a scrollbar
 * on the *whole modal* instead of just the option list. Same reasoning as
 * SearchableSelect.tsx and RowActionsMenu.tsx.
 */
export default function Select({
  value,
  onChange,
  children,
  className = '',
  disabled = false,
  'aria-label': ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<Position | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const options = extractOptions(children)
  const currentValue = value === undefined || value === null ? '' : String(value)
  const selected = options.find((o) => o.value === currentValue)

  // Native <select> popups always stay fully on-screen because the OS
  // renders them above everything else; ours is a normal positioned div, so
  // it has to flip upward itself when there isn't enough room below.
  function handleOpen() {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const spaceBelow = window.innerHeight - rect.bottom
    const openUpward = spaceBelow < PANEL_MAX_HEIGHT && rect.top > spaceBelow
    setPosition({ left: rect.left, width: rect.width, top: rect.top, bottom: rect.bottom, openUpward })
    setOpen((prev) => !prev)
  }

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      // The panel is portalled to <body>, outside the trigger's own DOM
      // subtree — without also checking it here, a mousedown on any option
      // would count as "outside" and close the panel before the option's
      // own click handler ever gets to fire.
      if (triggerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    function handleScroll(event: Event) {
      // A wheel-scroll inside a long option list fires this too (scroll
      // events reach ancestors, including window, during the capture
      // phase) — only close for a scroll from outside the panel, otherwise
      // scrolling the list itself would close it immediately.
      if (panelRef.current?.contains(event.target as Node)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open])

  function selectOption(option: OptionData) {
    if (option.disabled) return
    setOpen(false)
    onChange?.({ target: { value: option.value } })
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={handleOpen}
        className={`flex h-12 w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 text-left text-sm text-gray-800 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-100 dark:focus:bg-navy-900 ${className}`}
      >
        <span className="truncate">{selected?.label ?? ''}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform dark:text-gray-500 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            className="animate-modal-pop custom-scrollbar fixed z-50 max-h-60 w-max overflow-y-auto rounded-lg border border-gray-100 bg-white py-1 shadow-xl dark:border-navy-700 dark:bg-navy-800"
            style={{
              left: position.left,
              minWidth: position.width,
              transformOrigin: position.openUpward ? 'bottom' : 'top',
              ...(position.openUpward ? { bottom: window.innerHeight - position.top + 4 } : { top: position.bottom + 4 }),
            }}
          >
            {options.map((option) => {
              const isSelected = option.value === currentValue
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onClick={() => selectOption(option)}
                  className={`flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-sm transition outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:bg-gray-100 dark:focus-visible:bg-white/5 ${
                    isSelected ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </>
  )
}
