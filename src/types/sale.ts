export interface Sale {
  sale_id: number
  sale_no: string
  sale_date: string
  total_amount: string | number
  discount: string | number
  net_amount: string | number
  payment_method: string
}
