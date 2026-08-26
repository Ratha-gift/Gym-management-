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
  /**
   * When true, sizes to 100% of the parent instead of calc(100vh - height)
   * — for pages that already put this Table inside their own flex-1 /
   * overflow-y-auto scroll region.
   */
  fillParent?: boolean
  /**
   * When true, skips the fixed-height scroll container entirely and lets
   * the table grow to its natural content height — for short, paginated
   * lists embedded in a Card rather than a full-page data grid.
   */
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
    <div
      className={`custom-scrollbar relative mx-auto rounded-lg bg-white text-sm ${autoHeight ? 'overflow-x-auto' : 'overflow-auto'}`}
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

          <tbody className="divide-y divide-gray-100">
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
                        animate-fade-in text-gray-800 transition-all duration-150 ease-in-out
                        ${clickableRows ? 'cursor-pointer' : 'cursor-default'}
                        ${clickableRows ? 'hover:bg-brand-50/70' : ''}
                        ${isSelected ? 'border-l-4 border-l-brand-600 bg-brand-50' : ''}
                        ${isExpanded ? 'border-l-4 border-l-gray-400 bg-gray-50' : ''}
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
                      <tr className="bg-gray-50/80">
                        <td colSpan={columns.length} className="p-0">
                          <div className="border-t border-gray-100 px-4 py-3">{renderExpandContent(row, rowIndex)}</div>
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
  )
}

export default Table
