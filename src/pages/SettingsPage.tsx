import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Plus, Trash2, Save, Building2, Phone, Mail, MapPin, Clock, Camera, ImageOff, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import IconButton from '@/components/ui/IconButton'
import Field from '@/components/ui/Field'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import LoadingBlock from '@/components/ui/LoadingBlock'
import { usePageLoading } from '@/hooks/usePageLoading'
import { useToast } from '@/context/ToastContext'
import { api, ApiError } from '@/lib/api'
import type { Setting } from '@/types/setting'

/** Curated, labeled fields for the common gym settings the app actually
 * cares about — still just rows in the generic settings table underneath,
 * so nothing new is needed on the backend. Anything outside this list falls
 * through to the free-form "Custom Settings" editor below. */
const KNOWN_FIELDS = [
  { key: 'gym_name', labelKey: 'settings.gymName', icon: Building2, type: 'text' },
  { key: 'gym_phone', labelKey: 'settings.gymPhone', icon: Phone, type: 'tel' },
  { key: 'gym_email', labelKey: 'settings.gymEmail', icon: Mail, type: 'email' },
  { key: 'gym_address', labelKey: 'settings.gymAddress', icon: MapPin, type: 'text' },
  { key: 'opening_time', labelKey: 'settings.openingTime', icon: Clock, type: 'time' },
  { key: 'closing_time', labelKey: 'settings.closingTime', icon: Clock, type: 'time' },
] as const

const CURRENCY_KEY = 'currency'
const CURRENCY_OPTIONS = ['USD', 'KHR', 'EUR', 'GBP']
const LOGO_KEY = 'gym_logo'
const BANNER_KEY = 'dashboard_banner'
const MAX_LOGO_BYTES = 2 * 1024 * 1024 // 2MB — stored as a base64 string in the settings row, so keep it modest.
const KNOWN_KEYS: string[] = [...KNOWN_FIELDS.map((f) => f.key), CURRENCY_KEY, LOGO_KEY, BANNER_KEY]

type KnownValues = Record<string, string>

