-- Migration: Add generated date columns for aggregation
-- Description: 한국 기준 날짜 컬럼 추가 (집계/인덱싱용)
-- Date: 2024-10-11
-- Purpose: GROUP BY, WHERE 절에서 빠른 날짜 검색을 위한 생성 컬럼

-- =====================================================
-- 핵심 원칙:
-- 1. 레코드 원본(check_in_time)은 UTC ISO 문자열로 반환
-- 2. 집계/통계는 생성 컬럼(local_date_kr) 사용
-- 3. 프론트엔드에서 원본을 로컬 시간으로 변환
-- =====================================================

-- 1. attendance 테이블: 한국 기준 날짜 추가
ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS local_date_kr DATE
  GENERATED ALWAYS AS ((check_in_time AT TIME ZONE 'Asia/Seoul')::date) STORED;

-- 인덱스 생성 (날짜 범위 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_attendance_local_date_kr 
  ON attendance(local_date_kr);

-- 복합 인덱스 (직원별 날짜 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_attendance_employee_local_date 
  ON attendance(employee_id, local_date_kr);

COMMENT ON COLUMN attendance.local_date_kr IS '한국 기준 날짜 (집계/인덱싱용). 레코드 조회 시에는 check_in_time(UTC)을 사용하세요.';

-- 2. leave_requests 테이블: 한국 기준 날짜 추가
ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS local_start_date DATE
  GENERATED ALWAYS AS ((start_date AT TIME ZONE 'Asia/Seoul')::date) STORED;

ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS local_end_date DATE
  GENERATED ALWAYS AS ((end_date AT TIME ZONE 'Asia/Seoul')::date) STORED;

CREATE INDEX IF NOT EXISTS idx_leave_requests_local_start_date 
  ON leave_requests(local_start_date);

CREATE INDEX IF NOT EXISTS idx_leave_requests_local_end_date 
  ON leave_requests(local_end_date);

-- 3. 생성 컬럼 검증 쿼리
DO $$
DECLARE
  attendance_count INTEGER;
  leave_count INTEGER;
BEGIN
  -- attendance 생성 컬럼 확인
  SELECT COUNT(*) INTO attendance_count
  FROM information_schema.columns
  WHERE table_name = 'attendance' 
    AND column_name = 'local_date_kr'
    AND is_generated = 'ALWAYS';

  -- leave_requests 생성 컬럼 확인
  SELECT COUNT(*) INTO leave_count
  FROM information_schema.columns
  WHERE table_name = 'leave_requests' 
    AND column_name IN ('local_start_date', 'local_end_date')
    AND is_generated = 'ALWAYS';

  IF attendance_count > 0 THEN
    RAISE NOTICE '✅ attendance.local_date_kr 생성 완료';
  ELSE
    RAISE WARNING '⚠️  attendance.local_date_kr 생성 실패';
  END IF;

  IF leave_count = 2 THEN
    RAISE NOTICE '✅ leave_requests 생성 컬럼 완료';
  ELSE
    RAISE WARNING '⚠️  leave_requests 생성 컬럼 생성 실패';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '📝 사용 가이드:';
  RAISE NOTICE '   집계: SELECT local_date_kr, COUNT(*) FROM attendance GROUP BY local_date_kr';
  RAISE NOTICE '   조회: SELECT check_in_time FROM attendance WHERE local_date_kr = ''2024-10-10''';
  RAISE NOTICE '   주의: 레코드 값은 항상 원본(UTC ISO)으로 반환!';
END $$;

