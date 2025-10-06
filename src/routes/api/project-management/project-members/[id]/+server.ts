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
import type { PoolClient, QueryResult } from 'pg'
import type { RequestHandler } from './$types'

// ============================================================================
// Constants
// ============================================================================

// 최적화: 필요한 필드만 명시적으로 선택
const MEMBER_DETAILS_QUERY = `
  SELECT
    pm.id,
    pm.project_id,
    pm.employee_id,
    pm.role,
    pm.start_date,
    pm.end_date,
    pm.participation_rate,
    pm.monthly_salary,
    pm.monthly_amount,
    pm.cash_amount,
    pm.in_kind_amount,
    pm.status,
    pm.notes,
    pm.created_at,
    pm.updated_at,
    CASE
      WHEN e.first_name ~ '^[가-힣]+$' AND e.last_name ~ '^[가-힣]+$'
      THEN CONCAT(e.last_name, ' ', e.first_name)
      ELSE CONCAT(e.first_name, ' ', e.last_name)
    END as employee_name,
    e.department as employee_department,
    e.position as employee_position
  FROM project_members pm
  JOIN employees e ON pm.employee_id = e.id
  WHERE pm.id = $1
`

// ============================================================================
// Helper Functions
// ============================================================================

function formatMemberDates(memberData: Record<string, unknown>) {
  return {
    ...memberData,
    start_date: formatDateForAPI(String(memberData.start_date || '')),
    end_date: formatDateForAPI(String(memberData.end_date || '')),
  }
}

function notFoundResponse(message: string) {
  return json({ success: false, message }, { status: 404 })
}

function badRequestResponse(message: string) {
  return json({ success: false, message }, { status: 400 })
}

function errorResponse(message: string, error: Error, includeStack = false) {
  return json(
    {
      success: false,
      message,
      error: error.message,
      stack: includeStack ? error.stack : undefined,
    },
    { status: 500 },
  )
}

async function getMemberById(memberId: string): Promise<QueryResult<Record<string, unknown>>> {
  return (await query('SELECT * FROM project_members WHERE id = $1', [memberId])) as QueryResult<
    Record<string, unknown>
  >
}

async function getProjectById(
  client: PoolClient,
  projectId: string,
): Promise<QueryResult<Record<string, unknown>>> {
  return (await client.query('SELECT start_date, end_date FROM projects WHERE id = $1', [
    projectId,
  ])) as QueryResult<Record<string, unknown>>
}

// ============================================================================
// Validation Functions
// ============================================================================

function validateUpdateFields(data: Record<string, unknown>): boolean {
  const updateableFields = [
    'role',
    'startDate',
    'endDate',
    'participationRate',
    'cashAmount',
    'inKindAmount',
    'contractMonthlySalary',
    'status',
  ]
  return updateableFields.some((field) => data[field] !== undefined)
}

function validateParticipationRate(rate: unknown): boolean {
  const numRate = Number(rate || 0)
  return numRate >= 0 && numRate <= 100
}

async function validateProjectPeriod(
  existingMember: QueryResult<Record<string, unknown>>,
  startDate: unknown,
  endDate: unknown,
): Promise<string | null> {
  const currentMember = existingMember.rows[0]
  const projectClient = await getConnection()
  try {
    const projectResult = await getProjectById(
      projectClient,
      String(currentMember.project_id || ''),
    )

    if (projectResult.rows.length > 0) {
      const project = projectResult.rows[0]
      const participationValidation = calculateParticipationPeriod(
        String(startDate || ''),
        String(endDate || ''),
        String(project.start_date || ''),
        String(project.end_date || ''),
      )

      if (!participationValidation.isValid) {
        return participationValidation.errorMessage || '참여기간이 프로젝트 기간과 맞지 않습니다.'
      }
    }
  } finally {
    projectClient.release()
  }
  return null
}

// ============================================================================
// API Handlers
// ============================================================================

/**
 * GET /api/project-management/project-members/[id] - 특정 프로젝트 멤버 조회
 */
export const GET: RequestHandler = async ({ params }) => {
  try {
    const result = (await query<DatabaseProjectMember>(MEMBER_DETAILS_QUERY, [
      params.id,
    ])) as QueryResult<DatabaseProjectMember>

    if (!result || result.rows.length === 0) {
      return notFoundResponse('프로젝트 멤버를 찾을 수 없습니다.')
    }

    const memberData = result.rows[0] as Record<string, unknown>
    const formattedMemberData = formatMemberDates(memberData)

    const response: ApiResponse<unknown> = {
      success: true,
      data: formattedMemberData,
    }

    return json(response)
  } catch (error) {
    logger.error('프로젝트 멤버 조회 실패:', error)
    return errorResponse('프로젝트 멤버를 불러오는데 실패했습니다.', error as Error)
  }
}

