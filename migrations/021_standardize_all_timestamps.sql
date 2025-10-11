BEGIN;

-- announcement_reads.read_at
ALTER TABLE announcement_reads
ALTER COLUMN read_at TYPE TIMESTAMPTZ
USING read_at AT TIME ZONE 'Asia/Seoul';

-- announcements.created_at
ALTER TABLE announcements
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- announcements.expires_at
ALTER TABLE announcements
ALTER COLUMN expires_at TYPE TIMESTAMPTZ
USING expires_at AT TIME ZONE 'Asia/Seoul';

-- announcements.published_at
ALTER TABLE announcements
ALTER COLUMN published_at TYPE TIMESTAMPTZ
USING published_at AT TIME ZONE 'Asia/Seoul';

-- announcements.updated_at
ALTER TABLE announcements
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- bank_accounts.created_at
ALTER TABLE bank_accounts
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- bank_accounts.updated_at
ALTER TABLE bank_accounts
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- budget_categories.created_at
ALTER TABLE budget_categories
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- budget_categories.updated_at
ALTER TABLE budget_categories
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- budget_evidence.approved_at
ALTER TABLE budget_evidence
ALTER COLUMN approved_at TYPE TIMESTAMPTZ
USING approved_at AT TIME ZONE 'Asia/Seoul';

-- budget_evidence.created_at
ALTER TABLE budget_evidence
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- budget_evidence.updated_at
ALTER TABLE budget_evidence
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- certificate_requests.approved_at
ALTER TABLE certificate_requests
ALTER COLUMN approved_at TYPE TIMESTAMPTZ
USING approved_at AT TIME ZONE 'Asia/Seoul';

-- certificate_requests.created_at
ALTER TABLE certificate_requests
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- certificate_requests.issued_at
ALTER TABLE certificate_requests
ALTER COLUMN issued_at TYPE TIMESTAMPTZ
USING issued_at AT TIME ZONE 'Asia/Seoul';

-- certificate_requests.updated_at
ALTER TABLE certificate_requests
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- companies.created_at
ALTER TABLE companies
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- companies.updated_at
ALTER TABLE companies
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- dashboard_configs.created_at
ALTER TABLE dashboard_configs
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- dashboard_configs.updated_at
ALTER TABLE dashboard_configs
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- document_submissions.approved_at
ALTER TABLE document_submissions
ALTER COLUMN approved_at TYPE TIMESTAMPTZ
USING approved_at AT TIME ZONE 'Asia/Seoul';

-- document_submissions.created_at
ALTER TABLE document_submissions
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- document_submissions.submitted_at
ALTER TABLE document_submissions
ALTER COLUMN submitted_at TYPE TIMESTAMPTZ
USING submitted_at AT TIME ZONE 'Asia/Seoul';

-- document_submissions.updated_at
ALTER TABLE document_submissions
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- document_templates.created_at
ALTER TABLE document_templates
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- document_templates.updated_at
ALTER TABLE document_templates
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- employee_departments.created_at
ALTER TABLE employee_departments
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- employee_departments.updated_at
ALTER TABLE employee_departments
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- employee_roles.assigned_at
ALTER TABLE employee_roles
ALTER COLUMN assigned_at TYPE TIMESTAMPTZ
USING assigned_at AT TIME ZONE 'Asia/Seoul';

-- employee_roles.expires_at
-- SKIP: VIEW에서 사용 중 (user_effective_roles)
-- ALTER TABLE employee_roles
-- ALTER COLUMN expires_at TYPE TIMESTAMPTZ
-- USING expires_at AT TIME ZONE 'Asia/Seoul';

-- employees.created_at
ALTER TABLE employees
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- employees.updated_at
ALTER TABLE employees
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- evaluation_items.created_at
ALTER TABLE evaluation_items
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- evaluation_items.updated_at
ALTER TABLE evaluation_items
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- evaluations.created_at
ALTER TABLE evaluations
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- evaluations.reviewed_at
ALTER TABLE evaluations
ALTER COLUMN reviewed_at TYPE TIMESTAMPTZ
USING reviewed_at AT TIME ZONE 'Asia/Seoul';

-- evaluations.submitted_at
ALTER TABLE evaluations
ALTER COLUMN submitted_at TYPE TIMESTAMPTZ
USING submitted_at AT TIME ZONE 'Asia/Seoul';

