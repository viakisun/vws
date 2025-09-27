// 급여 계약 관리 API 엔드포인트

import { query } from '$lib/database/connection.js'
import type { DatabaseSalaryContract } from '$lib/types/database'
import type { CreateSalaryContractRequest, PaginatedResponse } from '$lib/types/salary-contracts'
import { formatDateForDisplay, toUTC } from '$lib/utils/date-handler.js'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET: 급여 계약 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    // 쿼리 파라미터 파싱
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const employeeId = url.searchParams.get('employeeId') || ''
    const department = url.searchParams.get('department') || ''
    const position = url.searchParams.get('position') || ''
    const contractType = url.searchParams.get('contractType') || ''
    const status = url.searchParams.get('status') || ''
    const startDateFrom = url.searchParams.get('startDateFrom') || ''
    const startDateTo = url.searchParams.get('startDateTo') || ''
    const search = url.searchParams.get('search') || ''

    // WHERE 조건 구성
    const conditions: string[] = []
    const params: (string | number)[] = []
    let paramIndex = 1

    if (employeeId) {
      conditions.push(`sc.employee_id = $${paramIndex}`)
      params.push(employeeId)
      paramIndex++
    }

    if (department) {
      conditions.push(`e.department = $${paramIndex}`)
      params.push(department)
      paramIndex++
    }

    if (position) {
      conditions.push(`e.position = $${paramIndex}`)
      params.push(position)
      paramIndex++
    }

    if (contractType) {
      conditions.push(`sc.contract_type = $${paramIndex}`)
      params.push(contractType)
      paramIndex++
    }

    if (status) {
      conditions.push(`sc.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (startDateFrom) {
      conditions.push(`sc.start_date >= $${paramIndex}`)
      params.push(startDateFrom)
      paramIndex++
    }

    if (startDateTo) {
      conditions.push(`sc.start_date <= $${paramIndex}`)
      params.push(startDateTo)
      paramIndex++
    }

    if (search) {
      conditions.push(`(
				CONCAT(e.last_name, e.first_name) ILIKE $${paramIndex} OR 
				e.employee_id ILIKE $${paramIndex} OR 
				e.department ILIKE $${paramIndex} OR
				e.position ILIKE $${paramIndex}
			)`)
      params.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 전체 개수 조회
    const countResult = await query<{ total: string }>(
      `
			SELECT COUNT(*) as total
			FROM salary_contracts sc
			JOIN employees e ON sc.employee_id = e.id
			${whereClause}
		`,
      params,
    )

    const total = parseInt(countResult.rows[0]?.total || '0')
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit

    // 급여 계약 목록 조회 (최적화된 쿼리)
    const result = await query<DatabaseSalaryContract>(
      `
			SELECT 
				sc.id,
				sc.employee_id,
				sc.start_date,
				sc.end_date,
				sc.annual_salary,
				sc.monthly_salary,
				sc.contract_type,
				sc.status,
				sc.notes,
				sc.created_at,
				sc.updated_at,
				sc.created_by,
				e.last_name || e.first_name as employee_name,
				e.employee_id as employee_id_number,
				e.department,
				e.position
			FROM salary_contracts sc
			INNER JOIN employees e ON sc.employee_id = e.id
			${whereClause}
			ORDER BY sc.start_date DESC, sc.created_at DESC
			LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
		`,
      [...params, limit, offset],
    )

    const contracts = result.rows.map((row: DatabaseSalaryContract) => {
      return {
        id: row.id,
        employeeId: row.employee_id,
        startDate: row.start_date ? formatDateForDisplay(row.start_date, 'ISO') : '',
        endDate: row.end_date ? formatDateForDisplay(row.end_date, 'ISO') : '',
        annualSalary: parseFloat(String(row.annual_salary)),
        monthlySalary: parseFloat(String(row.monthly_salary)),
        contractType: row.contract_type,
        status: row.status,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        employeeName: row.employee_name,
        employeeIdNumber: row.employee_id_number,
        department: row.department,
        position: row.position,
        contractEndDisplay: row.contract_end_display,
        statusDisplay: row.status_display,
      }
    })

    const response: PaginatedResponse<unknown> = {
      data: contracts,
      total,
      page,
      limit,
      totalPages,
    }

    return json({
      success: true,
      data: response,
    })
  } catch (_error) {
    return json(
      {
        success: false,
        error: '급여 계약 목록을 가져오는데 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// POST: 급여 계약 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const contractData: CreateSalaryContractRequest = await request.json()

    // 필수 필드 검증
    if (
      !contractData.employeeId ||
      !contractData.startDate ||
      !contractData.annualSalary ||
      !contractData.monthlySalary
    ) {
      return json(
        {
          success: false,
          error: '필수 필드가 누락되었습니다.',
        },
        { status: 400 },
      )
    }

    // 급여 계약 생성
    const result = await query(
      `
			INSERT INTO salary_contracts (
				employee_id, start_date, end_date, annual_salary, monthly_salary,
				contract_type, status, notes, created_by
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			RETURNING *
		`,
      [
        contractData.employeeId,
        contractData.startDate ? toUTC(contractData.startDate).split('T')[0] : null,
        contractData.endDate ? toUTC(contractData.endDate).split('T')[0] : null,
        contractData.annualSalary,
        contractData.monthlySalary,
        contractData.contractType || 'full_time',
        contractData.status || 'active',
        contractData.notes || null,
        'system',
      ],
    )

    const newContract = result.rows[0] as DatabaseSalaryContract

    return json({
      success: true,
      data: {
        id: newContract.id,
        employeeId: newContract.employee_id,
        startDate: newContract.start_date
          ? formatDateForDisplay(newContract.start_date, 'ISO')
          : null,
        endDate: newContract.end_date ? formatDateForDisplay(newContract.end_date, 'ISO') : null,
        annualSalary: parseFloat(newContract.annual_salary),
        monthlySalary: parseFloat(newContract.monthly_salary),
        contractType: newContract.contract_type,
        status: newContract.status,
        notes: newContract.notes,
        createdAt: newContract.created_at,
        updatedAt: newContract.updated_at,
        createdBy: newContract.created_by,
      },
    })
  } catch (_error) {
    return json(
      {
        success: false,
        error: '급여 계약 생성에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
