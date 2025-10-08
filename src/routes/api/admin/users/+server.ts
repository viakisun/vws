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
    // 직원 계정만 조회 (시스템 계정과 동일한 이메일을 가진 직원 제외)
    const employeeResult = await DatabaseService.query(`
      SELECT
        e.id,
        e.email,
        e.last_name || e.first_name as name,
        e.employee_id as employee_code,
        e.department,
        e.position,
        'employee' as account_type,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', r.id,
              'code', r.code,
              'name', r.name,
              'nameKo', r.name_ko
            )
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'::json
        ) as roles
      FROM employees e
      LEFT JOIN employee_roles er ON er.employee_id = e.id AND er.is_active = true
      LEFT JOIN roles r ON r.id = er.role_id AND r.is_active = true
      WHERE e.status = 'active'
        AND e.email NOT IN (SELECT email FROM system_accounts)
      GROUP BY e.id, e.email, e.first_name, e.last_name, e.employee_id, e.department, e.position
      ORDER BY e.last_name, e.first_name
    `)

    return json(employeeResult.rows)
  } catch (error) {
    console.error('Failed to get users:', error)
    return json({ error: 'Failed to load users' }, { status: 500 })
  }
}
