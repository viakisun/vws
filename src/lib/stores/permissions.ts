import { writable, derived, get } from 'svelte/store'
import type { Writable, Readable } from 'svelte/store'

// 권한 타입 정의
export interface Permission {
  code: string
  resource: string
  action: string
  scope: 'own' | 'department' | 'all'
}

export interface Role {
  id: string
  code: string
  name: string
  nameKo: string
  description?: string
  priority: number
}

export interface UserPermissions {
  userId: string
  permissions: Permission[]
  roles: Role[]
  calculatedAt: Date
  expiresAt: Date
}

// 역할 코드 enum
export enum RoleCode {
  ADMIN = 'ADMIN',
  MANAGEMENT = 'MANAGEMENT',
  FINANCE_MANAGER = 'FINANCE_MANAGER',
  HR_MANAGER = 'HR_MANAGER',
  ADMINISTRATOR = 'ADMINISTRATOR',
  RESEARCH_DIRECTOR = 'RESEARCH_DIRECTOR',
  SALES = 'SALES',
  RESEARCHER = 'RESEARCHER',
  EMPLOYEE = 'EMPLOYEE',
}

// 리소스 enum
export enum Resource {
  // 공통
  DASHBOARD = 'common.dashboard',
  PROFILE = 'common.profile',

  // 재무
  FINANCE_ACCOUNTS = 'finance.accounts',
  FINANCE_TRANSACTIONS = 'finance.transactions',
  FINANCE_BUDGETS = 'finance.budgets',

  // 인사
  HR_EMPLOYEES = 'hr.employees',
  HR_PAYSLIPS = 'hr.payslips',
  HR_ATTENDANCE = 'hr.attendance',
  HR_LEAVES = 'hr.leaves',

  // 급여
  SALARY_MANAGEMENT = 'salary.management',

  // 프로젝트
  PROJECT_PROJECTS = 'project.projects',
  PROJECT_DELIVERABLES = 'project.deliverables',

  // 플래너
  PLANNER_PRODUCTS = 'planner.products',
  PLANNER_INITIATIVES = 'planner.initiatives',
  PLANNER_THREADS = 'planner.threads',
  PLANNER_FORMATIONS = 'planner.formations',
  PLANNER_MILESTONES = 'planner.milestones',

  // 영업
  SALES_CUSTOMERS = 'sales.customers',
  SALES_CONTRACTS = 'sales.contracts',

  // 시스템
  SYSTEM_USERS = 'system.users',
  SYSTEM_ROLES = 'system.roles',
  SYSTEM_PERMISSIONS = 'system.permissions',
  SYSTEM_AUDIT = 'system.audit',
}

// 권한 액션 enum
export enum PermissionAction {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  APPROVE = 'approve',
}

// 사용자 권한 스토어
export const userPermissions: Writable<UserPermissions | null> = writable(null)

// 권한 체크 헬퍼 함수
function hasPermission(
  permissions: Permission[],
  resource: string,
  action: string,
  scope?: 'own' | 'department' | 'all',
): boolean {
  return permissions.some((perm) => {
    // 리소스와 액션이 일치하는지 확인
    if (perm.resource !== resource || perm.action !== action) {
      return false
    }

    // 범위 확인 (all > department > own)
    if (!scope || perm.scope === 'all') {
      return true
    }

    if (perm.scope === 'department' && (scope === 'department' || scope === 'own')) {
      return true
    }

    return perm.scope === scope
  })
}

// 역할 체크 헬퍼 함수
function hasRole(roles: Role[], roleCode: RoleCode): boolean {
  return roles.some((role) => role.code === roleCode)
}

// 권한 체크 파생 스토어
export const can: Readable<{
  read: (resource: string, scope?: 'own' | 'department' | 'all') => boolean
  write: (resource: string, scope?: 'own' | 'department' | 'all') => boolean
  delete: (resource: string, scope?: 'own' | 'department' | 'all') => boolean
  approve: (resource: string, scope?: 'own' | 'department' | 'all') => boolean
  hasRole: (roleCode: RoleCode) => boolean
  hasAnyRole: (roleCodes: RoleCode[]) => boolean
  isAdmin: () => boolean
}> = derived(userPermissions, ($userPermissions) => {
  const permissions = $userPermissions?.permissions || []
  const roles = $userPermissions?.roles || []

  return {
    read: (resource: string, scope?: 'own' | 'department' | 'all') =>
      hasPermission(permissions, resource, PermissionAction.READ, scope),
    write: (resource: string, scope?: 'own' | 'department' | 'all') =>
      hasPermission(permissions, resource, PermissionAction.WRITE, scope),
    delete: (resource: string, scope?: 'own' | 'department' | 'all') =>
      hasPermission(permissions, resource, PermissionAction.DELETE, scope),
    approve: (resource: string, scope?: 'own' | 'department' | 'all') =>
      hasPermission(permissions, resource, PermissionAction.APPROVE, scope),
    hasRole: (roleCode: RoleCode) => hasRole(roles, roleCode),
    hasAnyRole: (roleCodes: RoleCode[]) => roleCodes.some((code) => hasRole(roles, code)),
    isAdmin: () => hasRole(roles, RoleCode.ADMIN),
  }
})

// 최고 권한 역할 파생 스토어
export const highestRole: Readable<Role | null> = derived(userPermissions, ($userPermissions) => {
  if (!$userPermissions || $userPermissions.roles.length === 0) {
    return null
  }

  return $userPermissions.roles.reduce((highest, current) => {
    return current.priority > highest.priority ? current : highest
  })
})

