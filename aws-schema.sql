-- AWS Database Schema Export
-- Generated on: 2025-09-20T05:38:20.132Z
-- Source: db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- Table: active_salary_contracts
CREATE TABLE active_salary_contracts (
  id uuid,
  employee_id uuid,
  annual_salary numeric(12,2),
  start_date date,
  end_date date,
  contract_type character varying(50),
  status character varying(50),
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  monthly_salary numeric(12,2),
  notes text,
  created_by character varying(100),
  employee_name text,
  employee_id_number character varying(50),
  department character varying(100),
  position character varying(100)
);


-- Table: attendance_records
CREATE TABLE attendance_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL,
  date date NOT NULL,
  check_in_time timestamp without time zone,
  check_out_time timestamp without time zone,
  work_hours numeric(4,2) DEFAULT 0,
  overtime_hours numeric(4,2) DEFAULT 0,
  status character varying(50) DEFAULT 'present'::character varying,
  notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: bank_accounts
CREATE TABLE bank_accounts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying(255) NOT NULL,
  account_number character varying(50) NOT NULL,
  bank_name character varying(100) NOT NULL,
  account_type character varying(50) DEFAULT 'checking'::character varying,
  balance numeric(15,2) DEFAULT 0,
  currency character varying(3) DEFAULT 'KRW'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: budget_categories
CREATE TABLE budget_categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code character varying(50) NOT NULL,
  name character varying(100) NOT NULL,
  description text,
  parent_category_id uuid,
  is_active boolean DEFAULT true,
  sort_order integer(32) DEFAULT 0,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: budget_evidence
CREATE TABLE budget_evidence (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_budget_id uuid NOT NULL,
  evidence_type character varying(50) NOT NULL,
  title character varying(255) NOT NULL,
  description text,
  amount numeric(15,2) NOT NULL,
  evidence_date date NOT NULL,
  file_path character varying(500),
  file_name character varying(255),
  file_size integer(32),
  mime_type character varying(100),
  status character varying(20) DEFAULT 'pending'::character varying,
  created_by uuid,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  approved_by uuid,
  approved_at timestamp without time zone,
  rejection_reason text
);


-- Table: companies
CREATE TABLE companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(255) NOT NULL,
  establishment_date date,
  ceo_name character varying(100),
  business_type character varying(255),
  address text,
  phone character varying(50),
  fax character varying(50),
  email character varying(255),
  website character varying(255),
  registration_number character varying(50),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: dashboard_configs
CREATE TABLE dashboard_configs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  name character varying(255) NOT NULL,
  description text,
  layout_config jsonb DEFAULT '{}'::jsonb,
  widgets jsonb DEFAULT '[]'::jsonb,
  is_default boolean DEFAULT false,
  is_public boolean DEFAULT false,
  status character varying(50) DEFAULT 'active'::character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: departments
CREATE TABLE departments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(100) NOT NULL,
  description text,
  status character varying(20) DEFAULT 'active'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  max_employees integer(32) DEFAULT 0
);


-- Table: document_submissions
CREATE TABLE document_submissions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid,
  template_id uuid,
  submitter_id uuid,
  document_data jsonb NOT NULL,
  file_url character varying(500),
  status character varying(50) DEFAULT 'draft'::character varying,
  submitted_at timestamp without time zone,
  approved_by uuid,
  approved_at timestamp without time zone,
  notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: document_templates
CREATE TABLE document_templates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying(255) NOT NULL,
  type character varying(50) NOT NULL,
  category character varying(50) NOT NULL,
  template_content jsonb NOT NULL,
  required_fields jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: employee_payrolls
CREATE TABLE employee_payrolls (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payroll_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  employee_name character varying(100) NOT NULL,
  employee_id_number character varying(20) NOT NULL,
  department character varying(50) NOT NULL,
  position character varying(50) NOT NULL,
  base_salary numeric(12,2) NOT NULL DEFAULT 0,
  allowances jsonb DEFAULT '[]'::jsonb,
  deductions jsonb DEFAULT '[]'::jsonb,
  total_allowances numeric(12,2) NOT NULL DEFAULT 0,
  total_deductions numeric(12,2) NOT NULL DEFAULT 0,
  gross_salary numeric(12,2) NOT NULL DEFAULT 0,
  net_salary numeric(12,2) NOT NULL DEFAULT 0,
  status character varying(20) NOT NULL DEFAULT 'pending'::character varying,
  pay_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);


-- Table: employees
CREATE TABLE employees (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  employee_id character varying(50) NOT NULL,
  user_id uuid,
  first_name character varying(100) NOT NULL,
  last_name character varying(100) NOT NULL,
  email character varying(255) NOT NULL,
  phone character varying(50),
  department character varying(100),
  position character varying(100),
  manager_id uuid,
  employment_type character varying(50),
  hire_date date,
  salary numeric(12,2),
  status character varying(50) DEFAULT 'active'::character varying,
  address text,
  emergency_contact jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  job_title_id uuid,
  birth_date date,
  termination_date date
);


-- Table: evaluation_items
CREATE TABLE evaluation_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  evaluation_id uuid NOT NULL,
  category character varying(100) NOT NULL,
  item_name character varying(255) NOT NULL,
  rating numeric(3,2) NOT NULL,
  comments text,
  weight numeric(3,2) DEFAULT 1.00,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: evaluations
CREATE TABLE evaluations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL,
  evaluator_id uuid NOT NULL,
  evaluation_type character varying(50) NOT NULL,
  evaluation_period character varying(50) NOT NULL,
  status character varying(50) DEFAULT 'draft'::character varying,
  overall_rating numeric(3,2),
  strengths text,
  areas_for_improvement text,
  comments text,
  submitted_at timestamp without time zone,
  reviewed_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: evidence_categories
CREATE TABLE evidence_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(100) NOT NULL,
  description text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: evidence_documents
CREATE TABLE evidence_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  evidence_item_id uuid NOT NULL,
  document_type character varying(100) NOT NULL,
  document_name character varying(200) NOT NULL,
  file_path character varying(500),
  file_size bigint(64),
  mime_type character varying(100),
  upload_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  uploader_id uuid,
  status character varying(20) NOT NULL DEFAULT 'uploaded'::character varying,
  reviewer_id uuid,
  review_date timestamp without time zone,
  review_notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: evidence_items
