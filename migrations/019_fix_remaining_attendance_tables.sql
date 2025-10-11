-- Migration: Fix remaining attendance-related tables
-- Description: attendance_records, attendance_settings, attendance_backup 테이블 TIMESTAMPTZ 변환
-- Date: 2024-10-11

-- =====================================================
-- 1. attendance_records 테이블
-- =====================================================
-- 시간 컬럼 변환
ALTER TABLE attendance_records
  ALTER COLUMN check_in_time TYPE TIMESTAMPTZ
    USING check_in_time AT TIME ZONE 'Asia/Seoul',
  ALTER COLUMN check_out_time TYPE TIMESTAMPTZ
    USING check_out_time AT TIME ZONE 'Asia/Seoul',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ
    USING created_at AT TIME ZONE 'Asia/Seoul',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ
    USING updated_at AT TIME ZONE 'Asia/Seoul';

-- 생성 컬럼 추가 (날짜 집계용)
ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS local_date_kr DATE
  GENERATED ALWAYS AS ((check_in_time AT TIME ZONE 'Asia/Seoul')::date) STORED;

CREATE INDEX IF NOT EXISTS idx_attendance_records_local_date_kr 
  ON attendance_records(local_date_kr);

-- =====================================================
-- 2. attendance_settings 테이블
-- =====================================================
ALTER TABLE attendance_settings
  ALTER COLUMN created_at TYPE TIMESTAMPTZ
    USING created_at AT TIME ZONE 'Asia/Seoul',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ
    USING updated_at AT TIME ZONE 'Asia/Seoul';

-- =====================================================
-- 3. attendance_backup_20241011 테이블 (백업이므로 선택적)
-- =====================================================
-- 백업 테이블도 일관성을 위해 변환
ALTER TABLE attendance_backup_20241011
  ALTER COLUMN check_in_time TYPE TIMESTAMPTZ
    USING check_in_time AT TIME ZONE 'Asia/Seoul',
  ALTER COLUMN check_out_time TYPE TIMESTAMPTZ
    USING check_out_time AT TIME ZONE 'Asia/Seoul',
  ALTER COLUMN break_start_time TYPE TIMESTAMPTZ
    USING break_start_time AT TIME ZONE 'Asia/Seoul',
  ALTER COLUMN break_end_time TYPE TIMESTAMPTZ
    USING break_end_time AT TIME ZONE 'Asia/Seoul',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ
    USING created_at AT TIME ZONE 'Asia/Seoul',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ
    USING updated_at AT TIME ZONE 'Asia/Seoul';

-- =====================================================
-- 검증
-- =====================================================
DO $$
DECLARE
  wrong_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO wrong_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name LIKE '%attendance%'
    AND data_type = 'timestamp without time zone';

  IF wrong_count > 0 THEN
    RAISE WARNING '⚠️  아직 %개의 TIMESTAMP WITHOUT TIME ZONE이 남아있습니다.', wrong_count;
  ELSE
    RAISE NOTICE '✅ 모든 attendance 관련 테이블이 TIMESTAMPTZ로 변환되었습니다!';
  END IF;
END $$;

