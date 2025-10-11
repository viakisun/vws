-- Migration: Add Research & Development Project Fields
-- 연구개발사업에 필요한 추가 필드 생성

-- 1. 새 컬럼 추가
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS project_task_name TEXT,              -- 과제명
  ADD COLUMN IF NOT EXISTS dedicated_agency TEXT,               -- 전담기관
  ADD COLUMN IF NOT EXISTS dedicated_agency_contact_name TEXT,  -- 전담기관 담당자 이름
  ADD COLUMN IF NOT EXISTS dedicated_agency_contact_phone TEXT, -- 전담기관 담당자 전화번호
  ADD COLUMN IF NOT EXISTS dedicated_agency_contact_email TEXT; -- 전담기관 담당자 이메일

-- 2. 컬럼 설명 추가
COMMENT ON COLUMN projects.project_task_name IS '과제명';
COMMENT ON COLUMN projects.dedicated_agency IS '전담기관';
COMMENT ON COLUMN projects.dedicated_agency_contact_name IS '전담기관 담당자 이름';
COMMENT ON COLUMN projects.dedicated_agency_contact_phone IS '전담기관 담당자 전화번호';
COMMENT ON COLUMN projects.dedicated_agency_contact_email IS '전담기관 담당자 이메일';

-- 3. title 컬럼 설명 업데이트
COMMENT ON COLUMN projects.title IS '사업명';
COMMENT ON COLUMN projects.sponsor IS '주관기관';

-- 4. start_date, end_date는 유지하되, 재원구성(project_budgets)에서 계산 가능하도록 표시
COMMENT ON COLUMN projects.start_date IS '사업 시작일 (재원구성에서 계산 가능)';
COMMENT ON COLUMN projects.end_date IS '사업 종료일 (재원구성에서 계산 가능)';