CREATE TABLE evidence_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_budget_id uuid NOT NULL,
  category_id uuid NOT NULL,
  name character varying(200) NOT NULL,
  description text,
  budget_amount numeric(15,2) NOT NULL DEFAULT 0,
  spent_amount numeric(15,2) NOT NULL DEFAULT 0,
  assignee_id uuid,
  assignee_name character varying(100),
  progress integer(32) NOT NULL DEFAULT 0,
  status character varying(20) NOT NULL DEFAULT 'planned'::character varying,
  due_date date,
  start_date date,
  end_date date,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: evidence_items_detail
CREATE TABLE evidence_items_detail (
  id uuid,
  project_budget_id uuid,
  period_number integer(32),
  fiscal_year integer(32),
  category_id uuid,
  category_name character varying(100),
  name character varying(200),
  description text,
  budget_amount numeric(15,2),
  spent_amount numeric(15,2),
  assignee_id uuid,
  assignee_name character varying(100),
  progress integer(32),
  status character varying(20),
  due_date date,
  start_date date,
  end_date date,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  document_count bigint(64),
  approved_document_count bigint(64),
  pending_schedule_count bigint(64),
  overdue_schedule_count bigint(64)
);


-- Table: evidence_notifications
CREATE TABLE evidence_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  evidence_item_id uuid,
  evidence_schedule_id uuid,
  recipient_id uuid NOT NULL,
  notification_type character varying(50) NOT NULL,
  title character varying(200) NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  read_at timestamp without time zone
);


-- Table: evidence_progress_summary
CREATE TABLE evidence_progress_summary (
  project_budget_id uuid,
  period_number integer(32),
  fiscal_year integer(32),
  category_name character varying(100),
  total_items bigint(64),
  completed_items bigint(64),
  in_progress_items bigint(64),
  planned_items bigint(64),
  reviewing_items bigint(64),
  average_progress numeric,
  total_budget_amount numeric,
  total_spent_amount numeric
);


-- Table: evidence_review_history
CREATE TABLE evidence_review_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  evidence_item_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  review_type character varying(50) NOT NULL,
  review_status character varying(20) NOT NULL,
  review_notes text,
  reviewed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: evidence_schedules
CREATE TABLE evidence_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  evidence_item_id uuid NOT NULL,
  task_name character varying(200) NOT NULL,
  description text,
  due_date date NOT NULL,
  completed_date date,
  assignee_id uuid,
  status character varying(20) NOT NULL DEFAULT 'pending'::character varying,
  priority character varying(10) NOT NULL DEFAULT 'medium'::character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: evidence_types
