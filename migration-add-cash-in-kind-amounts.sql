-- project_members 테이블에 현금/현물 금액 필드 추가 및 contribution_type 필드 제거

-- 1. 현금/현물 금액 필드 추가
ALTER TABLE project_members 
ADD COLUMN cash_amount numeric(12,2) DEFAULT 0,
ADD COLUMN in_kind_amount numeric(12,2) DEFAULT 0;

-- 2. 기존 contribution_type 데이터를 새로운 필드로 마이그레이션
-- (기존 데이터가 있다면 cash로 설정)
UPDATE project_members 
SET cash_amount = monthly_amount 
WHERE contribution_type = 'cash' AND monthly_amount > 0;

UPDATE project_members 
SET in_kind_amount = monthly_amount 
WHERE contribution_type = 'in_kind' AND monthly_amount > 0;

-- 3. contribution_type 필드 제거
ALTER TABLE project_members DROP COLUMN contribution_type;

-- 4. 인덱스 추가 (성능 향상)
CREATE INDEX idx_project_members_cash_amount ON project_members(cash_amount);
CREATE INDEX idx_project_members_in_kind_amount ON project_members(in_kind_amount);
