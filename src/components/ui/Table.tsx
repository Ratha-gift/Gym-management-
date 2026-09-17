import React, { useState, useRef, useEffect, type ReactNode } from 'react'
import EmptyState from '@/components/ui/EmptyState'
import LoadingBlock from '@/components/ui/LoadingBlock'

export interface Column<T> {
  header: string
  accessor?: keyof T | string
  width?: number | string
  cellPadding?: string
  headerClassName?: string
  cellClassName?: string | ((row: T, rowIndex: number, colIndex: number) => string)
  render?: (row: T, rowIndex: number) => ReactNode
  sortable?: boolean
}

interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
  height?: string

  fillParent?: boolean
  autoHeight?: boolean
  loading?: boolean
  loadingComponent?: ReactNode

  
  emptyMessage?: string

  // Expandable rows
  expandedRows?: Record<string | number, boolean>
  onRowExpand?: (row: T, rowIndex: number) => void
  expandable?: boolean
  renderExpandContent?: (row: T, rowIndex: number) => ReactNode

  rowClassName?: string | ((row: T, rowIndex: number, isExpanded: boolean) => string)

  clickableRows?: boolean
  highlightSelectedRow?: boolean
  selectedRowId?: string | number | null
  onRowSelect?: (row: T | null, rowIndex: number | null) => void

  headerZIndex?: string

  // Controlled sorting (server-side)
  sortBy?: string | null
  sortDirection?: 'asc' | 'desc' | null
  onSortChange?: (sort: { key: string; direction: 'asc' | 'desc' } | null) => void
}

