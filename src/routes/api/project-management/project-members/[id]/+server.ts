import { getConnection, query } from '$lib/database/connection'
import type { ApiResponse, DatabaseProjectMember } from '$lib/types/database'
import {
  calculateParticipationPeriod,
  formatDateForAPI,
  isValidDate,
  isValidDateRange,
} from '$lib/utils/date-calculator'
import { toUTC } from '$lib/utils/date-handler'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/project-management/project-members/[id] - 특정 프로젝트 멤버 조회
export const GET: RequestHandler = async ({ params }) => {
  try {
    const result = await query<DatabaseProjectMember>(
      `
			SELECT
				pm.*,
				CASE
					WHEN e.first_name ~ '^[가-힣]+$' AND e.last_name ~ '^[가-힣]+$'
					THEN CONCAT(e.last_name, ' ', e.first_name)
					ELSE CONCAT(e.first_name, ' ', e.last_name)
				END as employee_name,
				e.first_name,
				e.last_name,
				e.email as employee_email,
				e.department as employee_department,
				e.position as employee_position,
				p.title as project_title,
				p.code as project_code
			FROM project_members pm
			JOIN employees e ON pm.employee_id = e.id
			JOIN projects p ON pm.project_id = p.id
			WHERE pm.id = $1
		`,
      [params.id],
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          message: '프로젝트 멤버를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    // TIMESTAMP 데이터를 YYYY-MM-DD 형식으로 변환 (중앙화된 함수 사용)
    const memberData = result.rows[0] as Record<string, unknown>
    const formattedMemberData = {
      ...memberData,
      start_date: formatDateForAPI(String(memberData.start_date || '')),
      end_date: formatDateForAPI(String(memberData.end_date || '')),
    }

    const response: ApiResponse<unknown> = {
      success: true,
      data: formattedMemberData,
    }

    return json(response)
  } catch (error) {
    logger.error('프로젝트 멤버 조회 실패:', error)
    return json(
      {
        success: false,
        message: '프로젝트 멤버를 불러오는데 실패했습니다.',
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

// PUT /api/project-management/project-members/[id] - 프로젝트 멤버 수정
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const data = (await request.json()) as Record<string, unknown>
    const {
      role,
      startDate,
      endDate,
      participationRate,
      cashAmount,
      inKindAmount,
      contractMonthlySalary,
      participationMonths,
      status,
    } = data

    // 필수 필드 검증
    if (
      role === undefined &&
      startDate === undefined &&
      endDate === undefined &&
      participationRate === undefined &&
      cashAmount === undefined &&
      inKindAmount === undefined &&
      contractMonthlySalary === undefined &&
      participationMonths === undefined &&
      status === undefined
    ) {
      return json(
        {
          success: false,
          message: '수정할 필드가 없습니다.',
        },
        { status: 400 },
      )
    }

    // 참여율 검증 (0-100 사이)
    if (
      participationRate !== undefined &&
      (Number(participationRate || 0) < 0 || Number(participationRate || 0) > 100)
    ) {
      return json(
        {
          success: false,
          message: '참여율은 0-100 사이의 값이어야 합니다.',
        },
        { status: 400 },
      )
    }

    // 멤버 존재 확인 (날짜 변환 없이 원본 데이터 가져오기)
    const client = await getConnection()
    let existingMember
    try {
      existingMember = await client.query('SELECT * FROM project_members WHERE id = $1', [
        params.id,
      ])
    } finally {
      client.release()
    }

    if (existingMember.rows.length === 0) {
      return json(
        {
          success: false,
          message: '프로젝트 멤버를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    // 멤버 수정
    const updateFields: string[] = []
    const updateValues: (string | number | null)[] = []
    let paramIndex = 1

    if (role !== undefined) {
      updateFields.push(`role = $${paramIndex}`)
      updateValues.push(String(role || ''))
      paramIndex++
    }

    // 참여기간 수정 시 UTC+9 타임존 적용 및 유효성 검증
    if (startDate !== undefined) {
      const startDateStr = String(startDate || '')
      // 날짜 유효성 검증
      if (!isValidDate(startDateStr)) {
        return json(
          {
            success: false,
            message: '유효하지 않은 시작일 형식입니다.',
          },
          { status: 400 },
        )
      }

      // UTC+9 타임존 적용 (TIMESTAMP 타입으로 저장)
      const formattedStartDate = new Date(startDateStr + 'T00:00:00.000+09:00')
      updateFields.push(`start_date = $${paramIndex}`)
      updateValues.push(toUTC(formattedStartDate))
      paramIndex++
    }

    if (endDate !== undefined) {
      const endDateStr = String(endDate || '')
      // 날짜 유효성 검증
      if (!isValidDate(endDateStr)) {
        return json(
          {
            success: false,
            message: '유효하지 않은 종료일 형식입니다.',
          },
          { status: 400 },
        )
      }

      // UTC+9 타임존 적용 (TIMESTAMP 타입으로 저장)
      const formattedEndDate = new Date(endDateStr + 'T23:59:59.999+09:00')
      updateFields.push(`end_date = $${paramIndex}`)
      updateValues.push(toUTC(formattedEndDate))
      paramIndex++
    }

    // 시작일과 종료일이 모두 변경되는 경우 날짜 범위 검증
    if (startDate !== undefined && endDate !== undefined) {
      if (!isValidDateRange(String(startDate || ''), String(endDate || ''))) {
        return json(
          {
            success: false,
            message: '시작일이 종료일보다 늦을 수 없습니다.',
          },
          { status: 400 },
        )
      }

      // 프로젝트 기간과의 겹침 검증
      const currentMember = existingMember.rows[0] as Record<string, unknown>

      // 날짜 처리를 위해 client.query를 직접 사용 (processQueryResultDates 우회)
      const client = await getConnection()
      try {
        const projectResult = await client.query(
          'SELECT start_date, end_date FROM projects WHERE id = $1',
          [String(currentMember.project_id || '')],
        )

        if (projectResult.rows.length > 0) {
          const project = projectResult.rows[0] as Record<string, unknown>
          const participationValidation = calculateParticipationPeriod(
            String(startDate || ''),
            String(endDate || ''),
            String(project.start_date || ''),
            String(project.end_date || ''),
          )

          if (!participationValidation.isValid) {
            return json(
              {
                success: false,
                message:
                  participationValidation.errorMessage ||
                  '참여기간이 프로젝트 기간과 맞지 않습니다.',
              },
              { status: 400 },
            )
          }
        }
      } finally {
        client.release()
      }
    }

    if (participationRate !== undefined) {
      updateFields.push(`participation_rate = $${paramIndex}`)
      updateValues.push(Number(participationRate || 0))
      paramIndex++
    }

    if (cashAmount !== undefined) {
      updateFields.push(`cash_amount = $${paramIndex}`)
      updateValues.push(Number(cashAmount || 0))
      paramIndex++
    }

    if (inKindAmount !== undefined) {
      updateFields.push(`in_kind_amount = $${paramIndex}`)
      updateValues.push(Number(inKindAmount || 0))
      paramIndex++
    }

    if (contractMonthlySalary !== undefined) {
      updateFields.push(`monthly_amount = $${paramIndex}`)
      updateValues.push(Number(contractMonthlySalary || 0))
      paramIndex++
    }

    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex}`)
      updateValues.push(String(status || ''))
      paramIndex++
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
    updateValues.push(params.id)

    const _result = await query(
      `UPDATE project_members SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      updateValues,
    )

    // 수정된 멤버 정보와 관련 정보 조회
    const memberWithDetails = await query(
      `
			SELECT
				pm.*,
				CASE
					WHEN e.first_name ~ '^[가-힣]+$' AND e.last_name ~ '^[가-힣]+$'
					THEN CONCAT(e.last_name, ' ', e.first_name)
					ELSE CONCAT(e.first_name, ' ', e.last_name)
				END as employee_name,
				e.first_name,
				e.last_name,
				e.email as employee_email,
				e.department as employee_department,
				e.position as employee_position,
				p.title as project_title,
				p.code as project_code
			FROM project_members pm
			JOIN employees e ON pm.employee_id = e.id
			JOIN projects p ON pm.project_id = p.id
			WHERE pm.id = $1
		`,
      [params.id],
    )

    // TIMESTAMP 데이터를 YYYY-MM-DD 형식으로 변환 (중앙화된 함수 사용)
    const memberData = memberWithDetails.rows[0] as Record<string, unknown>
    const formattedMemberData = {
      ...memberData,
      start_date: formatDateForAPI(String(memberData.start_date || '')),
      end_date: formatDateForAPI(String(memberData.end_date || '')),
    }

    return json({
      success: true,
      data: formattedMemberData,
      message: '프로젝트 멤버가 성공적으로 수정되었습니다.',
    })
  } catch (error) {
    logger.error('프로젝트 멤버 수정 실패:', error)
    return json(
      {
        success: false,
        message: '프로젝트 멤버 수정에 실패했습니다.',
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

// DELETE /api/project-management/project-members/[id] - 프로젝트 멤버 삭제
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    // 멤버 존재 확인
    const existingMember = await query('SELECT * FROM project_members WHERE id = $1', [params.id])

    if (existingMember.rows.length === 0) {
      return json(
        {
          success: false,
          message: '프로젝트 멤버를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    // 멤버 삭제
    await query('DELETE FROM project_members WHERE id = $1', [params.id])

    return json({
      success: true,
      message: '프로젝트 멤버가 성공적으로 삭제되었습니다.',
    })
  } catch (error) {
    logger.error('프로젝트 멤버 삭제 실패:', error)
    return json(
      {
        success: false,
        message: '프로젝트 멤버 삭제에 실패했습니다.',
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
