// 인사 관리 시스템 - 직원 API 엔드포인트

import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import type {
  EmergencyContact,
  Employee,
  EmployeeLevel,
  EmployeeStatus,
  EmploymentType,
  PaginatedResponse,
  PersonalInfo,
} from '$lib/types/hr'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface DatabaseEmployee {
  id: string
  employee_id: string
  name: string
  email: string
  phone: string
  address: string
  department: string
  position: string
  level: string
  employment_type: string
  hire_date: string
  birth_date: string
  status: string
  manager_id: string
  profile_image: string
  emergency_contact: string
  personal_info: string
  termination_date: string
  created_at: string
  updated_at: string
  [key: string]: unknown
}

interface CreateEmployeeRequest {
  employeeId: string
  name: string
  email: string
  phone: string
  address?: string
  department: string
  position: string
  level?: string
  employmentType?: string
  hireDate: string
  birthDate?: string
  status?: string
  managerId?: string
  profileImage?: string
  emergencyContact?: {
    name: string
    relationship: string
    phone: string
  }
  personalInfo?: {
    birthDate: string
    gender: string
    nationality: string
    maritalStatus: string
  }
  terminationDate?: string
}

// GET: 직원 목록 조회 (페이지네이션 및 필터링 지원)
export const GET: RequestHandler = async ({ url }) => {
  try {
    // 쿼리 파라미터 파싱
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') || ''
    const department = url.searchParams.get('department') || ''
    const position = url.searchParams.get('position') || ''
    const employmentType = url.searchParams.get('employmentType') || ''
    const level = url.searchParams.get('level') || ''
    const sortBy = url.searchParams.get('sortBy') || 'created_at'
    const sortOrder = url.searchParams.get('sortOrder') || 'DESC'

    // WHERE 조건 구성
    const conditions: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    // 검색 조건
    if (search) {
      conditions.push(`(
				CONCAT(e.first_name, ' ', e.last_name) ILIKE $${paramIndex} OR 
				e.email ILIKE $${paramIndex} OR 
				e.employee_id ILIKE $${paramIndex}
			)`)
      params.push(`%${search}%`)
      paramIndex++
    }

    // 필터 조건
    if (status && status !== 'all') {
      conditions.push(`e.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (department && department !== 'all') {
      conditions.push(`e.department = $${paramIndex}`)
      params.push(department)
      paramIndex++
    }

    if (position && position !== 'all') {
      conditions.push(`e.position = $${paramIndex}`)
      params.push(position)
      paramIndex++
    }

    if (employmentType && employmentType !== 'all') {
      conditions.push(`e.employment_type = $${paramIndex}`)
      params.push(employmentType)
      paramIndex++
    }

    if (level && level !== 'all') {
      conditions.push(`e.level = $${paramIndex}`)
      params.push(level)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 정렬 필드 검증
    const allowedSortFields = [
      'name',
      'employee_id',
      'department',
      'position',
      'hire_date',
      'status',
      'created_at',
    ]
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at'
    const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    // 전체 개수 조회
    const countResult = await query<{ total: string }>(
      `
			SELECT COUNT(*) as total
			FROM employees e
			${whereClause}
		`,
      params,
    )

    const total = parseInt(countResult.rows[0]?.total || '0')
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit

    // 직원 목록 조회
    const result = await query<DatabaseEmployee>(
      `
			SELECT 
				e.id,
				e.employee_id,
				CONCAT(e.first_name, ' ', e.last_name) as name,
				e.email,
				e.phone,
				e.address,
				e.department,
				e.position,
				e.position as level,
				e.employment_type,
				e.hire_date,
				e.status,
				vcm.manager_id,
				vcm.manager_name,
				e.emergency_contact,
				e.created_at,
				e.updated_at
			FROM employees e
			LEFT JOIN v_employee_current_manager vcm ON e.id = vcm.employee_id
			${whereClause}
			ORDER BY e.${sortField} ${orderDirection}
			LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
		`,
      [...params, limit, offset],
    )

    // 응답 데이터 구성
    const response: PaginatedResponse<Employee> = {
      data: result.rows.map((row) => ({
        id: row.id,
        employeeId: row.employee_id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        department: row.department,
        position: row.position,
        level: row.level as EmployeeLevel,
        employmentType: row.employment_type as EmploymentType,
        hireDate: row.hire_date,
        birthDate: row.birth_date,
        status: row.status as EmployeeStatus,
        managerId: row.manager_id,
        profileImage: row.profile_image,
        emergencyContact: (row.emergency_contact
          ? JSON.parse(row.emergency_contact)
          : {
              name: '',
              relationship: '',
              phone: '',
            }) as EmergencyContact,
        personalInfo: (row.personal_info
          ? JSON.parse(row.personal_info)
          : {
              birthDate: '',
              gender: 'other' as const,
              nationality: '',
              maritalStatus: 'single' as const,
            }) as PersonalInfo,
        terminationDate: row.termination_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      total,
      page,
      limit,
      totalPages,
    }

    const apiResponse: ApiResponse<PaginatedResponse<Employee>> = {
      success: true,
      data: response,
    }

    return json(apiResponse)
  } catch (error: unknown) {
    logger.error('Error fetching employees:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '직원 목록을 가져오는데 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// POST: 새 직원 추가
export const POST: RequestHandler = async ({ request }) => {
  try {
    const employeeData = (await request.json()) as CreateEmployeeRequest

    // 필수 필드 검증
    const requiredFields = [
      'employeeId',
      'name',
      'email',
      'phone',
      'department',
      'position',
      'hireDate',
    ]
    for (const field of requiredFields) {
      if (!employeeData[field]) {
        return json(
          {
            success: false,
            error: `${field}은(는) 필수 입력 항목입니다.`,
          },
          { status: 400 },
        )
      }
    }

    // 이메일 중복 검사
    const existingEmployee = await query<{ id: string }>(
      'SELECT id FROM employees WHERE email = $1 OR employee_id = $2',
      [employeeData.email, employeeData.employeeId],
    )

    if (existingEmployee.rows.length > 0) {
      return json(
        {
          success: false,
          error: '이미 존재하는 이메일 또는 사번입니다.',
        },
        { status: 400 },
      )
    }

    // 직원 추가
    const result = await query<DatabaseEmployee>(
      `
			INSERT INTO employees (
				employee_id, name, email, phone, address, department, position, level,
				employment_type, hire_date, birth_date, status, profile_image,
				emergency_contact, personal_info, termination_date, created_at, updated_at
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()
			) RETURNING *
		`,
      [
        employeeData.employeeId,
        employeeData.name,
        employeeData.email,
        employeeData.phone,
        employeeData.address || '',
        employeeData.department,
        employeeData.position,
        employeeData.level || 'mid',
        employeeData.employmentType || 'full-time',
        employeeData.hireDate,
        employeeData.birthDate || '',
        employeeData.status || 'active',
        employeeData.profileImage || '',
        JSON.stringify(employeeData.emergencyContact || {}),
        JSON.stringify(employeeData.personalInfo || {}),
        employeeData.terminationDate || '',
      ],
    )

    if (!result.rows[0]) {
      throw new Error('직원 생성에 실패했습니다.')
    }

    // 매니저가 지정된 경우 보고 관계 생성
    if (employeeData.managerId) {
      await query(
        `INSERT INTO reporting_relationships (employee_id, manager_id, report_type, start_date)
         VALUES ($1, $2, 'direct', $3)`,
        [
          result.rows[0].id,
          employeeData.managerId,
          employeeData.hireDate || new Date().toISOString(),
        ],
      )
    }

    // 부서가 지정된 경우 조직 소속 생성
    if (employeeData.department) {
      // 부서 코드로 org_unit 찾기
      const orgUnit = await query(`SELECT id FROM org_units WHERE code = $1 OR name = $2 LIMIT 1`, [
        employeeData.department.toLowerCase().replace(/[^a-z0-9가-힣]/g, '_'),
        employeeData.department,
      ])

      if (orgUnit.rows.length > 0) {
        await query(
          `INSERT INTO org_memberships (employee_id, org_unit_id, is_primary, start_date)
           VALUES ($1, $2, true, $3)`,
          [
            result.rows[0].id,
            orgUnit.rows[0].id,
            employeeData.hireDate || new Date().toISOString(),
          ],
        )
      }
    }

    const newEmployee: Employee = {
      id: result.rows[0].id,
      employee_id: result.rows[0].employee_id,
      first_name: result.rows[0].first_name || '',
      last_name: result.rows[0].last_name || '',
      name: result.rows[0].name,
      email: result.rows[0].email,
      phone: result.rows[0].phone,
      address: result.rows[0].address,
      department: result.rows[0].department,
      position: result.rows[0].position,
      level: result.rows[0].level as EmployeeLevel,
      employment_type: result.rows[0].employment_type as EmploymentType,
      hire_date: result.rows[0].hire_date,
      birth_date: result.rows[0].birth_date,
      status: result.rows[0].status as EmployeeStatus,
      manager_id: employeeData.managerId, // 전달받은 값 사용
      profile_image: result.rows[0].profile_image,
      emergency_contact: (result.rows[0].emergency_contact
        ? JSON.parse(result.rows[0].emergency_contact)
        : {
            name: '',
            relationship: '',
            phone: '',
          }) as EmergencyContact,
      personal_info: (result.rows[0].personal_info
        ? JSON.parse(result.rows[0].personal_info)
        : {
            birthDate: '',
            gender: 'other' as const,
            nationality: '',
            maritalStatus: 'single' as const,
          }) as PersonalInfo,
      termination_date: result.rows[0].termination_date,
      created_at: result.rows[0].created_at,
      updated_at: result.rows[0].updated_at,
    }

    const response: ApiResponse<Employee> = {
      success: true,
      data: newEmployee,
      message: '직원이 성공적으로 추가되었습니다.',
    }

    return json(response, { status: 201 })
  } catch (error: unknown) {
    logger.error('Error creating employee:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '직원 추가에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