-- evaluations.updated_at
ALTER TABLE evaluations
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- evidence_categories.created_at
ALTER TABLE evidence_categories
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- evidence_categories.updated_at
ALTER TABLE evidence_categories
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- evidence_documents.created_at
ALTER TABLE evidence_documents
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- evidence_documents.review_date
ALTER TABLE evidence_documents
ALTER COLUMN review_date TYPE TIMESTAMPTZ
USING review_date AT TIME ZONE 'Asia/Seoul';

-- evidence_documents.updated_at
ALTER TABLE evidence_documents
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- evidence_documents.upload_date
ALTER TABLE evidence_documents
ALTER COLUMN upload_date TYPE TIMESTAMPTZ
USING upload_date AT TIME ZONE 'Asia/Seoul';

-- evidence_items.created_at
ALTER TABLE evidence_items
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- evidence_items.updated_at
ALTER TABLE evidence_items
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- evidence_notifications.read_at
ALTER TABLE evidence_notifications
ALTER COLUMN read_at TYPE TIMESTAMPTZ
USING read_at AT TIME ZONE 'Asia/Seoul';

-- evidence_notifications.sent_at
ALTER TABLE evidence_notifications
ALTER COLUMN sent_at TYPE TIMESTAMPTZ
USING sent_at AT TIME ZONE 'Asia/Seoul';

-- evidence_review_history.reviewed_at
ALTER TABLE evidence_review_history
ALTER COLUMN reviewed_at TYPE TIMESTAMPTZ
USING reviewed_at AT TIME ZONE 'Asia/Seoul';

-- evidence_schedules.created_at
ALTER TABLE evidence_schedules
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- evidence_schedules.updated_at
ALTER TABLE evidence_schedules
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- evidence_types.created_at
ALTER TABLE evidence_types
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- executives.created_at
ALTER TABLE executives
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- executives.updated_at
ALTER TABLE executives
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- expense_items.created_at
ALTER TABLE expense_items
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- expense_items.updated_at
ALTER TABLE expense_items
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- feedback.created_at
ALTER TABLE feedback
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- feedback.updated_at
ALTER TABLE feedback
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- global_factors.created_at
ALTER TABLE global_factors
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- global_factors.updated_at
ALTER TABLE global_factors
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- goals.created_at
ALTER TABLE goals
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- goals.updated_at
ALTER TABLE goals
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- job_titles.created_at
ALTER TABLE job_titles
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- job_titles.updated_at
ALTER TABLE job_titles
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- leave_balances.created_at
ALTER TABLE leave_balances
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- leave_balances.updated_at
ALTER TABLE leave_balances
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- leave_types.created_at
ALTER TABLE leave_types
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- leave_types.updated_at
ALTER TABLE leave_types
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- notifications.created_at
ALTER TABLE notifications
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- notifications.expires_at
ALTER TABLE notifications
ALTER COLUMN expires_at TYPE TIMESTAMPTZ
USING expires_at AT TIME ZONE 'Asia/Seoul';

-- notifications.read_at
ALTER TABLE notifications
ALTER COLUMN read_at TYPE TIMESTAMPTZ
USING read_at AT TIME ZONE 'Asia/Seoul';

-- notifications.updated_at
ALTER TABLE notifications
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- org_memberships.created_at
ALTER TABLE org_memberships
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- org_memberships.updated_at
ALTER TABLE org_memberships
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- org_units.created_at
ALTER TABLE org_units
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- org_units.updated_at
ALTER TABLE org_units
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- participation_rate_history.created_at
ALTER TABLE participation_rate_history
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- participation_rates.created_at
ALTER TABLE participation_rates
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- participation_rates.updated_at
ALTER TABLE participation_rates
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- payslips.created_at
ALTER TABLE payslips
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- payslips.updated_at
ALTER TABLE payslips
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- performance_records.created_at
ALTER TABLE performance_records
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- performance_records.updated_at
ALTER TABLE performance_records
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- performance_records.verified_at
ALTER TABLE performance_records
ALTER COLUMN verified_at TYPE TIMESTAMPTZ
USING verified_at AT TIME ZONE 'Asia/Seoul';

-- permission_audit_log.performed_at
ALTER TABLE permission_audit_log
ALTER COLUMN performed_at TYPE TIMESTAMPTZ
USING performed_at AT TIME ZONE 'Asia/Seoul';

-- permission_cache.calculated_at
ALTER TABLE permission_cache
ALTER COLUMN calculated_at TYPE TIMESTAMPTZ
USING calculated_at AT TIME ZONE 'Asia/Seoul';

