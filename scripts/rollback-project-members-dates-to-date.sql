-- 프로젝트 멤버 테이블의 TIMESTAMP 컬럼을 DATE로 롤백
-- 마이그레이션 실패 시 사용

-- 1. 백업 테이블에서 원본 데이터 복원
DROP TABLE IF EXISTS project_members;
CREATE TABLE project_members AS SELECT * FROM project_members_backup;

-- 2. 프로젝트 테이블도 복원
DROP TABLE IF EXISTS projects;
CREATE TABLE projects AS SELECT * FROM projects_backup;

-- 3. 원본 인덱스들 재생성
CREATE UNIQUE INDEX project_members_project_id_employee_id_start_date_key 
ON project_members (project_id, employee_id, start_date);

CREATE INDEX IF NOT EXISTS idx_project_members_employee ON project_members (employee_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members (project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_status ON project_members (status);

-- 4. 백업 테이블 정리 (선택사항)
-- DROP TABLE project_members_backup;
-- DROP TABLE projects_backup;

SELECT 'Rollback completed: TIMESTAMP columns reverted to DATE' AS status;
