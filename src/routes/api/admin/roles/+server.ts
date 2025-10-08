import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { DatabaseService } from '$lib/database/connection'
import { permissionService, RoleCode } from '$lib/server/services/permission.service'

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user

  // 관리자 권한 확인
  if (!user || !(await permissionService.hasRole(user.id, RoleCode.ADMIN))) {
    return json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    // 모든 역할과 직원 수 조회
    const result = await DatabaseService.query(`
      SELECT
        r.id,
        r.code,
        r.name,
        r.name_ko as "nameKo",
        r.description,
        r.priority,
        COUNT(DISTINCT er.employee_id) as "userCount"
      FROM roles r
      LEFT JOIN employee_roles er ON er.role_id = r.id AND er.is_active = true
      WHERE r.is_active = true
      GROUP BY r.id, r.code, r.name, r.name_ko, r.description, r.priority
      ORDER BY r.priority DESC
    `)

    return json(result.rows)
  } catch (error) {
    console.error('Failed to get roles:', error)
    return json({ error: 'Failed to load roles' }, { status: 500 })
  }
}
