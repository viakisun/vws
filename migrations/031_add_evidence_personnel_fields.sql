-- =====================================================
-- Migration 031: Add Personnel Fields to Evidence Items
-- =====================================================
-- Purpose: 
-- evidence_items 테이블에 인건비 증빙을 위한 필드 추가
-- - employee_id: 해당 증빙이 어느 직원의 인건비인지
-- - project_member_id: 해당 증빙이 어느 참여연구원 레코드와 연결되는지
-- - evidence_month: 증빙 대상 월 (YYYY-MM-01 형식)
-- =====================================================

BEGIN;

-- =====================================================
-- Step 1: Add new columns to evidence_items
-- =====================================================

ALTER TABLE evidence_items
  ADD COLUMN IF NOT EXISTS employee_id uuid,
  ADD COLUMN IF NOT EXISTS project_member_id uuid,
  ADD COLUMN IF NOT EXISTS evidence_month date;

-- =====================================================
-- Step 2: Add foreign key constraints
-- =====================================================

ALTER TABLE evidence_items
  DROP CONSTRAINT IF EXISTS evidence_items_employee_id_fkey;

ALTER TABLE evidence_items
  ADD CONSTRAINT evidence_items_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE evidence_items
  DROP CONSTRAINT IF EXISTS evidence_items_project_member_id_fkey;

ALTER TABLE evidence_items
  ADD CONSTRAINT evidence_items_project_member_id_fkey
  FOREIGN KEY (project_member_id) REFERENCES project_members(id) ON DELETE SET NULL;

-- =====================================================
-- Step 3: Add indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_evidence_items_employee_id 
  ON evidence_items(employee_id);

CREATE INDEX IF NOT EXISTS idx_evidence_items_project_member_id 
  ON evidence_items(project_member_id);

CREATE INDEX IF NOT EXISTS idx_evidence_items_evidence_month 
  ON evidence_items(evidence_month);

-- =====================================================
-- Step 4: Add comments
-- =====================================================

COMMENT ON COLUMN evidence_items.employee_id IS '직원 ID (인건비 증빙용)';
COMMENT ON COLUMN evidence_items.project_member_id IS '참여연구원 ID (연결 레코드)';
COMMENT ON COLUMN evidence_items.evidence_month IS '증빙 대상 월 (YYYY-MM-01)';

COMMIT;

-- =====================================================
-- Verification Queries
-- =====================================================
-- Run these after migration to verify:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'evidence_items' 
--   AND column_name IN ('employee_id', 'project_member_id', 'evidence_month');

