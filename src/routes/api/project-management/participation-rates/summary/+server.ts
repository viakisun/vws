// Project Management API - Participation Rates Summary
// 개인별 참여율 요약 API

import { json } from '@sveltejs/kit';
import { query } from '$lib/database/connection';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		// 개인별 참여율 요약 조회
		const summaryResult = await query(`
			SELECT 
				e.id as employee_id,
				e.first_name || ' ' || e.last_name as employee_name,
				e.department,
				e.position,
				COUNT(pr.project_id) as active_projects,
				COALESCE(SUM(CASE WHEN pr.status = 'active' THEN pr.participation_rate ELSE 0 END), 0) as total_participation_rate,
				CASE 
					WHEN COALESCE(SUM(CASE WHEN pr.status = 'active' THEN pr.participation_rate ELSE 0 END), 0) > 100 THEN 'OVER_LIMIT'
					WHEN COALESCE(SUM(CASE WHEN pr.status = 'active' THEN pr.participation_rate ELSE 0 END), 0) = 100 THEN 'FULL'
					ELSE 'AVAILABLE'
				END as participation_status
			FROM employees e
			LEFT JOIN participation_rates pr ON e.id = pr.employee_id
			WHERE e.status = 'active'
			GROUP BY e.id, e.first_name, e.last_name, e.department, e.position
			ORDER BY e.first_name, e.last_name
		`);

		// 각 직원의 프로젝트별 참여율 상세 정보
		const projectDetailsResult = await query(`
			SELECT 
				pr.employee_id,
				pr.project_id,
				p.title as project_name,
				p.code as project_code,
				pr.participation_rate,
				pm.role,
				pr.status
			FROM participation_rates pr
			JOIN projects p ON pr.project_id = p.id
			LEFT JOIN project_members pm ON pr.project_id = pm.project_id AND pr.employee_id = pm.employee_id
			WHERE pr.status = 'active'
			ORDER BY pr.employee_id, pr.participation_rate DESC
		`);

		// 프로젝트별 정보를 직원별로 그룹화
		const projectDetailsMap = new Map();
		projectDetailsResult.rows.forEach(row => {
			if (!projectDetailsMap.has(row.employee_id)) {
				projectDetailsMap.set(row.employee_id, []);
			}
			projectDetailsMap.get(row.employee_id).push({
				projectId: row.project_id,
				projectName: row.project_name,
				projectCode: row.project_code,
				participationRate: row.participation_rate,
				role: row.role,
				status: row.status
			});
		});

		// 요약 데이터에 프로젝트 상세 정보 추가
		const summary = summaryResult.rows.map(row => ({
			employeeId: row.employee_id,
			employeeName: row.employee_name,
			department: row.department,
			position: row.position,
			activeProjects: parseInt(row.active_projects),
			totalParticipationRate: parseInt(row.total_participation_rate),
			participationStatus: row.participation_status,
			projects: projectDetailsMap.get(row.employee_id) || []
		}));

		// 통계 정보 계산
		const stats = {
			totalEmployees: summary.length,
			overLimitEmployees: summary.filter(emp => emp.participationStatus === 'OVER_LIMIT').length,
			fullEmployees: summary.filter(emp => emp.participationStatus === 'FULL').length,
			availableEmployees: summary.filter(emp => emp.participationStatus === 'AVAILABLE').length,
			averageParticipationRate: summary.length > 0 
				? Math.round(summary.reduce((sum, emp) => sum + emp.totalParticipationRate, 0) / summary.length * 10) / 10
				: 0
		};

		return json({
			success: true,
			data: {
				summary,
				stats
			}
		});
	} catch (error) {
		console.error('참여율 요약 조회 실패:', error);
		return json({
			success: false,
			message: '참여율 요약을 불러오는데 실패했습니다.',
			error: error instanceof Error ? error.message : '알 수 없는 오류'
		}, { status: 500 });
	}
};
