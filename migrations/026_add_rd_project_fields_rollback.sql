-- Rollback: Remove Research & Development Project Fields
-- 연구개발사업 추가 필드 제거

-- 1. 컬럼 제거
ALTER TABLE projects 
  DROP COLUMN IF EXISTS project_task_name,
  DROP COLUMN IF EXISTS dedicated_agency,
  DROP COLUMN IF EXISTS dedicated_agency_contact_name,
  DROP COLUMN IF EXISTS dedicated_agency_contact_phone,
  DROP COLUMN IF EXISTS dedicated_agency_contact_email;

-- 2. 원래 컬럼 설명 복원
COMMENT ON COLUMN projects.title IS '프로젝트 제목';
COMMENT ON COLUMN projects.sponsor IS '후원 기관';
COMMENT ON COLUMN projects.start_date IS '시작일';
COMMENT ON COLUMN projects.end_date IS '종료일';

