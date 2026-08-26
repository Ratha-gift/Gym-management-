import { useState, type FormEvent } from 'react'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

interface LoginFormProps {
  onSuccess: () => void
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login({ email, password, remember: rememberMe })
      onSuccess()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to reach the server. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <h2 className="text-2xl font-bold text-gray-900">{t('login.welcomeBack')}</h2>
      <p className="mt-1 text-sm text-gray-400">{t('login.signInSubtitle')}</p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-4">
        <Input
          icon={<Mail className="h-4 w-4" />}
          type="email"
          placeholder={t('login.email')}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
        <Input
          icon={<Lock className="h-4 w-4" />}
          type={showPassword ? 'text' : 'password'}
          placeholder={t('login.password')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-gray-400 transition hover:text-gray-600 active:scale-90"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-gray-500">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 accent-brand-600"
          />
          {t('login.rememberMe')}
        </label>
        <a href="#forgot-password" className="inline-block font-medium text-brand-600 transition hover:underline active:scale-95">
          {t('login.forgotPassword')}
        </a>
      </div>

      <Button type="submit" fullWidth className="mt-6" disabled={isSubmitting}>
        {isSubmitting ? t('login.signingIn') : t('login.login')}
      </Button>
    </form>
  )
}
