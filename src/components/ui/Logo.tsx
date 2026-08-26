import { Dumbbell } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface LogoProps {
  size?: 'sm' | 'lg'
  light?: boolean
  /** Hide the name/tagline at the lg breakpoint and up — for the collapsed
   * sidebar rail. Always rendered below lg, since the mobile drawer stays
   * full-width regardless of the desktop collapse preference. */
  collapseTextAtLg?: boolean
}

export default function Logo({ size = 'sm', light = true, collapseTextAtLg = false }: LogoProps) {
  const isLarge = size === 'lg'
  const { t } = useTranslation()
  return (
    <div className={`flex items-center gap-3 ${isLarge ? 'flex-col text-center' : ''}`}>
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white ${isLarge ? 'h-14 w-14' : 'h-9 w-9'}`}
      >
        <Dumbbell className={isLarge ? 'h-7 w-7' : 'h-5 w-5'} />
      </span>
      <span className={collapseTextAtLg ? 'lg:hidden' : ''}>
        <span className={`block font-extrabold tracking-wide ${isLarge ? 'text-2xl' : 'text-base'} ${light ? 'text-white' : 'text-gray-900'}`}>
          GYM <span className="text-brand-500">PRO</span>
        </span>
        <span className={`block text-[10px] font-medium tracking-widest uppercase ${light ? 'text-gray-400' : 'text-gray-400'}`}>
          {t('app.tagline')}
        </span>
      </span>
    </div>
  )
}