/**
 * PUT /api/project-management/project-members/[id] - 프로젝트 멤버 수정
 */
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
      status,
    } = data

    // 필수 필드 검증
    if (!validateUpdateFields(data)) {
      return badRequestResponse('수정할 필드가 없습니다.')
    }

    // 참여율 검증
    if (participationRate !== undefined && !validateParticipationRate(participationRate)) {
      return badRequestResponse('참여율은 0-100 사이의 값이어야 합니다.')
    }

    // 멤버 존재 확인
    const existingMember = await getMemberById(params.id)

    if (!existingMember || existingMember.rows.length === 0) {
      return notFoundResponse('프로젝트 멤버를 찾을 수 없습니다.')
    }

    // 동적 업데이트 쿼리 생성
    const updateFields: string[] = []
    const updateValues: (string | number | null)[] = []
    let paramIndex = 1

    // role 업데이트
    if (role !== undefined) {
      updateFields.push(`role = $${paramIndex}`)
      updateValues.push(String(role || ''))
      paramIndex++
    }

    // startDate 업데이트 및 검증
    if (startDate !== undefined) {
      const startDateStr = String(startDate || '')
      if (!isValidDate(startDateStr)) {
        return badRequestResponse('유효하지 않은 시작일 형식입니다.')
      }

      const formattedStartDate = new Date(startDateStr + 'T00:00:00.000+09:00')
      updateFields.push(`start_date = $${paramIndex}`)
      updateValues.push(toUTC(formattedStartDate))
      paramIndex++
    }

    // endDate 업데이트 및 검증
    if (endDate !== undefined) {
      const endDateStr = String(endDate || '')
      if (!isValidDate(endDateStr)) {
        return badRequestResponse('유효하지 않은 종료일 형식입니다.')
      }

      const formattedEndDate = new Date(endDateStr + 'T23:59:59.999+09:00')
      updateFields.push(`end_date = $${paramIndex}`)
      updateValues.push(toUTC(formattedEndDate))
      paramIndex++
    }

    // 날짜 범위 검증
    if (startDate !== undefined && endDate !== undefined) {
      if (!isValidDateRange(String(startDate || ''), String(endDate || ''))) {
        return badRequestResponse('시작일이 종료일보다 늦을 수 없습니다.')
      }

      // 프로젝트 기간과의 겹침 검증
      const validationError = await validateProjectPeriod(existingMember, startDate, endDate)
      if (validationError) {
        return badRequestResponse(validationError)
      }
    }

    // 나머지 필드 업데이트
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

    // updated_at 자동 업데이트
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
    updateValues.push(params.id)

    logger.log('Updating project member with fields:', updateFields)
    logger.log('Update values:', updateValues)

    // 멤버 업데이트 실행
    await query(
      `UPDATE project_members SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      updateValues,
    )

    // 수정된 멤버 정보 조회
    const memberWithDetails = (await query(MEMBER_DETAILS_QUERY, [
      params.id,
    ])) as QueryResult<DatabaseProjectMember>
    if (!memberWithDetails || memberWithDetails.rows.length === 0) {
      return errorResponse('수정된 멤버 정보를 조회할 수 없습니다.', new Error('Member not found'))
    }
    const memberData = memberWithDetails.rows[0] as Record<string, unknown>
    const formattedMemberData = formatMemberDates(memberData)

    return json({
      success: true,
      data: formattedMemberData,
      message: '프로젝트 멤버가 성공적으로 수정되었습니다.',
    })
  } catch (error) {
    logger.error('프로젝트 멤버 수정 실패:', error)
    logger.error('Error stack:', (error as Error).stack)
    return errorResponse(
      '프로젝트 멤버 수정에 실패했습니다.',
      error as Error,
      process.env.NODE_ENV === 'development',
    )
  }
}

/**
 * DELETE /api/project-management/project-members/[id] - 프로젝트 멤버 삭제
 */
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    // 멤버 존재 확인
    const existingMember = await getMemberById(params.id)

    if (!existingMember || existingMember.rows.length === 0) {
      return notFoundResponse('프로젝트 멤버를 찾을 수 없습니다.')
    }

    // 멤버 삭제
    await query('DELETE FROM project_members WHERE id = $1', [params.id])

    return json({
      success: true,
      message: '프로젝트 멤버가 성공적으로 삭제되었습니다.',
    })
  } catch (error) {
    logger.error('프로젝트 멤버 삭제 실패:', error)
    return errorResponse('프로젝트 멤버 삭제에 실패했습니다.', error as Error)
  }
}
