import { json } from '@sveltejs/kit';
import { query } from '$lib/database/connection';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const offset = parseInt(url.searchParams.get('offset') || '0');
		const status = url.searchParams.get('status') || undefined;
		const research_type = url.searchParams.get('research_type') || undefined;

		let queryText = `
			SELECT 
				rd.*,
				p.code,
				p.title,
				p.description,
				p.sponsor,
				p.sponsor_type,
				p.start_date,
				p.end_date,
				p.manager_id,
				p.status as project_status,
				p.budget_total,
				p.created_at,
				p.updated_at
			FROM rd_projects rd
			JOIN projects p ON rd.project_id = p.id
			WHERE 1=1
		`;
		
		const params: any[] = [];
		let paramCount = 0;

		if (status) {
			paramCount++;
			queryText += ` AND rd.status = $${paramCount}`;
			params.push(status);
		}

		if (research_type) {
			paramCount++;
			queryText += ` AND rd.research_type = $${paramCount}`;
			params.push(research_type);
		}

		queryText += ' ORDER BY rd.created_at DESC';

		if (limit) {
			paramCount++;
			queryText += ` LIMIT $${paramCount}`;
			params.push(limit);
		}

		if (offset) {
			paramCount++;
			queryText += ` OFFSET $${paramCount}`;
			params.push(offset);
		}

		const result = await query(queryText, params);

		return json({
			success: true,
			data: result.rows,
			pagination: {
				limit,
				offset,
				total: result.rows.length
			}
		});

	} catch (error) {
		console.error('Get R&D projects error:', error);
		return json({ 
			success: false, 
			error: error instanceof Error ? error.message : 'Unknown error' 
		}, { status: 500 });
	}
};

