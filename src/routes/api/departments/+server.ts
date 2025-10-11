import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 부서 목록 조회
// Note: departments 테이블이 없으므로 employees 테이블에서 고유한 department 값을 추출
export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams
    const status = searchParams.get('status') || 'active'

    // employees 테이블에서 고유한 부서명 추출
    let whereClause = ''
    if (status === 'active') {
      whereClause = "WHERE e.status = 'active'"
    }

    const result = await query(
      `
      SELECT 
        department as name,
        COUNT(*) as employee_count,
        MIN(hire_date)::text as created_at
      FROM employees e
      ${whereClause}
      GROUP BY department
      HAVING department IS NOT NULL AND department != ''
      ORDER BY department ASC
    `,
      [],
    )

    // departments 테이블 형식으로 변환
    const departments = result.rows.map((row) => ({
      id: row.name, // department 이름을 ID로 사용
      name: row.name,
      description: `${row.employee_count}명`,
      status: 'active',
      max_employees: null,
      created_at: row.created_at,
      updated_at: row.created_at,
      employee_count: parseInt(row.employee_count),
    }))

    return json({
      success: true,
      data: departments,
    })
  } catch (error: any) {
    logger.error('Error fetching departments:', error)
    return json(
      {
        success: false,
        error: error.message || '부서 목록을 가져오는데 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// 부서 생성
// Note: departments 테이블이 없으므로 부서는 employees.department 컬럼에 직접 입력됨
// 이 API는 호환성을 위해 유지하지만, 실제로는 직원 생성 시 department 필드로 관리됨
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json()

    // 필수 필드 검증
    if (!data.name || data.name.trim() === '') {
      return json(
        {
          success: false,
          error: '부서명은 필수 입력 항목입니다.',
        },
        { status: 400 },
      )
    }

    // 이미 존재하는 부서명인지 확인
    const existingDept = await query(
      "SELECT department FROM employees WHERE LOWER(department) = LOWER($1) AND status = 'active' LIMIT 1",
      [data.name.trim()],
    )

    if (existingDept.rows.length > 0) {
      return json(
        {
          success: false,
          error: '이미 존재하는 부서명입니다.',
        },
        { status: 400 },
      )
    }

    // departments 테이블이 없으므로 가상의 응답 반환
    // 실제로는 직원 생성 시 이 부서명을 사용하면 됨
    return json({
      success: true,
      data: {
        id: data.name.trim(),
        name: data.name.trim(),
        description: data.description?.trim() || '',
        status: 'active',
        max_employees: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        employee_count: 0,
      },
      message: '부서가 등록되었습니다. 이제 이 부서로 직원을 배정할 수 있습니다.',
    })
  } catch (error: any) {
    logger.error('Error creating department:', error)
    return json(
      {
        success: false,
        error: error.message || '부서 생성에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
