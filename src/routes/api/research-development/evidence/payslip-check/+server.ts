// 급여명세서 존재 여부 확인 API
// Payslip Existence Check API

import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
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

/**
 * GET: 직원명과 기간으로 급여명세서 존재 확인
 * Query params:
 *  - employeeName: 직원 이름 (예: "박기선")
 *  - period: 급여 기간 (YYYY-MM 형식, 예: "2025-01")
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    const employeeName = url.searchParams.get('employeeName')
    const period = url.searchParams.get('period')

    if (!employeeName || !period) {
      const response: ApiResponse<null> = {
        success: false,
        error: '직원명과 기간은 필수 파라미터입니다.',
      }
      return json(response, { status: 400 })
    }

    // 기간 형식 검증 (YYYY-MM)
    const periodRegex = /^\d{4}-\d{2}$/
    if (!periodRegex.test(period)) {
      const response: ApiResponse<null> = {
        success: false,
        error: '기간은 YYYY-MM 형식이어야 합니다.',
      }
      return json(response, { status: 400 })
    }

    // 직원명으로 직원 찾기
    const employeeResult = await query(
      `
      SELECT 
        id,
        first_name || last_name as full_name,
        korean_name
      FROM employees
      WHERE 
        korean_name = $1 
        OR first_name || last_name = $1
        OR last_name || first_name = $1
      LIMIT 1
    `,
      [employeeName.trim()],
    )

    if (employeeResult.rows.length === 0) {
      // 직원을 찾지 못한 경우
      const response: ApiResponse<PayslipCheckResponse> = {
        success: true,
        data: {
          exists: false,
        },
      }
      return json(response)
    }

    const employee = employeeResult.rows[0]
    const employeeId = employee.id

    // 급여명세서 찾기
    const payslipResult = await query(
      `
      SELECT 
        id,
        employee_id,
        period,
        status
      FROM payslips
      WHERE employee_id = $1 AND period = $2
      LIMIT 1
    `,
      [employeeId, period],
    )

    if (payslipResult.rows.length === 0) {
      // 급여명세서가 없는 경우
      const response: ApiResponse<PayslipCheckResponse> = {
        success: true,
        data: {
          exists: false,
          employeeId: employeeId.toString(),
          employeeName: employee.korean_name || employee.full_name,
        },
      }
      return json(response)
    }

    // 급여명세서가 있는 경우
    const payslip = payslipResult.rows[0]
    const response: ApiResponse<PayslipCheckResponse> = {
      success: true,
      data: {
        exists: true,
        payslipId: payslip.id.toString(),
        employeeId: employeeId.toString(),
        period: payslip.period,
        employeeName: employee.korean_name || employee.full_name,
      },
    }

    logger.log('Payslip check:', { employeeName, period, exists: true, payslipId: payslip.id })

    return json(response)
  } catch (error) {
    logger.error('급여명세서 확인 실패:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '급여명세서 확인 중 오류가 발생했습니다.',
    }
    return json(response, { status: 500 })
  }
}