CREATE TABLE evidence_types (
  id integer(32) NOT NULL DEFAULT nextval('evidence_types_id_seq'::regclass),
  code character varying(50) NOT NULL,
  name character varying(100) NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: executives
CREATE TABLE executives (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  executive_id character varying(50) NOT NULL,
  first_name character varying(100) NOT NULL,
  last_name character varying(100) NOT NULL,
  email character varying(255) NOT NULL,
  phone character varying(50),
  job_title_id uuid,
  department character varying(100),
  appointment_date date,
  term_end_date date,
  status character varying(50) DEFAULT 'active'::character varying,
  bio text,
  profile_image_url character varying(500),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: expense_items
CREATE TABLE expense_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid,
  category_code character varying(50) NOT NULL,
  requester_id uuid,
  amount numeric(15,2) NOT NULL,
  currency character varying(3) DEFAULT 'KRW'::character varying,
  description text,
  status character varying(50) DEFAULT 'pending'::character varying,
  dept_owner character varying(100),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: feedback
CREATE TABLE feedback (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL,
  feedback_giver_id uuid NOT NULL,
  feedback_type character varying(50) NOT NULL,
  title character varying(255) NOT NULL,
  content text NOT NULL,
  is_anonymous boolean DEFAULT false,
  status character varying(50) DEFAULT 'active'::character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: global_factors
CREATE TABLE global_factors (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  factor_name character varying(100) NOT NULL,
  factor_value character varying(255) NOT NULL,
  description text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: goals
CREATE TABLE goals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL,
  title character varying(255) NOT NULL,
  description text,
  goal_type character varying(50) NOT NULL,
  category character varying(100),
  target_value numeric(12,2),
  current_value numeric(12,2) DEFAULT 0,
  unit character varying(50),
  start_date date NOT NULL,
  end_date date NOT NULL,
  status character varying(50) DEFAULT 'active'::character varying,
  priority character varying(20) DEFAULT 'medium'::character varying,
  created_by uuid,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: job_titles
CREATE TABLE job_titles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying(100) NOT NULL,
  level integer(32) NOT NULL,
  category character varying(50) NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: leave_balances
CREATE TABLE leave_balances (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL,
  leave_type_id uuid NOT NULL,
  year integer(32) NOT NULL,
  total_days numeric(4,2) DEFAULT 0,
  used_days numeric(4,2) DEFAULT 0,
  remaining_days numeric(4,2) DEFAULT 0,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: leave_requests
CREATE TABLE leave_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL,
  leave_type_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days numeric(4,2) NOT NULL,
  reason text,
  status character varying(50) DEFAULT 'pending'::character varying,
  approved_by uuid,
  approved_at timestamp without time zone,
  rejection_reason text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: leave_types
CREATE TABLE leave_types (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying(100) NOT NULL,
  description text,
  max_days integer(32) DEFAULT 0,
  is_paid boolean DEFAULT true,
  requires_approval boolean DEFAULT true,
  advance_notice_days integer(32) DEFAULT 0,
  status character varying(50) DEFAULT 'active'::character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: participation_rate_history
CREATE TABLE participation_rate_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  employee_id uuid,
  project_id uuid,
  old_rate integer(32),
  new_rate integer(32) NOT NULL,
  change_reason character varying(255),
  change_date date NOT NULL,
  changed_by uuid,
  notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: participation_rates
CREATE TABLE participation_rates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  employee_id uuid,
  project_id uuid,
  participation_rate integer(32) NOT NULL,
  start_date date NOT NULL,
  end_date date,
  status character varying(50) DEFAULT 'active'::character varying,
  created_by uuid,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: payrolls
CREATE TABLE payrolls (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  period character varying(7) NOT NULL,
  pay_date date NOT NULL,
  status character varying(20) NOT NULL DEFAULT 'draft'::character varying,
  total_employees integer(32) NOT NULL DEFAULT 0,
  total_gross_salary numeric(15,2) NOT NULL DEFAULT 0,
  total_deductions numeric(15,2) NOT NULL DEFAULT 0,
  total_net_salary numeric(15,2) NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by character varying(50) NOT NULL,
  approved_by character varying(50),
  approved_at timestamp with time zone
);


-- Table: payslip_templates
CREATE TABLE payslip_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  default_payments jsonb NOT NULL DEFAULT '[{"id": "basic_salary", "name": "기본급", "type": "basic", "amount": 0, "isTaxable": true}, {"id": "position_allowance", "name": "직책수당", "type": "allowance", "amount": 0, "isTaxable": true}, {"id": "bonus", "name": "상여금", "type": "bonus", "amount": 0, "isTaxable": true}, {"id": "meal_allowance", "name": "식대", "type": "allowance", "amount": 300000, "isTaxable": false}, {"id": "vehicle_maintenance", "name": "차량유지", "type": "allowance", "amount": 200000, "isTaxable": false}, {"id": "annual_leave_allowance", "name": "연차수당", "type": "allowance", "amount": 0, "isTaxable": true}, {"id": "year_end_settlement", "name": "연말정산", "type": "settlement", "amount": 0, "isTaxable": true}]'::jsonb,
  default_deductions jsonb NOT NULL DEFAULT '[{"id": "health_insurance", "name": "건강보험", "rate": 0.034, "type": "insurance", "amount": 0, "isMandatory": true}, {"id": "long_term_care", "name": "장기요양보험", "rate": 0.0034, "type": "insurance", "amount": 0, "isMandatory": true}, {"id": "national_pension", "name": "국민연금", "rate": 0.045, "type": "pension", "amount": 0, "isMandatory": true}, {"id": "employment_insurance", "name": "고용보험", "rate": 0.008, "type": "insurance", "amount": 0, "isMandatory": true}, {"id": "income_tax", "name": "갑근세", "rate": 0.13, "type": "tax", "amount": 0, "isMandatory": true}, {"id": "local_tax", "name": "주민세", "rate": 0.013, "type": "tax", "amount": 0, "isMandatory": true}, {"id": "other", "name": "기타", "rate": 0, "type": "other", "amount": 0, "isMandatory": false}]'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: payslips
CREATE TABLE payslips (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL,
  pay_period_start date NOT NULL,
  pay_period_end date NOT NULL,
  base_salary numeric(12,2) NOT NULL,
  overtime_pay numeric(12,2) DEFAULT 0,
  bonus numeric(12,2) DEFAULT 0,
  old_deductions numeric(12,2) DEFAULT 0,
  total_amount numeric(12,2) NOT NULL,
  status character varying(50) DEFAULT 'generated'::character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  period character varying(7),
  pay_date date,
  employee_name character varying(255),
  employee_id_number character varying(50),
  department character varying(100),
  position character varying(100),
  hire_date date,
  total_payments numeric(15,2) DEFAULT 0,
  total_deductions numeric(15,2) DEFAULT 0,
  net_salary numeric(15,2) DEFAULT 0,
  payments jsonb DEFAULT '[]'::jsonb,
  is_generated boolean DEFAULT false,
  created_by character varying(100) DEFAULT 'system'::character varying,
  updated_by character varying(100) DEFAULT 'system'::character varying,
  deductions jsonb DEFAULT '[]'::jsonb
);


-- Table: performance_records
CREATE TABLE performance_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL,
  record_type character varying(50) NOT NULL,
  title character varying(255) NOT NULL,
  description text,
  date date NOT NULL,
  impact_level character varying(20) DEFAULT 'medium'::character varying,
  verified_by uuid,
  verified_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: positions
CREATE TABLE positions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(100) NOT NULL,
  description text,
  department character varying(100) NOT NULL,
  level integer(32) DEFAULT 1,
  status character varying(20) DEFAULT 'active'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);


-- Table: project_budgets
CREATE TABLE project_budgets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid,
  fiscal_year integer(32) NOT NULL,
  total_budget numeric(15,2) NOT NULL,
  personnel_cost numeric(15,2) DEFAULT 0,
  research_material_cost numeric(15,2) DEFAULT 0,
  research_activity_cost numeric(15,2) DEFAULT 0,
  indirect_cost numeric(15,2) DEFAULT 0,
  spent_amount numeric(15,2) DEFAULT 0,
  currency character varying(3) DEFAULT 'KRW'::character varying,
  status character varying(50) DEFAULT 'planned'::character varying,
  notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  contribution_type character varying(20) DEFAULT 'cash'::character varying,
  personnel_cost_cash numeric(15,2) DEFAULT 0,
  personnel_cost_in_kind numeric(15,2) DEFAULT 0,
  research_material_cost_cash numeric(15,2) DEFAULT 0,
  research_material_cost_in_kind numeric(15,2) DEFAULT 0,
  research_activity_cost_cash numeric(15,2) DEFAULT 0,
  research_activity_cost_in_kind numeric(15,2) DEFAULT 0,
  indirect_cost_cash numeric(15,2) DEFAULT 0,
  indirect_cost_in_kind numeric(15,2) DEFAULT 0,
  period_number integer(32) DEFAULT 1,
  start_date date,
  end_date date
);


-- Table: project_members
CREATE TABLE project_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid,
  employee_id uuid,
  role character varying(100) NOT NULL,
  start_date date NOT NULL,
  end_date date,
  participation_rate integer(32) NOT NULL,
  monthly_salary numeric(12,2),
  status character varying(50) DEFAULT 'active'::character varying,
  notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  contribution_type character varying(20) DEFAULT 'cash'::character varying,
  monthly_amount numeric(12,2) DEFAULT 0
);


-- Table: project_milestones
CREATE TABLE project_milestones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid,
  title character varying(255) NOT NULL,
  description text,
  milestone_date date NOT NULL,
  status character varying(50) DEFAULT 'pending'::character varying,
  completion_date date,
  notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: project_participations
CREATE TABLE project_participations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid,
  employee_id uuid,
  start_date date NOT NULL,
  end_date date,
  participation_rate integer(32) NOT NULL,
  monthly_salary numeric(12,2),
  role character varying(100),
  status character varying(50) DEFAULT 'active'::character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: project_risks
CREATE TABLE project_risks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid,
  risk_type character varying(100) NOT NULL,
  title character varying(255) NOT NULL,
  description text,
  probability character varying(50) DEFAULT 'medium'::character varying,
  impact character varying(50) DEFAULT 'medium'::character varying,
  status character varying(50) DEFAULT 'open'::character varying,
  mitigation_plan text,
  owner_id uuid,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: projects
CREATE TABLE projects (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code character varying(50) NOT NULL,
  title character varying(255) NOT NULL,
  description text,
  sponsor character varying(255),
  sponsor_type character varying(50) DEFAULT 'government'::character varying,
  start_date date,
  end_date date,
  manager_id uuid,
  status character varying(50) DEFAULT 'planning'::character varying,
  budget_total numeric(15,2),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  sponsor_name character varying(255),
  budget_currency character varying(3) DEFAULT 'KRW'::character varying,
  research_type character varying(50),
  technology_area character varying(100),
  priority character varying(50) DEFAULT 'medium'::character varying
);


-- Table: rd_budget_items
CREATE TABLE rd_budget_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid,
  category character varying(50) NOT NULL,
  subcategory character varying(100),
  description text,
  budgeted_amount numeric(15,2) NOT NULL,
  spent_amount numeric(15,2) DEFAULT 0,
  currency character varying(3) DEFAULT 'KRW'::character varying,
  fiscal_year integer(32),
  quarter integer(32),
  status character varying(50) DEFAULT 'planned'::character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: rd_employees
CREATE TABLE rd_employees (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  employee_id uuid,
  specialization character varying(100),
  research_areas ARRAY,
  publications integer(32) DEFAULT 0,
  patents integer(32) DEFAULT 0,
  experience_years integer(32) DEFAULT 0,
  education_level character varying(50),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: rd_projects
CREATE TABLE rd_projects (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid,
  research_type character varying(50) NOT NULL,
  technology_area character varying(100),
  priority character varying(50) DEFAULT 'medium'::character varying,
  budget_personnel numeric(15,2),
  budget_material numeric(15,2),
  budget_equipment numeric(15,2),
  budget_other numeric(15,2),
  start_date date,
  end_date date,
  status character varying(50) DEFAULT 'planning'::character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: report_executions
CREATE TABLE report_executions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  template_id uuid NOT NULL,
  executed_by uuid,
  execution_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  parameters jsonb DEFAULT '{}'::jsonb,
  result_data jsonb DEFAULT '{}'::jsonb,
  execution_time_ms integer(32),
  status character varying(50) DEFAULT 'completed'::character varying,
  error_message text,
  file_path text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: report_subscriptions
CREATE TABLE report_subscriptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  template_id uuid NOT NULL,
  subscriber_id uuid NOT NULL,
  schedule_type character varying(50) NOT NULL,
  schedule_config jsonb DEFAULT '{}'::jsonb,
  delivery_method character varying(50) DEFAULT 'email'::character varying,
  delivery_config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  last_sent timestamp without time zone,
  next_send timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: report_templates
CREATE TABLE report_templates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying(255) NOT NULL,
  description text,
  category character varying(100) NOT NULL,
  template_type character varying(50) NOT NULL,
  query_sql text,
  chart_config jsonb DEFAULT '{}'::jsonb,
  display_config jsonb DEFAULT '{}'::jsonb,
  parameters jsonb DEFAULT '{}'::jsonb,
  is_public boolean DEFAULT false,
  created_by uuid,
  status character varying(50) DEFAULT 'active'::character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: salary_contract_history
CREATE TABLE salary_contract_history (
  id uuid,
  employee_id uuid,
  annual_salary numeric(12,2),
  start_date date,
  end_date date,
  contract_type character varying(50),
  status character varying(50),
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  monthly_salary numeric(12,2),
  notes text,
  created_by character varying(100),
  employee_name text,
  employee_id_number character varying(50),
  department character varying(100),
  position character varying(100),
  contract_end_display text,
  status_display character varying
);


-- Table: salary_contracts
CREATE TABLE salary_contracts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL,
  annual_salary numeric(12,2) NOT NULL,
  start_date date NOT NULL,
  end_date date,
  contract_type character varying(50) DEFAULT 'full_time'::character varying,
  status character varying(50) DEFAULT 'active'::character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  monthly_salary numeric(12,2),
  notes text,
  created_by character varying(100) DEFAULT 'system'::character varying
);


-- Table: salary_history
CREATE TABLE salary_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  period character varying(7) NOT NULL,
  base_salary numeric(12,2) NOT NULL DEFAULT 0,
  total_allowances numeric(12,2) NOT NULL DEFAULT 0,
  total_deductions numeric(12,2) NOT NULL DEFAULT 0,
  gross_salary numeric(12,2) NOT NULL DEFAULT 0,
  net_salary numeric(12,2) NOT NULL DEFAULT 0,
  change_type character varying(20) NOT NULL,
  change_reason text NOT NULL,
  effective_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by character varying(50) NOT NULL
);


-- Table: salary_payments
CREATE TABLE salary_payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL,
  payment_date date NOT NULL,
  base_salary numeric(12,2) NOT NULL,
  overtime_pay numeric(12,2) DEFAULT 0,
  bonus numeric(12,2) DEFAULT 0,
  deductions numeric(12,2) DEFAULT 0,
  total_amount numeric(12,2) NOT NULL,
  payment_method character varying(50) DEFAULT 'bank_transfer'::character varying,
  status character varying(50) DEFAULT 'completed'::character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: salary_settings
CREATE TABLE salary_settings (
  id character varying(50) NOT NULL,
  company_id character varying(50) NOT NULL,
  pay_day integer(32) NOT NULL DEFAULT 25,
  overtime_rate numeric(5,2) NOT NULL DEFAULT 1.5,
  holiday_rate numeric(5,2) NOT NULL DEFAULT 2.0,
  night_shift_rate numeric(5,2) NOT NULL DEFAULT 1.3,
  weekend_rate numeric(5,2) NOT NULL DEFAULT 1.2,
  tax_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  deduction_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);


-- Table: salary_structures
CREATE TABLE salary_structures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  base_salary numeric(12,2) NOT NULL DEFAULT 0,
  allowances jsonb DEFAULT '[]'::jsonb,
  deductions jsonb DEFAULT '[]'::jsonb,
  total_allowances numeric(12,2) NOT NULL DEFAULT 0,
  total_deductions numeric(12,2) NOT NULL DEFAULT 0,
  net_salary numeric(12,2) NOT NULL DEFAULT 0,
  effective_date date NOT NULL,
  end_date date,
  status character varying(20) NOT NULL DEFAULT 'active'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by character varying(50) NOT NULL,
  approved_by character varying(50),
  approved_at timestamp with time zone
);


-- Table: transaction_categories
CREATE TABLE transaction_categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying(255) NOT NULL,
  type character varying(50) NOT NULL,
  parent_id uuid,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: transactions
CREATE TABLE transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  bank_account_id uuid,
  category_id uuid,
  amount numeric(15,2) NOT NULL,
  type character varying(50) NOT NULL,
  description text,
  reference character varying(255),
  date date NOT NULL,
  created_by uuid,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: users
CREATE TABLE users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email character varying(255) NOT NULL,
  password_hash character varying(255) NOT NULL,
  name character varying(255) NOT NULL,
  department character varying(100),
  position character varying(100),
  role character varying(50) DEFAULT 'user'::character varying,
  is_active boolean DEFAULT true,
  last_login timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- Table: work_schedules
CREATE TABLE work_schedules (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL,
  schedule_type character varying(50) DEFAULT 'standard'::character varying,
  start_time time without time zone DEFAULT '09:00:00'::time without time zone,
  end_time time without time zone DEFAULT '18:00:00'::time without time zone,
  break_duration integer(32) DEFAULT 60,
  work_days jsonb DEFAULT '["monday", "tuesday", "wednesday", "thursday", "friday"]'::jsonb,
  overtime_threshold integer(32) DEFAULT 8,
  status character varying(50) DEFAULT 'active'::character varying,
  effective_from date NOT NULL,
  effective_to date,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX attendance_records_employee_id_date_key ON public.attendance_records USING btree (employee_id, date);
CREATE UNIQUE INDEX budget_categories_code_key ON public.budget_categories USING btree (code);
CREATE INDEX idx_budget_evidence_created_by ON public.budget_evidence USING btree (created_by);
CREATE INDEX idx_budget_evidence_evidence_date ON public.budget_evidence USING btree (evidence_date);
CREATE INDEX idx_budget_evidence_project_budget_id ON public.budget_evidence USING btree (project_budget_id);
CREATE INDEX idx_budget_evidence_status ON public.budget_evidence USING btree (status);
CREATE INDEX idx_companies_name ON public.companies USING btree (name);
CREATE UNIQUE INDEX departments_name_key ON public.departments USING btree (name);
CREATE INDEX idx_document_submissions_project_id ON public.document_submissions USING btree (project_id);
CREATE INDEX idx_employee_payrolls_employee_id ON public.employee_payrolls USING btree (employee_id);
CREATE INDEX idx_employee_payrolls_pay_date ON public.employee_payrolls USING btree (pay_date);
CREATE INDEX idx_employee_payrolls_payroll_id ON public.employee_payrolls USING btree (payroll_id);
CREATE INDEX idx_employee_payrolls_status ON public.employee_payrolls USING btree (status);
CREATE UNIQUE INDEX employees_email_key ON public.employees USING btree (email);
CREATE UNIQUE INDEX employees_employee_id_key ON public.employees USING btree (employee_id);
CREATE INDEX idx_employees_birth_date ON public.employees USING btree (birth_date);
CREATE INDEX idx_employees_department ON public.employees USING btree (department);
CREATE INDEX idx_employees_employee_id ON public.employees USING btree (employee_id);
CREATE INDEX idx_employees_termination_date ON public.employees USING btree (termination_date);
CREATE INDEX idx_evidence_documents_item ON public.evidence_documents USING btree (evidence_item_id);
CREATE INDEX idx_evidence_documents_status ON public.evidence_documents USING btree (status);
CREATE INDEX idx_evidence_documents_type ON public.evidence_documents USING btree (document_type);
CREATE INDEX idx_evidence_items_assignee ON public.evidence_items USING btree (assignee_id);
CREATE INDEX idx_evidence_items_category ON public.evidence_items USING btree (category_id);
CREATE INDEX idx_evidence_items_due_date ON public.evidence_items USING btree (due_date);
CREATE INDEX idx_evidence_items_project_budget ON public.evidence_items USING btree (project_budget_id);
CREATE INDEX idx_evidence_items_status ON public.evidence_items USING btree (status);
CREATE INDEX idx_evidence_notifications_read ON public.evidence_notifications USING btree (is_read);
CREATE INDEX idx_evidence_notifications_recipient ON public.evidence_notifications USING btree (recipient_id);
CREATE INDEX idx_evidence_review_history_item ON public.evidence_review_history USING btree (evidence_item_id);
CREATE INDEX idx_evidence_review_history_reviewer ON public.evidence_review_history USING btree (reviewer_id);
CREATE INDEX idx_evidence_schedules_assignee ON public.evidence_schedules USING btree (assignee_id);
CREATE INDEX idx_evidence_schedules_due_date ON public.evidence_schedules USING btree (due_date);
CREATE INDEX idx_evidence_schedules_item ON public.evidence_schedules USING btree (evidence_item_id);
CREATE INDEX idx_evidence_schedules_status ON public.evidence_schedules USING btree (status);
CREATE UNIQUE INDEX evidence_types_code_key ON public.evidence_types USING btree (code);
CREATE UNIQUE INDEX executives_email_key ON public.executives USING btree (email);
CREATE UNIQUE INDEX executives_executive_id_key ON public.executives USING btree (executive_id);
CREATE INDEX idx_executives_executive_id ON public.executives USING btree (executive_id);
CREATE INDEX idx_executives_job_title_id ON public.executives USING btree (job_title_id);
CREATE UNIQUE INDEX global_factors_factor_name_key ON public.global_factors USING btree (factor_name);
CREATE INDEX idx_global_factors_name ON public.global_factors USING btree (factor_name);
CREATE INDEX idx_job_titles_category ON public.job_titles USING btree (category);
CREATE INDEX idx_job_titles_level ON public.job_titles USING btree (level);
CREATE UNIQUE INDEX job_titles_name_key ON public.job_titles USING btree (name);
CREATE UNIQUE INDEX leave_balances_employee_id_leave_type_id_year_key ON public.leave_balances USING btree (employee_id, leave_type_id, year);
CREATE INDEX idx_participation_rates_employee ON public.participation_rates USING btree (employee_id);
CREATE INDEX idx_participation_rates_project ON public.participation_rates USING btree (project_id);
CREATE INDEX idx_participation_rates_status ON public.participation_rates USING btree (status);
CREATE UNIQUE INDEX participation_rates_employee_id_project_id_start_date_key ON public.participation_rates USING btree (employee_id, project_id, start_date);
CREATE INDEX idx_payrolls_pay_date ON public.payrolls USING btree (pay_date);
CREATE INDEX idx_payrolls_period ON public.payrolls USING btree (period);
CREATE INDEX idx_payrolls_status ON public.payrolls USING btree (status);
CREATE UNIQUE INDEX payrolls_period_key ON public.payrolls USING btree (period);
CREATE UNIQUE INDEX payslip_templates_employee_id_key ON public.payslip_templates USING btree (employee_id);
CREATE INDEX idx_payslips_employee_id ON public.payslips USING btree (employee_id);
CREATE INDEX idx_payslips_employee_period ON public.payslips USING btree (employee_id, period);
CREATE INDEX idx_payslips_period ON public.payslips USING btree (period);
CREATE INDEX idx_payslips_status ON public.payslips USING btree (status);
CREATE UNIQUE INDEX positions_name_department_key ON public.positions USING btree (name, department);
CREATE INDEX idx_project_budgets_project ON public.project_budgets USING btree (project_id);
CREATE INDEX idx_project_budgets_year ON public.project_budgets USING btree (fiscal_year);
CREATE UNIQUE INDEX project_budgets_project_id_fiscal_year_key ON public.project_budgets USING btree (project_id, fiscal_year);
CREATE INDEX idx_project_members_employee ON public.project_members USING btree (employee_id);
CREATE INDEX idx_project_members_project ON public.project_members USING btree (project_id);
CREATE INDEX idx_project_members_status ON public.project_members USING btree (status);
CREATE UNIQUE INDEX project_members_project_id_employee_id_start_date_key ON public.project_members USING btree (project_id, employee_id, start_date);
CREATE INDEX idx_project_participations_employee_id ON public.project_participations USING btree (employee_id);
CREATE INDEX idx_project_participations_project_id ON public.project_participations USING btree (project_id);
CREATE INDEX idx_projects_code ON public.projects USING btree (code);
CREATE INDEX idx_projects_dates ON public.projects USING btree (start_date, end_date);
CREATE INDEX idx_projects_manager ON public.projects USING btree (manager_id);
CREATE INDEX idx_projects_status ON public.projects USING btree (status);
CREATE UNIQUE INDEX projects_code_key ON public.projects USING btree (code);
CREATE INDEX idx_rd_budget_items_project_id ON public.rd_budget_items USING btree (project_id);
CREATE INDEX idx_salary_contracts_dates ON public.salary_contracts USING btree (start_date, end_date);
CREATE INDEX idx_salary_contracts_employee_id ON public.salary_contracts USING btree (employee_id);
CREATE INDEX idx_salary_contracts_status ON public.salary_contracts USING btree (status);
CREATE INDEX idx_salary_history_employee_id ON public.salary_history USING btree (employee_id);
CREATE INDEX idx_salary_history_period ON public.salary_history USING btree (period);
CREATE INDEX idx_salary_structures_effective_date ON public.salary_structures USING btree (effective_date);
CREATE INDEX idx_salary_structures_employee_id ON public.salary_structures USING btree (employee_id);
CREATE INDEX idx_salary_structures_status ON public.salary_structures USING btree (status);
CREATE INDEX idx_transactions_date ON public.transactions USING btree (date);
CREATE INDEX idx_transactions_type ON public.transactions USING btree (type);
CREATE INDEX idx_users_email ON public.users USING btree (email);
CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

-- Constraints
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE budget_categories ADD CONSTRAINT budget_categories_parent_category_id_fkey FOREIGN KEY (parent_category_id) REFERENCES budget_categories(id);
ALTER TABLE budget_evidence ADD CONSTRAINT budget_evidence_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES employees(id);
ALTER TABLE budget_evidence ADD CONSTRAINT budget_evidence_created_by_fkey FOREIGN KEY (created_by) REFERENCES employees(id);
ALTER TABLE budget_evidence ADD CONSTRAINT budget_evidence_project_budget_id_fkey FOREIGN KEY (project_budget_id) REFERENCES project_budgets(id);
ALTER TABLE dashboard_configs ADD CONSTRAINT dashboard_configs_user_id_fkey FOREIGN KEY (user_id) REFERENCES employees(id);
ALTER TABLE document_submissions ADD CONSTRAINT document_submissions_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES users(id);
ALTER TABLE document_submissions ADD CONSTRAINT document_submissions_project_id_fkey FOREIGN KEY (project_id) REFERENCES rd_projects(id);
ALTER TABLE document_submissions ADD CONSTRAINT document_submissions_submitter_id_fkey FOREIGN KEY (submitter_id) REFERENCES users(id);
ALTER TABLE document_submissions ADD CONSTRAINT document_submissions_template_id_fkey FOREIGN KEY (template_id) REFERENCES document_templates(id);
ALTER TABLE document_templates ADD CONSTRAINT document_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE employee_payrolls ADD CONSTRAINT employee_payrolls_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE employee_payrolls ADD CONSTRAINT employee_payrolls_payroll_id_fkey FOREIGN KEY (payroll_id) REFERENCES payrolls(id);
ALTER TABLE employees ADD CONSTRAINT employees_job_title_id_fkey FOREIGN KEY (job_title_id) REFERENCES job_titles(id);
ALTER TABLE employees ADD CONSTRAINT employees_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES employees(id);
ALTER TABLE employees ADD CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE evaluation_items ADD CONSTRAINT evaluation_items_evaluation_id_fkey FOREIGN KEY (evaluation_id) REFERENCES evaluations(id);
ALTER TABLE evaluations ADD CONSTRAINT evaluations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE evaluations ADD CONSTRAINT evaluations_evaluator_id_fkey FOREIGN KEY (evaluator_id) REFERENCES employees(id);
ALTER TABLE evidence_documents ADD CONSTRAINT evidence_documents_evidence_item_id_fkey FOREIGN KEY (evidence_item_id) REFERENCES evidence_items(id);
ALTER TABLE evidence_documents ADD CONSTRAINT evidence_documents_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES employees(id);
ALTER TABLE evidence_documents ADD CONSTRAINT evidence_documents_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES employees(id);
ALTER TABLE evidence_items ADD CONSTRAINT evidence_items_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES employees(id);
ALTER TABLE evidence_items ADD CONSTRAINT evidence_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES evidence_categories(id);
ALTER TABLE evidence_items ADD CONSTRAINT evidence_items_project_budget_id_fkey FOREIGN KEY (project_budget_id) REFERENCES project_budgets(id);
ALTER TABLE evidence_notifications ADD CONSTRAINT evidence_notifications_evidence_item_id_fkey FOREIGN KEY (evidence_item_id) REFERENCES evidence_items(id);
ALTER TABLE evidence_notifications ADD CONSTRAINT evidence_notifications_evidence_schedule_id_fkey FOREIGN KEY (evidence_schedule_id) REFERENCES evidence_schedules(id);
ALTER TABLE evidence_notifications ADD CONSTRAINT evidence_notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES employees(id);
ALTER TABLE evidence_review_history ADD CONSTRAINT evidence_review_history_evidence_item_id_fkey FOREIGN KEY (evidence_item_id) REFERENCES evidence_items(id);
ALTER TABLE evidence_review_history ADD CONSTRAINT evidence_review_history_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES employees(id);
ALTER TABLE evidence_schedules ADD CONSTRAINT evidence_schedules_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES employees(id);
ALTER TABLE evidence_schedules ADD CONSTRAINT evidence_schedules_evidence_item_id_fkey FOREIGN KEY (evidence_item_id) REFERENCES evidence_items(id);
ALTER TABLE executives ADD CONSTRAINT executives_job_title_id_fkey FOREIGN KEY (job_title_id) REFERENCES job_titles(id);
ALTER TABLE expense_items ADD CONSTRAINT expense_items_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id);
ALTER TABLE expense_items ADD CONSTRAINT expense_items_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES users(id);
ALTER TABLE feedback ADD CONSTRAINT feedback_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE feedback ADD CONSTRAINT feedback_feedback_giver_id_fkey FOREIGN KEY (feedback_giver_id) REFERENCES employees(id);
ALTER TABLE goals ADD CONSTRAINT goals_created_by_fkey FOREIGN KEY (created_by) REFERENCES employees(id);
ALTER TABLE goals ADD CONSTRAINT goals_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE leave_balances ADD CONSTRAINT leave_balances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE leave_balances ADD CONSTRAINT leave_balances_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES leave_types(id);
ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES employees(id);
ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES leave_types(id);
ALTER TABLE participation_rate_history ADD CONSTRAINT participation_rate_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES employees(id);
ALTER TABLE participation_rate_history ADD CONSTRAINT participation_rate_history_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE participation_rate_history ADD CONSTRAINT participation_rate_history_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id);
ALTER TABLE participation_rates ADD CONSTRAINT participation_rates_created_by_fkey FOREIGN KEY (created_by) REFERENCES employees(id);
ALTER TABLE participation_rates ADD CONSTRAINT participation_rates_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE participation_rates ADD CONSTRAINT participation_rates_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id);
ALTER TABLE payslip_templates ADD CONSTRAINT payslip_templates_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE payslips ADD CONSTRAINT payslips_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE performance_records ADD CONSTRAINT performance_records_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE performance_records ADD CONSTRAINT performance_records_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES employees(id);
ALTER TABLE project_budgets ADD CONSTRAINT project_budgets_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id);
ALTER TABLE project_members ADD CONSTRAINT project_members_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE project_members ADD CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id);
ALTER TABLE project_milestones ADD CONSTRAINT project_milestones_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id);
ALTER TABLE project_participations ADD CONSTRAINT project_participations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES rd_employees(id);
ALTER TABLE project_participations ADD CONSTRAINT project_participations_project_id_fkey FOREIGN KEY (project_id) REFERENCES rd_projects(id);
ALTER TABLE project_risks ADD CONSTRAINT project_risks_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES employees(id);
ALTER TABLE project_risks ADD CONSTRAINT project_risks_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id);
ALTER TABLE projects ADD CONSTRAINT projects_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES users(id);
ALTER TABLE rd_budget_items ADD CONSTRAINT rd_budget_items_project_id_fkey FOREIGN KEY (project_id) REFERENCES rd_projects(id);
ALTER TABLE rd_employees ADD CONSTRAINT rd_employees_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE rd_projects ADD CONSTRAINT rd_projects_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id);
ALTER TABLE report_executions ADD CONSTRAINT report_executions_executed_by_fkey FOREIGN KEY (executed_by) REFERENCES employees(id);
ALTER TABLE report_executions ADD CONSTRAINT report_executions_template_id_fkey FOREIGN KEY (template_id) REFERENCES report_templates(id);
ALTER TABLE report_subscriptions ADD CONSTRAINT report_subscriptions_subscriber_id_fkey FOREIGN KEY (subscriber_id) REFERENCES employees(id);
ALTER TABLE report_subscriptions ADD CONSTRAINT report_subscriptions_template_id_fkey FOREIGN KEY (template_id) REFERENCES report_templates(id);
ALTER TABLE report_templates ADD CONSTRAINT report_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES employees(id);
ALTER TABLE salary_contracts ADD CONSTRAINT salary_contracts_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE salary_history ADD CONSTRAINT salary_history_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE salary_payments ADD CONSTRAINT salary_payments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE salary_structures ADD CONSTRAINT salary_structures_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE transaction_categories ADD CONSTRAINT transaction_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES transaction_categories(id);
ALTER TABLE transactions ADD CONSTRAINT transactions_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id);
ALTER TABLE transactions ADD CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES transaction_categories(id);
ALTER TABLE transactions ADD CONSTRAINT transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE work_schedules ADD CONSTRAINT work_schedules_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);

