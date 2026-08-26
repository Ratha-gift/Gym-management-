import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Select from '@/components/ui/Select'

interface PaginationProps {
  currentPage: number
  lastPage: number
  total: number
  entriesPerPage: number
  onPageChange: (page: number) => void
  onEntriesPerPageChange: (size: number) => void
  loading?: boolean
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

/** Sliding window of page numbers with '…' gaps, e.g. [1, '…', 4, 5, 6, '…', 43]. */
function getPageItems(current: number, last: number): (number | 'ellipsis')[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)

  const items: (number | 'ellipsis')[] = [1]
  if (current > 3) items.push('ellipsis')

  const start = Math.max(2, current - 1)
  const end = Math.min(last - 1, current + 1)
  for (let i = start; i <= end; i++) items.push(i)

  if (current < last - 2) items.push('ellipsis')
  items.push(last)
  return items
}

export default function Pagination({
  currentPage,
  lastPage,
  total,
  entriesPerPage,
  onPageChange,
  onEntriesPerPageChange,
  loading = false,
}: PaginationProps) {
  const { t } = useTranslation()

  if (total === 0) return null

  const from = (currentPage - 1) * entriesPerPage + 1
  const to = Math.min(currentPage * entriesPerPage, total)
  const pageItems = getPageItems(currentPage, lastPage)
  const disabled = loading

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 px-1 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Select
          value={entriesPerPage}
          onChange={(e) => onEntriesPerPageChange(Number(e.target.value))}
          disabled={disabled}
          aria-label="Entries per page"
          className="h-9 w-auto py-0 pr-8 text-sm"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {t('common.perPage', { count: size })}
            </option>
          ))}
        </Select>
        <span className="hidden sm:inline">{t('common.itemsOf', { from, to, total })}</span>
        <span className="sm:hidden">{t('common.itemsTotal', { total })}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={disabled || currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition hover:bg-gray-50 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={t('common.prevPage')}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Compact indicator on narrow screens */}
        <span className="px-2 text-sm text-gray-500 sm:hidden">
          {currentPage} / {lastPage}
        </span>

        {/* Numbered pages on larger screens */}
        <div className="hidden items-center gap-1 sm:flex">
          {pageItems.map((item, index) =>
            item === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-1 text-gray-300">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                disabled={disabled}
                onClick={() => onPageChange(item)}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm transition active:scale-90 disabled:cursor-not-allowed ${
                  item === currentPage ? 'bg-brand-600 font-semibold text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          disabled={disabled || currentPage >= lastPage}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition hover:bg-gray-50 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={t('common.nextPage')}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
