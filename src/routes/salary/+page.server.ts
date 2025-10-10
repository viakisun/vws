import type { ServerLoad } from '@sveltejs/kit'
import { redirect } from '@sveltejs/kit'

export const load: ServerLoad = async ({ locals }) => {
  const permissions = locals.permissions

  console.log('🔍 [Salary Page] Checking permissions...')
  console.log('📋 User:', locals.user?.email)
  console.log('🔐 Permissions:', permissions)

  // 권한 체크: salary.management 읽기 권한 필요
  if (!permissions) {
    console.log('❌ No permissions found, redirecting to login')
    throw redirect(302, '/login')
  }

  console.log('👥 Roles:', permissions.roles.map((r) => r.code))
  console.log('🎫 Permissions:', permissions.permissions.map((p) => `${p.resource}.${p.action}`))

  // ADMIN은 모든 권한 허용
  const isAdmin = permissions.roles.some((role) => role.code === 'ADMIN')
  if (isAdmin) {
    console.log('✅ Admin role detected, allowing access')
    return {}
  }

  // salary.management.read 권한 체크
  const hasPermission = permissions.permissions.some(
    (p) => p.resource === 'salary.management' && p.action === 'read',
  )

  console.log('🔍 Has salary.management.read permission:', hasPermission)

  if (!hasPermission) {
    console.log('❌ No permission, redirecting to unauthorized')
    throw redirect(302, '/unauthorized?reason=no_salary_permission')
  }

  console.log('✅ Permission granted')
  return {}
}
