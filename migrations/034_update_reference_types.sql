-- =============================================
-- Migration 034: Update Product Reference Types
-- =============================================
-- Adds support for additional reference types: YouTube, Slack, Discord, etc.

-- Drop existing constraint
ALTER TABLE planner_product_references 
DROP CONSTRAINT IF EXISTS planner_product_references_type_check;

-- Add new constraint with additional reference types
ALTER TABLE planner_product_references
ADD CONSTRAINT planner_product_references_type_check
CHECK (type IN (
    'file', 
    'url', 
    'figma', 
    'notion', 
    'google_docs', 
    'pdf', 
    'image', 
    'github',
    'youtube',
    'slack',
    'discord',
    'zoom',
    'trello',
    'jira',
    'miro',
    'adobe',
    'other'
));

-- Update comment to reflect new types
COMMENT ON COLUMN planner_product_references.type IS 'Type of reference: file, url, figma, notion, google_docs, pdf, image, github, youtube, slack, discord, zoom, trello, jira, miro, adobe, other';
