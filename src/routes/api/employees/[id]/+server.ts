import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { formatDateForDisplay, toUTC } from '$lib/utils/date-handler'
import { formatEmployeeName } from '$lib/utils/format'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface EmployeeWithJobTitle {
  id: string
  employee_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  department: string
  position: string
  salary: string
  hire_date: string
  birth_date?: string
  termination_date?: string
  status: string
  employment_type: string
  job_title_id: string
  created_at: string
  updated_at: string
  job_title_name: string
  job_title_level: string
  job_title_category: string
  [key: string]: unknown
}

interface UpdateEmployeeRequest {
  first_name: string
  last_name: string
  email: string
  phone?: string
  department: string
  position: string
  salary: number
  hire_date?: string
  status?: string
  employment_type?: string
  job_title_id?: string
}

// GET: 특정 직원 조회
export const GET: RequestHandler = async ({ params }) => {
  try {
    const result = await query<EmployeeWithJobTitle>(
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
      [params.id],
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '직원을 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    // 날짜 필드를 서울 시간대로 변환하여 반환
    const employee = result.rows[0]
    const formattedEmployee = {
      ...employee,
      hire_date: employee.hire_date ? formatDateForDisplay(employee.hire_date, 'ISO') : '',
      birth_date: employee.birth_date ? formatDateForDisplay(employee.birth_date, 'ISO') : '',
      termination_date: employee.termination_date
        ? formatDateForDisplay(employee.termination_date, 'ISO')
        : '',
    }

    const response: ApiResponse<EmployeeWithJobTitle> = {
      success: true,
      data: formattedEmployee as EmployeeWithJobTitle,
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Error fetching employee:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '직원 정보를 가져오는데 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// PUT: 직원 정보 수정
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const data = (await request.json()) as UpdateEmployeeRequest

    logger.info('Employee update request:', {
      employeeId: params.id,
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        department: data.department,
        position: data.position,
        salary: data.salary,
        phone: data.phone,
        hire_date: data.hire_date,
        status: data.status,
        employment_type: data.employment_type,
        job_title_id: data.job_title_id,
      },
    })

    // 필수 필드 검증
    const requiredFields = ['first_name', 'last_name', 'email', 'department', 'position']
    const missingFields = requiredFields.filter((field) => {
      const value = data[field as keyof UpdateEmployeeRequest]
      return value === null || value === undefined || value === ''
    })

    // salary는 0도 유효하므로 별도 체크
    if (data.salary === null || data.salary === undefined) {
      missingFields.push('salary')
    }

    if (missingFields.length > 0) {
      logger.error('Missing required fields for employee update:', {
        employeeId: params.id,
        missingFields,
        receivedData: data,
      })
      return json(
        {
          success: false,
          error: `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`,
        },
        { status: 400 },
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
            error: '올바르지 않은 입사일 형식입니다.',
          },
          { status: 400 },
        )
      }
    }

    const result = await query<EmployeeWithJobTitle>(
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
        data.salary,
        hireDate ? toUTC(hireDate).split('T')[0] : null,
        data.status || 'active',
        data.employment_type || 'full-time',
        data.job_title_id || null,
        new Date(),
      ],
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '직원을 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    // 응답 데이터의 날짜를 서울 시간대로 변환
    const employee = result.rows[0]
    const formattedEmployee = {
      ...employee,
      hire_date: employee.hire_date ? formatDateForDisplay(employee.hire_date, 'ISO') : '',
      birth_date: employee.birth_date ? formatDateForDisplay(employee.birth_date, 'ISO') : '',
      termination_date: employee.termination_date
        ? formatDateForDisplay(employee.termination_date, 'ISO')
        : '',
    }

    const response: ApiResponse<EmployeeWithJobTitle> = {
      success: true,
      data: formattedEmployee as EmployeeWithJobTitle,
      message: '직원 정보가 성공적으로 수정되었습니다.',
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Error updating employee:', error)

    // 데이터베이스 연결 타임아웃 오류 처리
    if (error instanceof Error) {
      if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
        return json(
          {
            success: false,
            error: '데이터베이스 연결이 시간 초과되었습니다. 잠시 후 다시 시도해주세요.',
          },
          { status: 408 }, // Request Timeout
        )
      }

      if (error.message.includes('ECONNREFUSED') || error.message.includes('connection')) {
        return json(
          {
            success: false,
            error: '데이터베이스 연결에 실패했습니다. 관리자에게 문의해주세요.',
          },
          { status: 503 }, // Service Unavailable
        )
      }
    }

    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '직원 정보 수정에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// DELETE: 직원 삭제 (완전 삭제)
export const DELETE: RequestHandler = async ({ params, url }) => {
  try {
    const archive = url.searchParams.get('archive') === 'true'

    if (archive) {
      // 아카이브 (soft delete) - 상태를 'terminated'로 변경
      const result = await query<{
        id: string
        employee_id: string
        first_name: string
        last_name: string
        status: string
      }>(
        `
				UPDATE employees SET
					status = 'terminated',
					updated_at = $2
				WHERE id = $1
				RETURNING id, employee_id, first_name, last_name, status
			`,
        [params.id, new Date()],
      )

      if (result.rows.length === 0) {
        return json(
          {
            success: false,
            error: '직원을 찾을 수 없습니다.',
          },
          { status: 404 },
        )
      }

      const response: ApiResponse<{
        id: string
        employee_id: string
        first_name: string
        last_name: string
        status: string
      }> = {
        success: true,
        message: '직원이 퇴사 처리되었습니다.',
        data: result.rows[0],
      }

      return json(response)
    } else {
      // 완전 삭제 전 안전장치 확인

      // 1. 직원 존재 확인
      const existingEmployee = await query<{
        id: string
        employee_id: string
        first_name: string
        last_name: string
      }>('SELECT id, employee_id, first_name, last_name FROM employees WHERE id = $1', [params.id])

      if (existingEmployee.rows.length === 0) {
        return json(
          {
            success: false,
            error: '직원을 찾을 수 없습니다.',
          },
          { status: 404 },
        )
      }

      const employee = existingEmployee.rows[0]

      // 2. 프로젝트 참여 여부 확인
      const projectParticipation = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM project_members WHERE employee_id = $1',
        [params.id],
      )

      if (parseInt(projectParticipation.rows[0].count) > 0) {
        return json(
          {
            success: false,
            error:
              '프로젝트에 참여 중인 직원은 삭제할 수 없습니다. 먼저 프로젝트 참여를 해제해주세요.',
          },
          { status: 400 },
        )
      }

      // 3. 근로계약서 확인
      const contractCount = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM salary_contracts WHERE employee_id = $1',
        [params.id],
      )

      if (parseInt(contractCount.rows[0].count) > 0) {
        return json(
          {
            success: false,
            error: '근로계약서가 있는 직원은 삭제할 수 없습니다. 먼저 근로계약서를 삭제해주세요.',
          },
          { status: 400 },
        )
      }

      // 4. 안전하게 직원 삭제
      const result = await query<{
        id: string
        employee_id: string
        first_name: string
        last_name: string
      }>(
        `
				DELETE FROM employees
				WHERE id = $1
				RETURNING id, employee_id, first_name, last_name
			`,
        [params.id],
      )

      const response: ApiResponse<{
        id: string
        employee_id: string
        first_name: string
        last_name: string
      }> = {
        success: true,
        message: `${formatEmployeeName(employee)}(${employee.employee_id}) 직원이 성공적으로 삭제되었습니다.`,
        data: result.rows[0],
      }

      return json(response)
    }
  } catch (error: unknown) {
    logger.error('Error deleting employee:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '직원 삭제에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
