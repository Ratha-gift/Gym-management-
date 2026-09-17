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
    // Bounded app-shell at every screen size, mobile included: header/
    // toolbar fixed, the middle zone scrolls its own content (Table fills
    // it and handles its own internal scrolling — desktop table or mobile
    // card list, both bounded to this same box), and pagination is pinned
    // below, always in view — never something you have to scroll the
    // whole page past a long list to reach.
    <div className="flex h-full flex-col overflow-hidden rounded-lg bg-white transition-colors dark:bg-navy-800">
      <div className="flex-none space-y-3 px-4 pt-4">
        {titleSlot}
        {hasTopBar && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="sm:max-w-sm sm:flex-1">{searchSlot}</div>
            {/* No flex-wrap here — filterSlot is usually a <Select>, whose
             * trigger is `w-full` for its normal use inside a form <Field>.
             * As a flex sibling that `w-full` resolves its flex-basis to the
             * whole row before `max-w-*` fully constrains it, so with wrap
             * enabled it forces the action button onto its own line below
             * instead of sitting beside it. */}
            <div className="flex shrink-0 items-center gap-2">
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
