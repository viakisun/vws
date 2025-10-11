-- Rollback: Remove project_budgets indexes

DROP INDEX IF EXISTS idx_project_budgets_project_dates;

