import { query } from '$lib/database/connection.js'
import { formatDateForDisplay, toUTC } from '$lib/utils/date-handler.js'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger';

// GET: 직원 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const status = url.searchParams.get('status')
    const department = url.searchParams.get('department')

    let whereClause = ''
    const params: unknown[] = []
    let paramIndex = 1

    if (status && status !== 'all') {
      whereClause += ` WHERE status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    if (department && department !== 'all') {
      whereClause += whereClause
        ? ` AND department = $${paramIndex}`
        : ` WHERE department = $${paramIndex}`
      params.push(department)
      paramIndex++
    }

    const result = await query(
      `
			SELECT 
				e.id, e.employee_id, e.first_name, e.last_name, e.email, e.phone,
				e.department, e.position, e.salary, e.hire_date, e.birth_date, e.termination_date, e.status,
				e.employment_type, e.job_title_id, e.created_at, e.updated_at,
				jt.name as job_title_name, jt.level as job_title_level, jt.category as job_title_category
			FROM employees e
			LEFT JOIN job_titles jt ON e.job_title_id = jt.id
			${whereClause}
			ORDER BY e.created_at DESC
		`,
      params
    )

    // 날짜 필드를 서울 시간대로 변환하여 반환
    const employees = result.rows.map(row => ({
      ...row,
      hire_date: row.hire_date ? formatDateForDisplay(row.hire_date, 'ISO') : null,
      birth_date: row.birth_date ? formatDateForDisplay(row.birth_date, 'ISO') : null,
      termination_date: row.termination_date
        ? formatDateForDisplay(row.termination_date, 'ISO')
        : null
    }))

    return json({
      success: true,
      data: employees
    })
  } catch (error) {
    logger.error('Error fetching employees:', error)
    return json(
      {
        success: false,
        error: '직원 목록을 가져오는데 실패했습니다.'
      },
      { status: 500 }
    )
  }
}

// POST: 새 직원 추가
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json()

    // 필수 필드 검증
    const requiredFields = ['first_name', 'last_name', 'email', 'department', 'position', 'salary']
    const missingFields = requiredFields.filter(field => !data[field] || data[field] === '')

    if (missingFields.length > 0) {
      return json(
        {
          success: false,
          error: `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`
        },
        { status: 400 }
      )
    }

    // 생일 처리
    let birthDate = null
    if (data.birth_date) {
      birthDate = new Date(data.birth_date)
      if (isNaN(birthDate.getTime())) {
        return json(
          {
            success: false,
            error: '올바르지 않은 생일 형식입니다.'
          },
          { status: 400 }
        )
      }
    }

    // 퇴사일 처리
    let terminationDate = null
    if (data.termination_date) {
      terminationDate = new Date(data.termination_date)
      if (isNaN(terminationDate.getTime())) {
        return json(
          {
            success: false,
            error: '올바르지 않은 퇴사일 형식입니다.'
          },
          { status: 400 }
        )
      }
    }

    // employee_id 생성 (기존 4자리 숫자 규칙 유지)
    // 기존 숫자 사번 중 최대값을 찾아서 다음 사번 생성
    const countResult = await query(`
			SELECT MAX(CAST(employee_id AS INTEGER)) as max_id 
			FROM employees 
			WHERE employee_id ~ '^[0-9]+$' AND LENGTH(employee_id) <= 4
		`)
    const maxId = countResult.rows[0]?.max_id || 1000
    const nextId = maxId + 1
    const employeeId = nextId.toString()

    // 입사일 처리
    let hireDate = new Date()
    if (data.hire_date) {
      hireDate = new Date(data.hire_date)
      if (isNaN(hireDate.getTime())) {
        return json(
          {
            success: false,
            error: '올바르지 않은 입사일 형식입니다.'
          },
          { status: 400 }
        )
      }
    }

    const result = await query(
      `
			INSERT INTO employees (
				employee_id, first_name, last_name, email, phone,
				department, position, salary, hire_date, birth_date, termination_date, status,
				employment_type, job_title_id, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
			RETURNING id, employee_id, first_name, last_name, email, phone,
				department, position, salary, hire_date, birth_date, termination_date, status,
				employment_type, job_title_id, created_at, updated_at
		`,
      [
        employeeId,
        data.first_name?.trim() || '',
        data.last_name?.trim() || '',
        data.email?.trim() || '',
        data.phone?.trim() || '',
        data.department?.trim() || '',
        data.position?.trim() || '',
        parseFloat(data.salary) || 0,
        hireDate ? toUTC(hireDate).split('T')[0] : null,
        birthDate ? toUTC(birthDate).split('T')[0] : null,
        terminationDate ? toUTC(terminationDate).split('T')[0] : null,
        data.status || 'active',
        data.employment_type || 'full-time',
        data.job_title_id || null,
        new Date(),
        new Date()
      ]
    )

    // 응답 데이터의 날짜를 서울 시간대로 변환
    const employee = result.rows[0]
    const formattedEmployee = {
      ...employee,
      hire_date: employee.hire_date ? formatDateForDisplay(employee.hire_date, 'ISO') : null,
      birth_date: employee.birth_date ? formatDateForDisplay(employee.birth_date, 'ISO') : null,
      termination_date: employee.termination_date
        ? formatDateForDisplay(employee.termination_date, 'ISO')
        : null
    }

    return json({
      success: true,
      data: formattedEmployee,
      message: '직원이 성공적으로 추가되었습니다.'
    })
  } catch (error) {
    logger.error('Error adding employee:', error)
    return json(
      {
        success: false,
        error: '직원 추가에 실패했습니다.'
      },
      { status: 500 }
    )
  }
}

// PUT: 직원 정보 수정
export const PUT: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json()

    // 필수 필드 검증
    if (!data.id) {
      return json(
        {
          success: false,
          error: '직원 ID가 필요합니다.'
        },
        { status: 400 }
      )
    }

    const requiredFields = ['first_name', 'last_name', 'email', 'department', 'position', 'salary']
    const missingFields = requiredFields.filter(field => !data[field] || data[field] === '')

    if (missingFields.length > 0) {
      return json(
        {
          success: false,
          error: `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`
        },
        { status: 400 }
      )
    }

    // 생일 처리
    let birthDate = null
    if (data.birth_date) {
      birthDate = new Date(data.birth_date)
      if (isNaN(birthDate.getTime())) {
        return json(
          {
            success: false,
            error: '올바르지 않은 생일 형식입니다.'
          },
          { status: 400 }
        )
      }
    }

    // 퇴사일 처리
    let terminationDate = null
    if (data.termination_date) {
      terminationDate = new Date(data.termination_date)
      if (isNaN(terminationDate.getTime())) {
        return json(
          {
            success: false,
            error: '올바르지 않은 퇴사일 형식입니다.'
          },
          { status: 400 }
        )
      }
    }

    // 입사일 처리
    let hireDate = new Date()
    if (data.hire_date) {
      hireDate = new Date(data.hire_date)
      if (isNaN(hireDate.getTime())) {
        return json(
          {
            success: false,
            error: '올바르지 않은 입사일 형식입니다.'
          },
          { status: 400 }
        )
      }
    }

    // 상태는 사용자가 직접 설정한 값 사용 (퇴사일이 있어도 자동으로 terminated로 변경하지 않음)
    const status = data.status || 'active'

    const result = await query(
      `
			UPDATE employees SET
				first_name = $2,
				last_name = $3,
				email = $4,
				phone = $5,
				department = $6,
				position = $7,
				salary = $8,
				hire_date = $9,
				birth_date = $10,
				termination_date = $11,
				status = $12,
				employment_type = $13,
				job_title_id = $14,
				updated_at = $15
			WHERE id = $1
			RETURNING id, employee_id, first_name, last_name, email, phone,
				department, position, salary, hire_date, birth_date, termination_date, status,
				employment_type, job_title_id, created_at, updated_at
		`,
      [
        data.id,
        data.first_name?.trim() || '',
        data.last_name?.trim() || '',
        data.email?.trim() || '',
        data.phone?.trim() || '',
        data.department?.trim() || '',
        data.position?.trim() || '',
        parseFloat(data.salary) || 0,
        hireDate ? toUTC(hireDate).split('T')[0] : null,
        birthDate ? toUTC(birthDate).split('T')[0] : null,
        terminationDate ? toUTC(terminationDate).split('T')[0] : null,
        status,
        data.employment_type || 'full-time',
        data.job_title_id || null,
        new Date()
      ]
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '직원을 찾을 수 없습니다.'
        },
        { status: 404 }
      )
    }

    // 응답 데이터의 날짜를 서울 시간대로 변환
    const employee = result.rows[0]
    const formattedEmployee = {
      ...employee,
      hire_date: employee.hire_date ? formatDateForDisplay(employee.hire_date, 'ISO') : null,
      birth_date: employee.birth_date ? formatDateForDisplay(employee.birth_date, 'ISO') : null,
      termination_date: employee.termination_date
        ? formatDateForDisplay(employee.termination_date, 'ISO')
        : null
    }

    return json({
      success: true,
      data: formattedEmployee,
      message: '직원 정보가 성공적으로 수정되었습니다.'
    })
  } catch (error) {
    logger.error('Error updating employee:', error)
    return json(
      {
        success: false,
        error: '직원 정보 수정에 실패했습니다.'
      },
      { status: 500 }
    )
  }
}
