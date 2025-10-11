import { query } from '$lib/database/connection'
import { transformArrayData, transformProjectBudgetData } from '$lib/utils/api-data-transformer'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/research-development/project-budgets - 프로젝트 사업비 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('projectId')
    const _budgetCategoryId = url.searchParams.get('budgetCategoryId')

    let sqlQuery = `
			SELECT
				pb.id, pb.project_id, pb.period_number,
				pb.start_date::text as start_date, pb.end_date::text as end_date,
				pb.personnel_cost, pb.research_material_cost, pb.research_activity_cost,
				pb.research_stipend, pb.indirect_cost,
				pb.personnel_cost_cash, pb.personnel_cost_in_kind,
				pb.research_material_cost_cash, pb.research_material_cost_in_kind,
				pb.research_activity_cost_cash, pb.research_activity_cost_in_kind,
				pb.research_stipend_cash, pb.research_stipend_in_kind,
				pb.indirect_cost_cash, pb.indirect_cost_in_kind,
				pb.government_funding_amount, pb.company_cash_amount, pb.company_in_kind_amount,
				pb.created_at::text as created_at, pb.updated_at::text as updated_at,
				p.title as project_title,
				p.code as project_code
			FROM project_budgets pb
			JOIN projects p ON pb.project_id = p.id
			WHERE 1=1
		`

    const params: unknown[] = []
    let paramIndex = 1

    if (projectId) {
      sqlQuery += ` AND pb.project_id = $${paramIndex}`
      params.push(projectId)
      paramIndex++
    }

    sqlQuery += ` ORDER BY pb.period_number ASC, pb.created_at ASC`

    const result = await query(sqlQuery, params)

    // 데이터 변환: snake_case를 camelCase로 변환
    const transformedData = transformArrayData(
      result.rows as Record<string, unknown>[],
      transformProjectBudgetData,
    )

    return json({
      success: true,
      data: transformedData,
    })
  } catch (error) {
    logger.error('프로젝트 사업비 조회 실패:', error)
    return json(
      {
        success: false,
        message: '프로젝트 사업비를 불러오는데 실패했습니다.',
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

// POST /api/research-development/project-budgets - 프로젝트 사업비 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = (await request.json()) as Record<string, unknown>
    const {
      projectId,
      periodNumber = 1,
      startDate,
      endDate,
      // 현금 비목들
      personnelCostCash = 0,
      researchMaterialCostCash = 0,
      researchActivityCostCash = 0,
      researchStipendCash = 0,
      indirectCostCash = 0,
      // 현물 비목들
      personnelCostInKind = 0,
      researchMaterialCostInKind = 0,
      researchActivityCostInKind = 0,
      researchStipendInKind = 0,
      indirectCostInKind = 0,
    } = data

    // 필수 필드 검증
    if (!projectId) {
      return json(
        {
          success: false,
          message: '필수 필드가 누락되었습니다.',
        },
        { status: 400 },
      )
    }

    // 중복 검사
    const existingBudget = await query(
      'SELECT id FROM project_budgets WHERE project_id = $1 AND period_number = $2',
      [projectId, periodNumber],
    )

    if (existingBudget.rows.length > 0) {
      return json(
        {
          success: false,
          message: '해당 연차에 대한 예산이 이미 존재합니다.',
        },
        { status: 400 },
      )
    }

    // 각 비목의 총합 계산 (현금 + 현물) - 로직으로 계산하므로 DB에 저장하지 않음
    const personnelCost = Number(personnelCostCash || 0) + Number(personnelCostInKind || 0)
    const researchMaterialCost =
      Number(researchMaterialCostCash || 0) + Number(researchMaterialCostInKind || 0)
    const researchActivityCost =
      Number(researchActivityCostCash || 0) + Number(researchActivityCostInKind || 0)
    const researchStipend = Number(researchStipendCash || 0) + Number(researchStipendInKind || 0)
    const indirectCost = Number(indirectCostCash || 0) + Number(indirectCostInKind || 0)

    // 사업비 생성
    const result = await query(
      `
			INSERT INTO project_budgets (
				project_id, period_number, start_date, end_date,
				personnel_cost, research_material_cost, research_activity_cost, research_stipend, indirect_cost,
				personnel_cost_cash, personnel_cost_in_kind,
				research_material_cost_cash, research_material_cost_in_kind,
				research_activity_cost_cash, research_activity_cost_in_kind,
				research_stipend_cash, research_stipend_in_kind,
				indirect_cost_cash, indirect_cost_in_kind
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
			RETURNING id, project_id, personnel_cost, research_material_cost, research_activity_cost,
			          indirect_cost, created_at::text, updated_at::text, personnel_cost_cash,
			          personnel_cost_in_kind, research_material_cost_cash, research_material_cost_in_kind,
			          research_activity_cost_cash, research_activity_cost_in_kind, indirect_cost_cash,
			          indirect_cost_in_kind, period_number, start_date::text, end_date::text,
			          government_funding_amount, company_cash_amount, company_in_kind_amount,
			          research_stipend, research_stipend_cash, research_stipend_in_kind
		`,
      [
        projectId,
        periodNumber,
        startDate,
        endDate,
        personnelCost,
        researchMaterialCost,
        researchActivityCost,
        researchStipend,
        indirectCost,
        personnelCostCash,
        personnelCostInKind,
        researchMaterialCostCash,
        researchMaterialCostInKind,
        researchActivityCostCash,
        researchActivityCostInKind,
        researchStipendCash,
        researchStipendInKind,
        indirectCostCash,
        indirectCostInKind,
      ],
    )

    // 생성된 사업비 정보와 관련 정보 조회
    const budgetWithDetails = await query(
      `
			SELECT
				pb.id, pb.project_id, pb.period_number,
				pb.start_date::text as start_date, pb.end_date::text as end_date,
				pb.personnel_cost, pb.research_material_cost, pb.research_activity_cost,
				pb.research_stipend, pb.indirect_cost,
				pb.personnel_cost_cash, pb.personnel_cost_in_kind,
				pb.research_material_cost_cash, pb.research_material_cost_in_kind,
				pb.research_activity_cost_cash, pb.research_activity_cost_in_kind,
				pb.research_stipend_cash, pb.research_stipend_in_kind,
				pb.indirect_cost_cash, pb.indirect_cost_in_kind,
				pb.government_funding_amount, pb.company_cash_amount, pb.company_in_kind_amount,
				pb.created_at::text as created_at, pb.updated_at::text as updated_at,
				p.title as project_title,
				p.code as project_code
			FROM project_budgets pb
			JOIN projects p ON pb.project_id = p.id
			WHERE pb.id = $1
		`,
      [String((result.rows[0] as Record<string, unknown>).id || '')],
    )

    return json({
      success: true,
      data: budgetWithDetails.rows[0] as Record<string, unknown>,
      message: '프로젝트 사업비가 성공적으로 생성되었습니다.',
    })
  } catch (error) {
    logger.error('프로젝트 사업비 생성 실패:', error)
    return json(
      {
        success: false,
        message: '프로젝트 사업비 생성에 실패했습니다.',
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
