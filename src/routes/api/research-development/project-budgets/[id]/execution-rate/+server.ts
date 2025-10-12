import { query } from '$lib/database/connection'
import { calculateExecutionRates } from '$lib/services/research-development/execution-rate.service'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params

    if (!id) {
      return json({ success: false, error: 'Project budget ID is required' }, { status: 400 })
    }

    // 프로젝트 예산 정보 조회
    const budgetResult = await query(
      `
      SELECT 
        pb.id,
        pb.project_id,
        pb.period_number,
        pb.personnel_cost_cash,
        pb.personnel_cost_in_kind,
        pb.research_material_cost_cash,
        pb.research_material_cost_in_kind,
        pb.research_activity_cost_cash,
        pb.research_activity_cost_in_kind,
        pb.research_stipend_cash,
        pb.research_stipend_in_kind,
        pb.indirect_cost_cash,
        pb.indirect_cost_in_kind,
        pb.start_date::text,
        pb.end_date::text,
        pb.created_at::text,
        pb.updated_at::text,
        p.title as project_title
      FROM project_budgets pb
      JOIN projects p ON pb.project_id = p.id
      WHERE pb.id = $1
      `,
      [id],
    )

    if (budgetResult.rows.length === 0) {
      return json({ success: false, error: 'Project budget not found' }, { status: 404 })
    }

    const budget = budgetResult.rows[0]

    // 집행율 계산
    const executionRates = await calculateExecutionRates(id, budget)

    return json({ success: true, data: executionRates })
  } catch (error: unknown) {
    logger.error('Failed to fetch execution rates:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '집행율 조회에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
