-- =====================================================
-- Migration 025: Rename Project to Research Development
-- =====================================================
-- Purpose: 
-- 프로젝트 관리를 "연구개발사업 관리"로 용어 통일
-- projects → rd_projects로 테이블명 변경
-- =====================================================

BEGIN;

-- =====================================================
-- Step 1: Rename Main Tables
-- =====================================================

ALTER TABLE projects RENAME TO rd_projects;
ALTER TABLE project_members RENAME TO rd_project_members;
ALTER TABLE project_budgets RENAME TO rd_project_budgets;
ALTER TABLE project_milestones RENAME TO rd_project_milestones;
ALTER TABLE project_risks RENAME TO rd_project_risks;

-- =====================================================
-- Step 2: Rename Evidence-related Tables
-- =====================================================

ALTER TABLE evidence_categories RENAME TO rd_evidence_categories;
ALTER TABLE evidence_documents RENAME TO rd_evidence_documents;
ALTER TABLE evidence_items RENAME TO rd_evidence_items;
ALTER TABLE evidence_schedules RENAME TO rd_evidence_schedules;

-- =====================================================
-- Step 3: Rename Participation & Validation Tables
-- =====================================================

ALTER TABLE participation_rates RENAME TO rd_participation_rates;
ALTER TABLE global_factors RENAME TO rd_global_factors;

-- =====================================================
-- Step 4: Update Foreign Key Constraints
-- =====================================================

-- rd_project_members foreign keys
ALTER TABLE rd_project_members 
  DROP CONSTRAINT IF EXISTS project_members_project_id_fkey;
  
ALTER TABLE rd_project_members 
  ADD CONSTRAINT rd_project_members_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES rd_projects(id) ON DELETE CASCADE;

ALTER TABLE rd_project_members 
  DROP CONSTRAINT IF EXISTS project_members_employee_id_fkey;
  
ALTER TABLE rd_project_members 
  ADD CONSTRAINT rd_project_members_employee_id_fkey 
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

-- rd_project_budgets foreign keys
ALTER TABLE rd_project_budgets 
  DROP CONSTRAINT IF EXISTS project_budgets_project_id_fkey;
  
ALTER TABLE rd_project_budgets 
  ADD CONSTRAINT rd_project_budgets_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES rd_projects(id) ON DELETE CASCADE;

-- rd_project_milestones foreign keys
ALTER TABLE rd_project_milestones 
  DROP CONSTRAINT IF EXISTS project_milestones_project_id_fkey;
  
ALTER TABLE rd_project_milestones 
  ADD CONSTRAINT rd_project_milestones_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES rd_projects(id) ON DELETE CASCADE;

-- rd_project_risks foreign keys
ALTER TABLE rd_project_risks 
  DROP CONSTRAINT IF EXISTS project_risks_project_id_fkey;
  
ALTER TABLE rd_project_risks 
  ADD CONSTRAINT rd_project_risks_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES rd_projects(id) ON DELETE CASCADE;

ALTER TABLE rd_project_risks 
  DROP CONSTRAINT IF EXISTS project_risks_owner_id_fkey;
  
ALTER TABLE rd_project_risks 
  ADD CONSTRAINT rd_project_risks_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES employees(id) ON DELETE SET NULL;

-- rd_evidence_items foreign keys
ALTER TABLE rd_evidence_items 
  DROP CONSTRAINT IF EXISTS evidence_items_project_budget_id_fkey;
  
ALTER TABLE rd_evidence_items 
  ADD CONSTRAINT rd_evidence_items_project_budget_id_fkey 
  FOREIGN KEY (project_budget_id) REFERENCES rd_project_budgets(id) ON DELETE CASCADE;

ALTER TABLE rd_evidence_items 
  DROP CONSTRAINT IF EXISTS evidence_items_category_id_fkey;
  
ALTER TABLE rd_evidence_items 
  ADD CONSTRAINT rd_evidence_items_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES rd_evidence_categories(id) ON DELETE SET NULL;

ALTER TABLE rd_evidence_items 
  DROP CONSTRAINT IF EXISTS evidence_items_document_id_fkey;
  
ALTER TABLE rd_evidence_items 
  ADD CONSTRAINT rd_evidence_items_document_id_fkey 
  FOREIGN KEY (document_id) REFERENCES rd_evidence_documents(id) ON DELETE SET NULL;

ALTER TABLE rd_evidence_items 
  DROP CONSTRAINT IF EXISTS evidence_items_employee_id_fkey;
  
ALTER TABLE rd_evidence_items 
  ADD CONSTRAINT rd_evidence_items_employee_id_fkey 
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE rd_evidence_items 
  DROP CONSTRAINT IF EXISTS evidence_items_project_member_id_fkey;
  
ALTER TABLE rd_evidence_items 
  ADD CONSTRAINT rd_evidence_items_project_member_id_fkey 
  FOREIGN KEY (project_member_id) REFERENCES rd_project_members(id) ON DELETE SET NULL;

-- rd_evidence_schedules foreign keys
ALTER TABLE rd_evidence_schedules 
  DROP CONSTRAINT IF EXISTS evidence_schedules_project_id_fkey;
  
ALTER TABLE rd_evidence_schedules 
  ADD CONSTRAINT rd_evidence_schedules_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES rd_projects(id) ON DELETE CASCADE;

-- rd_participation_rates foreign keys
ALTER TABLE rd_participation_rates 
  DROP CONSTRAINT IF EXISTS participation_rates_project_member_id_fkey;
  
ALTER TABLE rd_participation_rates 
  ADD CONSTRAINT rd_participation_rates_project_member_id_fkey 
  FOREIGN KEY (project_member_id) REFERENCES rd_project_members(id) ON DELETE CASCADE;

-- =====================================================
-- Step 5: Update Indexes
-- =====================================================

-- Drop old indexes and create new ones with updated names
DROP INDEX IF EXISTS idx_project_members_project_id;
CREATE INDEX idx_rd_project_members_project_id ON rd_project_members(project_id);

DROP INDEX IF EXISTS idx_project_members_employee_id;
CREATE INDEX idx_rd_project_members_employee_id ON rd_project_members(employee_id);

DROP INDEX IF EXISTS idx_project_budgets_project_id;
CREATE INDEX idx_rd_project_budgets_project_id ON rd_project_budgets(project_id);

DROP INDEX IF EXISTS idx_evidence_items_project_budget_id;
CREATE INDEX idx_rd_evidence_items_project_budget_id ON rd_evidence_items(project_budget_id);

DROP INDEX IF EXISTS idx_evidence_items_employee_id;
CREATE INDEX idx_rd_evidence_items_employee_id ON rd_evidence_items(employee_id);

-- =====================================================
-- Step 6: Update Sequences (if any)
-- =====================================================

-- Note: UUIDs are used for primary keys, so no sequences to rename

COMMIT;

-- =====================================================
-- Verification Queries
-- =====================================================
-- Run these after migration to verify:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'rd_%';
-- SELECT COUNT(*) FROM rd_projects;
-- SELECT COUNT(*) FROM rd_project_members;

