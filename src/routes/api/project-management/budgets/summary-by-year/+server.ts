import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger';

// GET /api/project-management/budgets/summary-by-year - 연도별 예산 요약 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const currentYear = new Date().getFullYear()
    const yearFrom = url.searchParams.get('yearFrom') || (currentYear - 2).toString()
    const yearTo = url.searchParams.get('yearTo') || currentYear.toString()

    const sqlQuery = `
			SELECT 
				pb.fiscal_year,
				COUNT(DISTINCT pb.project_id) as project_count,
				-- 총 예산 (현금 + 현물)
				COALESCE(SUM(
					COALESCE(pb.personnel_cost_cash, 0) + COALESCE(pb.personnel_cost_in_kind, 0) +
					COALESCE(pb.research_material_cost_cash, 0) + COALESCE(pb.research_material_cost_in_kind, 0) +
					COALESCE(pb.research_activity_cost_cash, 0) + COALESCE(pb.research_activity_cost_in_kind, 0) +
					COALESCE(pb.indirect_cost_cash, 0) + COALESCE(pb.indirect_cost_in_kind, 0)
				), 0) as total_budget,
				-- 현금 예산
				COALESCE(SUM(
					COALESCE(pb.personnel_cost_cash, 0) + COALESCE(pb.research_material_cost_cash, 0) +
					COALESCE(pb.research_activity_cost_cash, 0) + COALESCE(pb.indirect_cost_cash, 0)
				), 0) as cash_budget,
				-- 현물 예산
				COALESCE(SUM(
					COALESCE(pb.personnel_cost_in_kind, 0) + COALESCE(pb.research_material_cost_in_kind, 0) +
					COALESCE(pb.research_activity_cost_in_kind, 0) + COALESCE(pb.indirect_cost_in_kind, 0)
				), 0) as in_kind_budget,
				-- 인건비 (현금 + 현물)
				COALESCE(SUM(COALESCE(pb.personnel_cost_cash, 0) + COALESCE(pb.personnel_cost_in_kind, 0)), 0) as personnel_cost,
				-- 연구재료비 (현금 + 현물)
				COALESCE(SUM(COALESCE(pb.research_material_cost_cash, 0) + COALESCE(pb.research_material_cost_in_kind, 0)), 0) as research_material_cost,
				-- 연구활동비 (현금 + 현물)
				COALESCE(SUM(COALESCE(pb.research_activity_cost_cash, 0) + COALESCE(pb.research_activity_cost_in_kind, 0)), 0) as research_activity_cost,
				-- 간접비 (현금 + 현물)
				COALESCE(SUM(COALESCE(pb.indirect_cost_cash, 0) + COALESCE(pb.indirect_cost_in_kind, 0)), 0) as indirect_cost,
				-- 사용금액
				COALESCE(SUM(pb.spent_amount), 0) as spent_amount,
				-- 잔여예산
				COALESCE(SUM(
					(COALESCE(pb.personnel_cost_cash, 0) + COALESCE(pb.personnel_cost_in_kind, 0) +
					 COALESCE(pb.research_material_cost_cash, 0) + COALESCE(pb.research_material_cost_in_kind, 0) +
					 COALESCE(pb.research_activity_cost_cash, 0) + COALESCE(pb.research_activity_cost_in_kind, 0) +
					 COALESCE(pb.indirect_cost_cash, 0) + COALESCE(pb.indirect_cost_in_kind, 0)) - COALESCE(pb.spent_amount, 0)
				), 0) as remaining_budget
			FROM project_budgets pb
			WHERE pb.fiscal_year BETWEEN $1 AND $2
			GROUP BY pb.fiscal_year
			ORDER BY pb.fiscal_year DESC
		`

    const result = await query(sqlQuery, [parseInt(yearFrom), parseInt(yearTo)])

    return json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    logger.error('연도별 예산 요약 조회 실패:', error)
    return json(
      {
        success: false,
        message: '연도별 예산 요약을 불러오는데 실패했습니다.',
        error: (error as Error).message
      },
      { status: 500 }
    )
  }
}
