import { Dumbbell } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function LoadingScreen({ message }: { message?: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen animate-fade-in flex-col items-center justify-center gap-4 bg-[#f3f5f9]">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 rounded-2xl bg-brand-600/20 animate-pulse-ring" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/30">
          <Dumbbell className="h-8 w-8 text-white animate-lift-rep" />
        </span>
      </div>
      <p className="text-sm font-medium text-gray-400">{message ?? t('common.loading')}</p>
    </div>
  )
}
