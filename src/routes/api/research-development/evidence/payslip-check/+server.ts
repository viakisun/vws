import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface PayslipCheckResponse {
  exists: boolean
  payslipId?: string
  employeeId?: string
  period?: string
  employeeName?: string
}

export const GET: RequestHandler = async ({ url }) => {
  try {
    const employeeName = url.searchParams.get('employeeName')
    const period = url.searchParams.get('period') // YYYY-MM 형식

    if (!employeeName || !period) {
      return json(
        {
          success: false,
          error: 'employeeName and period are required query parameters.',
        },
        { status: 400 },
      )
    }

    // 1. employees 테이블에서 직원 ID 조회
    const employeeResult = await query<{ id: string; first_name: string; last_name: string }>(
      `
      SELECT id, first_name, last_name
      FROM employees
      WHERE CONCAT(last_name, first_name) = $1 OR CONCAT(first_name, ' ', last_name) = $1
      LIMIT 1
    `,
      [employeeName],
    )

    if (employeeResult.rows.length === 0) {
      return json({ success: true, data: { exists: false, employeeName, period } })
    }

    const employeeId = employeeResult.rows[0].id

    // 2. payslips 테이블에서 급여명세서 존재 확인 (ID만)
    const payslipResult = await query<{ id: string }>(
      `
      SELECT id
      FROM payslips
      WHERE employee_id = $1 AND period = $2
      LIMIT 1
    `,
      [employeeId, period],
    )

    const responseData: PayslipCheckResponse = {
      exists: payslipResult.rows.length > 0,
      payslipId: payslipResult.rows.length > 0 ? payslipResult.rows[0].id : undefined,
      employeeId: employeeId,
      period: period,
      employeeName: employeeName,
    }

    return json({ success: true, data: responseData })
  } catch (error: unknown) {
    logger.error('Failed to check payslip existence:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '급여명세서 확인에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
