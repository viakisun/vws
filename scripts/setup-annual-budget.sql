-- 연차별 예산 관리 시스템 테이블 생성

-- 프로젝트 연차별 예산 테이블
CREATE TABLE IF NOT EXISTS project_annual_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    year INTEGER NOT NULL CHECK (year > 0), -- 연차 (1차년도, 2차년도 등)
    start_date DATE, -- 연차 시작일
    end_date DATE, -- 연차 종료일
    
    -- 지원금 (현금만)
    government_funding DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (government_funding >= 0),
    
    -- 기업부담금
    company_cash DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (company_cash >= 0), -- 기업부담금 (현금)
    company_in_kind DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (company_in_kind >= 0), -- 기업부담금 (현물)
    
    -- 계산된 값들 (트리거로 자동 계산)
    total_cash DECIMAL(15,2) GENERATED ALWAYS AS (government_funding + company_cash) STORED, -- 현금 총액
    total_in_kind DECIMAL(15,2) GENERATED ALWAYS AS (company_in_kind) STORED, -- 현물 총액
    yearly_total DECIMAL(15,2) GENERATED ALWAYS AS (government_funding + company_cash + company_in_kind) STORED, -- 연차 사업비
    
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'active', 'completed')),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 제약 조건
    UNIQUE(project_id, year), -- 프로젝트별 연차는 중복될 수 없음
    CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date) -- 시작일은 종료일보다 이전이어야 함
);

-- 프로젝트 예산 요약 뷰
CREATE OR REPLACE VIEW project_budget_summary AS
SELECT 
    p.id as project_id,
    p.code as project_code,
    p.title as project_title,
    COUNT(pab.id) as total_years,
    COALESCE(SUM(pab.yearly_total), 0) as total_budget,
    COALESCE(SUM(pab.government_funding), 0) as total_government_funding,
    COALESCE(SUM(pab.company_cash), 0) as total_company_cash,
    COALESCE(SUM(pab.company_in_kind), 0) as total_company_in_kind,
    COALESCE(SUM(pab.total_cash), 0) as total_cash,
    COALESCE(SUM(pab.total_in_kind), 0) as total_in_kind,
    
    -- 비율 계산 (0으로 나누기 방지)
    CASE 
        WHEN COALESCE(SUM(pab.yearly_total), 0) = 0 THEN 0 
        ELSE ROUND((COALESCE(SUM(pab.government_funding), 0) * 100.0 / SUM(pab.yearly_total)), 2) 
    END as government_funding_ratio,
    
    CASE 
        WHEN COALESCE(SUM(pab.yearly_total), 0) = 0 THEN 0 
        ELSE ROUND(((COALESCE(SUM(pab.company_cash), 0) + COALESCE(SUM(pab.company_in_kind), 0)) * 100.0 / SUM(pab.yearly_total)), 2) 
    END as company_burden_ratio,
    
    CASE 
        WHEN COALESCE(SUM(pab.yearly_total), 0) = 0 THEN 0 
        ELSE ROUND((COALESCE(SUM(pab.total_cash), 0) * 100.0 / SUM(pab.yearly_total)), 2) 
    END as cash_ratio,
    
    CASE 
        WHEN COALESCE(SUM(pab.yearly_total), 0) = 0 THEN 0 
        ELSE ROUND((COALESCE(SUM(pab.total_in_kind), 0) * 100.0 / SUM(pab.yearly_total)), 2) 
    END as in_kind_ratio
    
FROM projects p
LEFT JOIN project_annual_budgets pab ON p.id = pab.project_id
GROUP BY p.id, p.code, p.title;

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_project_annual_budget_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 트리거
DROP TRIGGER IF EXISTS trigger_update_project_annual_budget_updated_at ON project_annual_budgets;
CREATE TRIGGER trigger_update_project_annual_budget_updated_at
    BEFORE UPDATE ON project_annual_budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_project_annual_budget_updated_at();

-- 프로젝트 총 예산 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_project_total_budget()
RETURNS TRIGGER AS $$
BEGIN
    -- 프로젝트의 총 예산을 연차별 예산 합계로 업데이트
    UPDATE projects 
    SET budget_total = (
        SELECT COALESCE(SUM(yearly_total), 0) 
        FROM project_annual_budgets 
        WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 프로젝트 총 예산 업데이트 트리거
DROP TRIGGER IF EXISTS trigger_update_project_total_budget_insert ON project_annual_budgets;
DROP TRIGGER IF EXISTS trigger_update_project_total_budget_update ON project_annual_budgets;
DROP TRIGGER IF EXISTS trigger_update_project_total_budget_delete ON project_annual_budgets;

CREATE TRIGGER trigger_update_project_total_budget_insert
    AFTER INSERT ON project_annual_budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_project_total_budget();

CREATE TRIGGER trigger_update_project_total_budget_update
    AFTER UPDATE ON project_annual_budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_project_total_budget();

CREATE TRIGGER trigger_update_project_total_budget_delete
    AFTER DELETE ON project_annual_budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_project_total_budget();

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_project_annual_budgets_project_id ON project_annual_budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_project_annual_budgets_year ON project_annual_budgets(year);
CREATE INDEX IF NOT EXISTS idx_project_annual_budgets_status ON project_annual_budgets(status);

-- 성공 메시지
DO $$
BEGIN
    RAISE NOTICE '연차별 예산 관리 시스템 테이블이 성공적으로 생성되었습니다.';
    RAISE NOTICE '- project_annual_budgets 테이블: 연차별 세부 예산 관리';
    RAISE NOTICE '- project_budget_summary 뷰: 프로젝트별 예산 요약';
    RAISE NOTICE '- 자동 계산 필드: total_cash, total_in_kind, yearly_total';
    RAISE NOTICE '- 자동 업데이트: projects.budget_total';
END $$;
