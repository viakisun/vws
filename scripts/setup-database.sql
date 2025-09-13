-- Workstream Database Schema Setup
-- This script creates all necessary tables for the Workstream application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'customer', 'vendor', 'partner'
    industry VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'prospect', 'churned'
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    website VARCHAR(255),
    revenue DECIMAL(15,2),
    employees INTEGER,
    notes TEXT,
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sponsor VARCHAR(255),
    sponsor_type VARCHAR(50), -- 'internal', 'external', 'government'
    start_date DATE,
    end_date DATE,
    manager_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'planning', -- 'planning', 'active', 'completed', 'cancelled'
    budget_total DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expense Items table
CREATE TABLE IF NOT EXISTS expense_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    category_code VARCHAR(50) NOT NULL, -- 'personnel', 'material', 'equipment', 'travel', 'other'
    requester_id UUID REFERENCES users(id),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KRW',
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'paid'
    dept_owner VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
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
    employment_type VARCHAR(50), -- 'full-time', 'part-time', 'contract', 'intern'
    hire_date DATE,
    salary DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'terminated'
    address TEXT,
    emergency_contact JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bank Accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) DEFAULT 'checking', -- 'checking', 'savings', 'business'
    balance DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'KRW',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transaction Categories table
CREATE TABLE IF NOT EXISTS transaction_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'income', 'expense'
    parent_id UUID REFERENCES transaction_categories(id),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_account_id UUID REFERENCES bank_accounts(id),
    category_id UUID REFERENCES transaction_categories(id),
    amount DECIMAL(15,2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'income', 'expense', 'transfer'
    description TEXT,
    reference VARCHAR(255),
    date DATE NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Executive Management Tables

-- Job Titles table (직책 체계)
CREATE TABLE IF NOT EXISTS job_titles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    level INTEGER NOT NULL, -- 1: C-Level, 2: Director, 3: Manager, etc.
    category VARCHAR(50) NOT NULL, -- 'executive', 'management', 'specialist'
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Executives table (이사 명부)
CREATE TABLE IF NOT EXISTS executives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    executive_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    job_title_id UUID REFERENCES job_titles(id),
    department VARCHAR(100),
    appointment_date DATE,
    term_end_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'retired'
    bio TEXT,
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- R&D Specific Tables

-- R&D Projects table (extends projects)
CREATE TABLE IF NOT EXISTS rd_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    research_type VARCHAR(50) NOT NULL, -- 'basic', 'applied', 'development'
    technology_area VARCHAR(100),
    priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    budget_personnel DECIMAL(15,2),
    budget_material DECIMAL(15,2),
    budget_equipment DECIMAL(15,2),
    budget_other DECIMAL(15,2),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'planning',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- R&D Employees table (extends employees)
CREATE TABLE IF NOT EXISTS rd_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    specialization VARCHAR(100),
    research_areas TEXT[],
    publications INTEGER DEFAULT 0,
    patents INTEGER DEFAULT 0,
    experience_years INTEGER DEFAULT 0,
    education_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Participations table
CREATE TABLE IF NOT EXISTS project_participations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES rd_projects(id),
    employee_id UUID REFERENCES rd_employees(id),
    start_date DATE NOT NULL,
    end_date DATE,
    participation_rate INTEGER NOT NULL CHECK (participation_rate >= 0 AND participation_rate <= 100),
    monthly_salary DECIMAL(12,2),
    role VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'completed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- R&D Budget Items table
CREATE TABLE IF NOT EXISTS rd_budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES rd_projects(id),
    category VARCHAR(50) NOT NULL, -- 'personnel', 'material', 'equipment', 'travel', 'other'
    subcategory VARCHAR(100),
    description TEXT,
    budgeted_amount DECIMAL(15,2) NOT NULL,
    spent_amount DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'KRW',
    fiscal_year INTEGER,
    quarter INTEGER,
    status VARCHAR(50) DEFAULT 'planned', -- 'planned', 'approved', 'spent', 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Templates table
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'proposal', 'work_order', 'report', 'inspection'
    category VARCHAR(50) NOT NULL, -- 'personnel', 'material', 'equipment', 'travel', 'other'
    template_content JSONB NOT NULL,
    required_fields JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Submissions table
CREATE TABLE IF NOT EXISTS document_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES rd_projects(id),
    template_id UUID REFERENCES document_templates(id),
    submitter_id UUID REFERENCES users(id),
    document_data JSONB NOT NULL,
    file_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'rejected'
    submitted_at TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(code);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_project_participations_project_id ON project_participations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_participations_employee_id ON project_participations(employee_id);
CREATE INDEX IF NOT EXISTS idx_rd_budget_items_project_id ON rd_budget_items(project_id);
CREATE INDEX IF NOT EXISTS idx_document_submissions_project_id ON document_submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_job_titles_level ON job_titles(level);
CREATE INDEX IF NOT EXISTS idx_job_titles_category ON job_titles(category);
CREATE INDEX IF NOT EXISTS idx_executives_executive_id ON executives(executive_id);
CREATE INDEX IF NOT EXISTS idx_executives_job_title_id ON executives(job_title_id);

-- Insert default transaction categories
INSERT INTO transaction_categories (name, type, description) VALUES
('Sales Revenue', 'income', 'Revenue from sales'),
('Service Revenue', 'income', 'Revenue from services'),
('Other Income', 'income', 'Other sources of income'),
('Personnel Costs', 'expense', 'Employee salaries and benefits'),
('Material Costs', 'expense', 'Raw materials and supplies'),
('Equipment Costs', 'expense', 'Equipment purchase and maintenance'),
('Travel Expenses', 'expense', 'Business travel costs'),
('Marketing Expenses', 'expense', 'Marketing and advertising costs'),
('Administrative Expenses', 'expense', 'General administrative costs'),
('Other Expenses', 'expense', 'Other business expenses')
ON CONFLICT DO NOTHING;

-- Insert default bank account
INSERT INTO bank_accounts (name, account_number, bank_name, account_type, balance, currency) VALUES
('Main Business Account', '123-456-789', 'KB Bank', 'business', 0, 'KRW')
ON CONFLICT DO NOTHING;

-- Insert default job titles (직책 체계)
INSERT INTO job_titles (name, level, category, description) VALUES
-- C-Level (Level 1)
('CEO', 1, 'executive', 'Chief Executive Officer - 대표이사'),
('CTO', 1, 'executive', 'Chief Technology Officer - 연구소장, 기술이사'),
('CFO', 1, 'executive', 'Chief Financial Officer - 상무이사'),
-- Management Level (Level 2)
('Director', 2, 'management', 'Director - 이사'),
('Managing Director', 2, 'management', 'Managing Director - 상무'),
-- Specialist Level (Level 3)
('Team Lead', 3, 'specialist', 'Team Lead - 팀장'),
('Senior Manager', 3, 'specialist', 'Senior Manager - 부장'),
('Manager', 3, 'specialist', 'Manager - 과장')
ON CONFLICT (name) DO NOTHING;

-- Insert C-Level executives
INSERT INTO executives (executive_id, first_name, last_name, email, phone, job_title_id, department, appointment_date, status, bio) VALUES
('EXE001', '박기선', '', 'ceo@viahub.com', '010-0001-0001', 
 (SELECT id FROM job_titles WHERE name = 'CEO'), '경영진', '2020-01-01', 'active', 
 '회사의 비전과 전략을 수립하고 이끌어가는 대표이사입니다.'),
('EXE002', '최현민', '', 'cto@viahub.com', '010-0002-0002', 
 (SELECT id FROM job_titles WHERE name = 'CTO'), '연구개발', '2020-01-01', 'active', 
 '기술 혁신과 연구개발을 총괄하는 연구소장이자 기술이사입니다.'),
('EXE003', '오현종', '', 'cfo@viahub.com', '010-0003-0003', 
 (SELECT id FROM job_titles WHERE name = 'CFO'), '재무', '2020-01-01', 'active', 
 '재무 관리와 경영 지원을 담당하는 상무이사입니다.')
ON CONFLICT (executive_id) DO NOTHING;

-- Insert default document templates
INSERT INTO document_templates (name, type, category, template_content, required_fields) VALUES
('Personnel Cost Proposal', 'proposal', 'personnel', 
 '{"title": "인건비 기안서", "fields": {"employee_name": "직원명", "project_name": "프로젝트명", "participation_rate": "참여율", "monthly_salary": "월급여", "period": "참여기간"}}',
 '["employee_name", "project_name", "participation_rate", "monthly_salary", "period"]'),
('Material Cost Work Order', 'work_order', 'material',
 '{"title": "재료비 과업지시서", "fields": {"item_name": "품목명", "quantity": "수량", "unit_price": "단가", "total_amount": "총액", "supplier": "공급업체"}}',
 '["item_name", "quantity", "unit_price", "total_amount", "supplier"]'),
('Equipment Purchase Report', 'report', 'equipment',
 '{"title": "장비 구매 보고서", "fields": {"equipment_name": "장비명", "model": "모델", "purchase_date": "구매일", "amount": "금액", "vendor": "판매업체"}}',
 '["equipment_name", "model", "purchase_date", "amount", "vendor"]')
ON CONFLICT DO NOTHING;

-- Create a default admin user (password: admin123)
INSERT INTO users (email, password_hash, name, department, position, role) VALUES
('admin@viahub.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', 'Admin User', 'IT', 'System Administrator', 'admin')
ON CONFLICT (email) DO NOTHING;

COMMIT;

