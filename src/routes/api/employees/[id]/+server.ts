import { json } from '@sveltejs/kit';
import { query } from '$lib/database/connection.js';
import type { RequestHandler } from './$types';

// GET: 특정 직원 조회
export const GET: RequestHandler = async ({ params }) => {
	try {
		const result = await query(`
			SELECT 
				e.id, e.employee_id, e.first_name, e.last_name, e.email, e.phone,
				e.department, e.position, e.salary, e.hire_date, e.status,
				e.employment_type, e.job_title_id, e.created_at, e.updated_at,
				jt.name as job_title_name, jt.level as job_title_level, jt.category as job_title_category
			FROM employees e
			LEFT JOIN job_titles jt ON e.job_title_id = jt.id
			WHERE e.id = $1
		`, [params.id]);
		
		if (result.rows.length === 0) {
			return json({
				success: false,
				error: '직원을 찾을 수 없습니다.'
			}, { status: 404 });
		}
		
		return json({
			success: true,
			data: result.rows[0]
		});
	} catch (error) {
		console.error('Error fetching employee:', error);
		return json({
			success: false,
			error: '직원 정보를 가져오는데 실패했습니다.'
		}, { status: 500 });
	}
};

// PUT: 직원 정보 수정
export const PUT: RequestHandler = async ({ params, request }) => {
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
			UPDATE employees SET
				first_name = $2,
				last_name = $3,
				email = $4,
				phone = $5,
				department = $6,
				position = $7,
				salary = $8,
				hire_date = $9,
				status = $10,
				employment_type = $11,
				job_title_id = $12,
				updated_at = $13
			WHERE id = $1
			RETURNING id, employee_id, first_name, last_name, email, phone,
				department, position, salary, hire_date, status,
				employment_type, job_title_id, created_at, updated_at
		`, [
			params.id,
			data.first_name.trim(),
			data.last_name.trim(),
			data.email.trim(),
			data.phone?.trim() || '',
			data.department.trim(),
			data.position.trim(),
			parseFloat(data.salary),
			hireDate.toISOString().split('T')[0],
			data.status || 'active',
			data.employment_type || 'full-time',
			data.job_title_id || null,
			new Date()
		]);
		
		if (result.rows.length === 0) {
			return json({
				success: false,
				error: '직원을 찾을 수 없습니다.'
			}, { status: 404 });
		}
		
		return json({
			success: true,
			data: result.rows[0],
			message: '직원 정보가 성공적으로 수정되었습니다.'
		});
	} catch (error) {
		console.error('Error updating employee:', error);
		return json({
			success: false,
			error: '직원 정보 수정에 실패했습니다.'
		}, { status: 500 });
	}
};

// DELETE: 직원 삭제 (완전 삭제)
export const DELETE: RequestHandler = async ({ params, url }) => {
	try {
		const archive = url.searchParams.get('archive') === 'true';
		
		if (archive) {
			// 아카이브 (soft delete) - 상태를 'terminated'로 변경
			const result = await query(`
				UPDATE employees SET
					status = 'terminated',
					updated_at = $2
				WHERE id = $1
				RETURNING id, employee_id, first_name, last_name, status
			`, [params.id, new Date()]);
			
			if (result.rows.length === 0) {
				return json({
					success: false,
					error: '직원을 찾을 수 없습니다.'
				}, { status: 404 });
			}
			
			return json({
				success: true,
				message: '직원이 퇴사 처리되었습니다.',
				data: result.rows[0]
			});
		} else {
			// 완전 삭제
			const result = await query(`
				DELETE FROM employees
				WHERE id = $1
				RETURNING id, employee_id, first_name, last_name
			`, [params.id]);
			
			if (result.rows.length === 0) {
				return json({
					success: false,
					error: '직원을 찾을 수 없습니다.'
				}, { status: 404 });
			}
			
			return json({
				success: true,
				message: '직원이 완전히 삭제되었습니다.',
				data: result.rows[0]
			});
		}
	} catch (error) {
		console.error('Error deleting employee:', error);
		return json({
			success: false,
			error: '직원 삭제에 실패했습니다.'
		}, { status: 500 });
	}
};
