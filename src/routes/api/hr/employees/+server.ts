// 인사 관리 시스템 - 직원 API 엔드포인트

import { json } from '@sveltejs/kit'
import { query } from '$lib/database/connection.js'
import type { RequestHandler } from './$types'
import type { Employee, PaginatedResponse } from '$lib/types/hr'
import { logger } from '$lib/utils/logger';

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
    const params: any[] = []
    let paramIndex = 1

    // 검색 조건
    if (search) {
      conditions.push(`(
				e.name ILIKE $${paramIndex} OR 
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
      'created_at'
    ]
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at'
    const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    // 전체 개수 조회
    const countResult = await query(
      `
			SELECT COUNT(*) as total
			FROM employees e
			${whereClause}
		`,
      params
    )

    const total = parseInt(countResult.rows[0]?.total || '0')
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit

    // 직원 목록 조회
    const result = await query(
      `
			SELECT 
				e.id,
				e.employee_id,
				e.name,
				e.email,
				e.phone,
				e.address,
				e.department,
				e.position,
				e.level,
				e.employment_type,
				e.hire_date,
				e.birth_date,
				e.status,
				e.manager_id,
				e.profile_image,
				e.emergency_contact,
				e.personal_info,
				e.termination_date,
				e.created_at,
				e.updated_at
			FROM employees e
			${whereClause}
			ORDER BY e.${sortField} ${orderDirection}
			LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
		`,
      [...params, limit, offset]
    )

    // 응답 데이터 구성
    const response: PaginatedResponse<Employee> = {
      data: result.rows.map(row => ({
        id: row.id,
        employeeId: row.employee_id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        department: row.department,
        position: row.position,
        level: row.level,
        employmentType: row.employment_type,
        hireDate: row.hire_date,
        birthDate: row.birth_date,
        status: row.status,
        managerId: row.manager_id,
        profileImage: row.profile_image,
        emergencyContact: row.emergency_contact || {
          name: '',
          relationship: '',
          phone: ''
        },
        personalInfo: row.personal_info || {
          birthDate: '',
          gender: 'other',
          nationality: '',
          maritalStatus: 'single'
        },
        terminationDate: row.termination_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      total,
      page,
      limit,
      totalPages
    }

    return json({
      success: true,
      data: response
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
    const employeeData = await request.json()

    // 필수 필드 검증
    const requiredFields = [
      'employeeId',
      'name',
      'email',
      'phone',
      'department',
      'position',
      'hireDate'
    ]
    for (const field of requiredFields) {
      if (!employeeData[field]) {
        return json(
          {
            success: false,
            error: `${field}은(는) 필수 입력 항목입니다.`
          },
          { status: 400 }
        )
      }
    }

    // 이메일 중복 검사
    const existingEmployee = await query(
      'SELECT id FROM employees WHERE email = $1 OR employee_id = $2',
      [employeeData.email, employeeData.employeeId]
    )

    if (existingEmployee.rows.length > 0) {
      return json(
        {
          success: false,
          error: '이미 존재하는 이메일 또는 사번입니다.'
        },
        { status: 400 }
      )
    }

    // 직원 추가
    const result = await query(
      `
			INSERT INTO employees (
				employee_id, name, email, phone, address, department, position, level,
				employment_type, hire_date, birth_date, status, manager_id, profile_image,
				emergency_contact, personal_info, termination_date, created_at, updated_at
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
			) RETURNING *
		`,
      [
        employeeData.employeeId,
        employeeData.name,
        employeeData.email,
        employeeData.phone,
        employeeData.address,
        employeeData.department,
        employeeData.position,
        employeeData.level || 'mid',
        employeeData.employmentType || 'full-time',
        employeeData.hireDate,
        employeeData.birthDate,
        employeeData.status || 'active',
        employeeData.managerId,
        employeeData.profileImage,
        JSON.stringify(employeeData.emergencyContact || {}),
        JSON.stringify(employeeData.personalInfo || {}),
        employeeData.terminationDate
      ]
    )

    if (!result.rows[0]) {
      throw new Error('직원 생성에 실패했습니다.')
    }

    const newEmployee: Employee = {
      id: result.rows[0].id,
      employeeId: result.rows[0].employee_id,
      name: result.rows[0].name,
      email: result.rows[0].email,
      phone: result.rows[0].phone,
      address: result.rows[0].address,
      department: result.rows[0].department,
      position: result.rows[0].position,
      level: result.rows[0].level,
      employmentType: result.rows[0].employment_type,
      hireDate: result.rows[0].hire_date,
      birthDate: result.rows[0].birth_date,
      status: result.rows[0].status,
      managerId: result.rows[0].manager_id,
      profileImage: result.rows[0].profile_image,
      emergencyContact: result.rows[0].emergency_contact || {
        name: '',
        relationship: '',
        phone: ''
      },
      personalInfo: result.rows[0].personal_info || {
        birthDate: '',
        gender: 'other',
        nationality: '',
        maritalStatus: 'single'
      },
      terminationDate: result.rows[0].termination_date,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    }

    return json(
      {
        success: true,
        data: newEmployee,
        message: '직원이 성공적으로 추가되었습니다.'
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Error creating employee:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '직원 추가에 실패했습니다.'
      },
      { status: 500 }
    )
  }
}
