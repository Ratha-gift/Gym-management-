import type { Member } from '@/types/member'

export interface PaymentDetail {
  payment_detail_id: number
  payment_id: number
  description: string
  amount: string | number
}

export interface Receipt {
  receipt_id: number
  payment_id: number
  receipt_no: string
  receipt_date: string
  amount: string | number
}

export type PaymentMethod = 'Cash' | 'Card' | 'Bank Transfer' | 'Other'

export interface Payment {
  payment_id: number
  member_id: number
  membership_id: number | null
  payment_date: string
  amount: string | number
  discount: string | number
  net_amount: string | number
  payment_method: PaymentMethod
  reference_no: string | null
  status: 'paid' | 'partial' | 'refunded'
  member?: Member
  details?: PaymentDetail[]
  receipt?: Receipt
}
