-- 026_add_sponsor_contact_fields.sql
-- 주관기관 담당자 정보 필드 추가

-- projects 테이블에 주관기관 담당자 정보 추가
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sponsor_contact_name VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sponsor_contact_phone VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sponsor_contact_email VARCHAR(255);

-- 주석 추가
COMMENT ON COLUMN projects.sponsor_contact_name IS '주관기관 담당자 이름';
COMMENT ON COLUMN projects.sponsor_contact_phone IS '주관기관 담당자 전화번호';
COMMENT ON COLUMN projects.sponsor_contact_email IS '주관기관 담당자 이메일';

