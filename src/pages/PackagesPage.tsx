import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import IconButton from '@/components/ui/IconButton'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import LoadingBlock from '@/components/ui/LoadingBlock'
import PackageFormModal from '@/components/packages/PackageFormModal'
import { usePageLoading } from '@/hooks/usePageLoading'
import { useToast } from '@/context/ToastContext'
import { api, ApiError } from '@/lib/api'
import type { MembershipPackage } from '@/types/package'

const UNIT_KEY: Record<MembershipPackage['duration_type'], { one: string; many: string }> = {
  days: { one: 'common.day', many: 'common.days' },
  weeks: { one: 'common.week', many: 'common.weeks' },
  months: { one: 'common.month', many: 'common.months' },
}

export default function PackagesPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [packages, setPackages] = useState<MembershipPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  usePageLoading(isLoading)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<MembershipPackage | null>(null)
  const [deletingPackage, setDeletingPackage] = useState<MembershipPackage | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  function formatDuration(pkg: MembershipPackage) {
    const unitKey = UNIT_KEY[pkg.duration_type]
    const unit = t(pkg.duration_value === 1 ? unitKey.one : unitKey.many)
    return `${pkg.duration_value} ${unit}`
  }

  function load() {
    setIsLoading(true)
    api
      .get<MembershipPackage[]>('/membership-packages')
      .then(setPackages)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Failed to load packages.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [])

  function openCreate() {
    setEditingPackage(null)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!deletingPackage) return
    setIsDeleting(true)
    try {
      await api.delete(`/membership-packages/${deletingPackage.package_id}`)
      setDeletingPackage(null)
      toast.success(t('packages.deletedSuccess'))
      load()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete package.'
      setError(message)
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && <Card className="border-red-100 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10">{error}</Card>}

      <div className="flex items-center justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('packages.addPackage')}
        </Button>
      </div>

      {isLoading ? (
        <LoadingBlock message={t('packages.loadingPackages')} />
      ) : packages.length === 0 ? (
        <Card className="animate-fade-in p-10 text-center text-sm text-gray-400 dark:text-gray-500">{t('packages.noPackagesYet')}</Card>
      ) : (
        <div className="grid animate-fade-in grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {packages.map((pkg) => (
            <Card key={pkg.package_id} className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">{pkg.package_name}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">{formatDuration(pkg)}</p>
                </div>
                <Badge status={pkg.status === 'active' ? 'active' : 'terminated'} />
              </div>
              <p className="text-2xl font-bold text-brand-600">${Number(pkg.price).toFixed(2)}</p>
              {pkg.description && <p className="text-sm text-gray-500 dark:text-gray-400">{pkg.description}</p>}
              <div className="mt-auto flex justify-end gap-2 pt-2">
                <IconButton
                  icon={<Pencil className="h-4 w-4" />}
                  onClick={() => {
                    setEditingPackage(pkg)
                    setFormOpen(true)
                  }}
                  aria-label={`Edit ${pkg.package_name}`}
                />
                <IconButton
                  icon={<Trash2 className="h-4 w-4" />}
                  tone="danger"
                  onClick={() => setDeletingPackage(pkg)}
                  aria-label={`Delete ${pkg.package_name}`}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      <PackageFormModal
        open={formOpen}
        pkg={editingPackage}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false)
          load()
        }}
      />

      <ConfirmDialog
        open={!!deletingPackage}
        title={t('packages.deleteTitle')}
        message={t('packages.deleteMessage', { name: deletingPackage?.package_name })}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingPackage(null)}
      />
    </div>
  )
}
