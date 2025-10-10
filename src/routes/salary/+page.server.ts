import type { ServerLoad } from '@sveltejs/kit'
import { requirePermission } from '$lib/server/auth/permission-guard'
import { PermissionAction } from '$lib/config/permissions'

export const load: ServerLoad = async ({ locals }) => {
  // ADMIN은 자동 통과, 나머지는 salary.management.read 권한 필요
  requirePermission(locals.permissions, 'salary.management', PermissionAction.READ)

  return {}
}
