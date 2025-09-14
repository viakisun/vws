// 급여 관리 시스템 - 직원별 급여 API 엔드포인트

import { json } from '@sveltejs/kit';
import { query } from '$lib/database/connection.js';
import type { RequestHandler } from './$types';
import type { EmployeePayroll, ApiResponse, PaginatedResponse } from '$lib/types/salary';

// GET: 직원별 급여 목록 조회
export const GET: RequestHandler = async ({ url }) => {
	try {
		// 쿼리 파라미터 파싱
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const period = url.searchParams.get('period') || '';
		const employeeId = url.searchParams.get('employeeId') || '';
		const department = url.searchParams.get('department') || '';
		const status = url.searchParams.get('status') || '';
		const search = url.searchParams.get('search') || '';

		// WHERE 조건 구성
		const conditions: string[] = [];
		const params: any[] = [];
		let paramIndex = 1;

		if (period) {
			conditions.push(`ep.pay_date LIKE $${paramIndex}`);
			params.push(`${period}%`);
			paramIndex++;
		}

		if (employeeId) {
			conditions.push(`ep.employee_id = $${paramIndex}`);
			params.push(employeeId);
			paramIndex++;
		}

		if (department) {
			conditions.push(`ep.department = $${paramIndex}`);
			params.push(department);
			paramIndex++;
		}

		if (status) {
			conditions.push(`ep.status = $${paramIndex}`);
			params.push(status);
			paramIndex++;
		}

		if (search) {
			conditions.push(`(
				ep.employee_name ILIKE $${paramIndex} OR 
				ep.employee_id_number ILIKE $${paramIndex} OR 
				ep.department ILIKE $${paramIndex}
			)`);
			params.push(`%${search}%`);
			paramIndex++;
		}

		const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

		// 전체 개수 조회
		const countResult = await query(`
			SELECT COUNT(*) as total
			FROM employee_payrolls ep
			${whereClause}
		`, params);

		const total = parseInt(countResult.rows[0]?.total || '0');
		const totalPages = Math.ceil(total / limit);
		const offset = (page - 1) * limit;

		// 직원별 급여 목록 조회
		const result = await query(`
			SELECT 
				ep.id,
				ep.payroll_id,
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
			${whereClause}
			ORDER BY ep.pay_date DESC, ep.employee_name ASC
			LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
		`, [...params, limit, offset]);

		const employeePayrolls: EmployeePayroll[] = result.rows.map(row => ({
			id: row.id,
			payrollId: row.payroll_id,
			employeeId: row.employee_id,
			employeeName: row.employee_name,
			employeeIdNumber: row.employee_id_number,
			department: row.department,
			position: row.position,
			baseSalary: row.base_salary,
			allowances: row.allowances || [],
			deductions: row.deductions || [],
			totalAllowances: row.total_allowances,
			totalDeductions: row.total_deductions,
			grossSalary: row.gross_salary,
			netSalary: row.net_salary,
			status: row.status,
			payDate: row.pay_date,
			createdAt: row.created_at,
			updatedAt: row.updated_at
		}));

		const response: PaginatedResponse<EmployeePayroll> = {
			data: employeePayrolls,
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
		console.error('Error fetching employee payrolls:', error);
		return json({
			success: false,
			error: '직원별 급여 목록을 가져오는데 실패했습니다.'
		}, { status: 500 });
	}
};

// POST: 직원별 급여 생성 (급여 계산 시 사용)
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { payrollId, employeeId, baseSalary, allowances, deductions } = await request.json();

		if (!payrollId || !employeeId || !baseSalary) {
			return json({
				success: false,
				error: '필수 입력 항목이 누락되었습니다.'
			}, { status: 400 });
		}

		// 직원 정보 조회
		const employeeResult = await query(`
			SELECT name, employee_id, department, position
			FROM employees
			WHERE id = $1
		`, [employeeId]);

		if (employeeResult.rows.length === 0) {
			return json({
				success: false,
				error: '직원 정보를 찾을 수 없습니다.'
			}, { status: 404 });
		}

		const employee = employeeResult.rows[0];

		// 총액 계산
		const totalAllowances = allowances?.reduce((sum: number, allowance: any) => sum + allowance.amount, 0) || 0;
		const totalDeductions = deductions?.reduce((sum: number, deduction: any) => sum + deduction.amount, 0) || 0;
		const grossSalary = baseSalary + totalAllowances;
		const netSalary = grossSalary - totalDeductions;

		// 급여 생성
		const result = await query(`
			INSERT INTO employee_payrolls (
				payroll_id, employee_id, employee_name, employee_id_number,
				department, position, base_salary, allowances, deductions,
				total_allowances, total_deductions, gross_salary, net_salary,
				status, pay_date, created_at, updated_at
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
				'calculated', NOW()::date, NOW(), NOW()
			) RETURNING *
		`, [
			payrollId,
			employeeId,
			employee.name,
			employee.employee_id,
			employee.department,
			employee.position,
			baseSalary,
			JSON.stringify(allowances || []),
			JSON.stringify(deductions || []),
			totalAllowances,
			totalDeductions,
			grossSalary,
			netSalary
		]);

		if (!result.rows[0]) {
			throw new Error('직원별 급여 생성에 실패했습니다.');
		}

		const newEmployeePayroll: EmployeePayroll = {
			id: result.rows[0].id,
			payrollId: result.rows[0].payroll_id,
			employeeId: result.rows[0].employee_id,
			employeeName: result.rows[0].employee_name,
			employeeIdNumber: result.rows[0].employee_id_number,
			department: result.rows[0].department,
			position: result.rows[0].position,
			baseSalary: result.rows[0].base_salary,
			allowances: result.rows[0].allowances || [],
			deductions: result.rows[0].deductions || [],
			totalAllowances: result.rows[0].total_allowances,
			totalDeductions: result.rows[0].total_deductions,
			grossSalary: result.rows[0].gross_salary,
			netSalary: result.rows[0].net_salary,
			status: result.rows[0].status,
			payDate: result.rows[0].pay_date,
			createdAt: result.rows[0].created_at,
			updatedAt: result.rows[0].updated_at
		};

		return json({
			success: true,
			data: newEmployeePayroll,
			message: '직원별 급여가 성공적으로 생성되었습니다.'
		}, { status: 201 });

	} catch (error) {
		console.error('Error creating employee payroll:', error);
		return json({
			success: false,
			error: error instanceof Error ? error.message : '직원별 급여 생성에 실패했습니다.'
		}, { status: 500 });
	}
};
