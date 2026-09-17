import { UserPlus, Package, CreditCard, UserCheck, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Card from '@/components/ui/Card'

const STEPS = [
  { key: 'member', icon: UserPlus, labelKey: 'members.addMember', standalone: false },
  { key: 'package', icon: Package, labelKey: 'dashboard.stepChoosePackage', standalone: false },
  { key: 'payment', icon: CreditCard, labelKey: 'dashboard.stepMakePayment', standalone: false },
 
  { key: 'attendance', icon: UserCheck, labelKey: 'nav.attendance', standalone: true },
] as const

export type QuickStartStep = (typeof STEPS)[number]['key']

interface DashboardQuickStartProps {
  onStepClick: (step: QuickStartStep) => void
  completed: Record<QuickStartStep, boolean>
}
export default function DashboardQuickStart({ onStepClick, completed }: DashboardQuickStartProps) {
  const { t } = useTranslation()
  const progressSteps = STEPS.filter((step) => !step.standalone)
  const allDone = progressSteps.every((step) => completed[step.key])

  const statuses = STEPS.map((step, i) => {
   
    if (step.standalone) return 'standalone' as const
    if (allDone) return i === 0 ? ('ready' as const) : ('upcoming' as const)
    if (completed[step.key]) return 'done' as const
    const priorDone = STEPS.slice(0, i).every((s) => s.standalone || completed[s.key])
    return priorDone ? ('ready' as const) : ('upcoming' as const)
  })

  return (
    <Card className="flex h-full flex-col justify-center p-6 sm:p-8">
      <p className="mb-6 text-sm font-semibold text-brand-500">{t('dashboard.quickStartTitle')}</p>

      <div className="relative flex items-start justify-between px-2">
        <svg
          className="pointer-events-none absolute inset-x-2 top-0 h-12 w-[calc(100%-1rem)]"
          viewBox="0 0 100 48"
          preserveAspectRatio="none"
          fill="none"
        >
   
          <defs>
            <linearGradient id="quickstart-line" x1="0" y1="0" x2="100%" y2="0">
              <stop offset="0%" stopColor="var(--color-brand-500)" />
              <stop offset="100%" stopColor="var(--color-brand-700)" />
            </linearGradient>
          </defs>
          {/* 4 evenly-spaced points (8, 36, 64, 92) — 3 connecting arcs. */}
          <path
            d="M8 24 Q22 2 36 24"
            stroke={statuses[0] === 'done' ? 'url(#quickstart-line)' : 'currentColor'}
            strokeWidth="2"
            strokeLinecap="round"
            className={statuses[0] === 'done' ? '' : 'text-gray-200 dark:text-navy-700'}
          />
          <path
            d="M36 24 Q50 2 64 24"
            stroke={statuses[1] === 'done' ? 'url(#quickstart-line)' : 'currentColor'}
            strokeWidth="2"
            strokeLinecap="round"
            className={statuses[1] === 'done' ? '' : 'text-gray-200 dark:text-navy-700'}
          />
          <path
            d="M64 24 Q78 2 92 24"
            stroke={statuses[2] === 'done' ? 'url(#quickstart-line)' : 'currentColor'}
            strokeWidth="2"
            strokeLinecap="round"
            className={statuses[2] === 'done' ? '' : 'text-gray-200 dark:text-navy-700'}
          />
        </svg>

        {STEPS.map((step, i) => {
          const Icon = step.icon
          const status = statuses[i]
          return (
            <button
              key={step.key}
              type="button"
              onClick={() => onStepClick(step.key)}
              className="group relative z-10 flex flex-col items-center gap-2 text-center"
            >
              <span className="relative flex h-12 w-12 items-center justify-center">
                {status === 'ready' && <span className="absolute inset-0 rounded-full bg-brand-500/40 animate-pulse-ring" />}

                <span
                  className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white transition group-hover:scale-110 group-active:scale-95 dark:bg-navy-800 ${
                    status === 'done'
                      ? 'border-emerald-500 text-emerald-500'
                      : status === 'ready' || status === 'standalone'
                        ? 'border-brand-500 text-brand-500'
                        : 'border-gray-200 text-gray-300 dark:border-navy-700 dark:text-navy-600'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>

                {status === 'done' && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-navy-800">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                )}
              </span>
              <span
                className={`text-xs font-medium ${
                  status === 'upcoming' ? 'text-gray-300 dark:text-navy-600' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {t(step.labelKey)}
              </span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
