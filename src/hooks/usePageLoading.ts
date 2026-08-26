import { useEffect, useRef } from 'react'
import { useLoadingBar } from '@/context/LoadingBarContext'

/**
 * Registers a page/section's own `isLoading` flag with the app-wide top
 * progress bar, so switching sidebar menus shows one continuous "loading"
 * signal instead of each page's fetch flashing its own isolated spinner.
 */
export function usePageLoading(loading: boolean) {
  const { start, done } = useLoadingBar()
  const registered = useRef(false)

  useEffect(() => {
    if (loading && !registered.current) {
      registered.current = true
      start()
    } else if (!loading && registered.current) {
      registered.current = false
      done()
    }
  }, [loading, start, done])

  // If the page unmounts (fast nav away) while still mid-fetch, release the
  // slot so the bar doesn't stay stuck on forever.
  useEffect(
    () => () => {
      if (registered.current) {
        registered.current = false
        done()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}
