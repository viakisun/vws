import { query } from '$lib/database/connection.js'
import { formatDateForDisplay, toUTC } from '$lib/utils/date-handler.js'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET: 특정 직원 조회
export const GET: RequestHandler = async ({ params }) => {
  try {
    const result = await query(
      `
			SELECT 
				e.id, e.employee_id, e.first_name, e.last_name, e.email, e.phone,
				e.department, e.position, e.salary, e.hire_date, e.status,
				e.employment_type, e.job_title_id, e.created_at, e.updated_at,
				jt.name as job_title_name, jt.level as job_title_level, jt.category as job_title_category
			FROM employees e
			LEFT JOIN job_titles jt ON e.job_title_id = jt.id
			WHERE e.id = $1
		`,
      [params.id]
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

    // 날짜 필드를 서울 시간대로 변환하여 반환
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
      data: formattedEmployee
    })
  } catch (error) {
    console.error('Error fetching employee:', error)
    return json(
      {
        success: false,
        error: '직원 정보를 가져오는데 실패했습니다.'
      },
      { status: 500 }
    )
  }
}

// PUT: 직원 정보 수정
export const PUT: RequestHandler = async ({ params, request }) => {
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
			UPDATE employees SET
				first_name = $2,
				last_name = $3,
				email = $4,
				phone = $5,
				department = $6,
				position = $7,
				salary = $8,
				hire_date = $9,
				status = $10,
				employment_type = $11,
				job_title_id = $12,
				updated_at = $13
			WHERE id = $1
			RETURNING id, employee_id, first_name, last_name, email, phone,
				department, position, salary, hire_date, status,
				employment_type, job_title_id, created_at, updated_at
		`,
      [
        params.id,
        data.first_name.trim(),
        data.last_name.trim(),
        data.email.trim(),
        data.phone?.trim() || '',
        data.department.trim(),
        data.position.trim(),
        parseFloat(data.salary),
        hireDate ? toUTC(hireDate).split('T')[0] : null,
        data.status || 'active',
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
    console.error('Error updating employee:', error)
    return json(
      {
        success: false,
        error: '직원 정보 수정에 실패했습니다.'
      },
      { status: 500 }
    )
  }
}

// DELETE: 직원 삭제 (완전 삭제)
export const DELETE: RequestHandler = async ({ params, url }) => {
  try {
    const archive = url.searchParams.get('archive') === 'true'

    if (archive) {
      // 아카이브 (soft delete) - 상태를 'terminated'로 변경
      const result = await query(
        `
				UPDATE employees SET
					status = 'terminated',
					updated_at = $2
				WHERE id = $1
				RETURNING id, employee_id, first_name, last_name, status
			`,
        [params.id, new Date()]
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

      return json({
        success: true,
        message: '직원이 퇴사 처리되었습니다.',
        data: result.rows[0]
      })
    } else {
      // 완전 삭제 전 안전장치 확인

      // 1. 직원 존재 확인
      const existingEmployee = await query(
        'SELECT id, employee_id, first_name, last_name FROM employees WHERE id = $1',
        [params.id]
      )

      if (existingEmployee.rows.length === 0) {
        return json(
          {
            success: false,
            error: '직원을 찾을 수 없습니다.'
          },
          { status: 404 }
        )
      }

      const employee = existingEmployee.rows[0]

      // 2. 프로젝트 참여 여부 확인
      const projectParticipation = await query(
        'SELECT COUNT(*) as count FROM project_members WHERE employee_id = $1',
        [params.id]
      )

      if (parseInt(projectParticipation.rows[0].count) > 0) {
        return json(
          {
            success: false,
            error:
              '프로젝트에 참여 중인 직원은 삭제할 수 없습니다. 먼저 프로젝트 참여를 해제해주세요.'
          },
          { status: 400 }
        )
      }

      // 3. 근로계약서 확인
      const contractCount = await query(
        'SELECT COUNT(*) as count FROM salary_contracts WHERE employee_id = $1',
        [params.id]
      )

      if (parseInt(contractCount.rows[0].count) > 0) {
        return json(
          {
            success: false,
            error: '근로계약서가 있는 직원은 삭제할 수 없습니다. 먼저 근로계약서를 삭제해주세요.'
          },
          { status: 400 }
        )
      }

      // 4. 안전하게 직원 삭제
      const result = await query(
        `
				DELETE FROM employees
				WHERE id = $1
				RETURNING id, employee_id, first_name, last_name
			`,
        [params.id]
      )

      return json({
        success: true,
        message: `${employee.first_name} ${employee.last_name}(${employee.employee_id}) 직원이 성공적으로 삭제되었습니다.`,
        data: result.rows[0]
      })
    }
  } catch (error) {
    console.error('Error deleting employee:', error)
    return json(
      {
        success: false,
        error: '직원 삭제에 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}
