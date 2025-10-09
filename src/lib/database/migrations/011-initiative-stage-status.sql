-- Migration: Separate stage and status for initiatives
-- Date: 2025-10-09
-- Description: Add stage column and rename state to status for clearer initiative tracking

BEGIN;

-- Step 1: Add new stage column (nullable for now)
ALTER TABLE planner_initiatives
ADD COLUMN stage VARCHAR(50);

-- Step 2: Add new status column (nullable for now)
ALTER TABLE planner_initiatives
ADD COLUMN status VARCHAR(50);

-- Step 3: Migrate existing data
-- Map old 'state' values to new stage/status
UPDATE planner_initiatives
SET
  stage = CASE
    WHEN state = 'shaping' THEN 'shaping'
    WHEN state = 'active' THEN 'building'
    WHEN state IN ('paused', 'shipped', 'abandoned') THEN 'building'
    ELSE 'shaping'
  END,
  status = CASE
    WHEN state = 'shaping' THEN 'active'
    WHEN state = 'active' THEN 'active'
    WHEN state = 'paused' THEN 'paused'
    WHEN state = 'shipped' THEN 'shipped'
    WHEN state = 'abandoned' THEN 'abandoned'
    ELSE 'active'
  END;

-- Step 4: Drop old state column constraints
ALTER TABLE planner_initiatives
DROP CONSTRAINT IF EXISTS planner_initiatives_state_check;

-- Step 5: Drop old state index
DROP INDEX IF EXISTS idx_planner_initiatives_state;

-- Step 6: Drop old state column
ALTER TABLE planner_initiatives
DROP COLUMN state;

-- Step 7: Set NOT NULL constraints on new columns
ALTER TABLE planner_initiatives
ALTER COLUMN stage SET NOT NULL,
ALTER COLUMN status SET NOT NULL;

-- Step 8: Set default values
ALTER TABLE planner_initiatives
ALTER COLUMN stage SET DEFAULT 'shaping',
ALTER COLUMN status SET DEFAULT 'active';

-- Step 9: Add CHECK constraints for valid values
ALTER TABLE planner_initiatives
ADD CONSTRAINT planner_initiatives_stage_check
CHECK (stage IN ('shaping', 'building', 'testing', 'shipping', 'done'));

ALTER TABLE planner_initiatives
ADD CONSTRAINT planner_initiatives_status_check
CHECK (status IN ('active', 'paused', 'shipped', 'abandoned'));

-- Step 10: Create new indexes
CREATE INDEX idx_planner_initiatives_stage ON planner_initiatives(stage);
CREATE INDEX idx_planner_initiatives_status ON planner_initiatives(status);
CREATE INDEX idx_planner_initiatives_stage_status ON planner_initiatives(stage, status);

-- Step 11: Add helpful comment
COMMENT ON COLUMN planner_initiatives.stage IS 'Current stage of initiative: shaping, building, testing, shipping, done';
COMMENT ON COLUMN planner_initiatives.status IS 'Current status of initiative: active, paused, shipped, abandoned';

COMMIT;
