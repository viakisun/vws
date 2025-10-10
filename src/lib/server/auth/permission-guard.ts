/**
 * 서버 사이드 권한 체크 유틸리티
 *
 * ADMIN은 모든 권한을 자동으로 가지며,
 * 다른 사용자는 특정 권한을 확인합니다.
 */

import { redirect } from '@sveltejs/kit'
import type { UserPermissions } from '$lib/stores/permissions'

/**
 * 사용자가 ADMIN 역할을 가지고 있는지 확인
 */
export function isAdmin(permissions: UserPermissions | null): boolean {
  if (!permissions) return false
  return permissions.roles.some((role) => role.code === 'ADMIN')
}

/**
 * 사용자가 특정 리소스에 대한 권한을 가지고 있는지 확인
 * ADMIN은 자동으로 true 반환
 */
export function hasPermission(
  permissions: UserPermissions | null,
  resource: string,
  action: 'read' | 'write' | 'delete' | 'approve',
): boolean {
  if (!permissions) return false

  // ADMIN은 모든 권한 허용
  if (isAdmin(permissions)) return true

  // 특정 권한 확인
  return permissions.permissions.some((p) => p.resource === resource && p.action === action)
}

/**
 * 권한 체크 후 없으면 리다이렉트
 * ADMIN은 자동으로 통과
 */
export function requirePermission(
  permissions: UserPermissions | null,
  resource: string,
  action: 'read' | 'write' | 'delete' | 'approve' = 'read',
  redirectUrl: string = '/unauthorized',
): void {
  // 로그인되지 않음
  if (!permissions) {
    throw redirect(302, '/login')
  }

  // ADMIN은 모든 권한 허용
  if (isAdmin(permissions)) {
    return
  }

  // 권한 없음
  if (!hasPermission(permissions, resource, action)) {
    throw redirect(302, `${redirectUrl}?reason=no_permission&resource=${resource}`)
  }
}

/**
 * 여러 권한 중 하나라도 있으면 통과
 * ADMIN은 자동으로 통과
 */
export function requireAnyPermission(
  permissions: UserPermissions | null,
  resources: Array<{ resource: string; action: 'read' | 'write' | 'delete' | 'approve' }>,
  redirectUrl: string = '/unauthorized',
): void {
  // 로그인되지 않음
  if (!permissions) {
    throw redirect(302, '/login')
  }

  // ADMIN은 모든 권한 허용
  if (isAdmin(permissions)) {
    return
  }

  // 하나라도 권한이 있는지 확인
  const hasAny = resources.some(({ resource, action }) =>
    hasPermission(permissions, resource, action),
  )

  if (!hasAny) {
    throw redirect(302, `${redirectUrl}?reason=no_permission`)
  }
}

/**
 * 특정 역할이 필요한 경우
 * ADMIN은 자동으로 통과
 */
export function requireRole(
  permissions: UserPermissions | null,
  roleCodes: string[],
  redirectUrl: string = '/unauthorized',
): void {
  // 로그인되지 않음
  if (!permissions) {
    throw redirect(302, '/login')
  }

  // ADMIN은 모든 역할 허용
  if (isAdmin(permissions)) {
    return
  }

  // 역할 확인
  const hasRole = roleCodes.some((code) => permissions.roles.some((role) => role.code === code))

  if (!hasRole) {
    throw redirect(302, `${redirectUrl}?reason=insufficient_role`)
  }
}
