import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { getCurrentDateForAPI } from '$lib/utils/date-calculator'
import { logger } from '$lib/utils/logger'
import { calculateMonthlySalary } from '$lib/utils/salary-calculator'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface DatabaseProject {
  id: string
  title: string
  code: string
  start_date: string
  end_date: string
  budget_total: string
  [key: string]: unknown
}

interface DatabaseProjectMember {
  id: string
  project_id: string
  employee_id: string
  start_date: string
  end_date: string
  participation_rate: string
  monthly_amount: string
  status: string
  created_at: string
  employee_name: string
  first_name: string
  last_name: string
  employee_email: string
  employee_department: string
  employee_position: string
  [key: string]: unknown
}

interface DatabaseSalaryContract {
  annual_salary: string
  monthly_salary: string
  start_date: string
  end_date: string
  status: string
  [key: string]: unknown
}

interface FixRequest {
  projectId: string
  fixes: Array<{
    type: string
    memberId: string
    oldValue: number
    newValue: number
  }>
}

interface AppliedFix {
  memberId: string
  type: string
  action: string
  success: boolean
  error?: string
}

// 프로젝트 멤버 타입 정의
interface ProjectMember {
  id: string // 사번
  employee_name: string // 직원 이름
  participation_rate: number | string // 참여율
  monthly_amount: number | string // 월간 금액
  start_date?: string // 시작일
  end_date?: string // 종료일
  contract_amount?: number | string // 계약 금액
}

interface ValidationResult {
  isValid: boolean
  issues: ValidationIssue[]
  summary: {
    totalMembers: number
    validMembers: number
    invalidMembers: number
    lastValidated: string
  }
}

interface ValidationIssue {
  type:
    | 'contract_missing'
    | 'contract_period_mismatch'
    | 'participation_rate_excess'
    | 'amount_excess'
    | 'duplicate_participation'
  severity: 'error' | 'warning' | 'info'
  message: string
  memberId: string
  memberName: string
  suggestedFix?: string
  data?: Record<string, unknown>
}

