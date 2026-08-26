export interface Permission {
  permission_id: number
  permission_name: string
  module: string | null
}

export interface Role {
  role_id: number
  role_name: string
  description: string | null
  users_count?: number
  permissions?: Permission[]
}
