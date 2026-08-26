import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Logo from '@/components/ui/Logo'
import LoginForm from '@/components/auth/LoginForm'
import LanguageSwitcher from '@/i18n/LanguageSwitcher'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuth()
  const { t } = useTranslation()

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-900 bg-cover bg-center p-4"
      style={{ backgroundImage: "url('/gym-bg.jpg')" }}
    >
      <div className="absolute inset-0 bg-navy-900/70" aria-hidden="true" />

      <div className="absolute right-4 top-4 z-10">
        <LanguageSwitcher variant="dark" />
      </div>

      <div className="relative grid w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl sm:grid-cols-2">
        <div className="flex flex-col items-center justify-center gap-4 bg-navy-900/80 px-8 py-12 text-center backdrop-blur-sm">
          <Logo size="lg" />
          <p className="max-w-55 text-sm text-gray-300">{t('login.heroText')}</p>
        </div>

        <div className="flex flex-col justify-center bg-white px-8 py-12">
          <LoginForm onSuccess={() => navigate('/dashboard')} />
        </div>
      </div>

      {/* <p className="absolute bottom-4 text-center text-xs text-gray-300">
        © 2026 Gym Pro. All rights reserved.
      </p> */}
    </div>
  )
}