function SettingRow({ setting, onDelete }: { setting: Setting; onDelete: () => void }) {
  const { t } = useTranslation()
  const toast = useToast()
  const [value, setValue] = useState(setting.setting_value ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const dirty = value !== (setting.setting_value ?? '')

  async function save() {
    setIsSaving(true)
    try {
      await api.patch(`/settings/${setting.setting_id}`, { setting_value: value })
      toast.success(t('settings.savedSuccess'))
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save setting.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 border-b border-gray-50 py-3 last:border-0 sm:flex-row sm:items-center sm:gap-4 dark:border-navy-700">
      <span className="font-mono text-sm text-gray-500 sm:w-56 sm:shrink-0 dark:text-gray-400">{setting.setting_key}</span>
      <Input value={value} onChange={(e) => setValue(e.target.value)} className="flex-1" />
      <div className="flex gap-2">
        <IconButton icon={<Save className="h-4 w-4" />} tone="brand" onClick={save} disabled={!dirty || isSaving} aria-label="Save" />
        <IconButton icon={<Trash2 className="h-4 w-4" />} tone="danger" onClick={onDelete} aria-label="Delete setting" />
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [settings, setSettings] = useState<Setting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  usePageLoading(isLoading)
  const [error, setError] = useState<string | null>(null)

  const [knownValues, setKnownValues] = useState<KnownValues>({})
  const [isSavingGeneral, setIsSavingGeneral] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [deletingSetting, setDeletingSetting] = useState<Setting | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  function load() {
    setIsLoading(true)
    api
      .get<Setting[]>('/settings')
      .then((data) => {
        setSettings(data)
        const values: KnownValues = {}
        for (const key of KNOWN_KEYS) {
          values[key] = data.find((s) => s.setting_key === key)?.setting_value ?? ''
        }
        setKnownValues(values)
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Failed to load settings.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [])

  const customSettings = useMemo(() => settings.filter((s) => !KNOWN_KEYS.includes(s.setting_key)), [settings])

  function setKnown(key: string, value: string) {
    setKnownValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleImageChange(key: string, tooLargeMessage: string) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return

      if (!file.type.startsWith('image/')) {
        setError('Please choose an image file.')
        return
      }
      if (file.size > MAX_LOGO_BYTES) {
        setError(tooLargeMessage)
        return
      }

      setError(null)
      const reader = new FileReader()
      reader.onload = () => setKnown(key, reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleLogoChange = handleImageChange(LOGO_KEY, 'Logo image must be smaller than 2MB.')
  const handleBannerChange = handleImageChange(BANNER_KEY, 'Banner image must be smaller than 2MB.')

  /** Creates the setting row if it doesn't exist yet, otherwise patches it
   * in place — the known-fields form doesn't know or care which rows
   * already exist in the generic settings table. */
  async function upsertSetting(key: string, value: string) {
    const existing = settings.find((s) => s.setting_key === key)
    if (existing) {
      if (existing.setting_value === value) return
      await api.patch(`/settings/${existing.setting_id}`, { setting_value: value || null })
    } else if (value) {
      await api.post('/settings', { setting_key: key, setting_value: value })
    }
  }

  async function handleSaveGeneral(event: FormEvent) {
    event.preventDefault()
    setIsSavingGeneral(true)
    setError(null)
    try {
      await Promise.all(KNOWN_KEYS.map((key) => upsertSetting(key, knownValues[key] ?? '')))
      toast.success(t('settings.savedSuccess'))
      load()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save settings.'
      setError(message)
      toast.error(message)
    } finally {
      setIsSavingGeneral(false)
    }
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault()
    setIsAdding(true)
    setError(null)
    try {
      await api.post('/settings', { setting_key: newKey, setting_value: newValue || null })
      setNewKey('')
      setNewValue('')
      toast.success(t('settings.addedSuccess'))
      load()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to add setting.'
      setError(message)
      toast.error(message)
    } finally {
      setIsAdding(false)
    }
  }

  async function confirmDelete() {
    if (!deletingSetting) return
    setIsDeleting(true)
    try {
      await api.delete(`/settings/${deletingSetting.setting_id}`)
      setDeletingSetting(null)
      toast.success(t('settings.deletedSuccess'))
      load()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete setting.'
      setError(message)
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && <Card className="border-red-100 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10">{error}</Card>}

      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('settings.generalInfo')}</h2>
        <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">{t('settings.generalInfoHint')}</p>

        {isLoading ? (
          <LoadingBlock message={t('settings.loadingSettings')} />
        ) : (
          <form onSubmit={handleSaveGeneral} className="animate-fade-in space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                {knownValues[LOGO_KEY] ? (
                  <img
                    src={knownValues[LOGO_KEY]}
                    alt={t('settings.gymLogo')}
                    className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-gray-100 dark:ring-navy-700"
                  />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-300 dark:bg-white/5 dark:text-gray-600">
                    <ImageOff className="h-6 w-6" />
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm ring-2 ring-white transition hover:bg-brand-700 active:scale-90 dark:ring-navy-800"
                  aria-label={t('settings.changeLogo')}
                  title={t('settings.changeLogo')}
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('settings.gymLogo')}</p>
                <div className="mt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="text-sm font-semibold text-brand-600 transition hover:underline active:scale-95"
                  >
                    {t('settings.changeLogo')}
                  </button>
                  {knownValues[LOGO_KEY] && (
                    <button
                      type="button"
                      onClick={() => setKnown(LOGO_KEY, '')}
                      className="inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-red-500 active:scale-95 dark:text-gray-500"
                    >
                      <X className="h-3.5 w-3.5" />
                      {t('settings.removeLogo')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">{t('settings.dashboardBanner')}</p>
              <div className="relative flex h-28 w-full max-w-md items-center justify-center overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-100 dark:bg-white/5 dark:ring-navy-700">
                {knownValues[BANNER_KEY] ? (
                  <img src={knownValues[BANNER_KEY]} alt={t('settings.dashboardBanner')} className="h-full w-full object-cover" />
                ) : (
                  <ImageOff className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                )}
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm ring-2 ring-white transition hover:bg-brand-700 active:scale-90 dark:ring-navy-800"
                  aria-label={t('settings.changeBanner')}
                  title={t('settings.changeBanner')}
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
              </div>
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="text-sm font-semibold text-brand-600 transition hover:underline active:scale-95"
                >
                  {t('settings.changeBanner')}
                </button>
                {knownValues[BANNER_KEY] && (
                  <button
                    type="button"
                    onClick={() => setKnown(BANNER_KEY, '')}
                    className="inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-red-500 active:scale-95 dark:text-gray-500"
                  >
                    <X className="h-3.5 w-3.5" />
                    {t('settings.removeLogo')}
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{t('settings.dashboardBannerHint')}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {KNOWN_FIELDS.map(({ key, labelKey, icon: Icon, type }) => (
                <Field key={key} label={t(labelKey)}>
                  <Input
                    type={type}
                    icon={<Icon className="h-4 w-4" />}
                    value={knownValues[key] ?? ''}
                    onChange={(e) => setKnown(key, e.target.value)}
                  />
                </Field>
              ))}

              <Field label={t('settings.currency')}>
                <Select value={knownValues[CURRENCY_KEY] ?? ''} onChange={(e) => setKnown(CURRENCY_KEY, e.target.value)}>
                  <option value="">—</option>
                  {CURRENCY_OPTIONS.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSavingGeneral}>
                <Save className="h-4 w-4" />
                {isSavingGeneral ? t('common.saving') : t('common.saveChanges')}
              </Button>
            </div>
          </form>
        )}
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('settings.customSettings')}</h2>
        <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">{t('settings.customSettingsHint')}</p>

        {isLoading ? null : customSettings.length === 0 ? (
          <p className="animate-fade-in py-6 text-center text-sm text-gray-400 dark:text-gray-500">{t('settings.noSettingsYet')}</p>
        ) : (
          <div className="animate-fade-in">
            {customSettings.map((s) => (
              <SettingRow key={s.setting_id} setting={s} onDelete={() => setDeletingSetting(s)} />
            ))}
          </div>
        )}

        <form onSubmit={handleAdd} className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end dark:border-navy-700">
          <Field label={t('settings.key')}>
            <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder={t('settings.keyPlaceholder')} required />
          </Field>
          <Field label={t('settings.value')}>
            <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder={t('settings.valuePlaceholder')} />
          </Field>
          <Button type="submit" disabled={isAdding}>
            <Plus className="h-4 w-4" />
            {isAdding ? t('common.adding') : t('common.add')}
          </Button>
        </form>
      </Card>

      <ConfirmDialog
        open={!!deletingSetting}
        title={t('settings.deleteTitle')}
        message={t('settings.deleteMessage', { key: deletingSetting?.setting_key })}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingSetting(null)}
      />
    </div>
  )
}
