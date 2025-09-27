// 직원별 급여 계약 정보 API 엔드포인트

import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import type { CurrentSalaryInfo, SalaryContract } from '$lib/types/salary-contracts'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface EmployeeInfo {
  id: string
  employee_id: string
  employee_name: string
  department: string
  position: string
  status: string
  [key: string]: unknown
}

interface ContractWithDisplay {
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
  contract_end_display: string
  status_display: string
  [key: string]: unknown
}

// GET: 특정 직원의 급여 계약 정보 조회
export const GET: RequestHandler = async ({ params }) => {
  try {
    const { employeeId } = params

    // 직원 기본 정보 조회
    const employeeResult = await query<EmployeeInfo>(
      `
			SELECT 
				e.id,
				e.employee_id,
				CONCAT(e.last_name, e.first_name) as employee_name,
				e.department,
				e.position,
				e.status
			FROM employees e
			WHERE e.id = $1
		`,
      [employeeId],
    )

    if (employeeResult.rows.length === 0) {
      return json(
        {
          success: false,
          error: '직원을 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const employee = employeeResult.rows[0]

    // 현재 유효한 급여 계약 조회
    const currentContractResult = await query<ContractWithDisplay>(
      `
			SELECT 
				sc.*,
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
			WHERE sc.employee_id = $1 
				AND sc.status = 'active' 
				AND sc.start_date <= CURRENT_DATE 
				AND (sc.end_date IS NULL OR sc.end_date >= CURRENT_DATE)
			ORDER BY sc.start_date DESC
			LIMIT 1
		`,
      [employeeId],
    )

    // 급여 계약 이력 조회
    const historyResult = await query<ContractWithDisplay>(
      `
			SELECT 
				sc.*,
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
			WHERE sc.employee_id = $1
			ORDER BY sc.start_date DESC
		`,
      [employeeId],
    )

    // 현재 계약 데이터 변환
    let currentContract: SalaryContract | null = null
    if (currentContractResult.rows.length > 0) {
      const contract = currentContractResult.rows[0]
      currentContract = {
        id: contract.id,
        employeeId: contract.employee_id,
        startDate: contract.start_date,
        endDate: contract.end_date || undefined,
        annualSalary: parseFloat(contract.annual_salary),
        monthlySalary: parseFloat(contract.monthly_salary),
        contractType: contract.contract_type as 'full_time' | 'part_time' | 'contract' | 'intern',
        status: contract.status as 'active' | 'expired' | 'terminated' | 'draft',
        notes: contract.notes || undefined,
        createdAt: contract.created_at,
        updatedAt: contract.updated_at,
        createdBy: contract.created_by || undefined,
        contractEndDisplay: contract.contract_end_display,
        statusDisplay: contract.status_display,
      }
    }

    // 계약 이력 데이터 변환
    const contractHistory: SalaryContract[] = historyResult.rows.map((contract) => ({
      id: contract.id,
      employeeId: contract.employee_id,
      startDate: contract.start_date,
      endDate: contract.end_date || undefined,
      annualSalary: parseFloat(contract.annual_salary),
      monthlySalary: parseFloat(contract.monthly_salary),
      contractType: contract.contract_type as 'full_time' | 'part_time' | 'contract' | 'intern',
      status: contract.status as 'active' | 'expired' | 'terminated' | 'draft',
      notes: contract.notes || undefined,
      createdAt: contract.created_at,
      updatedAt: contract.updated_at,
      createdBy: contract.created_by || undefined,
      contractEndDisplay: contract.contract_end_display,
      statusDisplay: contract.status_display,
    }))

    if (!currentContract) {
      return json(
        {
          success: false,
          error: '현재 유효한 급여 계약이 없습니다.',
        },
        { status: 404 },
      )
    }

    const currentSalaryInfo: CurrentSalaryInfo = {
      employeeId: employee.id,
      employeeName: employee.employee_name,
      employeeIdNumber: employee.employee_id,
      department: employee.department,
      position: employee.position,
      currentContract,
      contractHistory,
    }

    const response: ApiResponse<CurrentSalaryInfo> = {
      success: true,
      data: currentSalaryInfo,
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Error fetching employee salary info:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '직원 급여 정보 조회에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
