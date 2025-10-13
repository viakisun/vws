import { requireAuth } from '$lib/auth/middleware'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 급여명세서 데이터 타입
interface PayslipData {
  id: string
  employee_id: string
  employee_name: string
  department: string
  position: string
  period: string
  year: number
  month: number
  basic_salary: number
  overtime_pay: number
  bonus: number
  allowances: number
  gross_pay: number
  income_tax: number
  national_pension: number
  health_insurance: number
  employment_insurance: number
  long_term_care_insurance: number
  total_deductions: number
  net_pay: number
  working_days: number
  overtime_hours: number
  created_at: string
}

// 급여명세서 목록 조회
export const GET: RequestHandler = async (event) => {
  try {
    const { user } = await requireAuth(event)
    const { url } = event

    const employeeId = url.searchParams.get('employeeId')

    // 직원 ID가 없으면 현재 사용자의 직원 정보에서 가져오기
    let targetEmployeeId = employeeId

    if (!targetEmployeeId) {
      // 현재 사용자의 직원 정보 조회
      const employeeResult = await query(
        `
        SELECT id FROM employees WHERE email = $1
      `,
        [user.email],
      )

      if (employeeResult.rows.length === 0) {
        return json(
          {
            success: false,
            message: '직원 정보를 찾을 수 없습니다.',
          },
          { status: 404 },
        )
      }

      targetEmployeeId = employeeResult.rows[0].id
    }

    // 급여명세서 목록 조회
    const payslipsResult = await query(
      `
      SELECT 
        p.id,
        p.employee_id,
        p.period,
        p.pay_period_start::text as pay_period_start,
        p.base_salary,
        p.overtime_pay,
        p.bonus,
        p.total_payments,
        p.total_deductions,
        p.net_salary,
        p.payments,
        p.deductions,
        p.created_at::text as created_at,
        e.employee_id as emp_employee_id,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        e.department,
        e.position
      FROM payslips p
      JOIN employees e ON p.employee_id = e.id
      WHERE p.employee_id = $1 AND p.is_generated = true
      ORDER BY p.pay_period_start DESC
    `,
      [targetEmployeeId],
    )

    const payslips: PayslipData[] = payslipsResult.rows.map((row) => {
      const payPeriodStart = new Date(row.pay_period_start)
      const year = payPeriodStart.getFullYear()
      const month = payPeriodStart.getMonth() + 1

      // JSONB columns are already parsed by PostgreSQL driver
      const payments = Array.isArray(row.payments) ? row.payments : []
      const deductions = Array.isArray(row.deductions) ? row.deductions : []

      return {
        id: row.id,
        employee_id: row.employee_id,
        employee_name: row.employee_name || `${row.first_name} ${row.last_name}`,
        department: row.department,
        position: row.position,
        period: row.period || `${year}-${month.toString().padStart(2, '0')}`,
        year,
        month,
        payments, // Include payments array
        deductions, // Include deductions array
        basic_salary: parseFloat(row.base_salary || 0),
        overtime_pay: parseFloat(row.overtime_pay || 0),
        bonus: parseFloat(row.bonus || 0),
        allowances: 0,
        gross_pay: parseFloat(row.total_payments || 0),
        total_payments: parseFloat(row.total_payments || 0),
        income_tax: 0,
        national_pension: 0,
        health_insurance: 0,
        employment_insurance: 0,
        long_term_care_insurance: 0,
        total_deductions: parseFloat(row.total_deductions || 0),
        net_pay: parseFloat(row.net_salary || 0),
        working_days: 22,
        overtime_hours: 0,
        created_at: row.created_at,
      }
    })

    return json({ success: true, data: payslips })
  } catch (error) {
    logger.error('Error fetching payslips:', error)
    return json(
      {
        success: false,
        message: '급여명세서를 불러오는데 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
