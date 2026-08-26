import type { Role } from './role'

export interface GymUser {
  user_id: number
  first_name: string
  last_name: string
  name: string
  email: string
  phone: string | null
  photo: string | null
  status: 'active' | 'inactive'
  role_id: number | null
  role: Role | null
}