-- Functions
-- Function: update_global_factors_updated_at

BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
;

-- Function: update_payslip_updated_at

BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
;

-- Function: update_project_budget_spent_amount

			BEGIN
				IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
					UPDATE project_budgets 
					SET spent_amount = COALESCE(spent_amount, 0) + NEW.amount
					WHERE id = NEW.project_budget_id;
				END IF;
				
				IF OLD.status = 'approved' AND NEW.status != 'approved' THEN
					UPDATE project_budgets 
					SET spent_amount = GREATEST(COALESCE(spent_amount, 0) - OLD.amount, 0)
					WHERE id = OLD.project_budget_id;
				END IF;
				
				RETURN NEW;
			END;
			;

-- Function: update_salary_contract_updated_at

BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
;

-- Function: update_updated_at_column

BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
;

-- Function: uuid_generate_v1
null;

-- Function: uuid_generate_v1mc
null;

-- Function: uuid_generate_v3
null;

-- Function: uuid_generate_v4
null;

-- Function: uuid_generate_v5
null;

-- Function: uuid_nil
null;

-- Function: uuid_ns_dns
null;

-- Function: uuid_ns_oid
null;

-- Function: uuid_ns_url
null;

-- Function: uuid_ns_x500
null;

-- Triggers
CREATE TRIGGER trigger_budget_evidence_updated_at
  ON budget_evidence
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_budget_spent_amount
  ON budget_evidence
  EXECUTE FUNCTION update_project_budget_spent_amount();

