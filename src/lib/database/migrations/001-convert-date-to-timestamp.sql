-- Migration: Convert DATE columns to TIMESTAMP WITH TIME ZONE
-- Purpose: Fix timezone handling issues by using proper timestamp columns
-- Date: 2024-01-15
-- Author: System Migration

-- =============================================
-- BACKUP AND SAFETY CHECKS
-- =============================================

-- Create backup tables for critical data
CREATE TABLE IF NOT EXISTS backup_transactions AS SELECT * FROM transactions;
CREATE TABLE IF NOT EXISTS backup_employees AS SELECT * FROM employees;
CREATE TABLE IF NOT EXISTS backup_leave_requests AS SELECT * FROM leave_requests;
CREATE TABLE IF NOT EXISTS backup_projects AS SELECT * FROM projects;
CREATE TABLE IF NOT EXISTS backup_reports AS SELECT * FROM reports;
CREATE TABLE IF NOT EXISTS backup_leads AS SELECT * FROM leads;
CREATE TABLE IF NOT EXISTS backup_sales_activities AS SELECT * FROM sales_activities;
CREATE TABLE IF NOT EXISTS backup_customer_interactions AS SELECT * FROM customer_interactions;
CREATE TABLE IF NOT EXISTS backup_contracts AS SELECT * FROM contracts;

-- =============================================
-- CONVERT DATE COLUMNS TO TIMESTAMP WITH TIME ZONE
-- =============================================

-- 1. transactions.date
ALTER TABLE transactions 
ALTER COLUMN date TYPE TIMESTAMP WITH TIME ZONE 
USING date::TIMESTAMP WITH TIME ZONE;

-- 2. employees.hire_date
ALTER TABLE employees 
ALTER COLUMN hire_date TYPE TIMESTAMP WITH TIME ZONE 
USING hire_date::TIMESTAMP WITH TIME ZONE;

-- 3. leave_requests.start_date
ALTER TABLE leave_requests 
ALTER COLUMN start_date TYPE TIMESTAMP WITH TIME ZONE 
USING start_date::TIMESTAMP WITH TIME ZONE;

-- 4. leave_requests.end_date
ALTER TABLE leave_requests 
ALTER COLUMN end_date TYPE TIMESTAMP WITH TIME ZONE 
USING end_date::TIMESTAMP WITH TIME ZONE;

-- 5. projects.start_date
ALTER TABLE projects 
ALTER COLUMN start_date TYPE TIMESTAMP WITH TIME ZONE 
USING start_date::TIMESTAMP WITH TIME ZONE;

-- 6. projects.end_date
ALTER TABLE projects 
ALTER COLUMN end_date TYPE TIMESTAMP WITH TIME ZONE 
USING end_date::TIMESTAMP WITH TIME ZONE;

-- 7. reports.period_start
ALTER TABLE reports 
ALTER COLUMN period_start TYPE TIMESTAMP WITH TIME ZONE 
USING period_start::TIMESTAMP WITH TIME ZONE;

-- 8. reports.period_end
ALTER TABLE reports 
ALTER COLUMN period_end TYPE TIMESTAMP WITH TIME ZONE 
USING period_end::TIMESTAMP WITH TIME ZONE;

-- 9. leads.last_contact
ALTER TABLE leads 
ALTER COLUMN last_contact TYPE TIMESTAMP WITH TIME ZONE 
USING last_contact::TIMESTAMP WITH TIME ZONE;

-- 10. sales_activities.date
ALTER TABLE sales_activities 
ALTER COLUMN date TYPE TIMESTAMP WITH TIME ZONE 
USING date::TIMESTAMP WITH TIME ZONE;

-- 11. sales_activities.next_action_date
ALTER TABLE sales_activities 
ALTER COLUMN next_action_date TYPE TIMESTAMP WITH TIME ZONE 
USING next_action_date::TIMESTAMP WITH TIME ZONE;

-- 12. customer_interactions.date
ALTER TABLE customer_interactions 
ALTER COLUMN date TYPE TIMESTAMP WITH TIME ZONE 
USING date::TIMESTAMP WITH TIME ZONE;

-- 13. customer_interactions.next_action_date
ALTER TABLE customer_interactions 
ALTER COLUMN next_action_date TYPE TIMESTAMP WITH TIME ZONE 
USING next_action_date::TIMESTAMP WITH TIME ZONE;

-- 14. contracts.start_date
ALTER TABLE contracts 
ALTER COLUMN start_date TYPE TIMESTAMP WITH TIME ZONE 
USING start_date::TIMESTAMP WITH TIME ZONE;

-- 15. contracts.end_date
ALTER TABLE contracts 
ALTER COLUMN end_date TYPE TIMESTAMP WITH TIME ZONE 
USING end_date::TIMESTAMP WITH TIME ZONE;

-- 16. contracts.renewal_date
ALTER TABLE contracts 
ALTER COLUMN renewal_date TYPE TIMESTAMP WITH TIME ZONE 
USING renewal_date::TIMESTAMP WITH TIME ZONE;

-- =============================================
-- UPDATE INDEXES
-- =============================================

