export type MembershipStatus = 'active' | 'frozen' | 'expired' | 'terminated' | 'none'

/** Minimal shape of a membership's package, as nested under active_membership —
 * just enough to default a payment's amount to the package price. */
export interface MembershipPackageSummary {
  package_id: number
  package_name: string
  price: string | number
}

export interface Membership {
  membership_id: number
  member_id: number
  package_id: number
  start_date: string
  end_date: string
  freeze_start?: string | null
  freeze_end?: string | null
  status: MembershipStatus
  package?: MembershipPackageSummary | null
}

/** Minimal shape of the member's currently open attendance session (checked in, not yet checked out). */
export interface OpenAttendance {
  attendance_id: number
  check_in: string
}

export interface Member {
  member_id: number
  member_code: string
  first_name: string
  last_name: string
  name: string
  gender: 'Male' | 'Female' | 'Other' | null
  date_of_birth: string | null
  phone: string | null
  email: string | null
  address: string | null
  status: 'active' | 'inactive'
  membership_status: MembershipStatus
  latest_membership: Membership | null
  /** The member's current active membership (if any), with its package
   * nested — used to default a new payment's amount to the package price. */
  active_membership?: Membership | null
  open_attendance?: OpenAttendance | null
}
