-- 참여율 컬럼을 DECIMAL로 변경하는 마이그레이션 스크립트
-- 실행 전에 데이터베이스 백업을 권장합니다.

-- 1. project_members 테이블의 participation_rate 컬럼 변경
ALTER TABLE project_members 
ALTER COLUMN participation_rate TYPE DECIMAL(5,2);

-- 2. participation_assignments 테이블의 participation_rate 컬럼 변경
ALTER TABLE participation_assignments 
ALTER COLUMN participation_rate TYPE DECIMAL(5,2);

-- 3. participation_history 테이블의 participation_rate 컬럼 변경
ALTER TABLE participation_history 
ALTER COLUMN participation_rate TYPE DECIMAL(5,2);

-- 4. 기존 데이터의 participation_rate를 소수점 2자리로 정규화
UPDATE project_members 
SET participation_rate = ROUND(participation_rate, 2)
WHERE participation_rate IS NOT NULL;

UPDATE participation_assignments 
SET participation_rate = ROUND(participation_rate, 2)
WHERE participation_rate IS NOT NULL;

UPDATE participation_history 
SET participation_rate = ROUND(participation_rate, 2)
WHERE participation_rate IS NOT NULL;

-- 5. 컬럼 변경 확인
SELECT 
    table_name,
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE column_name = 'participation_rate'
ORDER BY table_name;

-- 마이그레이션 완료 메시지
SELECT 'Participation rate columns updated to DECIMAL(5,2) successfully' as status;
