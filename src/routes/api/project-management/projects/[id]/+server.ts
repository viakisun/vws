// Project Management API - Individual Project
// 개별 프로젝트 관련 API

import { query } from '$lib/database/connection'
import type {
  ApiResponse,
  DatabaseProject,
  DatabaseProjectBudget,
  DatabaseProjectMember,
} from '$lib/types/database'
import {
  transformArrayData,
  transformMilestoneData,
  transformProjectBudgetData,
  transformProjectData,
  transformProjectMemberData,
  transformRiskData,
} from '$lib/utils/api-data-transformer'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 개별 프로젝트 조회
export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params

    // 프로젝트 기본 정보 조회
    const projectResult = await query<DatabaseProject>(
      `
			SELECT
				p.id, p.code, p.title, p.description, p.sponsor, p.sponsor_name, p.sponsor_type,
				p.start_date::text as start_date, p.end_date::text as end_date,
				p.manager_employee_id, p.status, p.budget_total, p.budget_currency,
				p.research_type, p.technology_area, p.priority,
				p.created_at::text as created_at, p.updated_at::text as updated_at,
				e.first_name || ' ' || e.last_name as manager_name,
				COUNT(pm.id) as member_count,
				COALESCE(SUM(pm.participation_rate), 0) as total_participation_rate
			FROM projects p
			LEFT JOIN employees e ON p.manager_employee_id = e.id
			LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.status = 'active'
			WHERE p.id = $1
			GROUP BY p.id, p.code, p.title, p.description, p.sponsor, p.sponsor_name, p.sponsor_type,
			         p.start_date, p.end_date, p.manager_employee_id, p.status, p.budget_total,
			         p.budget_currency, p.research_type, p.technology_area, p.priority,
			         p.created_at, p.updated_at, e.first_name, e.last_name
		`,
      [id],
    )

    if (projectResult.rows.length === 0) {
      return json(
        {
          success: false,
          message: '프로젝트를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const project = projectResult.rows[0]

    // 프로젝트 멤버 목록 조회
    const membersResult = await query<DatabaseProjectMember>(
      `
			SELECT
				pm.id, pm.project_id, pm.employee_id, pm.role,
				pm.start_date::text as start_date, pm.end_date::text as end_date,
				pm.participation_rate, pm.monthly_salary, pm.monthly_amount,
				pm.cash_amount, pm.in_kind_amount, pm.status, pm.notes,
				pm.created_at::text as created_at, pm.updated_at::text as updated_at,
				e.first_name || ' ' || e.last_name as employee_name,
				e.department
			FROM project_members pm
			LEFT JOIN employees e ON pm.employee_id = e.id
			WHERE pm.project_id = $1
			ORDER BY pm.created_at DESC
		`,
      [id],
    )

    // 프로젝트 사업비 조회
    const budgetsResult = await query<DatabaseProjectBudget>(
      `
			SELECT
				id, project_id, period_number,
				start_date::text as start_date, end_date::text as end_date,
				personnel_cost, research_material_cost, research_activity_cost,
				research_stipend, indirect_cost,
				personnel_cost_cash, personnel_cost_in_kind,
				research_material_cost_cash, research_material_cost_in_kind,
				research_activity_cost_cash, research_activity_cost_in_kind,
				research_stipend_cash, research_stipend_in_kind,
				indirect_cost_cash, indirect_cost_in_kind,
				government_funding_amount, company_cash_amount, company_in_kind_amount,
				created_at::text as created_at, updated_at::text as updated_at
			FROM project_budgets
			WHERE project_id = $1
			ORDER BY period_number DESC
		`,
      [id],
    )

    // 프로젝트 마일스톤 조회
    const milestonesResult = await query(
      `
			SELECT
				id, project_id, title, description,
				milestone_date::text as milestone_date,
				status,
				created_at::text as created_at, updated_at::text as updated_at
			FROM project_milestones
			WHERE project_id = $1
			ORDER BY milestone_date ASC
		`,
      [id],
    )

    // 프로젝트 위험 요소 조회
    const risksResult = await query(
      `
			SELECT
				pr.id, pr.project_id, pr.title, pr.description,
				pr.probability, pr.impact, pr.status, pr.owner_id,
				pr.created_at::text as created_at, pr.updated_at::text as updated_at,
				e.first_name || ' ' || e.last_name as owner_name
			FROM project_risks pr
			LEFT JOIN employees e ON pr.owner_id = e.id
			WHERE pr.project_id = $1
			ORDER BY pr.created_at DESC
		`,
      [id],
    )

    // 데이터 변환: snake_case를 camelCase로 변환
    const transformedProject = transformProjectData(project)
    const transformedMembers = transformArrayData(membersResult.rows, transformProjectMemberData)
    const transformedBudgets = transformArrayData(budgetsResult.rows, transformProjectBudgetData)
    const transformedMilestones = transformArrayData(milestonesResult.rows, transformMilestoneData)
    const transformedRisks = transformArrayData(risksResult.rows, transformRiskData)

    const response: ApiResponse<unknown> = {
      success: true,
      data: {
        ...transformedProject,
        members: transformedMembers,
        budgets: transformedBudgets,
        milestones: transformedMilestones,
        risks: transformedRisks,
      },
    }

    return json(response)
  } catch (error) {
    logger.error('프로젝트 조회 실패:', error)
    return json(
      {
        success: false,
        message: '프로젝트를 불러오는데 실패했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 },
    )
  }
}

// 프로젝트 수정
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params as Record<string, string>
    const data = (await request.json()) as Record<string, unknown>
    const {
      code,
      title,
      description,
      sponsor,
      sponsorName,
      sponsorType,
      startDate,
      endDate,
      managerId,
      budgetTotal,
      researchType,
      technologyArea,
      priority,
      status,
    } = data

    // 프로젝트 존재 확인
    const existingProject = await query('SELECT id FROM projects WHERE id = $1', [id])

    if (existingProject.rows.length === 0) {
      return json(
        {
          success: false,
          message: '프로젝트를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    // 프로젝트 코드 중복 확인 (자신 제외)
    if (code) {
      const duplicateCheck = await query('SELECT id FROM projects WHERE code = $1 AND id != $2', [
        code,
        id,
      ])

      if (duplicateCheck.rows.length > 0) {
        return json(
          {
            success: false,
            message: '이미 존재하는 프로젝트 코드입니다.',
          },
          { status: 400 },
        )
      }
    }

    // 업데이트할 필드들 동적 생성
    const updateFields: string[] = []
    const updateValues: (string | number | null)[] = []
    let paramIndex = 1

    const fieldsToUpdate: Record<string, unknown> = {
      code,
      title,
      description,
      sponsor,
      sponsor_name: sponsorName,
      sponsor_type: sponsorType,
      start_date: startDate,
      end_date: endDate,
      manager_id: managerId,
      budget_total: budgetTotal,
      research_type: researchType,
      technology_area: technologyArea,
      priority,
      status,
    }

    Object.entries(fieldsToUpdate).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex++}`)
        updateValues.push(value as string | number | null)
      }
    })

    if (updateFields.length === 0) {
      return json(
        {
          success: false,
          message: '수정할 데이터가 없습니다.',
        },
        { status: 400 },
      )
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
    updateValues.push(id)

    const result = await query(
      `UPDATE projects SET ${updateFields.join(', ')} WHERE id = $${paramIndex} 
       RETURNING id, code, title, description, sponsor, sponsor_type, manager_employee_id,
                 status, budget_total, created_at::text, updated_at::text, sponsor_name,
                 budget_currency, research_type, technology_area, priority,
                 start_date::text, end_date::text`,
      updateValues,
    )

    const _updatedProject = result.rows[0] as Record<string, unknown>

    // 업데이트된 프로젝트 정보와 함께 반환
    const projectWithDetails = await query(
      `
			SELECT
				p.id, p.code, p.title, p.description, p.sponsor, p.sponsor_name, p.sponsor_type,
				p.start_date::text as start_date, p.end_date::text as end_date,
				p.manager_employee_id, p.status, p.budget_total, p.budget_currency,
				p.research_type, p.technology_area, p.priority,
				p.created_at::text as created_at, p.updated_at::text as updated_at,
				e.first_name || ' ' || e.last_name as manager_name,
				COUNT(pm.id) as member_count,
				COALESCE(SUM(pm.participation_rate), 0) as total_participation_rate
			FROM projects p
			LEFT JOIN employees e ON p.manager_employee_id = e.id
			LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.status = 'active'
			WHERE p.id = $1
			GROUP BY p.id, p.code, p.title, p.description, p.sponsor, p.sponsor_name, p.sponsor_type,
			         p.start_date, p.end_date, p.manager_employee_id, p.status, p.budget_total,
			         p.budget_currency, p.research_type, p.technology_area, p.priority,
			         p.created_at, p.updated_at, e.first_name, e.last_name
		`,
      [id],
    )

    // 데이터 변환: snake_case를 camelCase로 변환
    const transformedProject = transformProjectData(
      projectWithDetails.rows[0] as Record<string, unknown>,
    )

    return json({
      success: true,
      data: transformedProject,
      message: '프로젝트가 성공적으로 수정되었습니다.',
    })
  } catch (error) {
    logger.error('프로젝트 수정 실패:', error)
    return json(
      {
        success: false,
        message: '프로젝트 수정에 실패했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 },
    )
  }
}

// 프로젝트 삭제
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { id } = params as Record<string, string>

    // 프로젝트 존재 확인
    const existingProject = await query('SELECT id, status FROM projects WHERE id = $1', [id])

    if (existingProject.rows.length === 0) {
      return json(
        {
          success: false,
          message: '프로젝트를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const _project = existingProject.rows[0] as Record<string, unknown>

    // 프로젝트 삭제 가능 여부 확인 (모든 상태에서 삭제 가능)
    // 프로젝트 삭제 요청 처리

    // 트랜잭션으로 관련 데이터 모두 삭제
    await query('BEGIN')

    try {
      // 1. evidence_items 먼저 삭제 (project_budgets를 참조)
      await query(
        `
				DELETE FROM evidence_items
				WHERE project_budget_id IN (
					SELECT id FROM project_budgets WHERE project_id = $1
				)
			`,
        [id],
      )

      // 2. project_budgets 삭제
      await query('DELETE FROM project_budgets WHERE project_id = $1', [id])

      // 3. 기타 관련 데이터 삭제
      await query('DELETE FROM participation_rate_history WHERE project_id = $1', [id])
      await query('DELETE FROM participation_rates WHERE project_id = $1', [id])
      await query('DELETE FROM project_members WHERE project_id = $1', [id])
      await query('DELETE FROM project_milestones WHERE project_id = $1', [id])
      await query('DELETE FROM project_risks WHERE project_id = $1', [id])

      // 4. rd_projects 테이블에서 삭제 (외래키 제약조건 해결)
      await query('DELETE FROM rd_projects WHERE project_id = $1', [id])

      // 5. 마지막으로 프로젝트 삭제
      await query('DELETE FROM projects WHERE id = $1', [id])

      await query('COMMIT')

      return json({
        success: true,
        message: '프로젝트가 성공적으로 삭제되었습니다.',
      })
    } catch (error) {
      await query('ROLLBACK')
      throw error
    }
  } catch (error) {
    logger.error('프로젝트 삭제 실패:', error)
    return json(
      {
        success: false,
        message: '프로젝트 삭제에 실패했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 },
    )
  }
}
