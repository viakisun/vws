import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params

    const result = await query(
      `
      SELECT 
        p.id,
        p.employee_id,
        p.period,
        p.pay_date::text,
        p.base_salary,
        p.total_payments,
        p.total_deductions,
        p.net_salary,
        p.payments,
        p.deductions,
        p.status,
        p.is_generated,
        p.created_at::text,
        p.updated_at::text,
        CONCAT(e.last_name, e.first_name) as employee_name,
        e.employee_id as employee_id_number,
        e.department,
        e.position,
        e.hire_date::text as hire_date
      FROM payslips p
      JOIN employees e ON p.employee_id = e.id
      WHERE p.id = $1
      LIMIT 1
    `,
      [id],
    )

    if (result.rows.length === 0) {
      return json({ success: false, error: 'Payslip not found' }, { status: 404 })
    }

    const payslip = result.rows[0]

    // 데이터를 PayslipPDFData 형식으로 변환
    const payslipData = {
      // 직원 정보
      employeeName: payslip.employee_name,
      employeeId: payslip.employee_id_number,
      department: payslip.department,
      position: payslip.position,

      // 급여 기간 (period: "2025-09" -> year: 2025, month: 9)
      year: parseInt(payslip.period.split('-')[0]),
      month: parseInt(payslip.period.split('-')[1]),
      paymentDate: payslip.pay_date,

      // 급여 항목 (JSON에서 배열로 변환)
      payments: Array.isArray(payslip.payments)
        ? payslip.payments
        : Object.entries(payslip.payments || {}).map(([name, amount]) => ({
            name,
            amount: Number(amount),
          })),
      deductions: Array.isArray(payslip.deductions)
        ? payslip.deductions
        : Object.entries(payslip.deductions || {}).map(([name, amount]) => ({
            name,
            amount: Number(amount),
          })),

      // 합계
      totalPayments: Number(payslip.total_payments),
      totalDeductions: Number(payslip.total_deductions),
      netSalary: Number(payslip.net_salary),

      // 회사 정보 (기본값)
      companyName: 'VWS',
    }

    return json({ success: true, data: payslipData })
  } catch (error) {
    console.error('Failed to fetch payslip:', error)
    return json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
