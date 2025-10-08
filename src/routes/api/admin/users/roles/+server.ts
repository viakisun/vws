import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { permissionService, RoleCode } from '$lib/server/services/permission.service'

// 역할 할당
export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user

  // 관리자 권한 확인
  if (!user || !(await permissionService.hasRole(user.id, RoleCode.ADMIN))) {
    return json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { userId, roleCode, expiresAt } = await request.json()

    if (!userId || !roleCode) {
      return json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 역할 할당
    await permissionService.assignRole(
      userId,
      roleCode as RoleCode,
      user.id,
      expiresAt ? new Date(expiresAt) : undefined,
    )

    return json({ success: true })
  } catch (error) {
    console.error('Failed to assign role:', error)
    return json({ error: 'Failed to assign role' }, { status: 500 })
  }
}

// 역할 제거
export const DELETE: RequestHandler = async ({ request, locals }) => {
  const user = locals.user

  // 관리자 권한 확인
  if (!user || !(await permissionService.hasRole(user.id, RoleCode.ADMIN))) {
    return json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { userId, roleCode } = await request.json()

    if (!userId || !roleCode) {
      return json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 역할 제거
    await permissionService.revokeRole(userId, roleCode as RoleCode, user.id)

    return json({ success: true })
  } catch (error) {
    console.error('Failed to revoke role:', error)
    return json({ error: 'Failed to revoke role' }, { status: 500 })
  }
}
