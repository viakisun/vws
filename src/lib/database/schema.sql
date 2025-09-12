-- Workstream Database Schema
-- PostgreSQL Database Schema for Integrated Business Management System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable JSONB for flexible data storage
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =============================================
-- CORE TABLES
-- =============================================

-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies/Organizations
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'enterprise', 'startup', 'sme'
    industry VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'prospect'
    contact_person VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    website VARCHAR(255),
    revenue BIGINT,
    employees INTEGER,
    notes TEXT,
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- FINANCE MODULE
-- =============================================

-- Bank Accounts
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- 'checking', 'savings', 'business'
    balance DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'KRW',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budget Categories
CREATE TABLE budget_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES budget_categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_account_id UUID REFERENCES bank_accounts(id),
    category_id UUID REFERENCES budget_categories(id),
    amount DECIMAL(15,2) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'income', 'expense'
    description TEXT,
    reference VARCHAR(255),
    date DATE NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- HR MODULE
-- =============================================

-- Employees
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    department VARCHAR(100),
    position VARCHAR(100),
    manager_id UUID REFERENCES employees(id),
    employment_type VARCHAR(50), -- 'full_time', 'part_time', 'contract', 'intern'
    hire_date DATE,
    salary DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'terminated'
    address TEXT,
    emergency_contact JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave Types
CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    max_days INTEGER,
    is_paid BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave Requests
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    leave_type_id UUID REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested INTEGER NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- R&D MODULE
-- =============================================

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sponsor VARCHAR(100),
    sponsor_type VARCHAR(50), -- 'government', 'private', 'internal'
    start_date DATE,
    end_date DATE,
    manager_id UUID REFERENCES employees(id),
    status VARCHAR(50) DEFAULT 'planning', -- 'planning', 'active', 'completed', 'cancelled'
    budget_total DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Budget Categories
CREATE TABLE project_budget_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    category_code VARCHAR(50) NOT NULL,
    planned_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expense Items
CREATE TABLE expense_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    category_code VARCHAR(50) NOT NULL,
    requester_id UUID REFERENCES employees(id),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KRW',
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'pending_approval', 'approved', 'rejected', 'completed'
    dept_owner VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID REFERENCES expense_items(id),
    project_id UUID REFERENCES projects(id),
    type VARCHAR(50) NOT NULL, -- 'requisition', 'quote', 'purchase_order', 'tax_invoice', etc.
    filename VARCHAR(255) NOT NULL,
    storage_url TEXT,
    sha256 VARCHAR(64),
    version INTEGER DEFAULT 1,
    signed_by UUID REFERENCES employees(id),
    signed_at TIMESTAMP,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Approvals
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_type VARCHAR(50) NOT NULL, -- 'expense_item', 'document', 'project'
    subject_id UUID NOT NULL,
    step_no INTEGER NOT NULL,
    approver_id UUID REFERENCES employees(id),
    decision VARCHAR(20), -- 'approved', 'rejected', 'pending'
    decided_at TIMESTAMP,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Research Notes
CREATE TABLE research_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    author_id UUID REFERENCES employees(id),
    week_of VARCHAR(20) NOT NULL, -- '2024-W01'
    title VARCHAR(255) NOT NULL,
    content_md TEXT,
    attachments JSONB DEFAULT '[]',
    signed_at TIMESTAMP,
    verified_by UUID REFERENCES employees(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    type VARCHAR(50) NOT NULL, -- 'weekly', 'quarterly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    summary_json JSONB NOT NULL,
    file_url TEXT,
    generated_by UUID REFERENCES employees(id),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SALES MODULE
-- =============================================

-- Leads
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    contact_person VARCHAR(100) NOT NULL,
    position VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'new', -- 'new', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
    value DECIMAL(15,2),
    probability INTEGER DEFAULT 0,
    source VARCHAR(100),
    notes TEXT,
    last_contact DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Activities
CREATE TABLE sales_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id),
    type VARCHAR(50) NOT NULL, -- 'call', 'meeting', 'email', 'demo'
    subject VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME,
    duration INTEGER, -- in minutes
    participants JSONB DEFAULT '[]',
    notes TEXT,
    next_action VARCHAR(255),
    next_action_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CRM MODULE
