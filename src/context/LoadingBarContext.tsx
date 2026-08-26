import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

interface LoadingBarContextValue {
  /** True while at least one page/section has an in-flight fetch registered. */
  active: boolean
  start: () => void
  done: () => void
}

const LoadingBarContext = createContext<LoadingBarContextValue | null>(null)

/**
 * Ref-counted "is anything loading right now" signal, shared app-wide so the
 * top progress bar can reflect real fetch state instead of a fixed timer —
 * multiple sections can register concurrently without stomping each other.
 */
export function LoadingBarProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false)
  const countRef = useRef(0)

  const start = useCallback(() => {
    countRef.current += 1
    setActive(true)
  }, [])

  const done = useCallback(() => {
    countRef.current = Math.max(0, countRef.current - 1)
    if (countRef.current === 0) setActive(false)
  }, [])

  return <LoadingBarContext.Provider value={{ active, start, done }}>{children}</LoadingBarContext.Provider>
}

export function useLoadingBar() {
  const ctx = useContext(LoadingBarContext)
  if (!ctx) throw new Error('useLoadingBar must be used within a LoadingBarProvider')
  return ctx
}
