import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { toUTC } from '$lib/utils/date-handler'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface PayslipData {
  id: string
  employeeId: string
  period: string
  payDate: string
  baseSalary: number
  totalPayments: number
  totalDeductions: number
  netSalary: number
  payments: unknown
  deductions: unknown
  status: string
  isGenerated: boolean
  createdAt: string
  updatedAt: string
  employeeName: string
  employeeIdNumber: string
  department: string
  position: string
  hireDate: string
  [key: string]: unknown
}

interface CreatePayslipRequest {
  employeeId: string
  period: string
  payDate: string
  baseSalary?: number
  totalPayments?: number
  totalDeductions?: number
  netSalary?: number
  payments?: unknown
  deductions?: unknown
  status?: string
  isGenerated?: boolean
}

// 새로운 단순화된 payslips API (기존 API 교체)
export const GET: RequestHandler = async ({ url }) => {
  try {
    const employeeId = url.searchParams.get('employeeId')
    const period = url.searchParams.get('period') // YYYY-MM 형식
    const status = url.searchParams.get('status')

    const conditions: string[] = []
    const params: (string | number)[] = []
    let paramIndex = 1

    if (employeeId) {
      conditions.push(`p.employee_id = $${paramIndex}`)
      params.push(employeeId)
      paramIndex++
    }

    if (period) {
      conditions.push(`p.period = $${paramIndex}`)
      params.push(period)
      paramIndex++
    }

    if (status) {
      conditions.push(`p.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 기존 payslips 테이블 사용 (마이그레이션 전)
    const result = await query<PayslipData>(
      `
			SELECT
				p.id,
				p.employee_id AS "employeeId",
				p.period,
				p.pay_date AS "payDate",
				p.base_salary AS "baseSalary",
				p.total_payments AS "totalPayments",
				p.total_deductions AS "totalDeductions",
				p.net_salary AS "netSalary",
				p.payments,
				p.deductions,
				p.status,
				p.is_generated AS "isGenerated",
				p.created_at AS "createdAt",
				p.updated_at AS "updatedAt",
				-- 직원 정보 조인
				e.first_name || e.last_name AS "employeeName",
				e.employee_id AS "employeeIdNumber",
				e.department,
				e.position,
				e.hire_date AS "hireDate"
			FROM payslips p
			JOIN employees e ON p.employee_id = e.id
			${whereClause}
			ORDER BY p.period DESC, p.created_at DESC
			`,
      params,
    )

    const response: ApiResponse<PayslipData[]> = {
      success: true,
      data: result.rows,
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Error fetching payslips:', error)
    return json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '급여명세서 목록을 가져오는데 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const payslipData = (await request.json()) as CreatePayslipRequest

    const {
      employeeId,
      period,
      payDate,
      baseSalary,
      totalPayments,
      totalDeductions,
      netSalary,
      payments,
      deductions,
      status = 'draft',
      isGenerated = false,
    } = payslipData

    // 필수 필드 검증
    if (!employeeId || !period || !payDate) {
      return json(
        {
          success: false,
          error: '필수 필드가 누락되었습니다. (employeeId, period, payDate)',
        },
        { status: 400 },
      )
    }

    // period에서 시작일과 종료일 계산 (예: "2025-09" -> "2025-09-01", "2025-09-30")
    const [year, month] = period.split('-')

    const payPeriodStart = `${year}-${month.padStart(2, '0')}-01`

    const payPeriodEnd = toUTC(new Date(parseInt(year), parseInt(month), 0)).split('T')[0] // 해당 월의 마지막 날

    // 기존 급여명세서가 있는지 확인
    const existingPayslip = await query<{ id: string }>(
      'SELECT id FROM payslips WHERE employee_id = $1 AND period = $2',
      [employeeId, period],
    )

    let result
    if (existingPayslip.rows.length > 0) {
      // 기존 급여명세서 업데이트
      result = await query<PayslipData>(
        `
				UPDATE payslips SET
					pay_date = $3,
					pay_period_start = $4,
					pay_period_end = $5,
					base_salary = $6,
					total_payments = $7,
					total_deductions = $8,
					net_salary = $9,
					total_amount = $10,
					payments = $11,
					deductions = $12,
					status = $13,
					is_generated = $14,
					updated_at = CURRENT_TIMESTAMP
				WHERE employee_id = $1 AND period = $2
				RETURNING *
				`,
        [
          employeeId,
          period,
          payDate,
          payPeriodStart,
          payPeriodEnd,
          baseSalary || 0,
          totalPayments || 0,
          totalDeductions || 0,
          netSalary || 0,
          totalPayments || 0,
          JSON.stringify(payments || {}),
          JSON.stringify(deductions || {}),
          status || 'draft',
          isGenerated || false,
        ],
      )
    } else {
      // 새 급여명세서 생성
      result = await query<PayslipData>(
        `
				INSERT INTO payslips (
					employee_id, period, pay_date, pay_period_start, pay_period_end,
					base_salary, total_payments, total_deductions, net_salary, total_amount,
					payments, deductions, status, is_generated
				) VALUES (
					$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
				) RETURNING *
				`,
        [
          employeeId,
          period,
          payDate,
          payPeriodStart,
          payPeriodEnd,
          baseSalary || 0,
          totalPayments || 0,
          totalDeductions || 0,
          netSalary || 0,
          totalPayments || 0,
          JSON.stringify(payments || {}),
          JSON.stringify(deductions || {}),
          status || 'draft',
          isGenerated || false,
        ],
      )
    }

    const payslipResults: PayslipData[] = result.rows
    const response: ApiResponse<PayslipData> = {
      success: true,
      data: payslipResults[0],
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Error saving payslip:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '급여명세서 저장에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
