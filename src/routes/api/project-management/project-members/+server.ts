import { query } from '$lib/database/connection'
import { formatDateForAPI } from '$lib/utils/date-calculator'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/project-management/project-members - 프로젝트 멤버 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('projectId')
    const employeeId = url.searchParams.get('employeeId')
    const status = url.searchParams.get('status')
    const role = url.searchParams.get('role')

    let sqlQuery = `
			SELECT
				pm.*,
				CASE
					WHEN e.first_name ~ '^[가-힣]+$' AND e.last_name ~ '^[가-힣]+$'
					THEN CONCAT(e.last_name, e.first_name)
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
			WHERE 1=1
		`

    const params: unknown[] = []
    let paramIndex = 1

    if (projectId) {
      sqlQuery += ` AND pm.project_id = $${paramIndex}`
      params.push(projectId)
      paramIndex++
    }

    if (employeeId) {
      sqlQuery += ` AND pm.employee_id = $${paramIndex}`
      params.push(employeeId)
      paramIndex++
    }

    if (status) {
      sqlQuery += ` AND pm.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    if (role) {
      sqlQuery += ` AND pm.role = $${paramIndex}`
      params.push(role)
      paramIndex++
    }

    sqlQuery += ` ORDER BY pm.created_at DESC`

    const result = await query(sqlQuery, params)

    // 데이터 변환 없이 원본 데이터 그대로 반환 (임시)
    return json({
      success: true,
      data: result.rows,
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

// POST /api/project-management/project-members - 프로젝트 멤버 추가
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = (await request.json()) as Record<string, unknown>
    const {
      projectId,
      employeeId,
      role = 'researcher',
      startDate,
      endDate,
      participationRate = 100,
      cashAmount = 0,
      inKindAmount = 0,
      status = 'active',
    } = data

    // 필수 필드 검증
    if (!projectId || !employeeId) {
      return json(
        {
          success: false,
          message: '프로젝트 ID와 직원 ID는 필수입니다.',
        },
        { status: 400 },
      )
    }

    // 참여율 검증 (0-100 사이)
    if (Number(participationRate || 0) < 0 || Number(participationRate || 0) > 100) {
      return json(
        {
          success: false,
          message: '참여율은 0-100 사이의 값이어야 합니다.',
        },
        { status: 400 },
      )
    }

    // 기간 겹침 검사 - 같은 직원이 같은 프로젝트에 참여하되, 기간이 겹치지 않아야 함
    const overlappingMember = await query(
      `
        SELECT id, start_date, end_date 
        FROM project_members 
        WHERE project_id = $1 AND employee_id = $2
          AND (
            -- 새 멤버의 시작일이 기존 멤버의 기간 내에 있거나
            ($3::date BETWEEN start_date AND end_date)
            OR
            -- 새 멤버의 종료일이 기존 멤버의 기간 내에 있거나
            ($4::date BETWEEN start_date AND end_date)
            OR
            -- 새 멤버의 기간이 기존 멤버의 기간을 완전히 포함하거나
            ($3::date <= start_date AND $4::date >= end_date)
          )
      `,
      [projectId, employeeId, startDate, endDate],
    )

    if (overlappingMember.rows.length > 0) {
      return json(
        {
          success: false,
          message: '해당 직원의 참여기간이 기존 참여기간과 겹칩니다. 다른 기간을 선택해주세요.',
        },
        { status: 400 },
      )
    }

    // 해당 직원의 프로젝트 참여 기간에 유효한 급여 계약서 조회
    // 프로젝트 참여 기간과 계약서 기간이 겹치는 경우를 찾음
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
      [employeeId, startDate, endDate],
    )

    // 계약서에서 연봉을 가져오거나, 제공된 계약금액 사용
    let _finalContractAmount = 0
    if (contractResult.rows.length > 0) {
      // 연봉을 월급으로 변환 (연봉 / 12)
      const contractRow = contractResult.rows[0] as Record<string, unknown>
      _finalContractAmount = Number(contractRow.annual_salary || 0) / 12
    } else {
      // 계약서가 없는 경우, 해당 직원의 모든 계약서 정보를 조회하여 안내 메시지 생성
      const allContractsResult = await query(
        `
				SELECT sc.start_date, sc.end_date, sc.annual_salary, sc.status
				FROM salary_contracts sc
				WHERE sc.employee_id = $1
				ORDER BY sc.start_date DESC
			`,
        [employeeId],
      )

      if (allContractsResult.rows.length === 0) {
        return json(
          {
            success: false,
            message:
              '해당 직원의 급여 계약서가 등록되지 않았습니다. 급여 계약서를 먼저 등록해주세요.',
            errorCode: 'NO_CONTRACT',
          },
          { status: 400 },
        )
      } else {
        // 계약서는 있지만 기간이 맞지 않는 경우
        const contracts = allContractsResult.rows
        const projectStartDate = startDate ? new Date(String(startDate)) : new Date()
        const _projectEndDate = endDate ? new Date(String(endDate)) : new Date()

        // 가장 가까운 계약서 찾기
        const futureContracts = contracts.filter(
          (c: Record<string, unknown>) => new Date(String(c.start_date || '')) > projectStartDate,
        )
        const pastContracts = contracts.filter(
          (c: Record<string, unknown>) => new Date(String(c.start_date || '')) <= projectStartDate,
        )

        let message = `프로젝트 참여 기간(${startDate || '시작일 미정'} ~ ${endDate || '종료일 미정'})에 해당 직원이 재직 중이 아닙니다.\n\n`

        if (futureContracts.length > 0) {
          const nextContract = futureContracts[futureContracts.length - 1] as Record<
            string,
            unknown
          > // 가장 가까운 미래 계약
          const contractStartDate = formatDateForAPI(String(nextContract.start_date || ''))
          message += `다음 계약 시작일: ${contractStartDate}\n`
          message += `해당 날짜부터 프로젝트 참여가 가능합니다.`
        } else if (pastContracts.length > 0) {
          const lastContract = pastContracts[0] as Record<string, unknown>
          if (lastContract.end_date) {
            const contractEndDate = formatDateForAPI(String(lastContract.end_date || ''))
            message += `마지막 계약 종료일: ${contractEndDate}\n`
            message += `해당 직원은 이미 퇴사한 상태입니다.`
          } else {
            message += `계약서 상태를 확인해주세요.`
          }
        }

        return json(
          {
            success: false,
            message: message,
            errorCode: 'CONTRACT_PERIOD_MISMATCH',
            contracts: contracts.map((c: Record<string, unknown>) => ({
              startDate: c.start_date,
              endDate: c.end_date,
              status: c.status,
            })),
          },
          { status: 400 },
        )
      }
    }

    // 월간 금액 계산: 계약서에서 가져온 금액 사용
    const monthlyAmount = _finalContractAmount

    // 프로젝트 멤버 추가 (현금/현물 금액 포함)
    const result = await query(
      `
			INSERT INTO project_members (project_id, employee_id, role, start_date, end_date, participation_rate, monthly_amount, cash_amount, in_kind_amount, status)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			RETURNING *
		`,
      [
        projectId,
        employeeId,
        role,
        startDate,
        endDate,
        participationRate,
        monthlyAmount,
        cashAmount,
        inKindAmount,
        status,
      ],
    )

    // 추가된 멤버 정보와 관련 정보 조회
    const memberWithDetails = await query(
      `
			SELECT
				pm.*,
				CASE
					WHEN e.first_name ~ '^[가-힣]+$' AND e.last_name ~ '^[가-힣]+$'
					THEN CONCAT(e.last_name, e.first_name)
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
      [String((result.rows[0] as Record<string, unknown>).id || '')],
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
      message: '프로젝트 멤버가 성공적으로 추가되었습니다.',
    })
  } catch (error) {
    logger.error('프로젝트 멤버 추가 실패:', error)
    return json(
      {
        success: false,
        message: '프로젝트 멤버 추가에 실패했습니다.',
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
