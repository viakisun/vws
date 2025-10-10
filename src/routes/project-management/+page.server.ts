import type { ServerLoad } from '@sveltejs/kit'
import { requirePermission } from '$lib/server/auth/permission-guard'

export const load: ServerLoad = async ({ locals }) => {
  // ADMIN은 자동 통과, 나머지는 project.projects.read 권한 필요
  requirePermission(locals.permissions, 'project.projects', 'read')

  return {}
}
