// Project Management API - Participation Rates
// 참여율 관리 API

import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 참여율 현황 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams
    const employeeId = searchParams.get('employeeId')
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const participationStatus = searchParams.get('participationStatus')
    const department = searchParams.get('department')

    let sqlQuery = `
			SELECT 
				pr.*,
				e.first_name || ' ' || e.last_name as employee_name,
				e.department,
				p.title as project_name,
				p.code as project_code
			FROM participation_rates pr
			LEFT JOIN employees e ON pr.employee_id = e.id
			LEFT JOIN projects p ON pr.project_id = p.id
			WHERE 1=1
		`

    const conditions: string[] = []
    const params: (string | number)[] = []
    let paramIndex = 1

    if (employeeId) {
      conditions.push(`pr.employee_id = $${paramIndex++}`)
      params.push(employeeId)
    }

    if (projectId) {
      conditions.push(`pr.project_id = $${paramIndex++}`)
      params.push(projectId)
    }

    if (status && status !== 'all') {
      conditions.push(`pr.status = $${paramIndex++}`)
      params.push(status)
    }

    if (department) {
      conditions.push(`e.department = $${paramIndex++}`)
      params.push(department)
    }

    if (conditions.length > 0) {
      sqlQuery += ' AND ' + conditions.join(' AND ')
    }

    sqlQuery += ' ORDER BY e.first_name, e.last_name, pr.start_date DESC'

    const result = await query(sqlQuery, params)
    let participationRates = result.rows

    // 참여율 상태별 필터링
    if (participationStatus) {
      const employeeTotals = new Map()

      // 각 직원별 총 참여율 계산
      participationRates.forEach((rate) => {
        if (rate.status === 'active') {
          const current = employeeTotals.get(rate.employee_id) || 0
          employeeTotals.set(rate.employee_id, current + rate.participation_rate)
        }
      })

      // 상태별 필터링
      participationRates = participationRates.filter((rate) => {
        const totalRate = employeeTotals.get(rate.employee_id) || 0

        switch (participationStatus) {
          case 'OVER_LIMIT':
            return totalRate > 100
          case 'FULL':
            return totalRate === 100
          case 'AVAILABLE':
            return totalRate < 100
          default:
            return true
        }
      })
    }

    const response: ApiResponse<typeof participationRates> = {
      success: true,
      data: participationRates,
      count: participationRates.length,
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('참여율 현황 조회 실패:', error)
    const response: ApiResponse<null> = {
      success: false,
      message: '참여율 현황을 불러오는데 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }
    return json(response, { status: 500 })
  }
}

// 참여율 업데이트
export const PUT: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json() as Record<string, unknown>
    const { employeeId, projectId, participationRate, changeReason, notes } = data

    // 필수 필드 검증
    if (!employeeId || !projectId || participationRate === undefined) {
      const response: ApiResponse<null> = {
        success: false,
        message: '직원 ID, 프로젝트 ID, 참여율은 필수입니다.',
      }
      return json(response, { status: 400 })
    }

    // 참여율 범위 검증
    if (participationRate < 0 || participationRate > 100) {
      const response: ApiResponse<null> = {
        success: false,
        message: '참여율은 0-100 사이의 값이어야 합니다.',
      }
      return json(response, { status: 400 })
    }

    // 기존 참여율 조회
    const existingRate = await query(
      `
			SELECT * FROM participation_rates
			WHERE employee_id = $1 AND project_id = $2 AND status = 'active'
		`,
      [employeeId, projectId],
    )

    if (existingRate.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        message: '해당 프로젝트의 활성 참여율을 찾을 수 없습니다.',
      }
      return json(response, { status: 404 })
    }

    const oldRate = existingRate.rows[0]

    // 트랜잭션 시작
    await query('BEGIN')

    try {
      // 참여율 업데이트
      const updateResult = await query(
        `
				UPDATE participation_rates
				SET 
					participation_rate = $1,
					updated_at = CURRENT_TIMESTAMP
				WHERE id = $2
				RETURNING *
			`,
        [participationRate, oldRate.id],
      )

      // 변경 이력 생성
      await query(
        `
				INSERT INTO participation_rate_history (
					employee_id, project_id, old_rate, new_rate,
					change_reason, change_date, notes
				) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6)
			`,
        [employeeId, projectId, oldRate.participation_rate, participationRate, changeReason, notes],
      )

      // 해당 직원의 총 참여율 확인
      const totalRateResult = await query(
        `
				SELECT SUM(participation_rate) as total_rate
				FROM participation_rates
				WHERE employee_id = $1 AND status = 'active'
			`,
        [employeeId],
      )

      const totalRate = totalRateResult.rows[0]?.total_rate || 0

      await query('COMMIT')

      const response: ApiResponse<Record<string, unknown> & {
        totalParticipationRate: number
        isOverLimit: boolean
      }> = {
        success: true,
        data: {
          ...updateResult.rows[0],
          totalParticipationRate: totalRate,
          isOverLimit: totalRate > 100,
        },
        message: '참여율이 성공적으로 업데이트되었습니다.',
      }
      return json(response)
    } catch (error: unknown) {
      await query('ROLLBACK')
      throw error
    }
  } catch (error: unknown) {
    logger.error('참여율 업데이트 실패:', error)
    const response: ApiResponse<null> = {
      success: false,
      message: '참여율 업데이트에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }
    return json(response, { status: 500 })
  }
}
