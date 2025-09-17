-- 사업비 테이블에 현물/현금 구분 컬럼 추가
-- 각 비목을 현물과 현금으로 구분할 수 있도록 테이블 구조 수정

-- 기존 project_budgets 테이블에 현물/현금 구분 컬럼 추가
ALTER TABLE project_budgets 
ADD COLUMN IF NOT EXISTS contribution_type VARCHAR(20) DEFAULT 'cash';

-- 각 비목을 현물과 현금으로 구분하는 컬럼들 추가
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
ADD COLUMN IF NOT EXISTS other_cost_in_kind DECIMAL(15,2) DEFAULT 0;

-- 기존 데이터를 현금으로 마이그레이션 (기존 값들을 현금 컬럼으로 이동)
UPDATE project_budgets SET 
    personnel_cost_cash = COALESCE(personnel_cost, 0),
    material_cost_cash = COALESCE(material_cost, 0),
    research_activity_cost_cash = COALESCE(research_activity_cost, 0),
    indirect_cost_cash = COALESCE(indirect_cost, 0),
    other_cost_in_kind = COALESCE(other_cost, 0)
WHERE personnel_cost_cash = 0 AND material_cost_cash = 0 AND research_activity_cost_cash = 0 AND indirect_cost_cash = 0 AND other_cost_cash = 0;

-- 기존 컬럼들은 계산된 값으로 업데이트 (현금 + 현물)
UPDATE project_budgets SET 
    personnel_cost = personnel_cost_cash + personnel_cost_in_kind,
    material_cost = material_cost_cash + material_cost_in_kind,
    research_activity_cost = research_activity_cost_cash + research_activity_cost_in_kind,
    indirect_cost = indirect_cost_cash + indirect_cost_in_kind,
    other_cost = other_cost_cash + other_cost_in_kind;

-- 총 예산도 업데이트
UPDATE project_budgets SET 
    total_budget = personnel_cost + material_cost + research_activity_cost + indirect_cost + other_cost;
