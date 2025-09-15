import { query } from '$lib/database/connection';
import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	try {
		const employeeId = url.searchParams.get('employeeId');
		const period = url.searchParams.get('period'); // YYYY-MM 형식

		let conditions: string[] = [];
		let params: (string | number)[] = [];
		let paramIndex = 1;

		if (employeeId) {
			conditions.push(`p.employee_id = $${paramIndex}`);
			params.push(employeeId);
			paramIndex++;
		}

		if (period) {
			conditions.push(`p.period = $${paramIndex}`);
			params.push(period);
			paramIndex++;
		}

		const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

		const { rows } = await query(
			`
			SELECT
				p.id,
				p.employee_id AS "employeeId",
				p.period,
				p.pay_date AS "payDate",
				p.employee_name AS "employeeName",
				p.employee_id_number AS "employeeIdNumber",
				p.department,
				p.position,
				p.hire_date AS "hireDate",
				p.base_salary AS "baseSalary",
				p.total_payments AS "totalPayments",
				p.total_deductions AS "totalDeductions",
				p.net_salary AS "netSalary",
				p.payments,
				p.deductions,
				p.status,
				p.is_generated AS "isGenerated",
				p.created_at AS "createdAt",
				p.updated_at AS "updatedAt",
				p.created_by AS "createdBy",
				p.updated_by AS "updatedBy"
			FROM
				payslips p
			${whereClause}
			ORDER BY
				p.period DESC, p.created_at DESC;
			`,
			params
		);

		return json({ success: true, data: rows });
	} catch (error) {
		console.error('Error fetching payslips:', error);
		return json({
			success: false,
			error: '급여명세서 목록을 가져오는데 실패했습니다.',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
}

export async function POST({ request }) {
	try {
		const payslipData = await request.json();
		console.log('급여명세서 저장 요청 데이터:', JSON.stringify(payslipData, null, 2));
		
		const {
			employeeId,
			period,
			payDate,
			employeeName,
			employeeIdNumber,
			department,
			position,
			hireDate,
			baseSalary,
			totalPayments,
			totalDeductions,
			netSalary,
			payments,
			deductions,
			status = 'draft',
			isGenerated = false
		} = payslipData;

		// 필수 필드 검증
		if (!employeeId || !period || !payDate) {
			return json({
				success: false,
				error: '필수 필드가 누락되었습니다. (employeeId, period, payDate)'
			}, { status: 400 });
		}

		// 기존 급여명세서가 있는지 확인
		const existingPayslip = await query(
			'SELECT id FROM payslips WHERE employee_id = $1 AND period = $2',
			[employeeId, period]
		);

		let result;
		if (existingPayslip.rows.length > 0) {
			// 기존 급여명세서 업데이트
			result = await query(
				`
				UPDATE payslips SET
					pay_date = $3,
					employee_name = $4,
					employee_id_number = $5,
					department = $6,
					position = $7,
					hire_date = $8,
					base_salary = $9,
					total_payments = $10,
					total_deductions = $11,
					net_salary = $12,
					payments = $13,
					deductions = $14,
					status = $15,
					is_generated = $16,
					updated_at = CURRENT_TIMESTAMP,
					updated_by = 'system'
				WHERE employee_id = $1 AND period = $2
				RETURNING *
				`,
				[
					employeeId, period, payDate, employeeName, employeeIdNumber,
					department, position, hireDate, baseSalary, totalPayments,
					totalDeductions, netSalary, JSON.stringify(payments),
					JSON.stringify(deductions), status, isGenerated
				]
			);
		} else {
			// 새 급여명세서 생성
			// period에서 시작일과 종료일 계산 (YYYY-MM 형식)
			const [year, month] = period.split('-');
			const payPeriodStart = `${year}-${month}-01`;
			const payPeriodEnd = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
			
			result = await query(
				`
				INSERT INTO payslips (
					employee_id, period, pay_period_start, pay_period_end, pay_date, 
					employee_name, employee_id_number, department, position, hire_date, 
					base_salary, total_payments, total_deductions, net_salary, total_amount,
					payments, deductions, status, is_generated
				) VALUES (
					$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
				) RETURNING *
				`,
				[
					employeeId, period, payPeriodStart, payPeriodEnd, payDate, 
					employeeName, employeeIdNumber, department, position, hireDate, 
					baseSalary, totalPayments, totalDeductions, netSalary, netSalary,
					JSON.stringify(payments), JSON.stringify(deductions), status, isGenerated
				]
			);
		}

		return json({ success: true, data: result.rows[0] });
	} catch (error) {
		console.error('Error saving payslip:', error);
		console.error('Error details:', {
			message: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			name: error instanceof Error ? error.name : undefined
		});
		return json({
			success: false,
			error: '급여명세서 저장에 실패했습니다.',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
}
