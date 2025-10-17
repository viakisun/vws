-- =============================================
-- Migration 037: R&D Development Tables
-- =============================================
-- Create tables for developer-focused R&D project management
-- Separate from financial R&D management (/research-development)
-- Date: 2025-01-13
-- =============================================

-- 1. Main R&D development projects table
CREATE TABLE public.rd_dev_projects (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    project_type varchar(50) NOT NULL CHECK (project_type IN ('worker_follow_amr', 'smartfarm_multirobot')),
    total_duration_months integer NOT NULL,
    government_funding numeric(15,2),
    institution_funding numeric(15,2),
    phase_1_duration_months integer,
    phase_2_duration_months integer,
    phase_3_duration_months integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- 2. Project phases table
CREATE TABLE public.rd_dev_phases (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.rd_dev_projects(id) ON DELETE CASCADE,
    phase_number integer NOT NULL CHECK (phase_number IN (1, 2, 3)),
    year_number integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status varchar(50) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'delayed')),
    objectives jsonb DEFAULT '[]'::jsonb,
    key_technologies jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, phase_number, year_number)
);

-- 3. Participating institutions table
CREATE TABLE public.rd_dev_institutions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.rd_dev_projects(id) ON DELETE CASCADE,
    institution_name varchar(200) NOT NULL,
    institution_type varchar(100),
    role_description text,
    primary_researcher_name varchar(100),
    contact_info jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, institution_name)
);

-- 4. Project deliverables table
CREATE TABLE public.rd_dev_deliverables (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.rd_dev_projects(id) ON DELETE CASCADE,
    phase_id uuid REFERENCES public.rd_dev_phases(id) ON DELETE CASCADE,
    institution_id uuid REFERENCES public.rd_dev_institutions(id) ON DELETE SET NULL,
    deliverable_type varchar(100) NOT NULL,
    title varchar(300) NOT NULL,
    description text,
    target_date date,
    completion_date date,
    status varchar(50) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'delayed', 'cancelled')),
    verification_notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- 5. Quarterly milestones table
CREATE TABLE public.rd_dev_quarterly_milestones (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.rd_dev_projects(id) ON DELETE CASCADE,
    phase_id uuid NOT NULL REFERENCES public.rd_dev_phases(id) ON DELETE CASCADE,
    quarter varchar(10) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    year integer NOT NULL,
    planned_activities jsonb DEFAULT '[]'::jsonb,
    institution_assignments jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, phase_id, quarter, year)
);

-- 6. VIA's specific roles table
CREATE TABLE public.rd_dev_via_roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.rd_dev_projects(id) ON DELETE CASCADE,
    phase_id uuid REFERENCES public.rd_dev_phases(id) ON DELETE CASCADE,
    role_category varchar(100) NOT NULL CHECK (role_category IN ('관제', 'AI협업', '자율주행협업', 'UI/UX', '실증분석')),
    role_title varchar(200) NOT NULL,
    role_description text,
    technical_details jsonb DEFAULT '{}'::jsonb,
    integration_points jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- 7. Technical specifications table
CREATE TABLE public.rd_dev_technical_specs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.rd_dev_projects(id) ON DELETE CASCADE,
    spec_category varchar(100) NOT NULL,
    spec_title varchar(200) NOT NULL,
    spec_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_rd_dev_projects_type ON public.rd_dev_projects(project_type);
CREATE INDEX idx_rd_dev_projects_duration ON public.rd_dev_projects(total_duration_months);

CREATE INDEX idx_rd_dev_phases_project ON public.rd_dev_phases(project_id);
CREATE INDEX idx_rd_dev_phases_status ON public.rd_dev_phases(status);
CREATE INDEX idx_rd_dev_phases_dates ON public.rd_dev_phases(start_date, end_date);

CREATE INDEX idx_rd_dev_institutions_project ON public.rd_dev_institutions(project_id);
CREATE INDEX idx_rd_dev_institutions_name ON public.rd_dev_institutions(institution_name);

CREATE INDEX idx_rd_dev_deliverables_project ON public.rd_dev_deliverables(project_id);
CREATE INDEX idx_rd_dev_deliverables_phase ON public.rd_dev_deliverables(phase_id);
CREATE INDEX idx_rd_dev_deliverables_institution ON public.rd_dev_deliverables(institution_id);
CREATE INDEX idx_rd_dev_deliverables_status ON public.rd_dev_deliverables(status);
CREATE INDEX idx_rd_dev_deliverables_dates ON public.rd_dev_deliverables(target_date, completion_date);

CREATE INDEX idx_rd_dev_quarterly_project ON public.rd_dev_quarterly_milestones(project_id);
CREATE INDEX idx_rd_dev_quarterly_phase ON public.rd_dev_quarterly_milestones(phase_id);
CREATE INDEX idx_rd_dev_quarterly_year_quarter ON public.rd_dev_quarterly_milestones(year, quarter);

CREATE INDEX idx_rd_dev_via_roles_project ON public.rd_dev_via_roles(project_id);
CREATE INDEX idx_rd_dev_via_roles_phase ON public.rd_dev_via_roles(phase_id);
CREATE INDEX idx_rd_dev_via_roles_category ON public.rd_dev_via_roles(role_category);

CREATE INDEX idx_rd_dev_technical_specs_project ON public.rd_dev_technical_specs(project_id);
CREATE INDEX idx_rd_dev_technical_specs_category ON public.rd_dev_technical_specs(spec_category);

-- Add comments for documentation
COMMENT ON TABLE public.rd_dev_projects IS 'R&D Development projects - developer-focused view separate from financial management';
COMMENT ON TABLE public.rd_dev_phases IS 'Project phases with objectives and key technologies';
COMMENT ON TABLE public.rd_dev_institutions IS 'Participating institutions and their roles';
COMMENT ON TABLE public.rd_dev_deliverables IS 'Project deliverables by phase and institution';
COMMENT ON TABLE public.rd_dev_quarterly_milestones IS 'Quarterly breakdown of project activities';
COMMENT ON TABLE public.rd_dev_via_roles IS 'VIA-specific roles and responsibilities in projects';
COMMENT ON TABLE public.rd_dev_technical_specs IS 'Technical specifications and evaluation metrics';
