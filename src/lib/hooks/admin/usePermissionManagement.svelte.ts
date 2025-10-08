import { pushToast } from '$lib/stores/toasts'
import { RoleCode } from '$lib/stores/permissions'
import {
  Users as UsersIcon,
  Key as KeyIcon,
  ShieldCheck as ShieldCheckIcon,
  AlertCircle as AlertCircleIcon,
  Shield as ShieldIcon,
} from 'lucide-svelte'

export interface User {
  id: string
  email: string
  name: string
  employee_id?: string
  department?: string
  position?: string
  account_type?: string
  roles: Array<{
    code: string
    name: string
    nameKo: string
  }>
}

export interface Role {
  id: string
  code: string
  name: string
  nameKo: string
  description?: string
  priority: number
  userCount?: number
}

export interface PermissionManagementState {
  users: User[]
  roles: Role[]
  selectedUser: User | null
  selectedRole: RoleCode | null
  loading: boolean
  searchQuery: string
  activeTab: string
}

class PermissionManagementStore {
  // State
  users = $state<User[]>([])
  roles = $state<Role[]>([])
  selectedUser = $state<User | null>(null)
  selectedRole = $state<RoleCode | null>(null)
  loading = $state(false)
  searchQuery = $state('')
  activeTab = $state<string>('users')

  // Computed
  stats = $derived([
    {
      title: '전체 사용자',
      value: this.users.length,
      badge: '활성 계정',
      icon: UsersIcon,
      color: 'blue' as const,
    },
    {
      title: '역할 수',
      value: this.roles.length,
      badge: `${this.roles.filter((r) => r.userCount && r.userCount > 0).length}개 사용 중`,
      icon: KeyIcon,
      color: 'purple' as const,
    },
    {
      title: '관리자',
      value: this.users.filter((u) => u.roles.some((r) => r.code === 'ADMIN')).length,
      badge: 'ADMIN 권한',
      icon: ShieldCheckIcon,
      color: 'green' as const,
    },
    {
      title: '권한 미할당',
      value: this.users.filter((u) => u.roles.length === 0).length,
      badge: '역할 없음',
      icon: AlertCircleIcon,
      color:
        this.users.filter((u) => u.roles.length === 0).length > 0
          ? ('red' as const)
          : ('green' as const),
    },
  ])

  filteredUsers = $derived(
    this.users.filter(
      (user) =>
        user.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        user.roles.some((role) => role.nameKo.includes(this.searchQuery)),
    ),
  )

  tabs = $derived([
    {
      id: 'users',
      label: '사용자 관리',
      icon: UsersIcon,
      badge: this.users.length,
    },
    {
      id: 'roles',
      label: '역할 관리',
      icon: KeyIcon,
      badge: this.roles.length,
    },
    {
      id: 'permissions',
      label: '권한 매트릭스',
      icon: ShieldIcon,
    },
  ])

  // Methods
  async loadData(): Promise<void> {
    this.loading = true
    try {
      await Promise.all([this.loadUsers(), this.loadRoles()])
    } catch (error) {
      console.error('Failed to load data:', error)
      pushToast('데이터를 불러오는데 실패했습니다.', 'error')
    } finally {
      this.loading = false
    }
  }

  async loadUsers(): Promise<void> {
    const response = await fetch('/api/admin/users')
    if (!response.ok) {
      throw new Error('Failed to load users')
    }
    this.users = await response.json()
  }

  async loadRoles(): Promise<void> {
    const response = await fetch('/api/admin/roles')
    if (!response.ok) {
      throw new Error('Failed to load roles')
    }
    this.roles = await response.json()
  }

  async assignRole(userId: string, roleCode: string): Promise<boolean> {
    try {
      const response = await fetch('/api/admin/users/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roleCode }),
      })

      if (!response.ok) {
        throw new Error('Failed to assign role')
      }

      pushToast('역할이 성공적으로 할당되었습니다.', 'success')
      await this.loadUsers()
      this.selectedRole = null
      return true
    } catch (error) {
      console.error('Failed to assign role:', error)
      pushToast('역할 할당에 실패했습니다.', 'error')
      return false
    }
  }

  async revokeRole(userId: string, roleCode: string): Promise<boolean> {
    try {
      const response = await fetch('/api/admin/users/roles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roleCode }),
      })

      if (!response.ok) {
        throw new Error('Failed to revoke role')
      }

      pushToast('역할이 성공적으로 제거되었습니다.', 'success')
      await this.loadUsers()
      return true
    } catch (error) {
      console.error('Failed to revoke role:', error)
      pushToast('역할 제거에 실패했습니다.', 'error')
      return false
    }
  }

  async refreshPermissionCache(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/admin/users/${userId}/refresh-cache`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to refresh cache')
      }

      pushToast('권한 캐시가 갱신되었습니다.', 'success')
      return true
    } catch (error) {
      console.error('Failed to refresh cache:', error)
      pushToast('캐시 갱신에 실패했습니다.', 'error')
      return false
    }
  }

  selectUser(user: User): void {
    this.selectedUser = user
    this.selectedRole = null
  }

  clearSelection(): void {
    this.selectedUser = null
    this.selectedRole = null
  }

  setSearchQuery(query: string): void {
    this.searchQuery = query
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab
  }

  setSelectedRole(roleCode: RoleCode | null): void {
    this.selectedRole = roleCode
  }
}

let store: PermissionManagementStore | null = null

export function usePermissionManagement() {
  if (!store) {
    store = new PermissionManagementStore()
  }
  return store
}
