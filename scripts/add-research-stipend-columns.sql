-- 연구수당 컬럼 추가 마이그레이션 스크립트
-- 실행 전에 데이터베이스 백업을 권장합니다.

-- project_budgets 테이블에 연구수당 컬럼 추가
ALTER TABLE project_budgets 
ADD COLUMN IF NOT EXISTS research_stipend DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS research_stipend_cash DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS research_stipend_in_kind DECIMAL(15,2) DEFAULT 0;

-- 컬럼 추가 확인
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'project_budgets' 
AND column_name LIKE '%research_stipend%'
ORDER BY column_name;

-- 기존 데이터의 research_stipend 컬럼을 0으로 초기화 (이미 DEFAULT 0이므로 불필요하지만 명시적으로)
UPDATE project_budgets 
SET research_stipend = 0, 
    research_stipend_cash = 0, 
    research_stipend_in_kind = 0 
WHERE research_stipend IS NULL 
   OR research_stipend_cash IS NULL 
   OR research_stipend_in_kind IS NULL;

-- 마이그레이션 완료 메시지
SELECT 'Research stipend columns added successfully to project_budgets table' as status;
