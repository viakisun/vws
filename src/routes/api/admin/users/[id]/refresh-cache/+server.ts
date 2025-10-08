import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { permissionService, RoleCode } from '$lib/server/services/permission.service'

// 사용자 권한 캐시 갱신
export const POST: RequestHandler = async ({ params, locals }) => {
  const user = locals.user

  // 관리자 권한 확인
  if (!user || !(await permissionService.hasRole(user.id, RoleCode.ADMIN))) {
    return json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { id: targetUserId } = params

    if (!targetUserId) {
      return json({ error: 'User ID is required' }, { status: 400 })
    }

    // 권한 캐시 갱신
    const refreshedCache = await permissionService.refreshPermissionCache(targetUserId)

    return json({
      success: true,
      cache: {
        userId: refreshedCache.userId,
        permissions: refreshedCache.permissions,
        roles: refreshedCache.roles,
        calculatedAt: refreshedCache.calculatedAt,
        expiresAt: refreshedCache.expiresAt,
      },
    })
  } catch (error) {
    console.error('Failed to refresh permission cache:', error)
    return json({ error: 'Failed to refresh cache' }, { status: 500 })
  }
}
