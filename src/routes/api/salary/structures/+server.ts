// 급여 구조 관리 API 엔드포인트

import { query } from '$lib/database/connection.js'
import type { SalaryStructure } from '$lib/types/salary'
import { formatDateForDisplay, toUTC } from '$lib/utils/date-handler.js'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface DatabaseSalaryStructure extends Record<string, unknown> {
  id: string
  employee_id: string
  base_salary: string | number
  allowances: unknown
  deductions: unknown
  total_allowances: string | number
  total_deductions: string | number
  net_salary: string | number
  effective_date: string
  end_date?: string
  status: string
  created_at: string
  updated_at: string
  created_by: string
  approved_by?: string
  approved_at?: string
}

// GET: 급여 구조 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const employeeId = url.searchParams.get('employeeId') || ''
    const status = url.searchParams.get('status') || ''

    const conditions: string[] = []
    const params: string[] = []
    let paramIndex = 1

    if (employeeId) {
      conditions.push(`employee_id = $${paramIndex}`)
      params.push(employeeId)
      paramIndex++
    }

    if (status) {
      conditions.push(`status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const result = await query<DatabaseSalaryStructure>(
      `
			SELECT 
        id,
        employee_id,
        base_salary,
        allowances,
        deductions,
        total_allowances,
        total_deductions,
        net_salary,
        effective_date,
        end_date,
        status,
        created_at::text,
        updated_at::text,
        created_by,
        approved_by,
        approved_at::text
			FROM salary_structures
			${whereClause}
			ORDER BY effective_date DESC, created_at DESC
		`,
      params,
    )

    const structures: SalaryStructure[] = result.rows.map((row) => ({
      id: row.id,
      employeeId: row.employee_id,
      baseSalary: parseFloat(String(row.base_salary)),
      allowances: (row.allowances as SalaryStructure['allowances']) || [],
      deductions: (row.deductions as SalaryStructure['deductions']) || [],
      totalAllowances: parseFloat(String(row.total_allowances)),
      totalDeductions: parseFloat(String(row.total_deductions)),
      netSalary: parseFloat(String(row.net_salary)),
      effectiveDate: formatDateForDisplay(row.effective_date, 'ISO'),
      endDate: row.end_date ? formatDateForDisplay(row.end_date, 'ISO') : undefined,
      status: row.status as SalaryStructure['status'],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
    }))

    return json({
      success: true,
      data: structures,
    })
  } catch (_error) {
    return json(
      {
        success: false,
        error: '급여 구조 목록을 가져오는데 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// POST: 급여 구조 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const structureData = (await request.json()) as Omit<
      SalaryStructure,
      'id' | 'createdAt' | 'updatedAt'
    >

    // 필수 필드 검증
    if (!structureData.employeeId || !structureData.baseSalary || !structureData.effectiveDate) {
      return json(
        {
          success: false,
          error: '필수 필드가 누락되었습니다.',
        },
        { status: 400 },
      )
    }

    // 급여 구조 생성
    const result = await query<DatabaseSalaryStructure>(
      `
			INSERT INTO salary_structures (
				employee_id, base_salary, allowances, deductions,
				total_allowances, total_deductions, net_salary,
				effective_date, end_date, status, created_by
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			RETURNING 
        id,
        employee_id,
        base_salary,
        allowances,
        deductions,
        total_allowances,
        total_deductions,
        net_salary,
        effective_date,
        end_date,
        status,
        created_at::text,
        updated_at::text,
        created_by,
        approved_by,
        approved_at::text
		`,
      [
        structureData.employeeId,
        structureData.baseSalary,
        JSON.stringify(structureData.allowances || []),
        JSON.stringify(structureData.deductions || []),
        structureData.totalAllowances || 0,
        structureData.totalDeductions || 0,
        structureData.netSalary || 0,
        structureData.effectiveDate ? toUTC(structureData.effectiveDate).split('T')[0] : null,
        structureData.endDate ? toUTC(structureData.endDate).split('T')[0] : null,
        structureData.status || 'active',
        structureData.createdBy || 'system',
      ],
    )

    const newStructure = result.rows[0]

    return json({
      success: true,
      data: {
        id: newStructure.id,
        employeeId: newStructure.employee_id,
        baseSalary: parseFloat(String(newStructure.base_salary)),
        allowances: (newStructure.allowances as SalaryStructure['allowances']) || [],
        deductions: (newStructure.deductions as SalaryStructure['deductions']) || [],
        totalAllowances: parseFloat(String(newStructure.total_allowances)),
        totalDeductions: parseFloat(String(newStructure.total_deductions)),
        netSalary: parseFloat(String(newStructure.net_salary)),
        effectiveDate: formatDateForDisplay(newStructure.effective_date, 'ISO'),
        endDate: newStructure.end_date
          ? formatDateForDisplay(newStructure.end_date, 'ISO')
          : undefined,
        status: newStructure.status as SalaryStructure['status'],
        createdAt: newStructure.created_at,
        updatedAt: newStructure.updated_at,
        createdBy: newStructure.created_by,
      },
    })
  } catch (_error) {
    return json(
      {
        success: false,
        error: '급여 구조 생성에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
