-- Migration: Remove start_date and end_date from projects table
-- 사업 기간은 재원구성(project_budgets)에서 유추 가능하므로 별도 관리 불필요

-- 1. start_date, end_date 컬럼 삭제
ALTER TABLE projects 
  DROP COLUMN IF EXISTS start_date,
  DROP COLUMN IF EXISTS end_date;

-- 2. 관련 주석 업데이트
COMMENT ON TABLE projects IS '연구개발사업 기본 정보 (사업 기간은 project_budgets에서 유추)';

