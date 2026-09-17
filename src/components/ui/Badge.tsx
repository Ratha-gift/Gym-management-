import { useTranslation } from 'react-i18next'
import type { MembershipStatus } from '@/types/member'

const STYLES: Record<MembershipStatus, string> = {
  active: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  frozen: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
  expired: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  terminated: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  none: 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400',
}

const DOT: Record<MembershipStatus, string> = {
  active: 'bg-emerald-500',
  frozen: 'bg-sky-500',
  expired: 'bg-amber-500',
  terminated: 'bg-red-500',
  none: 'bg-gray-400',
}

const LABEL_KEY: Record<MembershipStatus, string> = {
  active: 'common.active',
  frozen: 'common.frozen',
  expired: 'common.expired',
  terminated: 'common.terminated',
  none: 'common.noPlan',
}

export default function Badge({ status }: { status: MembershipStatus }) {
  const { t } = useTranslation()
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} />
      {t(LABEL_KEY[status])}
    </span>
  )
}
