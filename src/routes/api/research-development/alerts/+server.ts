import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/research-development/alerts - 프로젝트 관리 알림 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const type = url.searchParams.get('type') // 'budget', 'participation', 'milestone', 'all'

    let sqlQuery = `
			WITH budget_alerts AS (
				SELECT 
					p.id as project_id,
					p.title as project_title,
					pb.period_number::integer as fiscal_year,
					(COALESCE(pb.government_funding_amount, 0) + COALESCE(pb.company_cash_amount, 0) + COALESCE(pb.company_in_kind_amount, 0))::decimal as total_budget,
					0::decimal as spent_amount,
					0::decimal as usage_percentage,
					'info' as severity,
					'budget' as alert_type,
					'예산 사용률 0%' as message,
					pb.updated_at::text as created_at
				FROM projects p
				JOIN project_budgets pb ON p.id = pb.project_id
				WHERE (COALESCE(pb.government_funding_amount, 0) + COALESCE(pb.company_cash_amount, 0) + COALESCE(pb.company_in_kind_amount, 0)) > 0
			),
			participation_alerts AS (
				SELECT 
					NULL::uuid as project_id,
					CONCAT(e.first_name, ' ', e.last_name) as project_title,
					NULL::integer as fiscal_year,
					NULL::decimal as total_budget,
					NULL::decimal as spent_amount,
					NULL::decimal as usage_percentage,
					CASE 
						WHEN pr.total_participation > 100 THEN 'critical'
						WHEN pr.total_participation > 90 THEN 'warning'
						ELSE 'info'
					END as severity,
					'participation' as alert_type,
					'참여율 ' || pr.total_participation || '% (한계 초과)' as message,
					pr.updated_at::text as created_at
				FROM employees e
				JOIN (
					SELECT 
						pm.employee_id,
						SUM(pm.participation_rate) as total_participation,
						MAX(pm.updated_at) as updated_at
					FROM project_members pm
					WHERE pm.status = 'active'
					GROUP BY pm.employee_id
					HAVING SUM(pm.participation_rate) > 90
				) pr ON e.id = pr.employee_id
			),
			deadline_alerts AS (
				SELECT 
					p.id as project_id,
					p.title as project_title,
					EXTRACT(YEAR FROM p.calculated_end_date)::integer as fiscal_year,
					NULL::decimal as total_budget,
					NULL::decimal as spent_amount,
					NULL::decimal as usage_percentage,
					CASE 
						WHEN p.calculated_end_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'critical'
						WHEN p.calculated_end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'warning'
						ELSE 'info'
					END as severity,
					'deadline' as alert_type,
					'프로젝트 종료 예정일: ' || p.calculated_end_date::text as message,
					p.updated_at::text as created_at
				FROM v_projects_with_dates p
				WHERE p.status = 'active'
				AND p.calculated_end_date IS NOT NULL
				AND p.calculated_end_date <= CURRENT_DATE + INTERVAL '30 days'
			)
			SELECT 'budget' as alert_type, id, project_id, message, severity, created_at::text as created_at FROM budget_alerts
			UNION ALL
			SELECT 'participation' as alert_type, id, project_id, message, severity, created_at::text as created_at FROM participation_alerts
			UNION ALL
			SELECT 'deadline' as alert_type, id, project_id, message, severity, created_at::text as created_at FROM deadline_alerts
		`

    const params: unknown[] = []
    if (type && type !== 'all') {
      sqlQuery += ` WHERE alert_type = $1`
      params.push(type)
    }

    sqlQuery += ` ORDER BY severity DESC, created_at DESC LIMIT $${params.length + 1}`
    params.push(limit)

    const result = await query(sqlQuery, params)

    return json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    logger.error('프로젝트 관리 알림 조회 실패:', error)
    return json(
      {
        success: false,
        message: '알림을 불러오는데 실패했습니다.',
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
