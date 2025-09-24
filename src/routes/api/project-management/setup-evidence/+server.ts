import { query } from "$lib/database/connection";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { logger } from "$lib/utils/logger";

// POST /api/project-management/setup-evidence - 증빙 내역 테이블 설정
export const POST: RequestHandler = async () => {
  try {
    // 사업비 증빙 내역 테이블 생성
    await query(`
			CREATE TABLE IF NOT EXISTS budget_evidence (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				project_budget_id UUID NOT NULL REFERENCES project_budgets(id) ON DELETE CASCADE,
				evidence_type VARCHAR(50) NOT NULL,
				title VARCHAR(255) NOT NULL,
				description TEXT,
				amount DECIMAL(15,2) NOT NULL,
				evidence_date DATE NOT NULL,
				file_path VARCHAR(500),
				file_name VARCHAR(255),
				file_size INTEGER,
				mime_type VARCHAR(100),
				status VARCHAR(20) DEFAULT 'pending',
				created_by UUID REFERENCES employees(id),
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				approved_by UUID REFERENCES employees(id),
				approved_at TIMESTAMP,
				rejection_reason TEXT
			)
		`);

    // 증빙 유형 테이블 생성
    await query(`
			CREATE TABLE IF NOT EXISTS evidence_types (
				id SERIAL PRIMARY KEY,
				code VARCHAR(50) UNIQUE NOT NULL,
				name VARCHAR(100) NOT NULL,
				description TEXT,
				is_active BOOLEAN DEFAULT true,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`);

    // 기본 증빙 유형 데이터 삽입
    await query(`
			INSERT INTO evidence_types (code, name, description) VALUES
			('receipt', '영수증', '구매 영수증'),
			('invoice', '세금계산서', '세금계산서'),
			('contract', '계약서', '계약서'),
			('quotation', '견적서', '견적서'),
			('payment_voucher', '지출증빙', '지출증빙서'),
			('other', '기타', '기타 증빙서류')
			ON CONFLICT (code) DO NOTHING
		`);

    // 인덱스 생성
    await query(
      `CREATE INDEX IF NOT EXISTS idx_budget_evidence_project_budget_id ON budget_evidence(project_budget_id)`,
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_budget_evidence_evidence_date ON budget_evidence(evidence_date)`,
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_budget_evidence_status ON budget_evidence(status)`,
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_budget_evidence_created_by ON budget_evidence(created_by)`,
    );

    // 트리거 함수 생성
    await query(`
			CREATE OR REPLACE FUNCTION update_project_budget_spent_amount()
			RETURNS TRIGGER AS $$
			BEGIN
				IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
					UPDATE project_budgets 
					SET spent_amount = COALESCE(spent_amount, 0) + NEW.amount
					WHERE id = NEW.project_budget_id;
				END IF;
				
				IF OLD.status = 'approved' AND NEW.status != 'approved' THEN
					UPDATE project_budgets 
					SET spent_amount = GREATEST(COALESCE(spent_amount, 0) - OLD.amount, 0)
					WHERE id = OLD.project_budget_id;
				END IF;
				
				RETURN NEW;
			END;
			$$ LANGUAGE plpgsql
		`);

    // 트리거 생성
    await query(`
			DROP TRIGGER IF EXISTS trigger_update_budget_spent_amount ON budget_evidence;
			CREATE TRIGGER trigger_update_budget_spent_amount
				AFTER INSERT OR UPDATE ON budget_evidence
				FOR EACH ROW
				EXECUTE FUNCTION update_project_budget_spent_amount()
		`);

    // 업데이트 시간 트리거 함수
    await query(`
			CREATE OR REPLACE FUNCTION update_updated_at_column()
			RETURNS TRIGGER AS $$
			BEGIN
				NEW.updated_at = CURRENT_TIMESTAMP;
				RETURN NEW;
			END;
			$$ LANGUAGE plpgsql
		`);

    // 업데이트 시간 트리거
    await query(`
			DROP TRIGGER IF EXISTS trigger_budget_evidence_updated_at ON budget_evidence;
			CREATE TRIGGER trigger_budget_evidence_updated_at
				BEFORE UPDATE ON budget_evidence
				FOR EACH ROW
				EXECUTE FUNCTION update_updated_at_column()
		`);

    return json({
      success: true,
      message: "증빙 내역 테이블이 성공적으로 설정되었습니다.",
    });
  } catch (error) {
    logger.error("증빙 내역 테이블 설정 실패:", error);
    return json(
      {
        success: false,
        message: "증빙 내역 테이블 설정에 실패했습니다.",
        error: (error as Error).message,
      },
      { status: 500 },
    );
  }
};