CREATE TRIGGER trigger_update_budget_spent_amount
  ON budget_evidence
  EXECUTE FUNCTION update_project_budget_spent_amount();

CREATE TRIGGER update_evidence_categories_updated_at
  ON evidence_categories
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evidence_documents_updated_at
  ON evidence_documents
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evidence_items_updated_at
  ON evidence_items
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evidence_schedules_updated_at
  ON evidence_schedules
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_global_factors_updated_at
  ON global_factors
  EXECUTE FUNCTION update_global_factors_updated_at();

CREATE TRIGGER trigger_update_payslip_template_updated_at
  ON payslip_templates
  EXECUTE FUNCTION update_payslip_updated_at();

CREATE TRIGGER trigger_update_payslip_updated_at
  ON payslips
  EXECUTE FUNCTION update_payslip_updated_at();

CREATE TRIGGER trigger_update_salary_contract_updated_at
  ON salary_contracts
  EXECUTE FUNCTION update_salary_contract_updated_at();

-- Views
CREATE VIEW active_salary_contracts AS
 SELECT sc.id,
    sc.employee_id,
    sc.annual_salary,
    sc.start_date,
    sc.end_date,
    sc.contract_type,
    sc.status,
    sc.created_at,
    sc.updated_at,
    sc.monthly_salary,
    sc.notes,
    sc.created_by,
    concat(e.last_name, e.first_name) AS employee_name,
    e.employee_id AS employee_id_number,
    e.department,
    e."position"
   FROM (salary_contracts sc
     JOIN employees e ON ((sc.employee_id = e.id)))
  WHERE (((sc.status)::text = 'active'::text) AND (sc.start_date <= CURRENT_DATE) AND ((sc.end_date IS NULL) OR (sc.end_date >= CURRENT_DATE)));;

