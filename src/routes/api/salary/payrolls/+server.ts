// 급여 관리 시스템 - 급여 API 엔드포인트

import { json } from '@sveltejs/kit';
import { query } from '$lib/database/connection.js';
import type { RequestHandler } from './$types';
import type { Payroll, EmployeePayroll, ApiResponse, PaginatedResponse } from '$lib/types/salary';

// GET: 급여 목록 조회
export const GET: RequestHandler = async ({ url }) => {
	try {
		// 쿼리 파라미터 파싱
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '20');
		const period = url.searchParams.get('period') || '';
		const status = url.searchParams.get('status') || '';
		const sortBy = url.searchParams.get('sortBy') || 'period';
		const sortOrder = url.searchParams.get('sortOrder') || 'DESC';

		// WHERE 조건 구성
		const conditions: string[] = [];
		const params: any[] = [];
		let paramIndex = 1;

		if (period) {
			conditions.push(`p.period = $${paramIndex}`);
			params.push(period);
			paramIndex++;
		}

		if (status) {
			conditions.push(`p.status = $${paramIndex}`);
			params.push(status);
			paramIndex++;
		}

		const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

		// 정렬 필드 검증
		const allowedSortFields = ['period', 'pay_date', 'status', 'total_net_salary', 'created_at'];
		const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'period';
		const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

		// 전체 개수 조회
		const countResult = await query(`
			SELECT COUNT(*) as total
			FROM payrolls p
			${whereClause}
		`, params);

		const total = parseInt(countResult.rows[0]?.total || '0');
		const totalPages = Math.ceil(total / limit);
		const offset = (page - 1) * limit;

		// 급여 목록 조회
		const result = await query(`
			SELECT 
				p.id,
				p.period,
				p.pay_date,
				p.status,
				p.total_employees,
				p.total_gross_salary,
				p.total_deductions,
				p.total_net_salary,
				p.created_at,
				p.updated_at,
				p.created_by,
				p.approved_by,
				p.approved_at
			FROM payrolls p
			${whereClause}
			ORDER BY p.${sortField} ${orderDirection}
			LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
		`, [...params, limit, offset]);

		// 각 급여의 직원별 급여 조회
		const payrollsWithEmployees: Payroll[] = [];
		
		for (const row of result.rows) {
			const employeeResult = await query(`
				SELECT 
					ep.id,
					ep.employee_id,
					ep.employee_name,
					ep.employee_id_number,
					ep.department,
					ep.position,
					ep.base_salary,
					ep.allowances,
					ep.deductions,
					ep.total_allowances,
					ep.total_deductions,
					ep.gross_salary,
					ep.net_salary,
					ep.status,
					ep.pay_date,
					ep.created_at,
					ep.updated_at
				FROM employee_payrolls ep
				WHERE ep.payroll_id = $1
			`, [row.id]);

			const employeePayrolls: EmployeePayroll[] = employeeResult.rows.map(empRow => ({
				id: empRow.id,
				payrollId: empRow.payroll_id,
				employeeId: empRow.employee_id,
				employeeName: empRow.employee_name,
				employeeIdNumber: empRow.employee_id_number,
				department: empRow.department,
				position: empRow.position,
				baseSalary: empRow.base_salary,
				allowances: empRow.allowances || [],
				deductions: empRow.deductions || [],
				totalAllowances: empRow.total_allowances,
				totalDeductions: empRow.total_deductions,
				grossSalary: empRow.gross_salary,
				netSalary: empRow.net_salary,
				status: empRow.status,
				payDate: empRow.pay_date,
				createdAt: empRow.created_at,
				updatedAt: empRow.updated_at
			}));

			payrollsWithEmployees.push({
				id: row.id,
				period: row.period,
				payDate: row.pay_date,
				status: row.status,
				totalEmployees: row.total_employees,
				totalGrossSalary: row.total_gross_salary,
				totalDeductions: row.total_deductions,
				totalNetSalary: row.total_net_salary,
				createdAt: row.created_at,
				updatedAt: row.updated_at,
				createdBy: row.created_by,
				approvedBy: row.approved_by,
				approvedAt: row.approved_at,
				employeePayrolls
			});
		}

		const response: PaginatedResponse<Payroll> = {
			data: payrollsWithEmployees,
			total,
			page,
			limit,
			totalPages
		};

		return json({
			success: true,
			data: response
		});

	} catch (error) {
		console.error('Error fetching payrolls:', error);
		return json({
			success: false,
			error: '급여 목록을 가져오는데 실패했습니다.'
		}, { status: 500 });
	}
};

// POST: 새 급여 생성
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { period, payDate, employeeIds } = await request.json();

		if (!period || !payDate) {
			return json({
				success: false,
				error: '기간과 지급일은 필수 입력 항목입니다.'
			}, { status: 400 });
		}

		// 기존 급여 확인
		const existingPayroll = await query(
			'SELECT id FROM payrolls WHERE period = $1',
			[period]
		);

		if (existingPayroll.rows.length > 0) {
			return json({
				success: false,
				error: '해당 기간의 급여가 이미 존재합니다.'
			}, { status: 400 });
		}

		// 급여 생성
		const payrollResult = await query(`
			INSERT INTO payrolls (
				period, pay_date, status, total_employees, total_gross_salary,
				total_deductions, total_net_salary, created_at, updated_at, created_by
			) VALUES (
				$1, $2, 'draft', 0, 0, 0, 0, NOW(), NOW(), 'system'
			) RETURNING *
		`, [period, payDate]);

		if (!payrollResult.rows[0]) {
			throw new Error('급여 생성에 실패했습니다.');
		}

		const newPayroll: Payroll = {
			id: payrollResult.rows[0].id,
			period: payrollResult.rows[0].period,
			payDate: payrollResult.rows[0].pay_date,
			status: payrollResult.rows[0].status,
			totalEmployees: payrollResult.rows[0].total_employees,
			totalGrossSalary: payrollResult.rows[0].total_gross_salary,
			totalDeductions: payrollResult.rows[0].total_deductions,
			totalNetSalary: payrollResult.rows[0].total_net_salary,
			createdAt: payrollResult.rows[0].created_at,
			updatedAt: payrollResult.rows[0].updated_at,
			createdBy: payrollResult.rows[0].created_by,
			employeePayrolls: []
		};

		return json({
			success: true,
			data: newPayroll,
			message: '급여가 성공적으로 생성되었습니다.'
		}, { status: 201 });

	} catch (error) {
		console.error('Error creating payroll:', error);
		return json({
			success: false,
			error: error instanceof Error ? error.message : '급여 생성에 실패했습니다.'
		}, { status: 500 });
	}
};
