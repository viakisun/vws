import type { ServerLoad } from '@sveltejs/kit'
import { redirect } from '@sveltejs/kit'

export const load: ServerLoad = async ({ locals }) => {
  const permissions = locals.permissions

  // 권한 체크: project.projects 읽기 권한 필요
  if (!permissions) {
    throw redirect(302, '/login')
  }

  // ADMIN은 모든 권한 허용
  const isAdmin = permissions.roles.some((role) => role.code === 'ADMIN')
  if (isAdmin) {
    return {}
  }

  // project.projects.read 권한 체크
  const hasPermission = permissions.permissions.some(
    (p) => p.resource === 'project.projects' && p.action === 'read',
  )

  if (!hasPermission) {
    throw redirect(302, '/unauthorized?reason=no_project_permission')
  }

  return {}
}