CREATE VIEW evidence_items_detail AS
 SELECT ei.id,
    ei.project_budget_id,
    pb.period_number,
    pb.fiscal_year,
    ei.category_id,
    ec.name AS category_name,
    ei.name,
    ei.description,
    ei.budget_amount,
    ei.spent_amount,
    ei.assignee_id,
    ei.assignee_name,
    ei.progress,
    ei.status,
    ei.due_date,
    ei.start_date,
    ei.end_date,
    ei.created_at,
    ei.updated_at,
    ( SELECT count(*) AS count
           FROM evidence_documents ed
          WHERE (ed.evidence_item_id = ei.id)) AS document_count,
    ( SELECT count(*) AS count
           FROM evidence_documents ed
          WHERE ((ed.evidence_item_id = ei.id) AND ((ed.status)::text = 'approved'::text))) AS approved_document_count,
    ( SELECT count(*) AS count
           FROM evidence_schedules es
          WHERE ((es.evidence_item_id = ei.id) AND ((es.status)::text = 'pending'::text))) AS pending_schedule_count,
    ( SELECT count(*) AS count
           FROM evidence_schedules es
          WHERE ((es.evidence_item_id = ei.id) AND ((es.status)::text = 'overdue'::text))) AS overdue_schedule_count
   FROM ((evidence_items ei
     JOIN project_budgets pb ON ((ei.project_budget_id = pb.id)))
     JOIN evidence_categories ec ON ((ei.category_id = ec.id)));;

