-- 020_fix_leave_timestamp.sql
-- Fix leave_requests table timestamp columns to use TIMESTAMPTZ

BEGIN;

-- 1. approved_at: TIMESTAMP → TIMESTAMPTZ
ALTER TABLE leave_requests
  ALTER COLUMN approved_at TYPE TIMESTAMPTZ 
  USING approved_at AT TIME ZONE 'Asia/Seoul';

-- 2. created_at: TIMESTAMP → TIMESTAMPTZ
ALTER TABLE leave_requests
  ALTER COLUMN created_at TYPE TIMESTAMPTZ 
  USING created_at AT TIME ZONE 'Asia/Seoul';

-- 3. updated_at: TIMESTAMP → TIMESTAMPTZ
ALTER TABLE leave_requests
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ 
  USING updated_at AT TIME ZONE 'Asia/Seoul';

-- 4. Update default values to use now() (which respects session timezone)
ALTER TABLE leave_requests
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

COMMIT;

-- Verify the changes
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'leave_requests'
  AND column_name IN ('start_date', 'end_date', 'approved_at', 'created_at', 'updated_at')
ORDER BY column_name;

