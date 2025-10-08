import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { permissionService } from '$lib/server/services/permission.service'

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user

  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 권한 정보 가져오기 (캐시 활용)
    const permissions = await permissionService.getUserPermissions(user.id)

    return json({
      userId: permissions.userId,
      permissions: permissions.permissions,
      roles: permissions.roles,
      calculatedAt: permissions.calculatedAt,
      expiresAt: permissions.expiresAt,
    })
  } catch (error) {
    console.error('Failed to get user permissions:', error)
    return json({ error: 'Failed to load permissions' }, { status: 500 })
  }
}

// 권한 캐시 새로고침
export const POST: RequestHandler = async ({ locals }) => {
  const user = locals.user

  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 권한 캐시 강제 갱신
    const permissions = await permissionService.refreshPermissionCache(user.id)

    return json({
      userId: permissions.userId,
      permissions: permissions.permissions,
      roles: permissions.roles,
      calculatedAt: permissions.calculatedAt,
      expiresAt: permissions.expiresAt,
    })
  } catch (error) {
    console.error('Failed to refresh permissions:', error)
    return json({ error: 'Failed to refresh permissions' }, { status: 500 })
  }
}
