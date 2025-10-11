-- Migration: Add indexes for project_budgets to optimize view performance
-- v_projects_with_dates 뷰의 성능을 최적화하기 위한 인덱스 생성

-- 1. project_budgets 테이블에 복합 인덱스 생성
-- project_id로 빠르게 찾고, start_date/end_date를 MIN/MAX로 계산하기 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_project_budgets_project_dates 
ON project_budgets(project_id, start_date, end_date);

-- 2. 인덱스 설명 추가
COMMENT ON INDEX idx_project_budgets_project_dates IS 
'v_projects_with_dates 뷰의 MIN/MAX 계산 성능 최적화를 위한 복합 인덱스';

-- 3. 기존 인덱스 확인 (이미 있을 수 있음)
-- 이미 project_id 인덱스가 있다면 복합 인덱스가 그 역할도 수행함