-- =============================================

-- Customer Interactions
CREATE TABLE customer_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    type VARCHAR(50) NOT NULL, -- 'meeting', 'call', 'email', 'demo'
    subject VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME,
    duration INTEGER,
    participants JSONB DEFAULT '[]',
    notes TEXT,
    next_action VARCHAR(255),
    next_action_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contracts
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'license', 'project', 'service'
    value DECIMAL(15,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'terminated'
    renewal_date DATE,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- AUDIT AND LOGGING
-- =============================================

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    diff JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES
-- =============================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Company indexes
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_type ON companies(type);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_industry ON companies(industry);

-- Transaction indexes
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_account ON transactions(bank_account_id);

-- Employee indexes
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_manager ON employees(manager_id);

-- Project indexes
CREATE INDEX idx_projects_code ON projects(code);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_manager ON projects(manager_id);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);

-- Expense indexes
CREATE INDEX idx_expense_items_project ON expense_items(project_id);
CREATE INDEX idx_expense_items_status ON expense_items(status);
CREATE INDEX idx_expense_items_requester ON expense_items(requester_id);

-- Document indexes
CREATE INDEX idx_documents_expense ON documents(expense_id);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_sha256 ON documents(sha256);

-- Approval indexes
CREATE INDEX idx_approvals_subject ON approvals(subject_type, subject_id);
CREATE INDEX idx_approvals_approver ON approvals(approver_id);
CREATE INDEX idx_approvals_decision ON approvals(decision);

-- Lead indexes
CREATE INDEX idx_leads_company ON leads(company_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_by ON leads(created_by);

-- Activity indexes
CREATE INDEX idx_sales_activities_lead ON sales_activities(lead_id);
CREATE INDEX idx_sales_activities_date ON sales_activities(date);
CREATE INDEX idx_customer_interactions_company ON customer_interactions(company_id);
CREATE INDEX idx_customer_interactions_date ON customer_interactions(date);

-- Contract indexes
CREATE INDEX idx_contracts_company ON contracts(company_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_dates ON contracts(start_date, end_date);

-- Audit log indexes
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_budget_categories_updated_at BEFORE UPDATE ON project_budget_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expense_items_updated_at BEFORE UPDATE ON expense_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_research_notes_updated_at BEFORE UPDATE ON research_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default budget categories
INSERT INTO budget_categories (name, code, description) VALUES
('인건비', 'PERSONNEL', '직원 급여 및 인건비'),
('재료비', 'MATERIALS', '원자재 및 소재비'),
('연구활동비', 'RESEARCH', '연구 활동 관련 비용'),
('출장비', 'TRAVEL', '출장 및 교통비'),
('회의비', 'MEETING', '회의 및 세미나 비용'),
('특허출원비', 'PATENT', '특허 출원 및 관련 비용'),
('사무용품비', 'OFFICE', '사무용품 및 소모품'),
('장비비', 'EQUIPMENT', '연구 장비 및 기계'),
('임대료', 'RENT', '사무실 및 시설 임대료'),
('기타', 'OTHER', '기타 비용');

-- Insert default leave types
INSERT INTO leave_types (name, code, max_days, is_paid, description) VALUES
('연차', 'ANNUAL', 15, true, '연차 휴가'),
('병가', 'SICK', 5, true, '질병으로 인한 휴가'),
('경조사', 'FAMILY', 3, true, '경조사 휴가'),
('출산휴가', 'MATERNITY', 90, true, '출산 휴가'),
('육아휴가', 'PARENTAL', 365, true, '육아 휴가'),
('무급휴가', 'UNPAID', NULL, false, '무급 휴가');

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- Project summary view
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

-- Employee summary view
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

-- Financial summary view
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
