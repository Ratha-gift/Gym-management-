import type { Member } from './member'

export type AttendanceMethod = 'QR' | 'Manual'
export type AttendanceStatus = 'Present' | 'Absent'

export interface Attendance {
  attendance_id: number
  member_id: number
  check_in: string
  check_out: string | null
  method: AttendanceMethod
  status: AttendanceStatus
  member?: Member
}
