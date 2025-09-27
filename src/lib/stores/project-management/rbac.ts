import type { Person } from '$lib/types'
import { writable } from 'svelte/store'

// RBAC 권한 정의
export const ROLES = {
  R1: '연구원',
  R2: 'PM(과제책임자)',
  R3: '담당부서(구매·기술 등)',
  R4: '경영지원(회계·총무)',
  R5: '연구소장',
  R6: '경영진',
  R7: '감사/외부평가',
} as const

export type Role = keyof typeof ROLES

// 권한 매트릭스
export const PERMISSIONS = {
  // Project 권한
  PROJECT_READ: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'] as Role[],
  PROJECT_CREATE: ['R4'] as Role[],
  PROJECT_UPDATE: ['R2', 'R4'] as Role[],
  PROJECT_APPROVE: ['R6'] as Role[],
  PROJECT_LOCK: ['R7'] as Role[],

  // ExpenseItem 권한
  EXPENSE_READ: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'] as Role[],
  EXPENSE_CREATE: ['R1', 'R2'] as Role[],
  EXPENSE_UPDATE: ['R3', 'R4'] as Role[],
  EXPENSE_APPROVE: ['R2', 'R4', 'R5'] as Role[],
  EXPENSE_LOCK: ['R4'] as Role[],

  // Document 권한
  DOCUMENT_READ: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'] as Role[],
  DOCUMENT_CREATE: ['R1', 'R2', 'R3'] as Role[],
  DOCUMENT_UPDATE: ['R4'] as Role[],
  DOCUMENT_LOCK: ['R4'] as Role[],

  // ResearchNote 권한
  RESEARCH_NOTE_READ: ['R1', 'R2', 'R5'] as Role[],
  RESEARCH_NOTE_CREATE: ['R1'] as Role[],
  RESEARCH_NOTE_UPDATE: ['R1'] as Role[],
  RESEARCH_NOTE_APPROVE: ['R2'] as Role[],

  // SubmissionBundle 권한
  BUNDLE_READ: ['R4', 'R6', 'R7'] as Role[],
  BUNDLE_CREATE: ['R4'] as Role[],
  BUNDLE_APPROVE: ['R4'] as Role[],
  BUNDLE_LOCK: ['R7'] as Role[],
} as const

export type Permission = keyof typeof PERMISSIONS

// 현재 사용자 정보
export const currentUser = writable<Person | null>(null)

// 권한 체크 함수들
export function hasRole(user: Person | null, role: Role): boolean {
  if (!user || !user.roleSet) return false
  return user.roleSet.includes(role)
}

export function hasPermission(user: Person | null, permission: Permission): boolean {
  if (!user || !user.roleSet) return false
  const allowedRoles = PERMISSIONS[permission]
  return user.roleSet.some((role) => allowedRoles.includes(role as Role))
}

export function hasAnyRole(user: Person | null, roles: Role[]): boolean {
  if (!user || !user.roleSet) return false
  return roles.some((role) => user.roleSet!.includes(role))
}

export function hasAllRoles(user: Person | null, roles: Role[]): boolean {
  if (!user || !user.roleSet) return false
  return roles.every((role) => user.roleSet!.includes(role))
}

// 역할별 권한 체크 함수들
export function canReadProject(user: Person | null): boolean {
  return hasPermission(user, 'PROJECT_READ')
}

export function canCreateProject(user: Person | null): boolean {
  return hasPermission(user, 'PROJECT_CREATE')
}

export function canUpdateProject(user: Person | null): boolean {
  return hasPermission(user, 'PROJECT_UPDATE')
}

export function canApproveProject(user: Person | null): boolean {
  return hasPermission(user, 'PROJECT_APPROVE')
}

export function canReadExpense(user: Person | null): boolean {
  return hasPermission(user, 'EXPENSE_READ')
}

export function canCreateExpense(user: Person | null): boolean {
  return hasPermission(user, 'EXPENSE_CREATE')
}

export function canUpdateExpense(user: Person | null): boolean {
  return hasPermission(user, 'EXPENSE_UPDATE')
}

export function canApproveExpense(user: Person | null): boolean {
  return hasPermission(user, 'EXPENSE_APPROVE')
}

export function canReadDocument(user: Person | null): boolean {
  return hasPermission(user, 'DOCUMENT_READ')
}

export function canCreateDocument(user: Person | null): boolean {
  return hasPermission(user, 'DOCUMENT_CREATE')
}

