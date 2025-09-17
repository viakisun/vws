import { query } from '$lib/database/connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// 사업비 테이블을 간소화된 구조로 변경
export const POST: RequestHandler = async () => {
	try {
		// 기존 컬럼들 제거 (other_cost 관련)
		await query(`
			ALTER TABLE project_budgets 
			DROP COLUMN IF EXISTS other_cost,
			DROP COLUMN IF EXISTS other_cost_cash,
			DROP COLUMN IF EXISTS other_cost_in_kind
		`);

		// material_cost를 research_material_cost로 변경 (연구재료비)
		await query(`
			ALTER TABLE project_budgets 
			RENAME COLUMN material_cost TO research_material_cost
		`);

		await query(`
			ALTER TABLE project_budgets 
			RENAME COLUMN material_cost_cash TO research_material_cost_cash
		`);

		await query(`
			ALTER TABLE project_budgets 
			RENAME COLUMN material_cost_in_kind TO research_material_cost_in_kind
		`);

		// 총 예산 재계산 (기타 제외)
		await query(`
			UPDATE project_budgets SET 
				total_budget = personnel_cost + research_material_cost + research_activity_cost + indirect_cost
		`);

		return json({
			success: true,
			message: '사업비 구조가 간소화되었습니다.'
		});
	} catch (error) {
		console.error('사업비 구조 간소화 실패:', error);
		return json({
			success: false,
			message: '사업비 구조 간소화에 실패했습니다.',
			error: (error as Error).message
		}, { status: 500 });
	}
};
