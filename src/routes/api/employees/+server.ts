import { json } from '@sveltejs/kit';
import { query } from '$lib/database/connection.js';
import type { RequestHandler } from './$types';

// GET: 직원 목록 조회
export const GET: RequestHandler = async ({ url }) => {
	try {
		const status = url.searchParams.get('status');
		const department = url.searchParams.get('department');
		
		let whereClause = '';
		const params: any[] = [];
		let paramIndex = 1;
		
		if (status && status !== 'all') {
			whereClause += ` WHERE status = $${paramIndex}`;
			params.push(status);
			paramIndex++;
		}
		
		if (department && department !== 'all') {
			whereClause += whereClause ? ` AND department = $${paramIndex}` : ` WHERE department = $${paramIndex}`;
			params.push(department);
			paramIndex++;
		}
		
		const result = await query(`
			SELECT 
				e.id, e.employee_id, e.first_name, e.last_name, e.email, e.phone,
				e.department, e.position, e.salary, e.hire_date, e.status,
				e.employment_type, e.job_title_id, e.created_at, e.updated_at,
				jt.name as job_title_name, jt.level as job_title_level, jt.category as job_title_category
			FROM employees e
			LEFT JOIN job_titles jt ON e.job_title_id = jt.id
			${whereClause}
			ORDER BY e.created_at DESC
		`, params);
		
		return json({
			success: true,
			data: result.rows
		});
	} catch (error) {
		console.error('Error fetching employees:', error);
		return json({
			success: false,
			error: '직원 목록을 가져오는데 실패했습니다.'
		}, { status: 500 });
	}
};

// POST: 새 직원 추가
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		
		// 필수 필드 검증
		const requiredFields = ['first_name', 'last_name', 'email', 'department', 'position', 'salary'];
		const missingFields = requiredFields.filter(field => !data[field] || data[field] === '');
		
		if (missingFields.length > 0) {
			return json({
				success: false,
				error: `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`
			}, { status: 400 });
		}
		
		// employee_id 생성
		const email = data.email.trim();
		const timestamp = Date.now().toString().slice(-6);
		const random = Math.random().toString(36).substr(2, 4);
		const employeeId = `${email.split('@')[0]}_${timestamp}_${random}`;
		
		// 입사일 처리
		let hireDate = new Date();
		if (data.hire_date) {
			hireDate = new Date(data.hire_date);
			if (isNaN(hireDate.getTime())) {
				return json({
					success: false,
					error: '올바르지 않은 입사일 형식입니다.'
				}, { status: 400 });
			}
		}
		
		const result = await query(`
			INSERT INTO employees (
				employee_id, first_name, last_name, email, phone,
				department, position, salary, hire_date, status,
				employment_type, job_title_id, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
			RETURNING id, employee_id, first_name, last_name, email, phone,
				department, position, salary, hire_date, status,
				employment_type, job_title_id, created_at, updated_at
		`, [
			employeeId,
			data.first_name?.trim() || '',
			data.last_name?.trim() || '',
			data.email?.trim() || '',
			data.phone?.trim() || '',
			data.department?.trim() || '',
			data.position?.trim() || '',
			parseFloat(data.salary) || 0,
			hireDate.toISOString().split('T')[0],
			data.status || 'active',
			data.employment_type || 'full-time',
			data.job_title_id || null,
			new Date(),
			new Date()
		]);
		
		return json({
			success: true,
			data: result.rows[0],
			message: '직원이 성공적으로 추가되었습니다.'
		});
	} catch (error) {
		console.error('Error adding employee:', error);
		return json({
			success: false,
			error: '직원 추가에 실패했습니다.'
		}, { status: 500 });
	}
};
