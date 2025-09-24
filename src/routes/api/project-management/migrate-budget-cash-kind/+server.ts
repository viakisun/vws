import { query } from "$lib/database/connection";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { logger } from "$lib/utils/logger";

// 사업비 테이블에 현물/현금 구분 컬럼 추가
export const POST: RequestHandler = async () => {
  try {
    // 사업비 테이블에 현물/현금 구분 컬럼 추가
    await query(`
			ALTER TABLE project_budgets 
			ADD COLUMN IF NOT EXISTS contribution_type VARCHAR(20) DEFAULT 'cash'
		`);

    // 각 비목을 현물과 현금으로 구분하는 컬럼들 추가
    await query(`
			ALTER TABLE project_budgets 
			ADD COLUMN IF NOT EXISTS personnel_cost_cash DECIMAL(15,2) DEFAULT 0,
			ADD COLUMN IF NOT EXISTS personnel_cost_in_kind DECIMAL(15,2) DEFAULT 0,
			ADD COLUMN IF NOT EXISTS material_cost_cash DECIMAL(15,2) DEFAULT 0,
			ADD COLUMN IF NOT EXISTS material_cost_in_kind DECIMAL(15,2) DEFAULT 0,
			ADD COLUMN IF NOT EXISTS research_activity_cost_cash DECIMAL(15,2) DEFAULT 0,
			ADD COLUMN IF NOT EXISTS research_activity_cost_in_kind DECIMAL(15,2) DEFAULT 0,
			ADD COLUMN IF NOT EXISTS indirect_cost_cash DECIMAL(15,2) DEFAULT 0,
			ADD COLUMN IF NOT EXISTS indirect_cost_in_kind DECIMAL(15,2) DEFAULT 0,
			ADD COLUMN IF NOT EXISTS other_cost_cash DECIMAL(15,2) DEFAULT 0,
			ADD COLUMN IF NOT EXISTS other_cost_in_kind DECIMAL(15,2) DEFAULT 0
		`);

    // 기존 데이터를 현금으로 마이그레이션 (기존 값들을 현금 컬럼으로 이동)
    await query(`
			UPDATE project_budgets SET 
				personnel_cost_cash = COALESCE(personnel_cost, 0),
				material_cost_cash = COALESCE(material_cost, 0),
				research_activity_cost_cash = COALESCE(research_activity_cost, 0),
				indirect_cost_cash = COALESCE(indirect_cost, 0),
				other_cost_cash = COALESCE(other_cost, 0)
			WHERE personnel_cost_cash = 0 AND material_cost_cash = 0 AND research_activity_cost_cash = 0 AND indirect_cost_cash = 0 AND other_cost_cash = 0
		`);

    // 기존 컬럼들은 계산된 값으로 업데이트 (현금 + 현물)
    await query(`
			UPDATE project_budgets SET 
				personnel_cost = personnel_cost_cash + personnel_cost_in_kind,
				material_cost = material_cost_cash + material_cost_in_kind,
				research_activity_cost = research_activity_cost_cash + research_activity_cost_in_kind,
				indirect_cost = indirect_cost_cash + indirect_cost_in_kind,
				other_cost = other_cost_cash + other_cost_in_kind
		`);

    // 총 예산도 업데이트
    await query(`
			UPDATE project_budgets SET 
				total_budget = personnel_cost + material_cost + research_activity_cost + indirect_cost + other_cost
		`);

    return json({
      success: true,
      message: "사업비 현물/현금 구분 컬럼이 성공적으로 추가되었습니다.",
    });
  } catch (error) {
    logger.error("사업비 현물/현금 구분 컬럼 추가 실패:", error);
    return json(
      {
        success: false,
        message: "사업비 현물/현금 구분 컬럼 추가에 실패했습니다.",
        error: (error as Error).message,
      },
      { status: 500 },
    );
  }
};
