import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/research-development/employees - 직원 목록 조회 (프로젝트 멤버 추가용)
export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('projectId')
    const department = url.searchParams.get('department')
    const position = url.searchParams.get('position')
    const search = url.searchParams.get('search')

    // 직원 목록 API 호출

    let sqlQuery = `
			SELECT 
				e.id,
				CASE 
					WHEN e.first_name ~ '^[가-힣]+$' AND e.last_name ~ '^[가-힣]+$' 
					THEN CONCAT(e.last_name, ' ', e.first_name)
					ELSE CONCAT(e.first_name, ' ', e.last_name)
				END as name,
				e.first_name,
				e.last_name,
				e.email,
				e.department,
				e.position,
				e.employee_id,
				e.status,
				COALESCE(sc.annual_salary, 0) as annual_salary
			FROM employees e
			LEFT JOIN salary_contracts sc ON e.id = sc.employee_id AND sc.status = 'active'
			WHERE e.status = 'active'
		`

    const params: unknown[] = []
    let paramIndex = 1

    if (department) {
      sqlQuery += ` AND e.department = $${paramIndex}`
      params.push(department)
      paramIndex++
    }

    if (position) {
      sqlQuery += ` AND e.position = $${paramIndex}`
      params.push(position)
      paramIndex++
    }

    if (search) {
      sqlQuery += ` AND (
				CASE 
					WHEN e.first_name ~ '^[가-힣]+$' AND e.last_name ~ '^[가-힣]+$' 
					THEN CONCAT(e.last_name, ' ', e.first_name)
					ELSE CONCAT(e.first_name, ' ', e.last_name)
				END ILIKE $${paramIndex} 
				OR e.first_name ILIKE $${paramIndex} 
				OR e.last_name ILIKE $${paramIndex} 
				OR e.email ILIKE $${paramIndex} 
				OR e.employee_id ILIKE $${paramIndex}
			)`
      params.push(`%${search}%`)
      paramIndex++
    }

    sqlQuery += ' ORDER BY e.department ASC, e.last_name ASC, e.first_name ASC'

    const result = await query(sqlQuery, params)

    // 직원 목록 쿼리 완료

    return json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    logger.error('직원 목록 조회 실패:', error)
    return json(
      {
        success: false,
        message: '직원 목록을 불러오는데 실패했습니다.',
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