export function canUpdateDocument(user: Person | null): boolean {
  return hasPermission(user, 'DOCUMENT_UPDATE')
}

export function canReadResearchNote(user: Person | null): boolean {
  return hasPermission(user, 'RESEARCH_NOTE_READ')
}

export function canCreateResearchNote(user: Person | null): boolean {
  return hasPermission(user, 'RESEARCH_NOTE_CREATE')
}

export function canUpdateResearchNote(user: Person | null): boolean {
  return hasPermission(user, 'RESEARCH_NOTE_UPDATE')
}

export function canApproveResearchNote(user: Person | null): boolean {
  return hasPermission(user, 'RESEARCH_NOTE_APPROVE')
}

export function canReadBundle(user: Person | null): boolean {
  return hasPermission(user, 'BUNDLE_READ')
}

export function canCreateBundle(user: Person | null): boolean {
  return hasPermission(user, 'BUNDLE_CREATE')
}

// 역할별 대시보드 접근 권한
export function canAccessExecutiveDashboard(user: Person | null): boolean {
  return hasAnyRole(user, ['R6'])
}

export function canAccessLabHeadDashboard(user: Person | null): boolean {
  return hasAnyRole(user, ['R5', 'R6'])
}

export function canAccessPMDashboard(user: Person | null): boolean {
  return hasAnyRole(user, ['R2', 'R5', 'R6'])
}

export function canAccessSupportDashboard(user: Person | null): boolean {
  return hasAnyRole(user, ['R4', 'R5', 'R6'])
}

export function canAccessResearcherDashboard(user: Person | null): boolean {
  return hasAnyRole(user, ['R1', 'R2', 'R5', 'R6'])
}

// 프로젝트별 권한 체크
export function canAccessProject(user: Person | null, _projectId: string): boolean {
  if (!user) return false

  // 모든 역할이 프로젝트를 읽을 수 있음
  return canReadProject(user)
}

export function canManageProject(user: Person | null, _projectId: string): boolean {
  if (!user) return false

  // PM, 경영지원, 연구소장, 경영진만 프로젝트 관리 가능
  return hasAnyRole(user, ['R2', 'R4', 'R5', 'R6'])
}

// 지출 항목별 권한 체크
export function canAccessExpense(user: Person | null, _expenseId: string): boolean {
  if (!user) return false

  // 모든 역할이 지출 항목을 읽을 수 있음
  return canReadExpense(user)
}

export function canManageExpense(user: Person | null, _expenseId: string): boolean {
  if (!user) return false

  // 요청자, PM, 담당부서, 경영지원만 지출 관리 가능
  return hasAnyRole(user, ['R1', 'R2', 'R3', 'R4'])
}

// 문서별 권한 체크
export function canAccessDocument(user: Person | null, _documentId: string): boolean {
  if (!user) return false

  // 모든 역할이 문서를 읽을 수 있음
  return canReadDocument(user)
}

export function canManageDocument(user: Person | null, _documentId: string): boolean {
  if (!user) return false

  // 관련자, 경영지원만 문서 관리 가능
  return hasAnyRole(user, ['R1', 'R2', 'R3', 'R4'])
}

// 연구노트별 권한 체크
export function canAccessResearchNote(user: Person | null, _noteId: string): boolean {
  if (!user) return false

  // 연구원, PM, 연구소장만 연구노트 접근 가능
  return hasAnyRole(user, ['R1', 'R2', 'R5'])
}

export function canManageResearchNote(user: Person | null, _noteId: string): boolean {
  if (!user) return false

  // 연구원만 연구노트 작성/수정 가능
  return hasRole(user, 'R1')
}

// 사용자 역할 정보 가져오기
export function getUserRoles(user: Person | null): string[] {
  if (!user || !user.roleSet) return []
  return user.roleSet.map((role) => ROLES[role as Role])
}

export function getUserRoleNames(user: Person | null): string[] {
  if (!user || !user.roleSet) return []
  return user.roleSet.map((role) => ROLES[role as Role])
}

// 역할별 색상
export const ROLE_COLORS = {
  R1: '#3B82F6', // 파란색
  R2: '#10B981', // 초록색
  R3: '#F59E0B', // 노란색
  R4: '#EF4444', // 빨간색
  R5: '#8B5CF6', // 보라색
  R6: '#EC4899', // 핑크색
  R7: '#6B7280', // 회색
} as const

export function getRoleColor(role: Role): string {
  return ROLE_COLORS[role] || '#6B7280'
}
