export type MembershipStatus = 'active' | 'frozen' | 'expired' | 'terminated' | 'none'

export interface Membership {
  membership_id: number
  member_id: number
  package_id: number
  start_date: string
  end_date: string
  freeze_start?: string | null
  freeze_end?: string | null
  status: MembershipStatus
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
  open_attendance?: OpenAttendance | null
}
