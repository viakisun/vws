-- Rollback: Restore start_date and end_date to projects table

-- 1. start_date, end_date 컬럼 복원
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;

-- 2. 컬럼 설명 복원
COMMENT ON COLUMN projects.start_date IS '사업 시작일';
COMMENT ON COLUMN projects.end_date IS '사업 종료일';