-- Drop old indexes that reference date columns
DROP INDEX IF EXISTS idx_transactions_date;
DROP INDEX IF EXISTS idx_projects_dates;
DROP INDEX IF EXISTS idx_sales_activities_date;
DROP INDEX IF EXISTS idx_customer_interactions_date;
DROP INDEX IF EXISTS idx_contracts_dates;

-- Recreate indexes with new timestamp columns
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX idx_sales_activities_date ON sales_activities(date);
CREATE INDEX idx_customer_interactions_date ON customer_interactions(date);
CREATE INDEX idx_contracts_dates ON contracts(start_date, end_date);

-- =============================================
-- UPDATE VIEWS
-- =============================================

-- Drop and recreate views that reference date columns
DROP VIEW IF EXISTS project_summary;
DROP VIEW IF EXISTS employee_summary;
DROP VIEW IF EXISTS financial_summary;

-- Recreate project_summary view
CREATE VIEW project_summary AS
SELECT 
    p.id,
    p.code,
    p.title,
    p.status,
    p.start_date,
    p.end_date,
    p.budget_total,
    e.name as manager_name,
    COUNT(DISTINCT ei.id) as expense_count,
    COALESCE(SUM(ei.amount), 0) as total_expenses
FROM projects p
LEFT JOIN employees e ON p.manager_id = e.id
LEFT JOIN expense_items ei ON p.id = ei.project_id
GROUP BY p.id, p.code, p.title, p.status, p.start_date, p.end_date, p.budget_total, e.name;

-- Recreate employee_summary view
CREATE VIEW employee_summary AS
SELECT 
    e.id,
    e.employee_id,
    e.first_name,
    e.last_name,
    e.email,
    e.department,
    e.position,
    e.status,
    e.hire_date,
    e.salary,
    m.first_name || ' ' || m.last_name as manager_name,
    COUNT(DISTINCT lr.id) as leave_requests,
    COUNT(DISTINCT p.id) as managed_projects
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id
LEFT JOIN leave_requests lr ON e.id = lr.employee_id
LEFT JOIN projects p ON e.id = p.manager_id
GROUP BY e.id, e.employee_id, e.first_name, e.last_name, e.email, e.department, e.position, e.status, e.hire_date, e.salary, m.first_name, m.last_name;

-- Recreate financial_summary view
CREATE VIEW financial_summary AS
SELECT 
    DATE_TRUNC('month', t.date) as month,
    t.type,
    bc.name as category_name,
    COUNT(*) as transaction_count,
    SUM(t.amount) as total_amount
FROM transactions t
JOIN budget_categories bc ON t.category_id = bc.id
GROUP BY DATE_TRUNC('month', t.date), t.type, bc.name
ORDER BY month DESC, t.type, bc.name;

-- =============================================
-- VERIFICATION
-- =============================================

-- Verify the migration was successful
DO $$
DECLARE
    table_name TEXT;
    column_name TEXT;
    data_type TEXT;
    date_columns TEXT[] := ARRAY[
        'transactions.date',
        'employees.hire_date',
        'leave_requests.start_date',
        'leave_requests.end_date',
        'projects.start_date',
        'projects.end_date',
        'reports.period_start',
        'reports.period_end',
        'leads.last_contact',
        'sales_activities.date',
        'sales_activities.next_action_date',
        'customer_interactions.date',
        'customer_interactions.next_action_date',
        'contracts.start_date',
        'contracts.end_date',
        'contracts.renewal_date'
    ];
    column_info TEXT;
BEGIN
    RAISE NOTICE 'Verifying migration results...';
    
    FOREACH column_info IN ARRAY date_columns
    LOOP
        SELECT 
            table_name,
            column_name,
            data_type
        INTO 
            table_name,
            column_name,
            data_type
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name || '.' || column_name = column_info;
        
        IF data_type = 'timestamp with time zone' THEN
            RAISE NOTICE '✓ % converted successfully to TIMESTAMP WITH TIME ZONE', column_info;
        ELSE
            RAISE NOTICE '✗ % conversion failed. Current type: %', column_info, data_type;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migration verification completed.';
END $$;

-- =============================================
-- CLEANUP (Optional - uncomment after verification)
-- =============================================

-- Uncomment these lines after verifying the migration was successful
-- DROP TABLE IF EXISTS backup_transactions;
-- DROP TABLE IF EXISTS backup_employees;
-- DROP TABLE IF EXISTS backup_leave_requests;
-- DROP TABLE IF EXISTS backup_projects;
-- DROP TABLE IF EXISTS backup_reports;
-- DROP TABLE IF EXISTS backup_leads;
-- DROP TABLE IF EXISTS backup_sales_activities;
-- DROP TABLE IF EXISTS backup_customer_interactions;
-- DROP TABLE IF EXISTS backup_contracts;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

-- Log migration completion
INSERT INTO audit_logs (actor_id, action, entity, entity_id, diff, created_at)
VALUES (
    (SELECT id FROM users WHERE email = 'system@vws.com' LIMIT 1),
    'MIGRATION',
    'database_schema',
    'date_to_timestamp_conversion',
    '{"migration": "001-convert-date-to-timestamp", "status": "completed", "tables_affected": 9, "columns_converted": 16}',
    CURRENT_TIMESTAMP
);
