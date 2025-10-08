import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DatabaseService } from '$lib/database/connection';
import { permissionService, RoleCode } from '$lib/server/services/permission.service';

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;

  // 관리자 권한 확인
  if (!user || !(await permissionService.hasRole(user.id, RoleCode.ADMIN))) {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // 1. 직원 계정 조회
    const employeeResult = await DatabaseService.query(`
      SELECT
        u.id,
        u.email,
        u.name,
        e.employee_id,
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
      FROM users u
      INNER JOIN employees e ON e.user_id = u.id AND e.status = 'active'
      LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = true
      LEFT JOIN roles r ON r.id = ur.role_id AND r.is_active = true
      WHERE u.is_active = true
      GROUP BY u.id, u.email, u.name, e.employee_id, e.department, e.position
      ORDER BY u.name
    `);

    // 2. 시스템 계정 조회
    const systemResult = await DatabaseService.query(`
      SELECT
        u.id,
        u.email,
        u.name,
        NULL as employee_id,
        u.department,
        u.position,
        sa.account_type,
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
      FROM users u
      INNER JOIN system_accounts sa ON sa.user_id = u.id
      LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = true
      LEFT JOIN roles r ON r.id = ur.role_id AND r.is_active = true
      WHERE u.is_active = true
      GROUP BY u.id, u.email, u.name, u.department, u.position, sa.account_type
      ORDER BY u.name
    `);

    // 3. 두 결과 합치기 (시스템 계정을 먼저 표시)
    const allUsers = [...systemResult.rows, ...employeeResult.rows];

    return json(allUsers);
  } catch (error) {
    console.error('Failed to get users:', error);
    return json({ error: 'Failed to load users' }, { status: 500 });
  }
};