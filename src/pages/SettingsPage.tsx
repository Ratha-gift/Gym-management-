import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import IconButton from '@/components/ui/IconButton'
import Field from '@/components/ui/Field'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import LoadingBlock from '@/components/ui/LoadingBlock'
import { usePageLoading } from '@/hooks/usePageLoading'
import { useToast } from '@/context/ToastContext'
import { api, ApiError } from '@/lib/api'
import type { Setting } from '@/types/setting'

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
    <div className="flex flex-col gap-2 border-b border-gray-50 py-3 last:border-0 sm:flex-row sm:items-center sm:gap-4">
      <span className="font-mono text-sm text-gray-500 sm:w-56 sm:shrink-0">{setting.setting_key}</span>
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
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [deletingSetting, setDeletingSetting] = useState<Setting | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  function load() {
    setIsLoading(true)
    api
      .get<Setting[]>('/settings')
      .then(setSettings)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Failed to load settings.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [])

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
      {error && <Card className="border-red-100 bg-red-50 p-4 text-sm text-red-600">{error}</Card>}

      <Card className="p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-gray-900">{t('settings.applicationSettings')}</h2>

        {isLoading ? (
          <LoadingBlock message={t('settings.loadingSettings')} />
        ) : settings.length === 0 ? (
          <p className="animate-fade-in py-6 text-center text-sm text-gray-400">{t('settings.noSettingsYet')}</p>
        ) : (
          <div className="animate-fade-in">
            {settings.map((s) => (
              <SettingRow key={s.setting_id} setting={s} onDelete={() => setDeletingSetting(s)} />
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-gray-900">{t('settings.addSetting')}</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
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
