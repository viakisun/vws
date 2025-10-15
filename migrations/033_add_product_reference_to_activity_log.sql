-- =============================================
-- Migration 033: Add product_reference to activity log constraint
-- =============================================
-- Updates the planner_activity_log constraint to include 'product_reference' entity type

-- Drop existing constraint
ALTER TABLE planner_activity_log 
DROP CONSTRAINT IF EXISTS planner_activity_log_entity_type_check;

-- Add new constraint with product_reference included
ALTER TABLE planner_activity_log
ADD CONSTRAINT planner_activity_log_entity_type_check 
CHECK (entity_type IN (
    'initiative',
    'formation',
    'thread',
    'product',
    'milestone',
    'product_reference'
));

-- Comment on the constraint update
COMMENT ON CONSTRAINT planner_activity_log_entity_type_check ON planner_activity_log 
IS 'Updated to include product_reference entity type for product reference activity logging';
