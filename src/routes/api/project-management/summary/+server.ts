// Project Management API - Summary
// 프로젝트 관리 시스템의 요약 정보 API

import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

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
				p.updated_at,
				e.first_name || ' ' || e.last_name as manager_name
			FROM projects p
			LEFT JOIN employees e ON p.manager_id = e.id
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

    const projectStats = projectStatsResult.rows[0]
    const budgetStats = budgetStatsResult.rows[0]
    const memberStats = memberStatsResult.rows[0]
    const overParticipation = overParticipationResult.rows[0]

    const summary = {
      // 기본 통계
      totalProjects: parseInt(projectStats.total_projects) || 0,
      activeProjects: parseInt(projectStats.active_projects) || 0,
      completedProjects: parseInt(projectStats.completed_projects) || 0,
      planningProjects: parseInt(projectStats.planning_projects) || 0,
      cancelledProjects: parseInt(projectStats.cancelled_projects) || 0,
      suspendedProjects: parseInt(projectStats.suspended_projects) || 0,

      // 사업비 통계
      totalBudget: parseFloat(budgetStats.total_budget) || 0,
      currentYearBudget: parseFloat(budgetStats.current_year_budget) || 0,

      // 연구원 통계
      totalMembers: parseInt(memberStats.total_members) || 0,
      activeMembers: parseInt(memberStats.active_members) || 0,
      overParticipationEmployees: parseInt(overParticipation.over_participation_count) || 0,

      // 연차별 사업비
      budgetByYear: budgetByYearResult.rows.map((row) => ({
        fiscalYear: parseInt(row.period_number),
        projectCount: parseInt(row.project_count),
        totalBudget: parseFloat(row.total_budget) || 0,
        personnelCost: parseFloat(row.personnel_cost) || 0,
        researchMaterialCost: parseFloat(row.research_material_cost) || 0,
        researchActivityCost: parseFloat(row.research_activity_cost) || 0,
        indirectCost: parseFloat(row.indirect_cost) || 0,
        spentAmount: parseFloat(row.spent_amount) || 0,
      })),

      // 최근 활동
      recentActivities: recentActivitiesResult.rows.map((row) => ({
        id: row.id,
        code: row.code,
        title: row.title,
        status: row.status,
        updatedAt: row.updated_at,
        managerName: row.manager_name,
      })),

      // 분포 통계
      statusDistribution: statusDistributionResult.rows.map((row) => ({
        status: row.status,
        count: parseInt(row.count),
        percentage: parseFloat(row.percentage),
      })),

      sponsorTypeDistribution: sponsorTypeDistributionResult.rows.map((row) => ({
        sponsorType: row.sponsor_type,
        count: parseInt(row.count),
        percentage: parseFloat(row.percentage),
      })),

      priorityDistribution: priorityDistributionResult.rows.map((row) => ({
        priority: row.priority,
        count: parseInt(row.count),
        percentage: parseFloat(row.percentage),
      })),

      // 마일스톤 통계
      milestoneStats: {
        totalMilestones: parseInt(milestoneStatsResult.rows[0]?.total_milestones) || 0,
        completedMilestones: parseInt(milestoneStatsResult.rows[0]?.completed_milestones) || 0,
        overdueMilestones: parseInt(milestoneStatsResult.rows[0]?.overdue_milestones) || 0,
        upcomingMilestones: parseInt(milestoneStatsResult.rows[0]?.upcoming_milestones) || 0,
      },

      // 위험 요소 통계
      riskStats: {
        totalRisks: parseInt(riskStatsResult.rows[0]?.total_risks) || 0,
        openRisks: parseInt(riskStatsResult.rows[0]?.open_risks) || 0,
        mitigatedRisks: parseInt(riskStatsResult.rows[0]?.mitigated_risks) || 0,
        closedRisks: parseInt(riskStatsResult.rows[0]?.closed_risks) || 0,
        criticalRisks: parseInt(riskStatsResult.rows[0]?.critical_risks) || 0,
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
