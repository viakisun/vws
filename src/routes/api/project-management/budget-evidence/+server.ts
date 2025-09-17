import { query } from '$lib/database/connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// GET /api/project-management/budget-evidence - 증빙 내역 목록 조회
export const GET: RequestHandler = async ({ url }) => {
	try {
		const projectBudgetId = url.searchParams.get('projectBudgetId');
		const projectId = url.searchParams.get('projectId');
		const status = url.searchParams.get('status');
		const evidenceType = url.searchParams.get('evidenceType');
		const year = url.searchParams.get('year');

		let sqlQuery = `
			SELECT 
				be.id,
				be.project_budget_id,
				be.evidence_type,
				be.title,
				be.description,
				be.amount,
				be.evidence_date,
				be.file_path,
				be.file_name,
				be.file_size,
				be.mime_type,
				be.status,
				be.created_at,
				be.updated_at,
				be.approved_at,
				be.rejection_reason,
				et.name as evidence_type_name,
				pb.fiscal_year,
				p.title as project_title,
				creator.first_name as created_by_name,
				approver.first_name as approved_by_name
			FROM budget_evidence be
			LEFT JOIN evidence_types et ON be.evidence_type = et.code
			LEFT JOIN project_budgets pb ON be.project_budget_id = pb.id
			LEFT JOIN projects p ON pb.project_id = p.id
			LEFT JOIN employees creator ON be.created_by = creator.id
			LEFT JOIN employees approver ON be.approved_by = approver.id
			WHERE 1=1
		`;

		const params: any[] = [];
		let paramIndex = 1;

		if (projectBudgetId) {
			sqlQuery += ` AND be.project_budget_id = $${paramIndex}`;
			params.push(projectBudgetId);
			paramIndex++;
		}

		if (projectId) {
			sqlQuery += ` AND pb.project_id = $${paramIndex}`;
			params.push(projectId);
			paramIndex++;
		}

		if (status) {
			sqlQuery += ` AND be.status = $${paramIndex}`;
			params.push(status);
			paramIndex++;
		}

		if (evidenceType) {
			sqlQuery += ` AND be.evidence_type = $${paramIndex}`;
			params.push(evidenceType);
			paramIndex++;
		}

		if (year) {
			sqlQuery += ` AND pb.fiscal_year = $${paramIndex}`;
			params.push(parseInt(year));
			paramIndex++;
		}

		sqlQuery += ' ORDER BY be.evidence_date DESC, be.created_at DESC';

		const result = await query(sqlQuery, params);

		return json({
			success: true,
			data: result.rows
		});
	} catch (error) {
		console.error('증빙 내역 조회 실패:', error);
		return json({
			success: false,
			message: '증빙 내역을 불러오는데 실패했습니다.',
			error: (error as Error).message
		}, { status: 500 });
	}
};

// POST /api/project-management/budget-evidence - 증빙 내역 등록
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const {
			projectBudgetId,
			evidenceType,
			title,
			description,
			amount,
			evidenceDate,
			filePath,
			fileName,
			fileSize,
			mimeType,
			createdBy
		} = data;

		// 필수 필드 검증
		if (!projectBudgetId || !evidenceType || !title || !amount || !evidenceDate) {
			return json({
				success: false,
				message: '필수 필드가 누락되었습니다.'
			}, { status: 400 });
		}

		// 증빙 내역 등록
		const insertQuery = `
			INSERT INTO budget_evidence (
				project_budget_id, evidence_type, title, description, amount, 
				evidence_date, file_path, file_name, file_size, mime_type, created_by
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			RETURNING *
		`;

		const result = await query(insertQuery, [
			projectBudgetId,
			evidenceType,
			title,
			description || null,
			parseFloat(amount),
			evidenceDate,
			filePath || null,
			fileName || null,
			fileSize || null,
			mimeType || null,
			createdBy || null
		]);

		return json({
			success: true,
			data: result.rows[0],
			message: '증빙 내역이 등록되었습니다.'
		});
	} catch (error) {
		console.error('증빙 내역 등록 실패:', error);
		return json({
			success: false,
			message: '증빙 내역 등록에 실패했습니다.',
			error: (error as Error).message
		}, { status: 500 });
	}
};
