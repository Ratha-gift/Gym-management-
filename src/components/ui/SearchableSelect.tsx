import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Minimal event shape so existing call sites (`onChange={(e) => set(e.target.value)}`)
 * keep working unchanged, matching the plain <Select>'s contract. */
interface SearchableSelectChangeEvent {
  target: { value: string }
}

export interface SearchableSelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SearchableSelectProps {
  value?: string | number
  onChange?: (event: SearchableSelectChangeEvent) => void
  options: SearchableSelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
  
  loading?: boolean
  'aria-label'?: string
}

interface Position {
  left: number
  width: number
  top: number
  bottom: number
  openUpward: boolean
}

const PANEL_HEIGHT = 288

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  disabled = false,
  loading = false,
  'aria-label': ariaLabel,
}: SearchableSelectProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<Position | null>(null)
  const [query, setQuery] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const currentValue = value === undefined || value === null ? '' : String(value)
  const selected = options.find((o) => o.value === currentValue)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  function handleOpen() {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const spaceBelow = window.innerHeight - rect.bottom
    const openUpward = spaceBelow < PANEL_HEIGHT && rect.top > spaceBelow
    setPosition({ left: rect.left, width: rect.width, top: rect.top, bottom: rect.bottom, openUpward })
    setQuery('')
    setOpen((prev) => !prev)
  }

  useEffect(() => {
    if (!open) return

    const id = requestAnimationFrame(() => searchInputRef.current?.focus())

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node

      if (triggerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    function handleScroll(event: Event) {
      // A wheel-scroll inside the options list itself fires this too (scroll
      // events reach ancestors, including window, during the capture phase)
      // — only treat it as "the page moved under us" when it comes from
      // outside the panel, otherwise every attempt to scroll the list closes
      // it before anything visibly moves.
      if (panelRef.current?.contains(event.target as Node)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      cancelAnimationFrame(id)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open])

  function selectOption(option: SearchableSelectOption) {
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
        <span className={`truncate ${selected ? '' : 'text-gray-400 dark:text-gray-500'}`}>{selected?.label ?? placeholder ?? ''}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform dark:text-gray-500 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            className="animate-modal-pop fixed z-50 flex flex-col overflow-hidden rounded-lg border border-gray-100 bg-white shadow-xl dark:border-navy-700 dark:bg-navy-800"
            style={{
              left: position.left,
              width: position.width,
              transformOrigin: position.openUpward ? 'bottom' : 'top',
              ...(position.openUpward ? { bottom: window.innerHeight - position.top + 4 } : { top: position.bottom + 4 }),
            }}
          >
            <div className="relative shrink-0 border-b border-gray-100 p-2 dark:border-navy-700">
              <Search className="pointer-events-none absolute left-4.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                placeholder={t('common.search')}
                className="h-8 w-full rounded-md border-none bg-gray-50 pl-8 pr-2 text-sm text-gray-800 outline-none placeholder:text-gray-400 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            </div>

            <div role="listbox" className="custom-scrollbar max-h-60 overflow-y-auto py-1">
              {loading ? (
                <p className="px-3.5 py-3 text-center text-sm text-gray-400 dark:text-gray-500">{t('common.loading')}</p>
              ) : filtered.length === 0 ? (
                <p className="px-3.5 py-3 text-center text-sm text-gray-400 dark:text-gray-500">{t('common.noResults')}</p>
              ) : (
                filtered.map((option) => {
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
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
