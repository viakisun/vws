-- 프로젝트 멤버 테이블의 날짜 컬럼을 TIMESTAMP로 마이그레이션
-- UTC+9 타임존 정보를 보존하기 위해 DATE → TIMESTAMP 변경

-- 1. 백업 테이블 생성
CREATE TABLE project_members_backup AS SELECT * FROM project_members;

-- 2. 기존 인덱스 삭제 (start_date가 포함된 유니크 인덱스)
DROP INDEX IF EXISTS project_members_project_id_employee_id_start_date_key;

-- 3. 새로운 컬럼 추가 (TIMESTAMP 타입)
ALTER TABLE project_members 
ADD COLUMN start_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN end_timestamp TIMESTAMP WITH TIME ZONE;

-- 4. 기존 DATE 데이터를 TIMESTAMP로 변환 (UTC+9 타임존으로 해석)
UPDATE project_members 
SET 
    start_timestamp = (start_date || ' 00:00:00+09:00')::TIMESTAMP WITH TIME ZONE,
    end_timestamp = CASE 
        WHEN end_date IS NOT NULL THEN (end_date || ' 23:59:59+09:00')::TIMESTAMP WITH TIME ZONE
        ELSE NULL
    END;

-- 5. 기존 컬럼 삭제
ALTER TABLE project_members 
DROP COLUMN start_date,
DROP COLUMN end_date;

-- 6. 새 컬럼을 기존 이름으로 변경
ALTER TABLE project_members 
RENAME COLUMN start_timestamp TO start_date;
ALTER TABLE project_members 
RENAME COLUMN end_timestamp TO end_date;

-- 7. NOT NULL 제약조건 추가
ALTER TABLE project_members 
ALTER COLUMN start_date SET NOT NULL;

-- 8. 새로운 유니크 인덱스 생성 (start_date가 TIMESTAMP이므로 날짜 부분만 비교)
CREATE UNIQUE INDEX project_members_project_id_employee_id_start_date_key 
ON project_members (project_id, employee_id, DATE(start_date));

-- 9. 기존 인덱스들 재생성
CREATE INDEX IF NOT EXISTS idx_project_members_employee ON project_members (employee_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members (project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_status ON project_members (status);

-- 10. 프로젝트 테이블의 날짜 컬럼도 함께 변경 (일관성을 위해)
CREATE TABLE projects_backup AS SELECT * FROM projects;

-- 프로젝트 테이블에 새 컬럼 추가
ALTER TABLE projects 
ADD COLUMN start_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN end_timestamp TIMESTAMP WITH TIME ZONE;

-- 기존 데이터 변환
UPDATE projects 
SET 
    start_timestamp = CASE 
        WHEN start_date IS NOT NULL THEN (start_date || ' 00:00:00+09:00')::TIMESTAMP WITH TIME ZONE
        ELSE NULL
    END,
    end_timestamp = CASE 
        WHEN end_date IS NOT NULL THEN (end_date || ' 23:59:59+09:00')::TIMESTAMP WITH TIME ZONE
        ELSE NULL
    END;

-- 기존 컬럼 삭제 및 새 컬럼 이름 변경
ALTER TABLE projects 
DROP COLUMN start_date,
DROP COLUMN end_date;

ALTER TABLE projects 
RENAME COLUMN start_timestamp TO start_date;
ALTER TABLE projects 
RENAME COLUMN end_timestamp TO end_date;

-- 11. 마이그레이션 완료 메시지
SELECT 'Migration completed: DATE columns converted to TIMESTAMP WITH TIME ZONE' AS status;

-- 12. 데이터 검증
SELECT 
    'project_members' as table_name,
    COUNT(*) as total_records,
    COUNT(start_date) as start_date_count,
    COUNT(end_date) as end_date_count
FROM project_members
UNION ALL
SELECT 
    'projects' as table_name,
    COUNT(*) as total_records,
    COUNT(start_date) as start_date_count,
    COUNT(end_date) as end_date_count
FROM projects;
