import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/research-development/project-budgets/[id] - 특정 프로젝트 사업비 조회
export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params as Record<string, string>
    const result = await query(
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
      [id],
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          message: '프로젝트 사업비를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    return json({
      success: true,
      data: result.rows[0] as Record<string, unknown>,
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

// PUT /api/research-development/project-budgets/[id] - 프로젝트 사업비 수정
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params as Record<string, string>
    const data = (await request.json()) as Record<string, unknown>
    const {
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

    // 사업비 존재 확인
    const existingBudget = await query('SELECT id FROM project_budgets WHERE id = $1', [id])

    if (existingBudget.rows.length === 0) {
      return json(
        {
          success: false,
          message: '프로젝트 사업비를 찾을 수 없습니다.',
        },
        { status: 404 },
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

    // 사업비 수정 (period_number는 변경하지 않음)
    const _result = await query(
      `
			UPDATE project_budgets
			SET
				start_date = $1,
				end_date = $2,
				personnel_cost = $3,
				research_material_cost = $4,
				research_activity_cost = $5,
				research_stipend = $6,
				indirect_cost = $7,
				personnel_cost_cash = $8,
				personnel_cost_in_kind = $9,
				research_material_cost_cash = $10,
				research_material_cost_in_kind = $11,
				research_activity_cost_cash = $12,
				research_activity_cost_in_kind = $13,
				research_stipend_cash = $14,
				research_stipend_in_kind = $15,
				indirect_cost_cash = $16,
				indirect_cost_in_kind = $17,
				updated_at = CURRENT_TIMESTAMP
			WHERE id = $18
			RETURNING id, project_id, personnel_cost, research_material_cost, research_activity_cost,
			          indirect_cost, created_at::text, updated_at::text, personnel_cost_cash,
			          personnel_cost_in_kind, research_material_cost_cash, research_material_cost_in_kind,
			          research_activity_cost_cash, research_activity_cost_in_kind, indirect_cost_cash,
			          indirect_cost_in_kind, period_number, start_date::text, end_date::text,
			          government_funding_amount, company_cash_amount, company_in_kind_amount,
			          research_stipend, research_stipend_cash, research_stipend_in_kind
		`,
      [
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
        id,
      ],
    )

    // 수정된 사업비 정보와 관련 정보 조회
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
      [id],
    )

    return json({
      success: true,
      data: budgetWithDetails.rows[0] as Record<string, unknown>,
      message: '프로젝트 사업비가 성공적으로 수정되었습니다.',
    })
  } catch (error) {
    logger.error('프로젝트 사업비 수정 실패:', error)
    return json(
      {
        success: false,
        message: '프로젝트 사업비 수정에 실패했습니다.',
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

// DELETE /api/research-development/project-budgets/[id] - 프로젝트 사업비 삭제
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { id } = params as Record<string, string>
    // 사업비 존재 확인
    const existingBudget = await query('SELECT id FROM project_budgets WHERE id = $1', [id])

    if (existingBudget.rows.length === 0) {
      return json(
        {
          success: false,
          message: '프로젝트 사업비를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    // 사업비 삭제
    await query('DELETE FROM project_budgets WHERE id = $1', [id])

    return json({
      success: true,
      message: '프로젝트 사업비가 성공적으로 삭제되었습니다.',
    })
  } catch (error) {
    logger.error('프로젝트 사업비 삭제 실패:', error)
    return json(
      {
        success: false,
        message: '프로젝트 사업비 삭제에 실패했습니다.',
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
