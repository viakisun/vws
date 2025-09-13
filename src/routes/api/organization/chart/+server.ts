import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$lib/database/connection';

// 조직도 데이터 생성
export const GET: RequestHandler = async () => {
	try {
		// 모든 직원 데이터 조회
		const employeesResult = await query(`
			SELECT 
				id,
				first_name,
				last_name,
				email,
				department,
				position,
				salary,
				status
			FROM employees 
			WHERE status = 'active'
			ORDER BY department, position
		`);
		
		const employees = Array.isArray(employeesResult) ? employeesResult : employeesResult.rows || [];

		// 부서별로 직원 그룹화
		const orgStructure = {
			"대표이사": {
				"name": "대표이사",
				"position": "대표이사",
				"email": "ceo@company.com",
				"children": [
					{
						"name": "경영기획팀",
						"position": "팀",
						"type": "department",
						"children": employees.filter((emp: any) => emp.department === '경영기획팀').map((emp: any) => ({
							"name": `${emp.last_name}${emp.first_name}`,
							"position": emp.position,
							"email": emp.email,
							"salary": emp.salary
						}))
					}
				]
			},
			"재무이사": {
				"name": "재무이사",
				"position": "재무이사",
				"email": "cfo@company.com",
				"children": [
					{
						"name": "경영지원팀",
						"position": "팀",
						"type": "department",
						"children": employees.filter((emp: any) => emp.department === '경영지원팀').map((emp: any) => ({
							"name": `${emp.last_name}${emp.first_name}`,
							"position": emp.position,
							"email": emp.email,
							"salary": emp.salary
						}))
					}
				]
			},
			"연구소장": {
				"name": "연구소장",
				"position": "연구소장",
				"email": "cto@company.com",
				"children": [
					{
						"name": "PSR팀",
						"position": "팀",
						"type": "department",
						"children": employees.filter((emp: any) => emp.department === 'PSR팀').map((emp: any) => ({
							"name": `${emp.last_name}${emp.first_name}`,
							"position": emp.position,
							"email": emp.email,
							"salary": emp.salary
						}))
					},
					{
						"name": "GRIT팀",
						"position": "팀",
						"type": "department",
						"children": employees.filter((emp: any) => emp.department === 'GRIT팀').map((emp: any) => ({
							"name": `${emp.last_name}${emp.first_name}`,
							"position": emp.position,
							"email": emp.email,
							"salary": emp.salary
						}))
					},
					{
						"name": "개발팀",
						"position": "팀",
						"type": "department",
						"children": employees.filter((emp: any) => emp.department === '개발팀').map((emp: any) => ({
							"name": `${emp.last_name}${emp.first_name}`,
							"position": emp.position,
							"email": emp.email,
							"salary": emp.salary
						}))
					}
				]
			}
		};

		return json({
			success: true,
			data: orgStructure,
			message: '조직도 데이터가 성공적으로 생성되었습니다.'
		});
	} catch (error: any) {
		console.error('Error generating organization chart:', error);
		return json({
			success: false,
			error: error.message || '조직도 생성에 실패했습니다.'
		}, { status: 500 });
	}
};

