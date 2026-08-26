import { useEffect, useState } from 'react'
import { Plus, Eye } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import IconButton from '@/components/ui/IconButton'
import Avatar from '@/components/ui/Avatar'
import Pagination from '@/components/ui/Pagination'
import Table, { type Column } from '@/components/ui/Table'
import ListPageTemplate from '@/components/ui/ListPageTemplate'
import PaymentFormModal from '@/components/payments/PaymentFormModal'
import PaymentViewModal from '@/components/payments/PaymentViewModal'
import { usePageLoading } from '@/hooks/usePageLoading'
import { api, ApiError } from '@/lib/api'
import type { Payment, PaymentMethod } from '@/types/payment'
import type { Paginated } from '@/types/pagination'
import type { MembershipStatus } from '@/types/member'

const STATUS_MAP: Record<Payment['status'], MembershipStatus> = {
  paid: 'active',
  partial: 'frozen',
  refunded: 'terminated',
}

const METHOD_KEY: Record<PaymentMethod, string> = {
  Cash: 'common.cash',
  Card: 'common.card',
  'Bank Transfer': 'common.bankTransfer',
  Other: 'common.other',
}

export default function PaymentsPage() {
  const { t } = useTranslation()
  const [payments, setPayments] = useState<Payment[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  usePageLoading(isLoading)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null)

  function load() {
    setIsLoading(true)
    setError(null)
    api
      .get<Paginated<Payment>>(`/payments?page=${page}&per_page=${entriesPerPage}`)
      .then((res) => {
        setPayments(res.data)
        setLastPage(res.last_page)
        setTotal(res.total)
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Failed to load payments.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [page, entriesPerPage])

  async function viewPayment(payment: Payment) {
    const full = await api.get<Payment>(`/payments/${payment.payment_id}`)
    setViewingPayment(full)
  }

  const columns: Column<Payment>[] = [
    {
      header: t('membership.member'),
      width: 220,
      render: (p) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={p.member?.name ?? '—'} size={32} />
          <span className="truncate font-medium text-gray-800" title={p.member?.name ?? `Member #${p.member_id}`}>
            {p.member?.name ?? `Member #${p.member_id}`}
          </span>
        </div>
      ),
    },
    {
      header: t('payments.date'),
      width: 140,
      render: (p) => <span className="text-gray-500">{new Date(p.payment_date).toLocaleDateString()}</span>,
    },
    {
      header: t('payments.method'),
      width: 140,
      render: (p) => <span className="text-gray-600">{t(METHOD_KEY[p.payment_method])}</span>,
    },
    {
      header: t('common.amount'),
      width: 120,
      render: (p) => <span className="font-semibold text-gray-900">${Number(p.net_amount).toFixed(2)}</span>,
    },
    {
      header: t('common.status'),
      width: 130,
      render: (p) => <Badge status={STATUS_MAP[p.status]} />,
    },
    {
      header: t('common.action'),
      width: 50,
      render: (p) => (
        <IconButton icon={<Eye className="h-4 w-4" />} tone="brand" onClick={() => viewPayment(p)} aria-label={t('payments.viewReceipt')} />
      ),
    },
  ]

  return (
    <div className="flex h-full flex-col gap-6">
      {error && <Card className="shrink-0 border-red-100 bg-red-50 p-4 text-sm text-red-600">{error}</Card>}

      <ListPageTemplate
        fillContent
        actionButton={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('payments.recordPayment')}
          </Button>
        }
        pagination={
          <Pagination
            currentPage={page}
            lastPage={lastPage}
            total={total}
            entriesPerPage={entriesPerPage}
            onPageChange={setPage}
            onEntriesPerPageChange={(size) => {
              setEntriesPerPage(size)
              setPage(1)
            }}
            loading={isLoading}
          />
        }
      >
        <Table data={payments} columns={columns} loading={isLoading} fillParent emptyMessage={t('payments.noPaymentsRecorded')} />
      </ListPageTemplate>

      <PaymentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false)
          load()
        }}
      />

      <PaymentViewModal payment={viewingPayment} onClose={() => setViewingPayment(null)} />
    </div>
  )
}
