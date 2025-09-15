// 개별 급여 계약 관리 API 엔드포인트

import { json } from '@sveltejs/kit';
import { query } from '$lib/database/connection.js';
import type { RequestHandler } from './$types';
import type { 
	SalaryContract, 
	UpdateSalaryContractRequest,
	ApiResponse 
} from '$lib/types/salary-contracts';

// GET: 특정 급여 계약 조회
export const GET: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;

		const result = await query(`
			SELECT 
				sc.*,
				CONCAT(e.last_name, e.first_name) as employee_name,
				e.employee_id as employee_id_number,
				e.department,
				e.position,
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
			JOIN employees e ON sc.employee_id = e.id
			WHERE sc.id = $1
		`, [id]);

		if (result.rows.length === 0) {
			return json({
				success: false,
				error: '급여 계약을 찾을 수 없습니다.'
			}, { status: 404 });
		}

		const contract = result.rows[0];
		const salaryContract: SalaryContract = {
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
			employeeName: contract.employee_name,
			employeeIdNumber: contract.employee_id_number,
			department: contract.department,
			position: contract.position,
			contractEndDisplay: contract.contract_end_display,
			statusDisplay: contract.status_display
		};

		return json({
			success: true,
			data: salaryContract
		});

	} catch (error) {
		console.error('Error fetching salary contract:', error);
		return json({
			success: false,
			error: '급여 계약 조회에 실패했습니다.'
		}, { status: 500 });
	}
};

// PUT: 급여 계약 수정
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const updateData: UpdateSalaryContractRequest = await request.json();

		// 업데이트할 필드 구성
		const updateFields: string[] = [];
		const params: any[] = [];
		let paramIndex = 1;

		if (updateData.startDate !== undefined) {
			updateFields.push(`start_date = $${paramIndex}`);
			params.push(updateData.startDate);
			paramIndex++;
		}

		if (updateData.endDate !== undefined) {
			updateFields.push(`end_date = $${paramIndex}`);
			params.push(updateData.endDate || null);
			paramIndex++;
		}

		if (updateData.annualSalary !== undefined) {
			updateFields.push(`annual_salary = $${paramIndex}`);
			params.push(updateData.annualSalary);
			paramIndex++;
		}

		if (updateData.monthlySalary !== undefined) {
			updateFields.push(`monthly_salary = $${paramIndex}`);
			params.push(updateData.monthlySalary);
			paramIndex++;
		}

		if (updateData.contractType !== undefined) {
			updateFields.push(`contract_type = $${paramIndex}`);
			params.push(updateData.contractType);
			paramIndex++;
		}

		if (updateData.status !== undefined) {
			updateFields.push(`status = $${paramIndex}`);
			params.push(updateData.status);
			paramIndex++;
		}

		if (updateData.notes !== undefined) {
			updateFields.push(`notes = $${paramIndex}`);
			params.push(updateData.notes || null);
			paramIndex++;
		}

		if (updateFields.length === 0) {
			return json({
				success: false,
				error: '업데이트할 필드가 없습니다.'
			}, { status: 400 });
		}

		// updated_at 자동 업데이트
		updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
		params.push(id);

		const result = await query(`
			UPDATE salary_contracts 
			SET ${updateFields.join(', ')}
			WHERE id = $${paramIndex}
			RETURNING *
		`, params);

		if (result.rows.length === 0) {
			return json({
				success: false,
				error: '급여 계약을 찾을 수 없습니다.'
			}, { status: 404 });
		}

		const updatedContract = result.rows[0];

		return json({
			success: true,
			data: {
				id: updatedContract.id,
				employeeId: updatedContract.employee_id,
				startDate: updatedContract.start_date,
				endDate: updatedContract.end_date,
				annualSalary: parseFloat(updatedContract.annual_salary),
				monthlySalary: parseFloat(updatedContract.monthly_salary),
				contractType: updatedContract.contract_type,
				status: updatedContract.status,
				notes: updatedContract.notes,
				createdAt: updatedContract.created_at,
				updatedAt: updatedContract.updated_at,
				createdBy: updatedContract.created_by
			}
		});

	} catch (error) {
		console.error('Error updating salary contract:', error);
		return json({
			success: false,
			error: '급여 계약 수정에 실패했습니다.'
		}, { status: 500 });
	}
};

// DELETE: 급여 계약 삭제
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;

		const result = await query(`
			DELETE FROM salary_contracts 
			WHERE id = $1
			RETURNING id
		`, [id]);

		if (result.rows.length === 0) {
			return json({
				success: false,
				error: '급여 계약을 찾을 수 없습니다.'
			}, { status: 404 });
		}

		return json({
			success: true,
			data: { id }
		});

	} catch (error) {
		console.error('Error deleting salary contract:', error);
		return json({
			success: false,
			error: '급여 계약 삭제에 실패했습니다.'
		}, { status: 500 });
	}
};
