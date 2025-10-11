-- =============================================
-- Migration 024: attendance_records 테이블 UNIQUE 제약조건 수정
-- =============================================
-- 목적: date 칼럼 제거 후, check_in_date 칼럼 + TRIGGER + UNIQUE 제약조건 추가
-- =============================================

BEGIN;

-- 기존 UNIQUE 제약조건 제거 (date 칼럼 사용)
ALTER TABLE attendance_records
DROP CONSTRAINT IF EXISTS attendance_records_employee_id_date_key CASCADE;

-- check_in_date 칼럼 추가 (일반 칼럼)
ALTER TABLE attendance_records
ADD COLUMN IF NOT EXISTS check_in_date DATE;

-- 기존 데이터의 check_in_date 채우기
UPDATE attendance_records
SET check_in_date = check_in_time::date
WHERE check_in_date IS NULL AND check_in_time IS NOT NULL;

-- TRIGGER 함수 생성: check_in_time 변경 시 check_in_date 자동 업데이트
CREATE OR REPLACE FUNCTION update_attendance_records_check_in_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.check_in_date = NEW.check_in_time::date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER 생성
DROP TRIGGER IF EXISTS trigger_update_attendance_records_check_in_date ON attendance_records;
CREATE TRIGGER trigger_update_attendance_records_check_in_date
  BEFORE INSERT OR UPDATE OF check_in_time ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_records_check_in_date();

-- UNIQUE 제약조건 생성
ALTER TABLE attendance_records
ADD CONSTRAINT attendance_records_employee_id_check_in_date_unique 
UNIQUE (employee_id, check_in_date);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ attendance_records UNIQUE 제약조건 수정 완료!';
  RAISE NOTICE '   - check_in_date 칼럼 추가 (TRIGGER 자동 업데이트)';
  RAISE NOTICE '   - UNIQUE: (employee_id, check_in_date)';
END $$;

COMMIT;

