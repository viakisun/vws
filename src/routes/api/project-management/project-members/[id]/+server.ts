import { query } from '$lib/database/connection'
import {
  calculateParticipationPeriod,
  formatDateForAPI,
  isValidDate,
  isValidDateRange,
} from '$lib/utils/date-calculator'
import { logger } from '$lib/utils/logger'
import { calculateMonthlySalary } from '$lib/utils/salary-calculator'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/project-management/project-members/[id] - 특정 프로젝트 멤버 조회
export const GET: RequestHandler = async ({ params }) => {
  try {
    const result = await query(
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
    const memberData = result.rows[0]
    const formattedMemberData = {
      ...memberData,
      start_date: formatDateForAPI(memberData.start_date),
      end_date: formatDateForAPI(memberData.end_date),
    }

    return json({
      success: true,
      data: formattedMemberData,
    })
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
    const data = await request.json()
    const {
      role,
      startDate,
      endDate,
      participationRate,
      contributionType,
      contractAmount,
      status,
    } = data

    // 필수 필드 검증
    if (
      role === undefined &&
      startDate === undefined &&
      endDate === undefined &&
      participationRate === undefined &&
      contributionType === undefined &&
      contractAmount === undefined &&
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
    if (participationRate !== undefined && (participationRate < 0 || participationRate > 100)) {
      return json(
        {
          success: false,
          message: '참여율은 0-100 사이의 값이어야 합니다.',
        },
        { status: 400 },
      )
    }

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

    // 멤버 수정
    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    if (role !== undefined) {
      updateFields.push(`role = $${paramIndex}`)
      updateValues.push(role)
      paramIndex++
    }

    // 참여기간 수정 시 UTC+9 타임존 적용 및 유효성 검증
    if (startDate !== undefined) {
      // 날짜 유효성 검증
      if (!isValidDate(startDate)) {
        return json(
          {
            success: false,
            message: '유효하지 않은 시작일 형식입니다.',
          },
          { status: 400 },
        )
      }

      // UTC+9 타임존 적용 (TIMESTAMP 타입으로 저장)
      const formattedStartDate = new Date(startDate + 'T00:00:00.000+09:00')
      updateFields.push(`start_date = $${paramIndex}`)
      updateValues.push(formattedStartDate)
      paramIndex++
    }

    if (endDate !== undefined) {
      // 날짜 유효성 검증
      if (!isValidDate(endDate)) {
        return json(
          {
            success: false,
            message: '유효하지 않은 종료일 형식입니다.',
          },
          { status: 400 },
        )
      }

      // UTC+9 타임존 적용 (TIMESTAMP 타입으로 저장)
      const formattedEndDate = new Date(endDate + 'T23:59:59.999+09:00')
      updateFields.push(`end_date = $${paramIndex}`)
      updateValues.push(formattedEndDate)
      paramIndex++
    }

    // 시작일과 종료일이 모두 변경되는 경우 날짜 범위 검증
    if (startDate !== undefined && endDate !== undefined) {
      if (!isValidDateRange(startDate, endDate)) {
        return json(
          {
            success: false,
            message: '시작일이 종료일보다 늦을 수 없습니다.',
          },
          { status: 400 },
        )
      }

      // 프로젝트 기간과의 겹침 검증
      const currentMember = existingMember.rows[0]
      const projectResult = await query('SELECT start_date, end_date FROM projects WHERE id = $1', [
        currentMember.project_id,
      ])

      if (projectResult.rows.length > 0) {
        const project = projectResult.rows[0]
        const participationValidation = calculateParticipationPeriod(
          startDate,
          endDate,
          project.start_date,
          project.end_date,
        )

        if (!participationValidation.isValid) {
          return json(
            {
              success: false,
              message:
                participationValidation.errorMessage || '참여기간이 프로젝트 기간과 맞지 않습니다.',
            },
            { status: 400 },
          )
        }
      }
    }

    if (participationRate !== undefined) {
      updateFields.push(`participation_rate = $${paramIndex}`)
      updateValues.push(participationRate)
      paramIndex++
    }

    if (contributionType !== undefined) {
      updateFields.push(`contribution_type = $${paramIndex}`)
      updateValues.push(contributionType)
      paramIndex++
    }

    // contract_amount 필드 제거 - 실제 근로계약서에서 조회

    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex}`)
      updateValues.push(status)
      paramIndex++
    }

    // 참여율이 변경된 경우 월간금액 재계산
    if (participationRate !== undefined) {
      const currentMember = existingMember.rows[0]
      const finalParticipationRate = participationRate

      // 실제 근로계약서에서 최신 금액 조회
      const contractResult = await query(
        `
				SELECT sc.annual_salary, sc.monthly_salary
				FROM salary_contracts sc
				WHERE sc.employee_id = $1
					AND sc.status = 'active'
					AND (
						-- 계약서 시작일이 프로젝트 참여 기간 내에 있거나
						(sc.start_date <= COALESCE($3, CURRENT_DATE) AND (sc.end_date IS NULL OR sc.end_date >= COALESCE($2, CURRENT_DATE)))
						OR
						-- 프로젝트 참여 기간이 계약서 기간 내에 있거나
						(COALESCE($2, CURRENT_DATE) <= sc.start_date AND COALESCE($3, CURRENT_DATE) >= sc.start_date)
					)
				ORDER BY sc.start_date DESC
				LIMIT 1
			`,
        [currentMember.employee_id, currentMember.start_date, currentMember.end_date],
      )

      let contractMonthlySalary = 0
      if (contractResult.rows.length > 0) {
        const contract = contractResult.rows[0]
        contractMonthlySalary = contract.monthly_salary || contract.annual_salary / 12
      }

      // 월간 금액 계산: 중앙화된 급여 계산 함수 사용
      const monthlyAmount = calculateMonthlySalary(
        contractMonthlySalary * 12, // 연봉으로 변환
        finalParticipationRate,
      )

      updateFields.push(`monthly_amount = $${paramIndex}`)
      updateValues.push(monthlyAmount)
      paramIndex++
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
    updateValues.push(params.id)

    // eslint-disable-next-line no-restricted-syntax -- not a personal name composition (false positive)
    const _result = await query(
      `
			UPDATE project_members 
			SET ${updateFields.join(', ')}
			WHERE id = $${paramIndex}
			RETURNING *
		`,
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
    const memberData = memberWithDetails.rows[0]
    const formattedMemberData = {
      ...memberData,
      start_date: formatDateForAPI(memberData.start_date),
      end_date: formatDateForAPI(memberData.end_date),
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
