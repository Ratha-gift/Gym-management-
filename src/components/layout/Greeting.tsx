import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'

/** Personalized "Welcome back, {name}!" subtitle for the dashboard topbar. */
export default function Greeting() {
  const { user } = useAuth()
  const { t } = useTranslation()

  return <>{t('dashboard.welcomeBack', { name: user?.first_name ?? 'Admin' })}</>
}
