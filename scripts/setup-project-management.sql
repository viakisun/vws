-- Project Management System Database Schema
-- 확장된 프로젝트 관리 시스템을 위한 테이블들

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 프로젝트 관리 시스템 테이블들
-- =============================================

-- 1. 프로젝트 기본 정보 (기존 projects 테이블 확장)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sponsor VARCHAR(255),
    sponsor_name VARCHAR(255), -- 스폰서명 (예: "과학기술정보통신부")
    sponsor_type VARCHAR(50) DEFAULT 'government', -- 'government', 'private', 'internal'
    start_date DATE,
    end_date DATE,
    manager_id UUID REFERENCES employees(id), -- 연구개발 책임자
    status VARCHAR(50) DEFAULT 'planning', -- 'planning', 'active', 'completed', 'cancelled', 'suspended'
    budget_total DECIMAL(15,2), -- 전체 사업비
    budget_currency VARCHAR(3) DEFAULT 'KRW',
    research_type VARCHAR(50), -- 'basic', 'applied', 'development'
    technology_area VARCHAR(100),
    priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 프로젝트 참여자 (연구원)
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL, -- 'PI', 'Co-PI', 'Researcher', 'Assistant'
    start_date DATE NOT NULL,
    end_date DATE,
    participation_rate INTEGER NOT NULL CHECK (participation_rate >= 0 AND participation_rate <= 100),
    monthly_salary DECIMAL(12,2), -- 월급 (참여율 반영)
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'completed', 'withdrawn'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, employee_id, start_date) -- 동일 프로젝트에 중복 참여 방지
);

-- 3. 연차별 사업비 관리
CREATE TABLE IF NOT EXISTS project_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    fiscal_year INTEGER NOT NULL, -- 연차 (예: 2024, 2025)
    total_budget DECIMAL(15,2) NOT NULL, -- 해당 연차 총 사업비
    personnel_cost DECIMAL(15,2) DEFAULT 0, -- 인건비
    material_cost DECIMAL(15,2) DEFAULT 0, -- 재료비
    research_activity_cost DECIMAL(15,2) DEFAULT 0, -- 연구활동비
    indirect_cost DECIMAL(15,2) DEFAULT 0, -- 간접비
    other_cost DECIMAL(15,2) DEFAULT 0, -- 기타 비목
    spent_amount DECIMAL(15,2) DEFAULT 0, -- 집행된 금액
    currency VARCHAR(3) DEFAULT 'KRW',
    status VARCHAR(50) DEFAULT 'planned', -- 'planned', 'approved', 'executing', 'completed'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, fiscal_year)
);

-- 4. 참여율 관리 (개인별 전체 참여율 추적)
CREATE TABLE IF NOT EXISTS participation_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    participation_rate INTEGER NOT NULL CHECK (participation_rate >= 0 AND participation_rate <= 100),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'completed'
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, project_id, start_date)
);