// 메뉴 접근 권한 체크
export const menuAccess: Readable<{
  dashboard: boolean
  finance: boolean
  hr: boolean
  projects: boolean
  planner: boolean
  sales: boolean
  admin: boolean
  reports: boolean
}> = derived(can, ($can) => ({
  dashboard: $can.read(Resource.DASHBOARD),
  finance:
    $can.read(Resource.FINANCE_ACCOUNTS) ||
    $can.read(Resource.FINANCE_TRANSACTIONS) ||
    $can.read(Resource.FINANCE_BUDGETS),
  hr:
    $can.read(Resource.HR_EMPLOYEES) ||
    $can.read(Resource.HR_PAYSLIPS) ||
    $can.read(Resource.HR_ATTENDANCE) ||
    $can.read(Resource.HR_LEAVES),
  projects: $can.read(Resource.PROJECT_PROJECTS) || $can.read(Resource.PROJECT_DELIVERABLES),
  planner:
    $can.read(Resource.PLANNER_PRODUCTS) ||
    $can.read(Resource.PLANNER_INITIATIVES) ||
    $can.read(Resource.PLANNER_THREADS) ||
    $can.read(Resource.PLANNER_FORMATIONS) ||
    $can.read(Resource.PLANNER_MILESTONES),
  sales: $can.read(Resource.SALES_CUSTOMERS) || $can.read(Resource.SALES_CONTRACTS),
  admin:
    $can.read(Resource.SYSTEM_USERS) ||
    $can.read(Resource.SYSTEM_ROLES) ||
    $can.read(Resource.SYSTEM_PERMISSIONS) ||
    $can.read(Resource.SYSTEM_AUDIT),
  reports: $can.hasRole(RoleCode.MANAGEMENT) || $can.hasRole(RoleCode.RESEARCH_DIRECTOR),
}))

// 권한 초기화 함수 (서버에서 받은 데이터로 설정)
export function initializePermissions(permissions: UserPermissions): void {
  userPermissions.set(permissions)
}

// 권한 클리어 함수 (로그아웃 시)
export function clearPermissions(): void {
  userPermissions.set(null)
}

// 권한 갱신 함수
export async function refreshPermissions(): Promise<void> {
  try {
    const response = await fetch('/api/auth/permissions')
    if (response.ok) {
      const data = await response.json()
      initializePermissions(data)
    }
  } catch (error) {
    console.error('Failed to refresh permissions:', error)
  }
}

// 역할별 한글명 매핑
export const ROLE_NAMES_KO: Record<RoleCode, string> = {
  [RoleCode.ADMIN]: '관리자',
  [RoleCode.MANAGEMENT]: '경영관리자',
  [RoleCode.FINANCE_MANAGER]: '재무관리자',
  [RoleCode.HR_MANAGER]: '인사관리자',
  [RoleCode.ADMINISTRATOR]: '행정원',
  [RoleCode.RESEARCH_DIRECTOR]: '연구소장',
  [RoleCode.SALES]: '영업',
  [RoleCode.RESEARCHER]: '연구원',
  [RoleCode.EMPLOYEE]: '일반직원',
}

// 역할별 설명
export const ROLE_DESCRIPTIONS: Record<RoleCode, string> = {
  [RoleCode.ADMIN]: '시스템 전체 관리 권한',
  [RoleCode.MANAGEMENT]: '경영 정보 접근 및 관리',
  [RoleCode.FINANCE_MANAGER]: '재무 정보 접근 및 관리',
  [RoleCode.HR_MANAGER]: '급여 및 인사정보 접근 및 관리',
  [RoleCode.ADMINISTRATOR]: '일반 행정 업무 담당',
  [RoleCode.RESEARCH_DIRECTOR]: '연구개발 총괄',
  [RoleCode.SALES]: '고객 및 영업 데이터 관리',
  [RoleCode.RESEARCHER]: '연구개발 업무 수행',
  [RoleCode.EMPLOYEE]: '기본 사용자 권한',
}

// 권한 체크 유틸리티 함수들
export const permissionUtils = {
  // 현재 사용자가 특정 권한을 가지고 있는지 확인
  can(resource: string, action: string, scope?: 'own' | 'department' | 'all'): boolean {
    const $can = get(can)
    switch (action) {
      case PermissionAction.READ:
        return $can.read(resource, scope)
      case PermissionAction.WRITE:
        return $can.write(resource, scope)
      case PermissionAction.DELETE:
        return $can.delete(resource, scope)
      case PermissionAction.APPROVE:
        return $can.approve(resource, scope)
      default:
        return false
    }
  },

  // 여러 권한 중 하나라도 가지고 있는지 확인
  canAny(
    permissions: Array<{ resource: string; action: string; scope?: 'own' | 'department' | 'all' }>,
  ): boolean {
    return permissions.some((perm) => this.can(perm.resource, perm.action, perm.scope))
  },

  // 모든 권한을 가지고 있는지 확인
  canAll(
    permissions: Array<{ resource: string; action: string; scope?: 'own' | 'department' | 'all' }>,
  ): boolean {
    return permissions.every((perm) => this.can(perm.resource, perm.action, perm.scope))
  },

  // 관리자 권한 확인
  isAdmin(): boolean {
    const $can = get(can)
    return $can.isAdmin()
  },

  // 특정 역할 보유 확인
  hasRole(roleCode: RoleCode): boolean {
    const $can = get(can)
    return $can.hasRole(roleCode)
  },

  // 여러 역할 중 하나라도 보유 확인
  hasAnyRole(roleCodes: RoleCode[]): boolean {
    const $can = get(can)
    return $can.hasAnyRole(roleCodes)
  },
}
