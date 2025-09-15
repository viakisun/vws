// 급여 계약 통계 API 엔드포인트

import { json } from '@sveltejs/kit';
import { query } from '$lib/database/connection.js';
import type { RequestHandler } from './$types';
import type { ApiResponse, SalaryContractStats } from '$lib/types/salary-contracts';

// GET: 급여 계약 통계 조회
export const GET: RequestHandler = async () => {
	try {
		// 기본 통계 조회
		const statsResult = await query(`
			SELECT 
				COUNT(*) as total_contracts,
				COUNT(CASE WHEN sc.status = 'active' THEN 1 END) as active_contracts,
				COUNT(CASE WHEN sc.status = 'expired' OR (sc.status = 'active' AND sc.end_date < CURRENT_DATE) THEN 1 END) as expired_contracts,
				AVG(sc.annual_salary) as average_annual_salary,
				AVG(sc.monthly_salary) as average_monthly_salary,
				SUM(sc.annual_salary) as total_annual_salary,
				SUM(sc.monthly_salary) as total_monthly_salary
			FROM salary_contracts sc
			JOIN employees e ON sc.employee_id = e.id
			WHERE e.status = 'active'
		`);

		// 계약 유형별 통계
		const typeStatsResult = await query(`
			SELECT 
				sc.contract_type,
				COUNT(*) as count
			FROM salary_contracts sc
			JOIN employees e ON sc.employee_id = e.id
			WHERE e.status = 'active'
			GROUP BY sc.contract_type
		`);

		// 부서별 통계
		const deptStatsResult = await query(`
			SELECT 
				COALESCE(e.department, '부서없음') as department,
				COUNT(*) as count
			FROM salary_contracts sc
			JOIN employees e ON sc.employee_id = e.id
			WHERE e.status = 'active'
			GROUP BY e.department
		`);

		const stats = statsResult.rows[0];
		const contractsByType: Record<string, number> = {};
		const contractsByDepartment: Record<string, number> = {};

		// 계약 유형별 데이터 변환
		typeStatsResult.rows.forEach(row => {
			contractsByType[row.contract_type] = parseInt(row.count);
		});

		// 부서별 데이터 변환
		deptStatsResult.rows.forEach(row => {
			contractsByDepartment[row.department] = parseInt(row.count);
		});

		const salaryContractStats: SalaryContractStats = {
			totalContracts: parseInt(stats.total_contracts) || 0,
			activeContracts: parseInt(stats.active_contracts) || 0,
			expiredContracts: parseInt(stats.expired_contracts) || 0,
			averageAnnualSalary: Math.ceil(parseFloat(stats.average_annual_salary) || 0),
			averageMonthlySalary: Math.ceil(parseFloat(stats.average_monthly_salary) || 0),
			totalAnnualSalary: parseFloat(stats.total_annual_salary) || 0,
			totalMonthlySalary: parseFloat(stats.total_monthly_salary) || 0,
			contractsByType,
			contractsByDepartment
		};

		return json({
			success: true,
			data: salaryContractStats
		});

	} catch (error) {
		return json({
			success: false,
			error: '급여 계약 통계 조회에 실패했습니다.'
		}, { status: 500 });
	}
};
