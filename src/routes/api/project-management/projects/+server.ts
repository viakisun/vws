// Project Management API - Projects
// 프로젝트 관리 시스템의 프로젝트 관련 API

import { json } from '@sveltejs/kit';
import { query } from '$lib/database/connection';
import type { RequestHandler } from './$types';

// 프로젝트 목록 조회
export const GET: RequestHandler = async ({ url }) => {
	try {
		const searchParams = url.searchParams;
		const status = searchParams.get('status');
		const sponsorType = searchParams.get('sponsorType');
		const researchType = searchParams.get('researchType');
		const priority = searchParams.get('priority');
		const managerId = searchParams.get('managerId');
		const search = searchParams.get('search');
		const startDateFrom = searchParams.get('startDateFrom');
		const startDateTo = searchParams.get('startDateTo');

		let sqlQuery = `
			SELECT 
				p.*,
				e.first_name || ' ' || e.last_name as manager_name,
				COUNT(pm.id) as member_count,
				COALESCE(SUM(pm.participation_rate), 0) as total_participation_rate
			FROM projects p
			LEFT JOIN employees e ON p.manager_id = e.id
			LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.status = 'active'
		`;
		
		const conditions = [];
		const params = [];
		let paramIndex = 1;

		if (status && status !== 'all') {
			conditions.push(`p.status = $${paramIndex++}`);
			params.push(status);
		}

		if (sponsorType && sponsorType !== 'all') {
			conditions.push(`p.sponsor_type = $${paramIndex++}`);
			params.push(sponsorType);
		}

		if (researchType && researchType !== 'all') {
			conditions.push(`p.research_type = $${paramIndex++}`);
			params.push(researchType);
		}

		if (priority && priority !== 'all') {
			conditions.push(`p.priority = $${paramIndex++}`);
			params.push(priority);
		}

		if (managerId) {
			conditions.push(`p.manager_id = $${paramIndex++}`);
			params.push(managerId);
		}

		if (search) {
			conditions.push(`(p.title ILIKE $${paramIndex} OR p.code ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
			params.push(`%${search}%`);
			paramIndex++;
		}

		if (startDateFrom) {
			conditions.push(`p.start_date >= $${paramIndex++}`);
			params.push(startDateFrom);
		}

		if (startDateTo) {
			conditions.push(`p.start_date <= $${paramIndex++}`);
			params.push(startDateTo);
		}

		if (conditions.length > 0) {
			sqlQuery += ' WHERE ' + conditions.join(' AND ');
		}

		sqlQuery += `
			GROUP BY p.id, e.first_name, e.last_name
			ORDER BY p.created_at DESC
		`;

		const result = await query(sqlQuery, params);
		
		return json({
			success: true,
			data: result.rows,
			total: result.rows.length
		});
	} catch (error) {
		console.error('프로젝트 목록 조회 실패:', error);
		return json({
			success: false,
			message: '프로젝트 목록을 불러오는데 실패했습니다.',
			error: error instanceof Error ? error.message : '알 수 없는 오류'
		}, { status: 500 });
	}
};

// 프로젝트 생성
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const {
			code,
			title,
			description,
			sponsor,
			sponsorName,
			sponsorType = 'government',
			startDate,
			endDate,
			managerId,
			budgetTotal,
			researchType,
			technologyArea,
			priority = 'medium'
		} = data;

		// 필수 필드 검증
		if (!code || !title) {
			return json({
				success: false,
				message: '프로젝트 코드와 제목은 필수입니다.'
			}, { status: 400 });
		}

		// 프로젝트 코드 중복 확인
		const existingProject = await query(
			'SELECT id FROM projects WHERE code = $1',
			[code]
		);

		if (existingProject.rows.length > 0) {
			return json({
				success: false,
				message: '이미 존재하는 프로젝트 코드입니다.'
			}, { status: 400 });
		}

		// 프로젝트 생성
		const result = await query(`
			INSERT INTO projects (
				code, title, description, sponsor, sponsor_name, sponsor_type,
				start_date, end_date, manager_id, budget_total, research_type,
				technology_area, priority
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
			RETURNING *
		`, [
			code, title, description, sponsor, sponsorName, sponsorType,
			startDate, endDate, managerId, budgetTotal, researchType,
			technologyArea, priority
		]);

		const project = result.rows[0];

		// 프로젝트 멤버 정보와 함께 반환
		const projectWithDetails = await query(`
			SELECT 
				p.*,
				e.first_name || ' ' || e.last_name as manager_name,
				COUNT(pm.id) as member_count,
				COALESCE(SUM(pm.participation_rate), 0) as total_participation_rate
			FROM projects p
			LEFT JOIN employees e ON p.manager_id = e.id
			LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.status = 'active'
			WHERE p.id = $1
			GROUP BY p.id, e.first_name, e.last_name
		`, [project.id]);

		return json({
			success: true,
			data: projectWithDetails.rows[0],
			message: '프로젝트가 성공적으로 생성되었습니다.'
		});
	} catch (error) {
		console.error('프로젝트 생성 실패:', error);
		return json({
			success: false,
			message: '프로젝트 생성에 실패했습니다.',
			error: error instanceof Error ? error.message : '알 수 없는 오류'
		}, { status: 500 });
	}
};
