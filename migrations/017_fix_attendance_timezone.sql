-- Migration: Fix attendance table timezone issues
-- Description: TIMESTAMP를 TIMESTAMPTZ로 변경하여 타임존 정보 보존
-- Date: 2024-10-11
-- Issue: 데이터가 한국 시간(KST)으로 저장되었지만 DB 타임존이 UTC라서
--        TIMESTAMP WITHOUT TIMEZONE이 잘못 해석됨

-- 현재 상황:
--   - DB 타임존: UTC
--   - 저장된 시간: 09:53 (한국 시간)
--   - 문제: DB가 이를 UTC 09:53으로 해석 → KST 변환 시 18:53 (잘못!)
--
-- 해결 방법:
--   1. TIMESTAMPTZ로 변경
--   2. 기존 값을 'Asia/Seoul' 타임존으로 해석 (실제 저장 의도)
--   3. 그러면 자동으로 UTC로 저장됨 (09:53 KST → 00:53 UTC)
--   4. 조회 시 Asia/Seoul로 변환하면 09:53 표시 ✅

-- 1. 백업 테이블 생성
CREATE TABLE IF NOT EXISTS attendance_backup_20241011 AS
SELECT * FROM attendance;

-- 2. attendance 테이블의 타임스탬프 컬럼들을 TIMESTAMPTZ로 변경
-- 핵심: 기존 값을 'Asia/Seoul' 타임존으로 해석!
-- (실제로 한국 시간으로 저장되었기 때문)

-- check_in_time: 09:53 (KST) → 00:53 (UTC)로 자동 변환
ALTER TABLE attendance
  ALTER COLUMN check_in_time TYPE TIMESTAMPTZ
    USING check_in_time AT TIME ZONE 'Asia/Seoul';

-- check_out_time
ALTER TABLE attendance
  ALTER COLUMN check_out_time TYPE TIMESTAMPTZ
    USING check_out_time AT TIME ZONE 'Asia/Seoul';

-- break_start_time
ALTER TABLE attendance
  ALTER COLUMN break_start_time TYPE TIMESTAMPTZ
    USING break_start_time AT TIME ZONE 'Asia/Seoul';

-- break_end_time
ALTER TABLE attendance
  ALTER COLUMN break_end_time TYPE TIMESTAMPTZ
    USING break_end_time AT TIME ZONE 'Asia/Seoul';

-- created_at
ALTER TABLE attendance
  ALTER COLUMN created_at TYPE TIMESTAMPTZ
    USING created_at AT TIME ZONE 'Asia/Seoul';

-- updated_at
ALTER TABLE attendance
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ
    USING updated_at AT TIME ZONE 'Asia/Seoul';

-- 3. 변경 사항 로깅
DO $$
BEGIN
  RAISE NOTICE '✅ attendance 테이블 타임존 변경 완료';
  RAISE NOTICE '   - TIMESTAMP → TIMESTAMPTZ 변환 완료';
  RAISE NOTICE '   - 기존 데이터를 Asia/Seoul 기준으로 해석하여 UTC로 변환';
  RAISE NOTICE '   - 백업 테이블: attendance_backup_20241011';
  RAISE NOTICE '';
  RAISE NOTICE '📝 이제 조회 시 다음과 같이 사용하세요:';
  RAISE NOTICE '   TO_CHAR(check_in_time AT TIME ZONE ''Asia/Seoul'', ''YYYY-MM-DD HH24:MI:SS'')';
END $$;

-- 4. 변경 후 데이터 검증 쿼리
SELECT
  '✅ 마이그레이션 검증' as status,
  date,
  TO_CHAR(check_in_time, 'YYYY-MM-DD HH24:MI:SS TZ') as check_in_raw,
  TO_CHAR(check_in_time AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') as check_in_utc,
  TO_CHAR(check_in_time AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') as check_in_kst,
  pg_typeof(check_in_time) as type
FROM attendance
WHERE date = '2024-10-10'
  AND check_in_time IS NOT NULL
LIMIT 5;

