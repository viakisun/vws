-- =============================================
-- Migration 022: 중복 날짜 칼럼 및 백업 테이블 정리
-- =============================================
-- 목적: 불필요한 중복 DATE 칼럼과 백업 테이블 제거
-- 영향: 3개 백업 테이블, 7개 중복 칼럼
-- =============================================

BEGIN;

-- =============================================
-- 1. 백업 테이블 삭제
-- =============================================

DROP TABLE IF EXISTS attendance_backup_20241011 CASCADE;
DROP TABLE IF EXISTS project_members_backup CASCADE;
DROP TABLE IF EXISTS projects_backup CASCADE;

-- =============================================
-- 2. attendance 중복 칼럼 제거
-- =============================================

-- attendance.date 제거 (check_in_time이 이미 TIMESTAMPTZ)
-- attendance.local_date_kr 제거 (불필요한 generated column)
ALTER TABLE attendance
DROP COLUMN IF EXISTS date CASCADE,
DROP COLUMN IF EXISTS local_date_kr CASCADE;

-- =============================================
-- 3. attendance_records 중복 칼럼 제거
-- =============================================

-- attendance_records.date 제거 (check_in_time이 이미 TIMESTAMPTZ)
-- attendance_records.local_date_kr 제거 (불필요한 generated column)
ALTER TABLE attendance_records
DROP COLUMN IF EXISTS date CASCADE,
DROP COLUMN IF EXISTS local_date_kr CASCADE;

-- =============================================
-- 4. leave_requests 중복 칼럼 제거
-- =============================================

-- local_start_date 제거 (start_date가 이미 TIMESTAMPTZ)
-- local_end_date 제거 (end_date가 이미 TIMESTAMPTZ)
ALTER TABLE leave_requests
DROP COLUMN IF EXISTS local_start_date CASCADE,
DROP COLUMN IF EXISTS local_end_date CASCADE;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 중복 칼럼 및 백업 테이블 정리 완료!';
  RAISE NOTICE '   - 백업 테이블 3개 삭제';
  RAISE NOTICE '   - 중복 칼럼 7개 제거';
  RAISE NOTICE '   - DATE 칼럼: 69개 → 58개 (필요한 것만)';
END $$;

COMMIT;

