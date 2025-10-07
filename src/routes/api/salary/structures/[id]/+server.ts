// 급여 구조 상세 관리 API 엔드포인트

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

// GET: 특정 급여 구조 조회
export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params

    const result = await query<DatabaseSalaryStructure>(
      `
			SELECT *
			FROM salary_structures
			WHERE id = $1
		`,
      [id],
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '급여 구조를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const row = result.rows[0]

    const structure: SalaryStructure = {
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
    }

    return json({
      success: true,
      data: structure,
    })
  } catch (_error) {
    return json(
      {
        success: false,
        error: '급여 구조를 가져오는데 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// PUT: 급여 구조 수정
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params
    const updates = (await request.json()) as Partial<SalaryStructure>

    // 업데이트할 필드 구성
    const updateFields: string[] = []
    const values: (string | number | null)[] = []
    let paramIndex = 1

    if (updates.baseSalary !== undefined) {
      updateFields.push(`base_salary = $${paramIndex}`)
      values.push(updates.baseSalary)
      paramIndex++
    }

    if (updates.allowances !== undefined) {
      updateFields.push(`allowances = $${paramIndex}`)
      values.push(JSON.stringify(updates.allowances))
      paramIndex++
    }

    if (updates.deductions !== undefined) {
      updateFields.push(`deductions = $${paramIndex}`)
      values.push(JSON.stringify(updates.deductions))
      paramIndex++
    }

    if (updates.totalAllowances !== undefined) {
      updateFields.push(`total_allowances = $${paramIndex}`)
      values.push(updates.totalAllowances)
      paramIndex++
    }

    if (updates.totalDeductions !== undefined) {
      updateFields.push(`total_deductions = $${paramIndex}`)
      values.push(updates.totalDeductions)
      paramIndex++
    }

    if (updates.netSalary !== undefined) {
      updateFields.push(`net_salary = $${paramIndex}`)
      values.push(updates.netSalary)
      paramIndex++
    }

    if (updates.effectiveDate !== undefined) {
      updateFields.push(`effective_date = $${paramIndex}`)
      values.push(updates.effectiveDate ? toUTC(updates.effectiveDate).split('T')[0] : null)
      paramIndex++
    }

    if (updates.endDate !== undefined) {
      updateFields.push(`end_date = $${paramIndex}`)
      values.push(updates.endDate ? toUTC(updates.endDate).split('T')[0] : null)
      paramIndex++
    }

    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`)
      values.push(updates.status)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return json(
        {
          success: false,
          error: '수정할 필드가 없습니다.',
        },
        { status: 400 },
      )
    }

    // updated_at 자동 갱신
    updateFields.push(`updated_at = now()`)

    const result = await query<DatabaseSalaryStructure>(
      `
			UPDATE salary_structures
			SET ${updateFields.join(', ')}
			WHERE id = $${paramIndex}
			RETURNING *
		`,
      [...values, id],
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '급여 구조를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const updatedStructure = result.rows[0]

    return json({
      success: true,
      data: {
        id: updatedStructure.id,
        employeeId: updatedStructure.employee_id,
        baseSalary: parseFloat(String(updatedStructure.base_salary)),
        allowances: (updatedStructure.allowances as SalaryStructure['allowances']) || [],
        deductions: (updatedStructure.deductions as SalaryStructure['deductions']) || [],
        totalAllowances: parseFloat(String(updatedStructure.total_allowances)),
        totalDeductions: parseFloat(String(updatedStructure.total_deductions)),
        netSalary: parseFloat(String(updatedStructure.net_salary)),
        effectiveDate: formatDateForDisplay(updatedStructure.effective_date, 'ISO'),
        endDate: updatedStructure.end_date
          ? formatDateForDisplay(updatedStructure.end_date, 'ISO')
          : undefined,
        status: updatedStructure.status as SalaryStructure['status'],
        createdAt: updatedStructure.created_at,
        updatedAt: updatedStructure.updated_at,
        createdBy: updatedStructure.created_by,
        approvedBy: updatedStructure.approved_by,
        approvedAt: updatedStructure.approved_at,
      },
    })
  } catch (_error) {
    return json(
      {
        success: false,
        error: '급여 구조 수정에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// DELETE: 급여 구조 삭제
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { id } = params

    const result = await query(
      `
			DELETE FROM salary_structures
			WHERE id = $1
			RETURNING id
		`,
      [id],
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '급여 구조를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    return json({
      success: true,
      message: '급여 구조가 삭제되었습니다.',
    })
  } catch (_error) {
    return json(
      {
        success: false,
        error: '급여 구조 삭제에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
