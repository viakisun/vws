// 개별 급여 계약 관리 API 엔드포인트

import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import type { SalaryContract, UpdateSalaryContractRequest } from '$lib/types/salary-contracts'
import { toUTC } from '$lib/utils/date-handler'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface DatabaseSalaryContract {
  id: string
  employee_id: string
  start_date: string
  end_date: string | null
  annual_salary: string
  monthly_salary: string
  contract_type: string
  status: string
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  employee_name: string
  employee_id_number: string
  department: string
  position: string
  contract_end_display: string
  status_display: string
  [key: string]: unknown
}

// GET: 특정 급여 계약 조회
export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params

    const result = await query<DatabaseSalaryContract>(
      `
			SELECT 
				sc.*,
				CONCAT(e.last_name, e.first_name) as employee_name,
				e.employee_id as employee_id_number,
				e.department,
				e.position,
				CASE 
					WHEN sc.end_date IS NULL THEN '무기한'
					ELSE TO_CHAR(sc.end_date, 'YYYY-MM-DD')
				END as contract_end_display,
				CASE 
					WHEN sc.status = 'active' AND sc.end_date IS NULL THEN '진행중 (무기한)'
					WHEN sc.status = 'active' AND sc.end_date >= CURRENT_DATE THEN '진행중'
					WHEN sc.status = 'expired' OR sc.end_date < CURRENT_DATE THEN '만료됨'
					ELSE sc.status
				END as status_display
			FROM salary_contracts sc
			JOIN employees e ON sc.employee_id = e.id
			WHERE sc.id = $1
		`,
      [id],
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '급여 계약을 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const contract = result.rows[0]

    // 날짜를 KST로 변환
    const convertToKST = (dateString: string | null): string | undefined => {
      if (!dateString) return undefined
      const date = new Date(dateString)
      // UTC+9 (KST)로 변환
      const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000)
      return toUTC(kstDate).split('T')[0] // YYYY-MM-DD 형식으로 반환
    }

    const salaryContract: SalaryContract = {
      id: contract.id,
      employeeId: contract.employee_id,
      startDate: convertToKST(contract.start_date) || '',
      endDate: convertToKST(contract.end_date),
      annualSalary: parseFloat(contract.annual_salary),
      monthlySalary: parseFloat(contract.monthly_salary),
      contractType: contract.contract_type as 'full_time' | 'part_time' | 'contract' | 'intern',
      status: contract.status as 'active' | 'expired' | 'terminated' | 'draft',
      notes: contract.notes || undefined,
      createdAt: contract.created_at,
      updatedAt: contract.updated_at,
      createdBy: contract.created_by || undefined,
      employeeName: contract.employee_name,
      employeeIdNumber: contract.employee_id_number,
      department: contract.department,
      position: contract.position,
      contractEndDisplay: contract.contract_end_display,
      statusDisplay: contract.status_display,
    }

    const response: ApiResponse<SalaryContract> = {
      success: true,
      data: salaryContract,
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Error fetching salary contract:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '급여 계약 조회에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// PUT: 급여 계약 수정
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params
    const updateData: UpdateSalaryContractRequest = await request.json()

    // 업데이트할 필드 구성
    const updateFields: string[] = []
    const queryParams: (string | number | null)[] = []
    let paramIndex = 1

    if (updateData.startDate !== undefined) {
      updateFields.push(`start_date = $${paramIndex}`)
      queryParams.push(updateData.startDate)
      paramIndex++
    }

    if (updateData.endDate !== undefined) {
      updateFields.push(`end_date = $${paramIndex}`)
      queryParams.push(updateData.endDate || null)
      paramIndex++
    }

    if (updateData.annualSalary !== undefined) {
      updateFields.push(`annual_salary = $${paramIndex}`)
      queryParams.push(updateData.annualSalary)
      paramIndex++
    }

    if (updateData.monthlySalary !== undefined) {
      updateFields.push(`monthly_salary = $${paramIndex}`)
      queryParams.push(updateData.monthlySalary)
      paramIndex++
    }

    if (updateData.contractType !== undefined) {
      updateFields.push(`contract_type = $${paramIndex}`)
      queryParams.push(updateData.contractType)
      paramIndex++
    }

    if (updateData.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`)
      queryParams.push(updateData.status)
      paramIndex++
    }

    if (updateData.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex}`)
      queryParams.push(updateData.notes || null)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return json(
        {
          success: false,
          error: '업데이트할 필드가 없습니다.',
        },
        { status: 400 },
      )
    }

    // updated_at 자동 업데이트
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
    queryParams.push(id)

    const result = await query<DatabaseSalaryContract>(
      `UPDATE salary_contracts SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      queryParams,
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '급여 계약을 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const updatedContract = result.rows[0]

    // 날짜를 KST로 변환
    const convertToKST = (dateString: string | null): string | undefined => {
      if (!dateString) return undefined
      const date = new Date(dateString)
      // UTC+9 (KST)로 변환
      const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000)
      return toUTC(kstDate).split('T')[0] // YYYY-MM-DD 형식으로 반환
    }

    const response: ApiResponse<Partial<SalaryContract>> = {
      success: true,
      data: {
        id: updatedContract.id,
        employeeId: updatedContract.employee_id,
        startDate: convertToKST(updatedContract.start_date) || '',
        endDate: convertToKST(updatedContract.end_date),
        annualSalary: parseFloat(updatedContract.annual_salary),
        monthlySalary: parseFloat(updatedContract.monthly_salary),
        contractType: updatedContract.contract_type as
          | 'full_time'
          | 'part_time'
          | 'contract'
          | 'intern',
        status: updatedContract.status as 'active' | 'expired' | 'terminated' | 'draft',
        notes: updatedContract.notes || undefined,
        createdAt: updatedContract.created_at,
        updatedAt: updatedContract.updated_at,
        createdBy: updatedContract.created_by || undefined,
      },
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Error updating salary contract:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '급여 계약 수정에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// DELETE: 급여 계약 삭제
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { id } = params

    const result = await query<{ id: string }>(
      `
			DELETE FROM salary_contracts 
			WHERE id = $1
			RETURNING id
		`,
      [id],
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '급여 계약을 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const response: ApiResponse<{ id: string }> = {
      success: true,
      data: { id },
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Error deleting salary contract:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '급여 계약 삭제에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
