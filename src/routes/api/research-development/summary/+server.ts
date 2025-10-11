// Project Management API - Summary
// 프로젝트 관리 시스템의 요약 정보 API

import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async () => {
  try {
    // 현재 연도
    const currentYear = new Date().getFullYear()

    // 기본 프로젝트 통계
    const projectStatsResult = await query(`
			SELECT
				COUNT(*) as total_projects,
				COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects,
				COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
				COUNT(CASE WHEN status = 'planning' THEN 1 END) as planning_projects,
				COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_projects,
				COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_projects
			FROM projects
		`)

    // 총 사업비 통계
    const budgetStatsResult = await query(
      `
			SELECT
				COALESCE(SUM(budget_total), 0) as total_budget,
				COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM start_date) = $1 THEN budget_total ELSE 0 END), 0) as current_year_budget
			FROM projects
			WHERE budget_total IS NOT NULL
		`,
      [currentYear],
    )

    // 참여 연구원 수
    const memberStatsResult = await query(`
			SELECT
				COUNT(DISTINCT pm.employee_id) as total_members,
				COUNT(DISTINCT CASE WHEN pm.status = 'active' THEN pm.employee_id END) as active_members
			FROM project_members pm
			JOIN employees e ON pm.employee_id = e.id
			WHERE e.status = 'active'
		`)

    // 참여율 초과 직원 수
    const overParticipationResult = await query(`
			SELECT COUNT(*) as over_participation_count
			FROM (
				SELECT
					pr.employee_id,
					SUM(pr.participation_rate) as total_rate
				FROM participation_rates pr
				WHERE pr.status = 'active'
				GROUP BY pr.employee_id
				HAVING SUM(pr.participation_rate) > 100
			) over_employees
		`)

    // 연차별 사업비 현황
    const budgetByYearResult = await query(`
			SELECT
				period_number,
				COUNT(project_id) as project_count,
				SUM(COALESCE(government_funding_amount, 0) + COALESCE(company_cash_amount, 0) + COALESCE(company_in_kind_amount, 0)) as total_budget,
				SUM(COALESCE(personnel_cost_cash, 0) + COALESCE(personnel_cost_in_kind, 0)) as personnel_cost,
				SUM(COALESCE(research_material_cost_cash, 0) + COALESCE(research_material_cost_in_kind, 0)) as research_material_cost,
				SUM(COALESCE(research_activity_cost_cash, 0) + COALESCE(research_activity_cost_in_kind, 0)) as research_activity_cost,
				SUM(COALESCE(indirect_cost_cash, 0) + COALESCE(indirect_cost_in_kind, 0)) as indirect_cost,
				0 as spent_amount
			FROM project_budgets
			GROUP BY period_number
			ORDER BY period_number DESC
			LIMIT 5
		`)

    // 최근 프로젝트 활동
    const recentActivitiesResult = await query(`
			SELECT
				p.id,
				p.code,
				p.title,
				p.status,
				p.updated_at::text as updated_at,
				e.first_name || ' ' || e.last_name as manager_name
			FROM projects p
			LEFT JOIN employees e ON p.manager_employee_id = e.id
			ORDER BY p.updated_at DESC
			LIMIT 10
		`)

    // 프로젝트 상태별 분포
    const statusDistributionResult = await query(`
			SELECT
				status,
				COUNT(*) as count,
				ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
			FROM projects
			GROUP BY status
			ORDER BY count DESC
		`)

    // 스폰서 유형별 분포
    const sponsorTypeDistributionResult = await query(`
			SELECT
				sponsor_type,
				COUNT(*) as count,
				ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
			FROM projects
			WHERE sponsor_type IS NOT NULL
			GROUP BY sponsor_type
			ORDER BY count DESC
		`)

    // 우선순위별 분포
    const priorityDistributionResult = await query(`
			SELECT
				priority,
				COUNT(*) as count,
				ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
			FROM projects
			WHERE priority IS NOT NULL
			GROUP BY priority
			ORDER BY count DESC
		`)

    // 마일스톤 현황
    const milestoneStatsResult = await query(`
			SELECT
				COUNT(*) as total_milestones,
				COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_milestones,
				COUNT(CASE WHEN status = 'pending' AND milestone_date < CURRENT_DATE THEN 1 END) as overdue_milestones,
				COUNT(CASE WHEN status = 'pending' AND milestone_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as upcoming_milestones
			FROM project_milestones
		`)

    // 위험 요소 현황
    const riskStatsResult = await query(`
			SELECT
				COUNT(*) as total_risks,
				COUNT(CASE WHEN status = 'open' THEN 1 END) as open_risks,
				COUNT(CASE WHEN status = 'mitigated' THEN 1 END) as mitigated_risks,
				COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_risks,
				COUNT(CASE WHEN probability = 'high' AND impact = 'high' THEN 1 END) as critical_risks
			FROM project_risks
		`)

    const projectStats = projectStatsResult.rows[0] as Record<string, unknown>
    const budgetStats = budgetStatsResult.rows[0] as Record<string, unknown>
    const memberStats = memberStatsResult.rows[0] as Record<string, unknown>
    const overParticipation = overParticipationResult.rows[0] as Record<string, unknown>

    const summary = {
      // 기본 통계
      totalProjects: parseInt(String(projectStats.total_projects || 0)) || 0,
      activeProjects: parseInt(String(projectStats.active_projects || 0)) || 0,
      completedProjects: parseInt(String(projectStats.completed_projects || 0)) || 0,
      planningProjects: parseInt(String(projectStats.planning_projects || 0)) || 0,
      cancelledProjects: parseInt(String(projectStats.cancelled_projects || 0)) || 0,
      suspendedProjects: parseInt(String(projectStats.suspended_projects || 0)) || 0,

      // 사업비 통계
      totalBudget: parseFloat(String(budgetStats.total_budget || 0)) || 0,
      currentYearBudget: parseFloat(String(budgetStats.current_year_budget || 0)) || 0,

      // 연구원 통계
      totalMembers: parseInt(String(memberStats.total_members || 0)) || 0,
      activeMembers: parseInt(String(memberStats.active_members || 0)) || 0,
      overParticipationEmployees:
        parseInt(String(overParticipation.over_participation_count || 0)) || 0,

      // 연차별 사업비
      budgetByYear: budgetByYearResult.rows.map((row: Record<string, unknown>) => ({
        fiscalYear: parseInt(String(row.period_number || 0)) || 0,
        projectCount: parseInt(String(row.project_count || 0)) || 0,
        totalBudget: parseFloat(String(row.total_budget || 0)) || 0,
        personnelCost: parseFloat(String(row.personnel_cost || 0)) || 0,
        researchMaterialCost: parseFloat(String(row.research_material_cost || 0)) || 0,
        researchActivityCost: parseFloat(String(row.research_activity_cost || 0)) || 0,
        indirectCost: parseFloat(String(row.indirect_cost || 0)) || 0,
        spentAmount: parseFloat(String(row.spent_amount || 0)) || 0,
      })),

      // 최근 활동
      recentActivities: recentActivitiesResult.rows.map((row: Record<string, unknown>) => ({
        id: row.id,
        code: row.code,
        title: row.title,
        status: row.status,
        updatedAt: row.updated_at,
        managerName: row.manager_name,
      })),

      // 분포 통계
      statusDistribution: statusDistributionResult.rows.map((row: Record<string, unknown>) => ({
        status: row.status,
        count: parseInt(String(row.count || 0)) || 0,
        percentage: parseFloat(String(row.percentage || 0)) || 0,
      })),

      sponsorTypeDistribution: sponsorTypeDistributionResult.rows.map(
        (row: Record<string, unknown>) => ({
          sponsorType: row.sponsor_type,
          count: parseInt(String(row.count || 0)) || 0,
          percentage: parseFloat(String(row.percentage || 0)) || 0,
        }),
      ),

      priorityDistribution: priorityDistributionResult.rows.map((row: Record<string, unknown>) => ({
        priority: row.priority,
        count: parseInt(String(row.count || 0)) || 0,
        percentage: parseFloat(String(row.percentage || 0)) || 0,
      })),

      // 마일스톤 통계
      milestoneStats: {
        totalMilestones:
          parseInt(
            String(
              (milestoneStatsResult.rows[0] as Record<string, unknown>)?.total_milestones || 0,
            ),
          ) || 0,
        completedMilestones:
          parseInt(
            String(
              (milestoneStatsResult.rows[0] as Record<string, unknown>)?.completed_milestones || 0,
            ),
          ) || 0,
        overdueMilestones:
          parseInt(
            String(
              (milestoneStatsResult.rows[0] as Record<string, unknown>)?.overdue_milestones || 0,
            ),
          ) || 0,
        upcomingMilestones:
          parseInt(
            String(
              (milestoneStatsResult.rows[0] as Record<string, unknown>)?.upcoming_milestones || 0,
            ),
          ) || 0,
      },

      // 위험 요소 통계
      riskStats: {
        totalRisks:
          parseInt(
            String((riskStatsResult.rows[0] as Record<string, unknown>)?.total_risks || 0),
          ) || 0,
        openRisks:
          parseInt(String((riskStatsResult.rows[0] as Record<string, unknown>)?.open_risks || 0)) ||
          0,
        mitigatedRisks:
          parseInt(
            String((riskStatsResult.rows[0] as Record<string, unknown>)?.mitigated_risks || 0),
          ) || 0,
        closedRisks:
          parseInt(
            String((riskStatsResult.rows[0] as Record<string, unknown>)?.closed_risks || 0),
          ) || 0,
        criticalRisks:
          parseInt(
            String((riskStatsResult.rows[0] as Record<string, unknown>)?.critical_risks || 0),
          ) || 0,
      },
    }

    return json({
      success: true,
      data: summary,
    })
  } catch (error) {
    logger.error('프로젝트 요약 정보 조회 실패:', error)
    return json(
      {
        success: false,
        message: '프로젝트 요약 정보를 불러오는데 실패했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 },
    )
  }
}