const Table = <T extends Record<string, any>>({
  data,
  columns: initialColumns,
  height = '12rem',
  fillParent = false,
  autoHeight = false,
  loading = false,
  loadingComponent = null,
  emptyMessage,

  expandedRows = {},
  onRowExpand,
  expandable = false,
  renderExpandContent,

  rowClassName = '',
  headerZIndex = 'z-10',

  clickableRows = false,
  highlightSelectedRow = true,
  selectedRowId = null,
  onRowSelect,

  sortBy = null,
  sortDirection = null,
  onSortChange,
}: TableProps<T>) => {
  const tableData = Array.isArray(data) ? data : []
  const hasData = tableData.length > 0 && !loading

  // Store only resized widths; always derive full columns from the prop so render functions stay fresh
  const [widthOverrides, setWidthOverrides] = useState<Record<number, number | string>>({})

  const columns = initialColumns.map((col, index) => {
    const isLastColumn = index === initialColumns.length - 1
    const baseWidth = isLastColumn && !col.width ? 'auto' : col.width || 150
    return {
      ...col,
      width: widthOverrides[index] ?? baseWidth,
      cellPadding: col.cellPadding || 'p-3',
    }
  })

  const [resizing, setResizing] = useState<{ colIndex: number; startX: number; startWidth: number } | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return
      const diff = e.clientX - resizing.startX
      const newWidth = Math.max(50, resizing.startWidth + diff)
      setWidthOverrides((prev) => ({ ...prev, [resizing.colIndex]: newWidth }))
    }

    const handleMouseUp = () => {
      setResizing(null)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [resizing])

  const startResize = (e: React.MouseEvent<HTMLDivElement>, colIndex: number) => {
    e.preventDefault()
    const startX = e.clientX
    const currentWidth = columns[colIndex].width
    const startWidth = typeof currentWidth === 'number' ? currentWidth : parseInt(currentWidth as string, 10) || 150
    setResizing({ colIndex, startX, startWidth })
  }

  const handleRowClick = (row: T, rowIndex: number) => {
    if (expandable && onRowExpand) {
      onRowExpand(row, rowIndex)
    }
    if (clickableRows && onRowSelect) {
      onRowSelect(row, rowIndex)
    }
  }

  const getRowId = (row: T, rowIndex: number): string | number => {
    return row.id ?? row._id ?? rowIndex
  }

  return (
    <>
      {/* Desktop: fixed-height, internally-scrolling table — a real sibling
          of the mobile card list below (not the same box with a
          `hidden`/`sm:table` toggle on the <table> alone), since each
          needs its own independent height + overflow rule and inline
          styles can't be scoped to a breakpoint on a single shared box. */}
      <div
        className={`custom-scrollbar relative mx-auto hidden rounded-lg bg-white text-sm transition-colors sm:block dark:bg-navy-800 ${autoHeight ? 'sm:overflow-x-auto' : 'sm:overflow-auto'}`}
        style={autoHeight ? undefined : { height: fillParent ? '100%' : `calc(100vh - ${height})` }}
        ref={tableRef}
      >
        <div className="h-full w-full">
          <table className={`w-full table-fixed border-collapse ${loading || !hasData ? 'h-full' : ''}`}>
          <thead>
            <tr>
              {columns.map((column, index) => {
                const isLastColumn = index === columns.length - 1
                const isAutoWidth = column.width === 'auto'
                const showResizeHandle = !isLastColumn
                const width = column.width || 150
                const canSort = !!column.sortable && !!column.accessor
                const isSorted = sortBy === (column.accessor as string | undefined)
                const currentDirection = isSorted ? sortDirection : null

                return (
                  <th
                    key={index}
                    className={`
                      ${column.cellPadding || 'p-3'}
                      sticky top-0 ${headerZIndex} group relative
                      bg-brand-600 text-left text-xs font-semibold uppercase tracking-wider text-white
                      ${canSort ? 'cursor-pointer transition hover:bg-brand-700 active:scale-[0.98]' : ''}
                      ${column.headerClassName || ''}
                    `}
                    style={{
                      width: isAutoWidth ? 'auto' : width,
                      minWidth: isAutoWidth ? 'auto' : width,
                      maxWidth: isAutoWidth ? 'none' : width,
                    }}
                    onClick={
                      canSort
                        ? () => {
                            const key = column.accessor as string
                            let newDirection: 'asc' | 'desc' = 'asc'

                            if (sortBy === key) {
                              if (sortDirection === 'asc') {
                                newDirection = 'desc'
                              } else {
                                onSortChange?.(null)
                                return
                              }
                            }

                            onSortChange?.({ key, direction: newDirection })
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{column.header}</span>
                      {canSort && (
                        <span className="min-w-[1.2rem] text-center text-xs font-bold opacity-70 transition-opacity group-hover:opacity-100">
                          {isSorted ? (currentDirection === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      )}
                    </div>
                    {showResizeHandle && (
                      <div
                        className={`absolute right-0 top-1/2 h-8 w-0.5 -translate-y-1/2 transform cursor-col-resize rounded transition-all duration-200 ${
                          resizing?.colIndex === index
                            ? 'scale-110 bg-white'
                            : 'bg-white/40 hover:w-1 hover:scale-105 hover:bg-white/80'
                        }`}
                        onMouseDown={(e) => startResize(e, index)}
                        title="Drag to resize"
                      />
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-navy-700">
            {loading ? (
              <tr className="h-full">
                <td colSpan={columns.length} className="h-full p-3 text-center text-sm">
                  <div className="flex h-full min-h-60 items-center justify-center">{loadingComponent || <LoadingBlock />}</div>
                </td>
              </tr>
            ) : !hasData ? (
              <tr className="h-full animate-fade-in">
                <td colSpan={columns.length} className="h-full p-3 text-center text-sm">
                  <div className="flex h-full min-h-60 items-center justify-center">
                    <EmptyState message={emptyMessage} />
                  </div>
                </td>
              </tr>
            ) : (
              tableData.map((row, rowIndex) => {
                const rowId = getRowId(row, rowIndex)
                const isExpanded = !!expandedRows[rowId]
                const isSelected = highlightSelectedRow && selectedRowId === rowId

                const rowClass = typeof rowClassName === 'function' ? rowClassName(row, rowIndex, isExpanded) : rowClassName

                return (
                  <React.Fragment key={rowId}>
                    <tr
                      className={`
                        animate-fade-in text-gray-800 transition-all duration-150 ease-in-out dark:text-gray-200
                        ${clickableRows ? 'cursor-pointer' : 'cursor-default'}
                        ${clickableRows ? 'hover:bg-brand-50/70 dark:hover:bg-brand-500/10' : ''}
                        ${isSelected ? 'border-l-4 border-l-brand-600 bg-brand-50 dark:bg-brand-500/10' : ''}
                        ${isExpanded ? 'border-l-4 border-l-gray-400 bg-gray-50 dark:border-l-gray-600 dark:bg-white/5' : ''}
                        ${rowClass}
                      `}
                      onClick={(e) => {
                        if (!clickableRows && !expandable) return

                        const target = e.target as HTMLElement
                        if (
                          target.closest('button') ||
                          target.closest('a') ||
                          target.closest('svg') ||
                          target.closest('[role="button"]') ||
                          target.closest('input')
                        ) {
                          return
                        }

                        handleRowClick(row, rowIndex)
                      }}
                    >
                      {columns.map((column, colIndex) => {
                        let cellClassName = `${column.cellPadding || 'p-3'} truncate text-left text-sm align-top`

                        if (column.cellClassName) {
                          cellClassName +=
                            typeof column.cellClassName === 'function'
                              ? ` ${column.cellClassName(row, rowIndex, colIndex)}`
                              : ` ${column.cellClassName}`
                        }

                        const cellContent = column.render ? column.render(row, rowIndex) : (row[column.accessor as keyof T] ?? '')

                        const isAutoWidth = column.width === 'auto'
                        const width = column.width || 150

                        return (
                          <td
                            key={colIndex}
                            className={cellClassName}
                            style={{
                              width: isAutoWidth ? 'auto' : width,
                              minWidth: isAutoWidth ? 'auto' : width,
                              maxWidth: isAutoWidth ? 'none' : width,
                            }}
                            title={typeof cellContent === 'string' ? cellContent : undefined}
                          >
                            {cellContent}
                          </td>
                        )
                      })}
                    </tr>

                    {expandable && isExpanded && renderExpandContent && (
                      <tr className="bg-gray-50/80 dark:bg-white/5">
                        <td colSpan={columns.length} className="p-0">
                          <div className="border-t border-gray-100 px-4 py-3 dark:border-navy-700">{renderExpandContent(row, rowIndex)}</div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Mobile card list — its own bounded scroll box, mirroring the
          desktop table's height/overflow treatment exactly (same
          fillParent/height math), so the list scrolls *within* this box —
          pagination (a sibling below, outside Table entirely) stays fixed
          in view the whole time, instead of either being clipped by an
          ancestor's overflow-hidden or forcing the whole page to scroll
          past every row just to reach it. A wide multi-column table
          doesn't fit a phone screen anyway, so below `sm` each row becomes
          its own stacked card instead, generically built from the same
          `columns` every page already defines: the first column (always
          the row's identity — an avatar+name combo across every page in
          this app) becomes the card's header, the last column (always the
          action button/menu) is pinned top-right, and everything in
          between renders as "label: value" lines. */}
      <div
        className="custom-scrollbar overflow-y-auto rounded-lg bg-white transition-colors sm:hidden dark:bg-navy-800"
        style={{ height: fillParent ? '100%' : `calc(100vh - ${height})` }}
      >
        <div className="divide-y divide-gray-100 dark:divide-navy-700">
          {loading ? (
            <div className="flex min-h-60 items-center justify-center p-6">{loadingComponent || <LoadingBlock />}</div>
          ) : !hasData ? (
            <div className="animate-fade-in flex min-h-60 items-center justify-center p-6">
              <EmptyState message={emptyMessage} />
            </div>
          ) : (
            tableData.map((row, rowIndex) => {
              const rowId = getRowId(row, rowIndex)
              const firstCol = columns[0]
              const lastCol = columns[columns.length - 1]
              const middleCols = columns.length > 2 ? columns.slice(1, -1) : []
              const cell = (col: Column<T>) => (col.render ? col.render(row, rowIndex) : (row[col.accessor as keyof T] ?? ''))

              return (
                <div key={rowId} className="animate-fade-in flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{cell(firstCol)}</div>
                    {middleCols.map((col, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <span className="shrink-0 text-gray-400 dark:text-gray-500">{col.header}:</span>
                        <span className="min-w-0 truncate text-gray-600 dark:text-gray-400">{cell(col)}</span>
                      </div>
                    ))}
                  </div>
                  {columns.length > 1 && <div className="shrink-0">{cell(lastCol)}</div>}
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}

export default Table
