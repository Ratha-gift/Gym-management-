import { useLoadingBar } from '@/context/LoadingBarContext'

/** Slim indeterminate progress bar pinned to the very top of the viewport — fires on every page/section fetch, app-wide. */
export default function TopLoadingBar() {
  const { active } = useLoadingBar()

  if (!active) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-brand-100">
      <div className="h-full w-1/3 animate-loading-bar rounded-r-full bg-brand-600" />
    </div>
  )
}
