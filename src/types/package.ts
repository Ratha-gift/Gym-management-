export interface MembershipPackage {
  package_id: number
  package_name: string
  duration_type: 'days' | 'weeks' | 'months'
  duration_value: number
  price: string | number
  description: string | null
  status: 'active' | 'inactive'
}
