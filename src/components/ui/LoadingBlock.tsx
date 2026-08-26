import { Dumbbell } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Smaller, inline sibling of LoadingScreen — for a section/card body rather than a full page. */
export default function LoadingBlock({ message }: { message?: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex animate-fade-in flex-col items-center justify-center gap-3 py-10">
      <div className="relative flex h-11 w-11 items-center justify-center">
        <span className="absolute inset-0 rounded-xl bg-brand-600/20 animate-pulse-ring" />
        <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600">
          <Dumbbell className="h-5 w-5 text-white animate-lift-rep" />
        </span>
      </div>
      <p className="text-sm text-gray-400">{message ?? t('common.loading')}</p>
    </div>
  )
}