-- 5. 참여율 변경 이력
CREATE TABLE IF NOT EXISTS participation_rate_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    old_rate INTEGER,
    new_rate INTEGER NOT NULL,
    change_reason VARCHAR(255), -- 'project_start', 'project_end', 'manual_adjustment', 'employee_leave', 'employee_join'
    change_date DATE NOT NULL,
    changed_by UUID REFERENCES employees(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. 사업비 항목 카테고리 (국가연구개발 사업 기준)
CREATE TABLE IF NOT EXISTS budget_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES budget_categories(id),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. 프로젝트 마일스톤
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    milestone_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'delayed', 'cancelled'
    completion_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. 프로젝트 위험 관리
CREATE TABLE IF NOT EXISTS project_risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    risk_type VARCHAR(100) NOT NULL, -- 'technical', 'schedule', 'budget', 'resource', 'external'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    probability VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high'
    impact VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high'
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'mitigated', 'closed'
    mitigation_plan TEXT,
    owner_id UUID REFERENCES employees(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 인덱스 생성
-- =============================================

-- 프로젝트 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(start_date, end_date);

-- 프로젝트 멤버 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_employee ON project_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_project_members_status ON project_members(status);

-- 사업비 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_project_budgets_project ON project_budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_project_budgets_year ON project_budgets(fiscal_year);

-- 참여율 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_participation_rates_employee ON participation_rates(employee_id);
CREATE INDEX IF NOT EXISTS idx_participation_rates_project ON participation_rates(project_id);
CREATE INDEX IF NOT EXISTS idx_participation_rates_status ON participation_rates(status);

-- =============================================
-- 기본 데이터 삽입
-- =============================================

-- 사업비 항목 카테고리 기본 데이터
INSERT INTO budget_categories (code, name, description, sort_order) VALUES
('PERSONNEL', '인건비', '연구원 인건비 및 연구활동비', 1),
('MATERIAL', '재료비', '연구에 필요한 재료 및 소모품비', 2),
('EQUIPMENT', '연구활동비', '연구장비 구입 및 임대비', 3),
('TRAVEL', '간접비', '연구활동 관련 출장비 및 회의비', 4),
('OTHER', '기타 비목', '기타 연구활동 관련 비용', 5)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 트리거 함수 (참여율 자동 관리)
-- =============================================

-- 참여율 변경 시 이력 자동 생성
CREATE OR REPLACE FUNCTION create_participation_rate_history()
RETURNS TRIGGER AS $$
BEGIN
    -- 참여율이 변경된 경우에만 이력 생성
    IF OLD.participation_rate != NEW.participation_rate THEN
        INSERT INTO participation_rate_history (
            employee_id, project_id, old_rate, new_rate, 
            change_reason, change_date, changed_by
        ) VALUES (
            NEW.employee_id, NEW.project_id, OLD.participation_rate, NEW.participation_rate,
            'manual_adjustment', CURRENT_DATE, NEW.updated_at::text::uuid
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 참여율 변경 이력 트리거
CREATE TRIGGER trigger_participation_rate_history
    AFTER UPDATE ON participation_rates
    FOR EACH ROW
    EXECUTE FUNCTION create_participation_rate_history();

-- =============================================
-- 뷰 생성 (자주 사용되는 쿼리 최적화)
-- =============================================

-- 프로젝트 요약 정보 뷰
CREATE OR REPLACE VIEW project_summary AS
SELECT 
    p.id,
    p.code,
    p.title,
    p.sponsor,
    p.sponsor_name,
    p.status,
    p.start_date,
    p.end_date,
    p.budget_total,
    e.first_name || ' ' || e.last_name as manager_name,
    COUNT(pm.id) as member_count,
    SUM(pm.participation_rate) as total_participation_rate
FROM projects p
LEFT JOIN employees e ON p.manager_id = e.id
LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.status = 'active'
GROUP BY p.id, p.code, p.title, p.sponsor, p.sponsor_name, p.status, 
         p.start_date, p.end_date, p.budget_total, e.first_name, e.last_name;

-- 개인별 참여율 현황 뷰
CREATE OR REPLACE VIEW employee_participation_summary AS
SELECT 
    e.id as employee_id,
    e.first_name || ' ' || e.last_name as employee_name,
    e.department,
    COUNT(pr.project_id) as active_projects,
    SUM(pr.participation_rate) as total_participation_rate,
    CASE 
        WHEN SUM(pr.participation_rate) > 100 THEN 'OVER_LIMIT'
        WHEN SUM(pr.participation_rate) = 100 THEN 'FULL'
        ELSE 'AVAILABLE'
    END as participation_status
FROM employees e
LEFT JOIN participation_rates pr ON e.id = pr.employee_id AND pr.status = 'active'
WHERE e.status = 'active'
GROUP BY e.id, e.first_name, e.last_name, e.department;

-- 연차별 사업비 현황 뷰
CREATE OR REPLACE VIEW budget_summary_by_year AS
SELECT 
    pb.fiscal_year,
    COUNT(pb.project_id) as project_count,
    SUM(pb.total_budget) as total_budget,
    SUM(pb.personnel_cost) as total_personnel_cost,
    SUM(pb.material_cost) as total_material_cost,
    SUM(pb.research_activity_cost) as total_research_activity_cost,
    SUM(pb.indirect_cost) as total_indirect_cost,
    SUM(pb.other_cost) as total_other_cost,
    SUM(pb.spent_amount) as total_spent_amount
FROM project_budgets pb
GROUP BY pb.fiscal_year
ORDER BY pb.fiscal_year DESC;