CREATE VIEW evidence_progress_summary AS
 SELECT pb.id AS project_budget_id,
    pb.period_number,
    pb.fiscal_year,
    ec.name AS category_name,
    count(ei.id) AS total_items,
    count(
        CASE
            WHEN ((ei.status)::text = 'completed'::text) THEN 1
            ELSE NULL::integer
        END) AS completed_items,
    count(
        CASE
            WHEN ((ei.status)::text = 'in_progress'::text) THEN 1
            ELSE NULL::integer
        END) AS in_progress_items,
    count(
        CASE
            WHEN ((ei.status)::text = 'planned'::text) THEN 1
            ELSE NULL::integer
        END) AS planned_items,
    count(
        CASE
            WHEN ((ei.status)::text = 'reviewing'::text) THEN 1
            ELSE NULL::integer
        END) AS reviewing_items,
    avg(ei.progress) AS average_progress,
    sum(ei.budget_amount) AS total_budget_amount,
    sum(ei.spent_amount) AS total_spent_amount
   FROM ((project_budgets pb
     LEFT JOIN evidence_items ei ON ((pb.id = ei.project_budget_id)))
     LEFT JOIN evidence_categories ec ON ((ei.category_id = ec.id)))
  GROUP BY pb.id, pb.period_number, pb.fiscal_year, ec.name;;