// GET: 참여연구원 검증 실행
export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('projectId')

    if (!projectId) {
      return json(
        {
          success: false,
          error: '프로젝트 ID가 필요합니다.',
        },
        { status: 400 },
      )
    }

    logger.log(`🔍 [참여연구원 검증] 프로젝트 ${projectId} 검증 시작`)

    // 1. 프로젝트 기본 정보 조회
    const projectResult = await query<DatabaseProject>(
      `
			SELECT id, title, code, start_date, end_date, budget_total
			FROM projects 
			WHERE id = $1
		`,
      [projectId],
    )

    if (projectResult.rows.length === 0) {
      const response: ApiResponse<null> = { success: false, error: '프로젝트를 찾을 수 없습니다.' }
      return json(response, { status: 404 })
    }

    const project = projectResult.rows[0]

    // 2. 참여연구원 목록 조회
    const membersResult = await query<DatabaseProjectMember>(
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
				e.position as employee_position
			FROM project_members pm
			JOIN employees e ON pm.employee_id = e.id
			WHERE pm.project_id = $1 AND pm.status = 'active'
			ORDER BY pm.created_at DESC
		`,
      [projectId],
    )

    const members = membersResult.rows
    logger.log(`📋 참여연구원 ${members.length}명 검증 시작`)

    // 3. 검증 실행
    const validationResult = await performValidation(project, members)

    logger.log(
      `✅ [참여연구원 검증] 완료 - ${validationResult.isValid ? '✅ 통과' : '❌ 실패'} (${validationResult.issues.length}개 이슈)`,
    )

    const response: ApiResponse<{
      project: { id: string; title: string; code: string }
      validation: ValidationResult
    }> = {
      success: true,
      data: {
        project: {
          id: project.id,
          title: project.title,
          code: project.code,
        },
        validation: validationResult,
      },
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('참여연구원 검증 오류:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '검증 중 오류가 발생했습니다.',
    }
    return json(response, { status: 500 })
  }
}

// POST: 자동 수정 실행
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { projectId, fixes } = (await request.json()) as FixRequest

    if (!projectId) {
      const response: ApiResponse<null> = { success: false, error: '프로젝트 ID가 필요합니다.' }
      return json(response, { status: 400 })
    }

    logger.log(`🔧 [참여연구원 자동 수정] 프로젝트 ${projectId} 수정 시작`)

    const appliedFixes: AppliedFix[] = []

    // 각 수정사항 적용
    for (const fix of fixes || []) {
      try {
        switch (fix.type) {
          case 'participation_rate_adjustment':
            await query('UPDATE project_members SET participation_rate = $1 WHERE id = $2', [
              fix.newValue,
              fix.memberId,
            ])
            appliedFixes.push({
              memberId: fix.memberId,
              type: fix.type,

              action: `참여율 ${fix.oldValue}% → ${fix.newValue}%로 조정`,
              success: true,
            })
            break

          // contract_amount_adjustment 케이스 제거 - 실제 근로계약서에서 조회하므로 불필요

          default:
            appliedFixes.push({
              memberId: fix.memberId,
              type: fix.type,
              action: '지원하지 않는 수정 유형',
              success: false,
            })
        }
      } catch (fixError) {
        logger.error(`수정 실패 (${fix.type}):`, fixError)
        appliedFixes.push({
          memberId: fix.memberId,
          type: fix.type,
          action: '수정 실패',
          success: false,
          error: fixError instanceof Error ? fixError.message : 'Unknown error',
        })
      }
    }

    logger.log(
      `✅ [참여연구원 자동 수정] 완료 - ${appliedFixes.filter((f) => f.success).length}/${appliedFixes.length}개 성공`,
    )

    const response: ApiResponse<{
      appliedFixes: AppliedFix[]
      summary: { total: number; successful: number; failed: number }
    }> = {
      success: true,
      data: {
        appliedFixes,
        summary: {
          total: appliedFixes.length,
          successful: appliedFixes.filter((f) => f.success).length,
          failed: appliedFixes.filter((f) => !f.success).length,
        },
      },
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('자동 수정 오류:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '자동 수정 중 오류가 발생했습니다.',
    }
    return json(response, { status: 500 })
  }
}

// 검증 로직 실행
async function performValidation(
  project: DatabaseProject,
  members: ProjectMember[],
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = []
  let validMembers = 0

  for (const member of members) {
    let memberHasIssues = false

    // 1. 근로계약서 검증
    const contractValidation = await validateContract(member, project)
    if (!contractValidation.isValid) {
      issues.push(...contractValidation.issues)
      memberHasIssues = true
    }

    // 2. 참여율 검증
    const participationRate =
      typeof member.participation_rate === 'string'
        ? parseFloat(member.participation_rate) || 0
        : member.participation_rate || 0
    if (participationRate > 100) {
      issues.push({
        type: 'participation_rate_excess',
        severity: 'error',
        message: `참여율이 100%를 초과합니다 (${participationRate}%)`,
        memberId: member.id,
        memberName: member.employee_name,
        suggestedFix: '참여율을 100% 이하로 조정하세요',
        data: { participationRate },
      })
      memberHasIssues = true
    }

    // 3. 월간 금액 검증 (계약서 대비)
    const monthlyAmount =
      typeof member.monthly_amount === 'string'
        ? parseFloat(member.monthly_amount) || 0
        : member.monthly_amount || 0

    // 실제 근로계약서에서 연봉 가져오기
    const contractResult = await query<DatabaseSalaryContract>(
      `
			SELECT sc.annual_salary, sc.monthly_salary, sc.start_date, sc.end_date, sc.status
			FROM salary_contracts sc
			WHERE sc.employee_id = $1
				AND sc.status = 'active'
				AND (
					(sc.start_date <= COALESCE($3, CURRENT_DATE) AND (sc.end_date IS NULL OR sc.end_date >= COALESCE($2, CURRENT_DATE)))
					OR
					(COALESCE($2, CURRENT_DATE) <= sc.start_date AND COALESCE($3, CURRENT_DATE) >= sc.start_date)
				)
			ORDER BY sc.start_date DESC
			LIMIT 1
		`,
      [member.id, member.start_date, member.end_date],
    )

    let contractAmount = 0
    if (contractResult.rows.length > 0) {
      // 월급이 있으면 월급 기준, 없으면 연봉/12 기준
      const contract = contractResult.rows[0]
      contractAmount =
        parseFloat(contract.monthly_salary || '0') || parseFloat(contract.annual_salary || '0') / 12
    }

    // 예상 월간 금액 계산
    const expectedMonthlyAmount = calculateMonthlySalary(contractAmount, participationRate)

    if (monthlyAmount > expectedMonthlyAmount * 1.1) {
      // 10% 허용 오차
      issues.push({
        type: 'amount_excess',
        severity: 'warning',

        message: `월간 금액이 예상 금액을 초과합니다 (${monthlyAmount.toLocaleString()}원 vs ${expectedMonthlyAmount.toLocaleString()}원)`,
        memberId: member.id,
        memberName: member.employee_name,
        suggestedFix: '계약 금액 또는 참여율을 확인하세요',
        data: {
          monthlyAmount,
          expectedMonthlyAmount,
          contractAmount,
          participationRate,
        },
      })
      memberHasIssues = true
    }

    // 4. 중복 참여 검증 (동일 기간에 여러 프로젝트 참여)
    const duplicateValidation = await validateDuplicateParticipation(member)
    if (!duplicateValidation.isValid) {
      issues.push(...duplicateValidation.issues)
      memberHasIssues = true
    }

    if (!memberHasIssues) {
      validMembers++
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    summary: {
      totalMembers: members.length,
      validMembers,
      invalidMembers: members.length - validMembers,
      lastValidated: getCurrentDateForAPI(),
    },
  }
}

// 근로계약서 검증
async function validateContract(
  member: ProjectMember,
  _project: DatabaseProject,
): Promise<{ isValid: boolean; issues: ValidationIssue[] }> {
  const issues: ValidationIssue[] = []

  // 프로젝트 참여 기간과 겹치는 계약서 조회
  const contractResult = await query<DatabaseSalaryContract>(
    `
		SELECT sc.annual_salary, sc.monthly_salary, sc.start_date, sc.end_date, sc.status
		FROM salary_contracts sc
		WHERE sc.employee_id = $1
			AND sc.status = 'active'
			AND (
				(sc.start_date <= COALESCE($3, CURRENT_DATE) AND (sc.end_date IS NULL OR sc.end_date >= COALESCE($2, CURRENT_DATE)))
				OR
				(COALESCE($2, CURRENT_DATE) <= sc.start_date AND COALESCE($3, CURRENT_DATE) >= sc.start_date)
			)
		ORDER BY sc.start_date DESC
		LIMIT 1
	`,
    [member.id, member.start_date, member.end_date],
  )

  if (contractResult.rows.length === 0) {
    // 계약서가 없는 경우
    const allContractsResult = await query<DatabaseSalaryContract>(
      `
			SELECT sc.start_date, sc.end_date, sc.annual_salary, sc.status
			FROM salary_contracts sc
			WHERE sc.employee_id = $1
			ORDER BY sc.start_date DESC
		`,
      [member.id],
    )

    if (allContractsResult.rows.length === 0) {
      issues.push({
        type: 'contract_missing',
        severity: 'error',

        message: '해당 기간의 근로계약서가 없습니다',
        memberId: member.id,
        memberName: member.employee_name,
        suggestedFix: '급여 계약서를 등록하거나 프로젝트 참여 기간을 조정하세요',
        data: {
          participationPeriod: `${member.start_date} ~ ${member.end_date}`,
          contracts: [],
        },
      })
    } else {
      issues.push({
        type: 'contract_period_mismatch',
        severity: 'error',

        message: '프로젝트 참여 기간에 해당하는 근로계약서가 없습니다',
        memberId: member.id,
        memberName: member.employee_name,
        suggestedFix: '근로계약서 기간을 확인하거나 프로젝트 참여 기간을 조정하세요',
        data: {
          participationPeriod: `${member.start_date} ~ ${member.end_date}`,
          contracts: allContractsResult.rows,
        },
      })
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  }
}

// 중복 참여 검증
async function validateDuplicateParticipation(
  member: ProjectMember,
): Promise<{ isValid: boolean; issues: ValidationIssue[] }> {
  const issues: ValidationIssue[] = []

  // 동일 직원의 다른 프로젝트 참여 조회
  const duplicateResult = await query<{
    id: string
    project_id: string
    start_date: string
    end_date: string
    participation_rate: string
    project_title: string
    [key: string]: unknown
  }>(
    `
		SELECT pm.id, pm.project_id, pm.start_date, pm.end_date, pm.participation_rate,
			   p.title as project_title
		FROM project_members pm
		JOIN projects p ON pm.project_id = p.id
		WHERE pm.employee_id = $1 
			AND pm.id != $2
			AND pm.status = 'active'
			AND (
				(pm.start_date <= COALESCE($4, CURRENT_DATE) AND (pm.end_date IS NULL OR pm.end_date >= COALESCE($3, CURRENT_DATE)))
				OR
				(COALESCE($3, CURRENT_DATE) <= pm.start_date AND COALESCE($4, CURRENT_DATE) >= pm.start_date)
			)
	`,
    [member.id, member.id, member.start_date, member.end_date],
  )

  if (duplicateResult.rows.length > 0) {
    // 참여율 합계 계산
    const totalParticipationRate =
      duplicateResult.rows.reduce((sum, p) => sum + (parseFloat(p.participation_rate) || 0), 0) +
      (parseFloat(String(member.participation_rate)) || 0)

    if (totalParticipationRate > 100) {
      issues.push({
        type: 'duplicate_participation',
        severity: 'error',
        message: `동일 기간에 여러 프로젝트 참여율 합계가 100%를 초과합니다 (${totalParticipationRate.toFixed(1)}%)`,
        memberId: member.id,
        memberName: member.employee_name,

        suggestedFix: '참여율을 조정하거나 참여 기간을 변경하세요',
        data: {
          totalParticipationRate,
          conflictingProjects: duplicateResult.rows.map((p) => ({
            projectId: p.project_id,
            projectTitle: p.project_title,
            participationRate: parseFloat(p.participation_rate) || 0,

            period: `${p.start_date} ~ ${p.end_date}`,
          })),
        },
      })
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  }
}
