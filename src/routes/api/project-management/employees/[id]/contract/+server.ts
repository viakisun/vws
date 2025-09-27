import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface SalaryContract {
  id: string
  employee_id: string
  annual_salary: number
  start_date: string
  end_date?: string
  status: string
  contract_type: string
}

// GET /api/project-management/employees/[id]/contract - 특정 직원의 참여기간 내 계약 정보 조회
export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const { id } = params
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    if (!startDate || !endDate) {
      const response: ApiResponse<null> = {
        success: false,
        message: '시작일과 종료일이 필요합니다.',
      }
      return json(response, { status: 400 })
    }

    // 계약 정보 조회

    // 먼저 해당 직원의 모든 활성 계약을 확인
    const allContractsQuery = `
			SELECT 
				sc.id,
				sc.employee_id,
				sc.annual_salary,
				sc.start_date,
				sc.end_date,
				sc.status,
				sc.contract_type
			FROM salary_contracts sc
			WHERE sc.employee_id = $1 
				AND sc.status = 'active'
			ORDER BY sc.start_date DESC
		`

    const allContractsResult = await query(allContractsQuery, [id])
    const allContracts: SalaryContract[] = allContractsResult.rows
    // 해당 직원의 모든 활성 계약 조회 완료

    // 참여기간과 겹치는 활성 계약 조회 (더 유연한 조건)
    const contractQuery = `
			SELECT 
				sc.id,
				sc.employee_id,
				sc.annual_salary,
				sc.start_date,
				sc.end_date,
				sc.status,
				sc.contract_type
			FROM salary_contracts sc
			WHERE sc.employee_id = $1 
				AND sc.status = 'active'
				AND (
					-- 계약이 참여기간과 겹치거나
					(sc.start_date <= $3 AND (sc.end_date IS NULL OR sc.end_date >= $2))
					-- 또는 계약이 참여기간을 포함하거나
					OR (sc.start_date <= $2 AND (sc.end_date IS NULL OR sc.end_date >= $3))
					-- 또는 참여기간이 계약을 포함하거나
					OR (sc.start_date >= $2 AND (sc.end_date IS NULL OR sc.end_date <= $3))
				)
			ORDER BY sc.start_date DESC
			LIMIT 1
		`

    const result = await query(contractQuery, [id, startDate, endDate])
    const contracts: SalaryContract[] = result.rows

    if (contracts.length === 0) {
      // 계약이 없을 때 더 자세한 정보 제공
      const hasAnyContracts = allContracts.length > 0
      let message = '해당 기간에 유효한 계약이 없습니다.'

      if (hasAnyContracts) {
        const latestContract = allContracts[0]
        message = `해당 기간(${startDate} ~ ${endDate})에 유효한 계약이 없습니다. 최신 계약: ${latestContract.start_date} ~ ${latestContract.end_date || '무기한'}`
      } else {
        message = '해당 직원의 활성 계약이 없습니다.'
      }

      const response: ApiResponse<null> = {
        success: false,
        message,
        data: null,
      }
      return json(response)
    }

    const contract = contracts[0]
    // 계약 정보 조회 완료

    const response: ApiResponse<SalaryContract> = {
      success: true,
      data: contract,
    }
    return json(response)
  } catch (error: unknown) {
    logger.error('계약 정보 조회 실패:', error)
    const response: ApiResponse<null> = {
      success: false,
      message: '계약 정보를 불러오는데 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }
    return json(response, { status: 500 })
  }
}