-- permission_cache.expires_at
ALTER TABLE permission_cache
ALTER COLUMN expires_at TYPE TIMESTAMPTZ
USING expires_at AT TIME ZONE 'Asia/Seoul';

-- permissions.created_at
ALTER TABLE permissions
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- project_budgets.created_at
ALTER TABLE project_budgets
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- project_budgets.updated_at
ALTER TABLE project_budgets
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- project_members.created_at
ALTER TABLE project_members
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- project_members.updated_at
ALTER TABLE project_members
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- project_members_backup.created_at
ALTER TABLE project_members_backup
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- project_members_backup.updated_at
ALTER TABLE project_members_backup
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- project_milestones.created_at
ALTER TABLE project_milestones
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- project_milestones.updated_at
ALTER TABLE project_milestones
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- project_participations.created_at
ALTER TABLE project_participations
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- project_participations.updated_at
ALTER TABLE project_participations
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- project_risks.created_at
ALTER TABLE project_risks
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- project_risks.updated_at
ALTER TABLE project_risks
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- projects.created_at
ALTER TABLE projects
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- projects.updated_at
ALTER TABLE projects
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- projects_backup.created_at
ALTER TABLE projects_backup
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- projects_backup.updated_at
ALTER TABLE projects_backup
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- rd_budget_items.created_at
ALTER TABLE rd_budget_items
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- rd_budget_items.updated_at
ALTER TABLE rd_budget_items
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- rd_employees.created_at
ALTER TABLE rd_employees
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- rd_employees.updated_at
ALTER TABLE rd_employees
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- rd_projects.created_at
ALTER TABLE rd_projects
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- rd_projects.updated_at
ALTER TABLE rd_projects
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- report_executions.created_at
ALTER TABLE report_executions
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- report_executions.execution_date
ALTER TABLE report_executions
ALTER COLUMN execution_date TYPE TIMESTAMPTZ
USING execution_date AT TIME ZONE 'Asia/Seoul';

-- report_subscriptions.created_at
ALTER TABLE report_subscriptions
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- report_subscriptions.last_sent
ALTER TABLE report_subscriptions
ALTER COLUMN last_sent TYPE TIMESTAMPTZ
USING last_sent AT TIME ZONE 'Asia/Seoul';

-- report_subscriptions.next_send
ALTER TABLE report_subscriptions
ALTER COLUMN next_send TYPE TIMESTAMPTZ
USING next_send AT TIME ZONE 'Asia/Seoul';

-- report_subscriptions.updated_at
ALTER TABLE report_subscriptions
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- report_templates.created_at
ALTER TABLE report_templates
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- report_templates.updated_at
ALTER TABLE report_templates
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- reporting_lines.created_at
ALTER TABLE reporting_lines
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- reporting_lines.updated_at
ALTER TABLE reporting_lines
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- reporting_relationships.created_at
ALTER TABLE reporting_relationships
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- reporting_relationships.updated_at
ALTER TABLE reporting_relationships
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- role_permissions.granted_at
ALTER TABLE role_permissions
ALTER COLUMN granted_at TYPE TIMESTAMPTZ
USING granted_at AT TIME ZONE 'Asia/Seoul';

-- roles.created_at
ALTER TABLE roles
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- roles.updated_at
ALTER TABLE roles
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- salary_contracts.created_at
-- SKIP: VIEW에서 사용 중 (active_salary_contracts, salary_contract_history)
-- ALTER TABLE salary_contracts
-- ALTER COLUMN created_at TYPE TIMESTAMPTZ
-- USING created_at AT TIME ZONE 'Asia/Seoul';

-- salary_contracts.updated_at
-- SKIP: VIEW에서 사용 중 (active_salary_contracts, salary_contract_history)
-- ALTER TABLE salary_contracts
-- ALTER COLUMN updated_at TYPE TIMESTAMPTZ
-- USING updated_at AT TIME ZONE 'Asia/Seoul';

-- salary_payments.created_at
ALTER TABLE salary_payments
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- salary_payments.updated_at
ALTER TABLE salary_payments
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- transaction_categories.created_at
ALTER TABLE transaction_categories
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- transaction_categories.updated_at
ALTER TABLE transaction_categories
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- transactions.created_at
ALTER TABLE transactions
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- transactions.updated_at
ALTER TABLE transactions
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

-- work_schedules.created_at
ALTER TABLE work_schedules
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'Asia/Seoul';

-- work_schedules.updated_at
ALTER TABLE work_schedules
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'Asia/Seoul';

COMMIT;
-- Auto-generated by scan-all-date-columns.ts
