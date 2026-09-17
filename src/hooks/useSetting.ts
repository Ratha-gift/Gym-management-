import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Setting } from '@/types/setting'

/** Reads one value out of the generic settings table by key — for the few
 * spots outside the Settings page itself (e.g. the dashboard banner image)
 * that need to reflect an admin-configured value. Returns null while
 * loading or if the setting was never set. */
export function useSetting(key: string): string | null {
  const [value, setValue] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .get<Setting[]>('/settings')
      .then((settings) => {
        if (cancelled) return
        setValue(settings.find((s) => s.setting_key === key)?.setting_value ?? null)
      })
      .catch(() => {
        if (!cancelled) setValue(null)
      })
    return () => {
      cancelled = true
    }
  }, [key])

  return value
}
