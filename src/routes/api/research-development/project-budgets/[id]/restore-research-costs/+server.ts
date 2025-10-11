import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// POST /api/research-development/project-budgets/[id]/restore-research-costs - 연구개발비 복구
export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params as Record<string, string>
    const data = (await request.json()) as Record<string, unknown>
    const {
      // 복구할 연구개발비 데이터
      personnelCostCash = 0,
      personnelCostInKind = 0,
      researchMaterialCostCash = 0,
      researchMaterialCostInKind = 0,
      researchActivityCostCash = 0,
      researchActivityCostInKind = 0,
      researchStipendCash = 0,
      researchStipendInKind = 0,
      indirectCostCash = 0,
      indirectCostInKind = 0,
      // 복구 사유
      restoreReason = '사용자 요청에 의한 연구개발비 복구',
    } = data

    // 기존 예산 정보 조회
    const existingBudget = await query('SELECT * FROM project_budgets WHERE id = $1', [id])

    if (existingBudget.rows.length === 0) {
      return json(
        {
          success: false,
          message: '프로젝트 사업비를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const _existing = existingBudget.rows[0] as Record<string, unknown>

    // 연구개발비 복구 (현금 + 현물)
    const personnelCost = Number(personnelCostCash || 0) + Number(personnelCostInKind || 0)
    const researchMaterialCost =
      Number(researchMaterialCostCash || 0) + Number(researchMaterialCostInKind || 0)
    const researchActivityCost =
      Number(researchActivityCostCash || 0) + Number(researchActivityCostInKind || 0)
    const researchStipend = Number(researchStipendCash || 0) + Number(researchStipendInKind || 0)
    const indirectCost = Number(indirectCostCash || 0) + Number(indirectCostInKind || 0)

    // 총 예산 재계산
    const totalBudget =
      personnelCost + researchMaterialCost + researchActivityCost + researchStipend + indirectCost

    // 연구개발비 복구 실행
    const result = await query(
      `
			UPDATE project_budgets
			SET
				personnel_cost = $1,
				research_material_cost = $2,
				research_activity_cost = $3,
				research_stipend = $4,
				indirect_cost = $5,
				total_budget = $6,
				personnel_cost_cash = $7,
				personnel_cost_in_kind = $8,
				research_material_cost_cash = $9,
				research_material_cost_in_kind = $10,
				research_activity_cost_cash = $11,
				research_activity_cost_in_kind = $12,
				research_stipend_cash = $13,
				research_stipend_in_kind = $14,
				indirect_cost_cash = $15,
				indirect_cost_in_kind = $16,
				updated_at = CURRENT_TIMESTAMP
			WHERE id = $17
			RETURNING id, project_id, personnel_cost, research_material_cost, research_activity_cost,
			          indirect_cost, created_at::text, updated_at::text, personnel_cost_cash,
			          personnel_cost_in_kind, research_material_cost_cash, research_material_cost_in_kind,
			          research_activity_cost_cash, research_activity_cost_in_kind, indirect_cost_cash,
			          indirect_cost_in_kind, period_number, start_date::text, end_date::text,
			          government_funding_amount, company_cash_amount, company_in_kind_amount,
			          research_stipend, research_stipend_cash, research_stipend_in_kind
		`,
      [
        personnelCost,
        researchMaterialCost,
        researchActivityCost,
        researchStipend,
        indirectCost,
        totalBudget,
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

    // 복구 이력 기록
    await query(
      `
			INSERT INTO budget_restore_history (
				budget_id, restore_reason, restored_by, restored_at,
				personnel_cost, research_material_cost, research_activity_cost,
				research_stipend, indirect_cost, total_budget
			) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9)
		`,
      [
        id,
        restoreReason,
        'system', // 복구한 사용자 (실제로는 세션에서 가져와야 함)
        personnelCost,
        researchMaterialCost,
        researchActivityCost,
        researchStipend,
        indirectCost,
        totalBudget,
      ],
    )

    const updatedBudget = result.rows[0] as Record<string, unknown>

    logger.log(
      `✅ 연구개발비 복구 완료 - Budget ID: ${id}, 총 예산: ${totalBudget.toLocaleString()}원`,
    )

    return json({
      success: true,
      data: updatedBudget,
      message: `연구개발비가 성공적으로 복구되었습니다. 총 예산: ${totalBudget.toLocaleString()}원`,
    })
  } catch (error) {
    logger.error('연구개발비 복구 실패:', error)
    return json(
      {
        success: false,
        message: '연구개발비 복구에 실패했습니다.',
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

// GET /api/research-development/project-budgets/[id]/restore-history - 복구 이력 조회
export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params as Record<string, string>

    const result = await query(
      `
			SELECT 
				brh.*,
				pb.period_number,
				p.title as project_title,
				p.code as project_code
			FROM budget_restore_history brh
			JOIN project_budgets pb ON brh.budget_id = pb.id
			JOIN projects p ON pb.project_id = p.id
			WHERE brh.budget_id = $1
			ORDER BY brh.restored_at DESC
		`,
      [id],
    )

    return json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    logger.error('복구 이력 조회 실패:', error)
    return json(
      {
        success: false,
        message: '복구 이력을 불러오는데 실패했습니다.',
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
