import { writable } from 'svelte/store'

export type Role = 'admin' | 'manager' | 'viewer'

export interface User {
  id: string
  name: string
  role: Role
}

export const auth = writable<{ user: User }>({
  user: { id: 'u-1', name: '관리자', role: 'manager' }
})

const permissions: Record<Role, Set<string>> = {
  admin: new Set(['dashboard', 'participation', 'budget', 'compliance', 'reports']),
  manager: new Set(['dashboard', 'participation', 'budget', 'reports']),
  viewer: new Set(['dashboard', 'reports'])
}

export function canAccessForRole(role: Role, key: string): boolean {
  return permissions[role]?.has(key) ?? false
}
