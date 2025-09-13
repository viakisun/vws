import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$lib/database/connection';

// 직책 목록 조회
export const GET: RequestHandler = async ({ url }) => {
	try {
		const searchParams = url.searchParams;
		const status = searchParams.get('status') || 'active';
		const category = searchParams.get('category');
		const level = searchParams.get('level');
		
		let whereClause = '';
		const params: any[] = [];
		
		if (status === 'active') {
			whereClause = 'WHERE is_active = $1';
			params.push(true);
		} else if (status === 'all') {
			whereClause = '';
		}

		if (category) {
			if (whereClause) {
				whereClause += ' AND category = $' + (params.length + 1);
			} else {
				whereClause = 'WHERE category = $1';
			}
			params.push(category);
		}

		if (level) {
			if (whereClause) {
				whereClause += ' AND level = $' + (params.length + 1);
			} else {
				whereClause = 'WHERE level = $1';
			}
			params.push(parseInt(level));
		}

		const result = await query(`
			SELECT id, name, level, category, description, is_active, created_at, updated_at
			FROM job_titles
			${whereClause}
			ORDER BY level ASC, name ASC
		`, params);

		return json({
			success: true,
			data: result.rows
		});
	} catch (error: any) {
		console.error('Error fetching job titles:', error);
		return json({
			success: false,
			error: error.message || '직책 목록을 가져오는데 실패했습니다.'
		}, { status: 500 });
	}
};

// 새 직책 생성
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		
		// 필수 필드 검증
		if (!data.name || data.name.trim() === '') {
			return json({
				success: false,
				error: '직책명은 필수 입력 항목입니다.'
			}, { status: 400 });
		}

		if (!data.level || data.level < 1 || data.level > 10) {
			return json({
				success: false,
				error: '레벨은 1-10 사이의 값이어야 합니다.'
			}, { status: 400 });
		}

		if (!data.category || data.category.trim() === '') {
			return json({
				success: false,
				error: '카테고리는 필수 선택 항목입니다.'
			}, { status: 400 });
		}

		// 중복 직책명 검증
		const existingTitle = await query(
			'SELECT id FROM job_titles WHERE LOWER(name) = LOWER($1)',
			[data.name.trim()]
		);

		if (existingTitle.rows.length > 0) {
			return json({
				success: false,
				error: '이미 존재하는 직책명입니다.'
			}, { status: 400 });
		}

		const result = await query(`
			INSERT INTO job_titles (name, level, category, description, is_active, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING id, name, level, category, description, is_active, created_at, updated_at
		`, [
			data.name.trim(),
			data.level,
			data.category.trim(),
			data.description?.trim() || '',
			data.is_active !== false,
			new Date(),
			new Date()
		]);

		return json({
			success: true,
			data: result.rows[0],
			message: '직책이 성공적으로 생성되었습니다.'
		});
	} catch (error: any) {
		console.error('Error creating job title:', error);
		return json({
			success: false,
			error: error.message || '직책 생성에 실패했습니다.'
		}, { status: 500 });
	}
};