CREATE VIEW salary_contract_history AS
 SELECT sc.id,
    sc.employee_id,
    sc.annual_salary,
    sc.start_date,
    sc.end_date,
    sc.contract_type,
    sc.status,
    sc.created_at,
    sc.updated_at,
    sc.monthly_salary,
    sc.notes,
    sc.created_by,
    concat(e.last_name, e.first_name) AS employee_name,
    e.employee_id AS employee_id_number,
    e.department,
    e."position",
        CASE
            WHEN (sc.end_date IS NULL) THEN '무기한'::text
            ELSE to_char((sc.end_date)::timestamp with time zone, 'YYYY-MM-DD'::text)
        END AS contract_end_display,
        CASE
            WHEN (((sc.status)::text = 'active'::text) AND (sc.end_date IS NULL)) THEN '진행중 (무기한)'::character varying
            WHEN (((sc.status)::text = 'active'::text) AND (sc.end_date >= CURRENT_DATE)) THEN '진행중'::character varying
            WHEN (((sc.status)::text = 'expired'::text) OR (sc.end_date < CURRENT_DATE)) THEN '만료됨'::character varying
            ELSE sc.status
        END AS status_display
   FROM (salary_contracts sc
     JOIN employees e ON ((sc.employee_id = e.id)))
  ORDER BY sc.start_date DESC;;

