-- 사업비 테이블을 간소화된 구조로 변경
-- 직접비(인건비, 연구재료비, 연구활동비) + 간접비

-- 기존 컬럼들 제거 (other_cost 관련)
ALTER TABLE project_budgets 
DROP COLUMN IF EXISTS other_cost,
DROP COLUMN IF EXISTS other_cost_cash,
DROP COLUMN IF EXISTS other_cost_in_kind;

-- material_cost를 research_material_cost로 변경 (연구재료비)
ALTER TABLE project_budgets 
RENAME COLUMN material_cost TO research_material_cost;

ALTER TABLE project_budgets 
RENAME COLUMN material_cost_cash TO research_material_cost_cash;

ALTER TABLE project_budgets 
RENAME COLUMN material_cost_in_kind TO research_material_cost_in_kind;

-- 총 예산 재계산 (기타 제외)
UPDATE project_budgets SET 
    total_budget = personnel_cost + research_material_cost + research_activity_cost + indirect_cost;
