import type { ReactNode } from 'react'

interface ListPageTemplateProps {
  titleSlot?: ReactNode
  searchSlot?: ReactNode
  filterSlot?: ReactNode
  actionButton?: ReactNode
  extraButtons?: ReactNode
  secondaryActionsRow?: ReactNode
  tabs?: ReactNode
  aboveTableContent?: ReactNode
  children: ReactNode
  pagination?: ReactNode
  /** When true, the content zone is overflow-hidden flex-col so children (a
   * Table with fillParent) can fill it with h-full instead of scrolling the
   * whole page. */
  fillContent?: boolean
}

/** Shared shell for every list/table page (Members, Users, Payments, …) — a
 * white rounded panel sitting on the thin gray gutter main provides (just a
 * sliver near the header/sidebar/footer, not a floating card), with a fixed
 * toolbar row up top, a scrollable table in the middle, and a fixed
 * pagination row pinned to the bottom. Mirrors the reference ERP layout the
 * pages are modeled on. */
export default function ListPageTemplate({
  titleSlot,
  searchSlot,
  filterSlot,
  actionButton,
  extraButtons,
  secondaryActionsRow,
  tabs,
  aboveTableContent,
  children,
  pagination,
  fillContent = false,
}: ListPageTemplateProps) {
  const hasTopBar = !!(searchSlot || filterSlot || actionButton || extraButtons)

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg bg-white">
      {/* Fixed header zone (never scrolls) */}
      <div className="flex-none space-y-3 px-4 pt-4">
        {titleSlot}
        {hasTopBar && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="sm:max-w-sm sm:flex-1">{searchSlot}</div>
            <div className="flex flex-wrap items-center gap-2">
              {filterSlot}
              {extraButtons}
              {actionButton}
            </div>
          </div>
        )}
        {secondaryActionsRow}
        {tabs}
        {aboveTableContent}
      </div>

      {/* Scrollable table zone */}
      <div className={`min-h-0 flex-1 px-4 py-2 ${fillContent ? 'flex flex-col overflow-hidden' : 'overflow-auto custom-scrollbar'}`}>
        {children}
      </div>

      {/* Fixed pagination zone (never scrolls) — Pagination itself supplies
       * the top divider + spacing, so this wrapper only adds side padding. */}
      {pagination && <div className="flex-none px-4 pb-3">{pagination}</div>}
    </div>
  )
}
