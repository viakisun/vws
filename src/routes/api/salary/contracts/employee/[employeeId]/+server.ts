// 직원별 급여 계약 정보 API 엔드포인트

import { json } from '@sveltejs/kit';
import { query } from '$lib/database/connection.js';
import type { RequestHandler } from './$types';
import type { ApiResponse, CurrentSalaryInfo, SalaryContract } from '$lib/types/salary-contracts';

// GET: 특정 직원의 급여 계약 정보 조회
export const GET: RequestHandler = async ({ params }) => {
	try {
		const { employeeId } = params;

		// 직원 기본 정보 조회
		const employeeResult = await query(`
			SELECT 
				e.id,
				e.employee_id,
				CONCAT(e.last_name, e.first_name) as employee_name,
				e.department,
				e.position,
				e.status
			FROM employees e
			WHERE e.id = $1
		`, [employeeId]);

		if (employeeResult.rows.length === 0) {
			return json({
				success: false,
				error: '직원을 찾을 수 없습니다.'
			}, { status: 404 });
		}

		const employee = employeeResult.rows[0];

		// 현재 유효한 급여 계약 조회
		const currentContractResult = await query(`
			SELECT 
				sc.*,
				CASE 
					WHEN sc.end_date IS NULL THEN '무기한'
					ELSE TO_CHAR(sc.end_date, 'YYYY-MM-DD')
				END as contract_end_display,
				CASE 
					WHEN sc.status = 'active' AND sc.end_date IS NULL THEN '진행중 (무기한)'
					WHEN sc.status = 'active' AND sc.end_date >= CURRENT_DATE THEN '진행중'
					WHEN sc.status = 'expired' OR sc.end_date < CURRENT_DATE THEN '만료됨'
					ELSE sc.status
				END as status_display
			FROM salary_contracts sc
			WHERE sc.employee_id = $1 
				AND sc.status = 'active' 
				AND sc.start_date <= CURRENT_DATE 
				AND (sc.end_date IS NULL OR sc.end_date >= CURRENT_DATE)
			ORDER BY sc.start_date DESC
			LIMIT 1
		`, [employeeId]);

		// 급여 계약 이력 조회
		const historyResult = await query(`
			SELECT 
				sc.*,
				CASE 
					WHEN sc.end_date IS NULL THEN '무기한'
					ELSE TO_CHAR(sc.end_date, 'YYYY-MM-DD')
				END as contract_end_display,
				CASE 
					WHEN sc.status = 'active' AND sc.end_date IS NULL THEN '진행중 (무기한)'
					WHEN sc.status = 'active' AND sc.end_date >= CURRENT_DATE THEN '진행중'
					WHEN sc.status = 'expired' OR sc.end_date < CURRENT_DATE THEN '만료됨'
					ELSE sc.status
				END as status_display
			FROM salary_contracts sc
			WHERE sc.employee_id = $1
			ORDER BY sc.start_date DESC
		`, [employeeId]);

		// 현재 계약 데이터 변환
		let currentContract: SalaryContract | null = null;
		if (currentContractResult.rows.length > 0) {
			const contract = currentContractResult.rows[0];
			currentContract = {
				id: contract.id,
				employeeId: contract.employee_id,
				startDate: contract.start_date,
				endDate: contract.end_date,
				annualSalary: parseFloat(contract.annual_salary),
				monthlySalary: parseFloat(contract.monthly_salary),
				contractType: contract.contract_type,
				status: contract.status,
				notes: contract.notes,
				createdAt: contract.created_at,
				updatedAt: contract.updated_at,
				createdBy: contract.created_by,
				contractEndDisplay: contract.contract_end_display,
				statusDisplay: contract.status_display
			};
		}

		// 계약 이력 데이터 변환
		const contractHistory: SalaryContract[] = historyResult.rows.map(contract => ({
			id: contract.id,
			employeeId: contract.employee_id,
			startDate: contract.start_date,
			endDate: contract.end_date,
			annualSalary: parseFloat(contract.annual_salary),
			monthlySalary: parseFloat(contract.monthly_salary),
			contractType: contract.contract_type,
			status: contract.status,
			notes: contract.notes,
			createdAt: contract.created_at,
			updatedAt: contract.updated_at,
			createdBy: contract.created_by,
			contractEndDisplay: contract.contract_end_display,
			statusDisplay: contract.status_display
		}));

		const currentSalaryInfo: CurrentSalaryInfo = {
			employeeId: employee.id,
			employeeName: employee.employee_name,
			employeeIdNumber: employee.employee_id,
			department: employee.department,
			position: employee.position,
			currentContract: currentContract!,
			contractHistory
		};

		return json({
			success: true,
			data: currentSalaryInfo
		});

	} catch (error) {
		return json({
			success: false,
			error: '직원 급여 정보 조회에 실패했습니다.'
		}, { status: 500 });
	}
};
