import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger';

// GET /api/project-management/project-budgets/[id] - 특정 프로젝트 사업비 조회
export const GET: RequestHandler = async ({ params }) => {
  try {
    const result = await query(
      `
			SELECT 
				pb.*,
				p.title as project_title,
				p.code as project_code
			FROM project_budgets pb
			JOIN projects p ON pb.project_id = p.id
			WHERE pb.id = $1
		`,
      [params.id]
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          message: '프로젝트 사업비를 찾을 수 없습니다.'
        },
        { status: 404 }
      )
    }

    return json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    logger.error('프로젝트 사업비 조회 실패:', error)
    return json(
      {
        success: false,
        message: '프로젝트 사업비를 불러오는데 실패했습니다.',
        error: (error as Error).message
      },
      { status: 500 }
    )
  }
}

// PUT /api/project-management/project-budgets/[id] - 프로젝트 사업비 수정
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const data = await request.json()
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
      indirectCostInKind = 0
    } = data

    // 사업비 존재 확인
    const existingBudget = await query('SELECT * FROM project_budgets WHERE id = $1', [params.id])

    if (existingBudget.rows.length === 0) {
      return json(
        {
          success: false,
          message: '프로젝트 사업비를 찾을 수 없습니다.'
        },
        { status: 404 }
      )
    }

    // 각 비목의 총합 계산 (현금 + 현물) - 로직으로 계산하므로 DB에 저장하지 않음
    const personnelCost = personnelCostCash + personnelCostInKind
    const researchMaterialCost = researchMaterialCostCash + researchMaterialCostInKind
    const researchActivityCost = researchActivityCostCash + researchActivityCostInKind
    const researchStipend = researchStipendCash + researchStipendInKind
    const indirectCost = indirectCostCash + indirectCostInKind

    // 사업비 수정
    const result = await query(
      `
			UPDATE project_budgets 
			SET 
				period_number = $1,
				start_date = $2,
				end_date = $3,
				personnel_cost = $4,
				research_material_cost = $5,
				research_activity_cost = $6,
				research_stipend = $7,
				indirect_cost = $8,
				personnel_cost_cash = $9,
				personnel_cost_in_kind = $10,
				research_material_cost_cash = $11,
				research_material_cost_in_kind = $12,
				research_activity_cost_cash = $13,
				research_activity_cost_in_kind = $14,
				research_stipend_cash = $15,
				research_stipend_in_kind = $16,
				indirect_cost_cash = $17,
				indirect_cost_in_kind = $18,
				updated_at = CURRENT_TIMESTAMP
			WHERE id = $19
			RETURNING *
		`,
      [
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
        params.id
      ]
    )

    // 수정된 사업비 정보와 관련 정보 조회
    const budgetWithDetails = await query(
      `
			SELECT 
				pb.*,
				p.title as project_title,
				p.code as project_code
			FROM project_budgets pb
			JOIN projects p ON pb.project_id = p.id
			WHERE pb.id = $1
		`,
      [params.id]
    )

    return json({
      success: true,
      data: budgetWithDetails.rows[0],
      message: '프로젝트 사업비가 성공적으로 수정되었습니다.'
    })
  } catch (error) {
    logger.error('프로젝트 사업비 수정 실패:', error)
    return json(
      {
        success: false,
        message: '프로젝트 사업비 수정에 실패했습니다.',
        error: (error as Error).message
      },
      { status: 500 }
    )
  }
}

// DELETE /api/project-management/project-budgets/[id] - 프로젝트 사업비 삭제
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    // 사업비 존재 확인
    const existingBudget = await query('SELECT * FROM project_budgets WHERE id = $1', [params.id])

    if (existingBudget.rows.length === 0) {
      return json(
        {
          success: false,
          message: '프로젝트 사업비를 찾을 수 없습니다.'
        },
        { status: 404 }
      )
    }

    // 사업비 삭제
    await query('DELETE FROM project_budgets WHERE id = $1', [params.id])

    return json({
      success: true,
      message: '프로젝트 사업비가 성공적으로 삭제되었습니다.'
    })
  } catch (error) {
    logger.error('프로젝트 사업비 삭제 실패:', error)
    return json(
      {
        success: false,
        message: '프로젝트 사업비 삭제에 실패했습니다.',
        error: (error as Error).message
      },
      { status: 500 }
    )
  }
}
