-- =============================================
-- Migration 036: Add product_doc to activity log constraint
-- =============================================
-- Updates the planner_activity_log constraint to include 'product_doc' entity type

-- Drop existing constraint
ALTER TABLE planner_activity_log 
DROP CONSTRAINT IF EXISTS planner_activity_log_entity_type_check;

-- Add new constraint with product_doc included
ALTER TABLE planner_activity_log
ADD CONSTRAINT planner_activity_log_entity_type_check 
CHECK (entity_type IN (
    'initiative',
    'formation',
    'thread',
    'product',
    'milestone',
    'product_reference',
    'product_doc'
));

-- Comment on the constraint update
COMMENT ON CONSTRAINT planner_activity_log_entity_type_check ON planner_activity_log 
IS 'Updated to include product_doc entity type for product documentation activity logging';
