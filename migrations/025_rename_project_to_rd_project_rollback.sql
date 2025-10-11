-- =====================================================
-- Migration 025 ROLLBACK: Revert RD Project to Project
-- =====================================================
-- Purpose: 
-- Rollback the rename from rd_projects back to projects
-- =====================================================

BEGIN;

-- =====================================================
-- Step 1: Revert Main Tables
-- =====================================================

ALTER TABLE rd_projects RENAME TO projects;
ALTER TABLE rd_project_members RENAME TO project_members;
ALTER TABLE rd_project_budgets RENAME TO project_budgets;
ALTER TABLE rd_project_milestones RENAME TO project_milestones;
ALTER TABLE rd_project_risks RENAME TO project_risks;

-- =====================================================
-- Step 2: Revert Evidence-related Tables
-- =====================================================

ALTER TABLE rd_evidence_categories RENAME TO evidence_categories;
ALTER TABLE rd_evidence_documents RENAME TO evidence_documents;
ALTER TABLE rd_evidence_items RENAME TO evidence_items;
ALTER TABLE rd_evidence_schedules RENAME TO evidence_schedules;

-- =====================================================
-- Step 3: Revert Participation & Validation Tables
-- =====================================================

ALTER TABLE rd_participation_rates RENAME TO participation_rates;
ALTER TABLE rd_global_factors RENAME TO global_factors;

-- =====================================================
-- Step 4: Revert Foreign Key Constraints
-- =====================================================

-- project_members foreign keys
ALTER TABLE project_members 
  DROP CONSTRAINT IF EXISTS rd_project_members_project_id_fkey;
  
ALTER TABLE project_members 
  ADD CONSTRAINT project_members_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE project_members 
  DROP CONSTRAINT IF EXISTS rd_project_members_employee_id_fkey;
  
ALTER TABLE project_members 
  ADD CONSTRAINT project_members_employee_id_fkey 
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

-- project_budgets foreign keys
ALTER TABLE project_budgets 
  DROP CONSTRAINT IF EXISTS rd_project_budgets_project_id_fkey;
  
ALTER TABLE project_budgets 
  ADD CONSTRAINT project_budgets_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- project_milestones foreign keys
ALTER TABLE project_milestones 
  DROP CONSTRAINT IF EXISTS rd_project_milestones_project_id_fkey;
  
ALTER TABLE project_milestones 
  ADD CONSTRAINT project_milestones_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- project_risks foreign keys
ALTER TABLE project_risks 
  DROP CONSTRAINT IF EXISTS rd_project_risks_project_id_fkey;
  
ALTER TABLE project_risks 
  ADD CONSTRAINT project_risks_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE project_risks 
  DROP CONSTRAINT IF EXISTS rd_project_risks_owner_id_fkey;
  
ALTER TABLE project_risks 
  ADD CONSTRAINT project_risks_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES employees(id) ON DELETE SET NULL;

-- evidence_items foreign keys
ALTER TABLE evidence_items 
  DROP CONSTRAINT IF EXISTS rd_evidence_items_project_budget_id_fkey;
  
ALTER TABLE evidence_items 
  ADD CONSTRAINT evidence_items_project_budget_id_fkey 
  FOREIGN KEY (project_budget_id) REFERENCES project_budgets(id) ON DELETE CASCADE;

ALTER TABLE evidence_items 
  DROP CONSTRAINT IF EXISTS rd_evidence_items_category_id_fkey;
  
ALTER TABLE evidence_items 
  ADD CONSTRAINT evidence_items_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES evidence_categories(id) ON DELETE SET NULL;

ALTER TABLE evidence_items 
  DROP CONSTRAINT IF EXISTS rd_evidence_items_document_id_fkey;
  
ALTER TABLE evidence_items 
  ADD CONSTRAINT evidence_items_document_id_fkey 
  FOREIGN KEY (document_id) REFERENCES evidence_documents(id) ON DELETE SET NULL;

ALTER TABLE evidence_items 
  DROP CONSTRAINT IF EXISTS rd_evidence_items_employee_id_fkey;
  
ALTER TABLE evidence_items 
  ADD CONSTRAINT evidence_items_employee_id_fkey 
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE evidence_items 
  DROP CONSTRAINT IF EXISTS rd_evidence_items_project_member_id_fkey;
  
ALTER TABLE evidence_items 
  ADD CONSTRAINT evidence_items_project_member_id_fkey 
  FOREIGN KEY (project_member_id) REFERENCES project_members(id) ON DELETE SET NULL;

-- evidence_schedules foreign keys
ALTER TABLE evidence_schedules 
  DROP CONSTRAINT IF EXISTS rd_evidence_schedules_project_id_fkey;
  
ALTER TABLE evidence_schedules 
  ADD CONSTRAINT evidence_schedules_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- participation_rates foreign keys
ALTER TABLE participation_rates 
  DROP CONSTRAINT IF EXISTS rd_participation_rates_project_member_id_fkey;
  
ALTER TABLE participation_rates 
  ADD CONSTRAINT participation_rates_project_member_id_fkey 
  FOREIGN KEY (project_member_id) REFERENCES project_members(id) ON DELETE CASCADE;

-- =====================================================
-- Step 5: Revert Indexes
-- =====================================================

DROP INDEX IF EXISTS idx_rd_project_members_project_id;
CREATE INDEX idx_project_members_project_id ON project_members(project_id);

DROP INDEX IF EXISTS idx_rd_project_members_employee_id;
CREATE INDEX idx_project_members_employee_id ON project_members(employee_id);

DROP INDEX IF EXISTS idx_rd_project_budgets_project_id;
CREATE INDEX idx_project_budgets_project_id ON project_budgets(project_id);

DROP INDEX IF EXISTS idx_rd_evidence_items_project_budget_id;
CREATE INDEX idx_evidence_items_project_budget_id ON evidence_items(project_budget_id);

DROP INDEX IF EXISTS idx_rd_evidence_items_employee_id;
CREATE INDEX idx_evidence_items_employee_id ON evidence_items(employee_id);

COMMIT;

-- =====================================================
-- Verification Queries
-- =====================================================
-- Run these after rollback to verify:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'project%';
-- SELECT COUNT(*) FROM projects;
-- SELECT COUNT(*) FROM project_members;

