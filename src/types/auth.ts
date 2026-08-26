export interface Role {
  role_id: number
  role_name: string
  description: string | null
}

export interface AuthUser {
  user_id: number
  first_name: string
  last_name: string
  name: string
  email: string
  phone: string | null
  photo: string | null
  status: 'active' | 'inactive'
  role: Role | null
}
