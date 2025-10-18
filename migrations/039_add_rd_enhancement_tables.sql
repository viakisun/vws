-- =============================================
-- Migration 039: R&D Development Enhancement Tables
-- =============================================
-- Adds comprehensive project management capabilities:
-- - KPI/Metrics tracking
-- - Deliverable dependencies
-- - Verification scenarios
-- - Test locations
-- - Module responsibilities
-- - Commercialization tracking
-- - Calendar integration
-- - Progress tracking and risk management
-- Date: 2025-10-18
-- =============================================

-- 1. KPI/검증 지표 관리
CREATE TABLE public.rd_dev_kpis (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.rd_dev_projects(id) ON DELETE CASCADE,
    phase_id uuid REFERENCES public.rd_dev_phases(id) ON DELETE CASCADE,
    kpi_category varchar(100) NOT NULL CHECK (kpi_category IN ('주행성능', '정밀도', '안전성', '전력효율', '인식성능', '운영성능', '기타')),
    kpi_name varchar(200) NOT NULL,
    kpi_description text,
    target_value varchar(100),
    current_value varchar(100),
    unit varchar(50),
    measurement_date date,
    status varchar(50) DEFAULT '미측정' CHECK (status IN ('목표달성', '진행중', '지연', '미측정')),
    verification_method text,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- 2. 산출물 의존성 관리
CREATE TABLE public.rd_dev_deliverable_dependencies (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    source_deliverable_id uuid NOT NULL REFERENCES public.rd_dev_deliverables(id) ON DELETE CASCADE,
    target_deliverable_id uuid NOT NULL REFERENCES public.rd_dev_deliverables(id) ON DELETE CASCADE,
    dependency_type varchar(50) NOT NULL CHECK (dependency_type IN ('선행조건', '입력데이터', '통합대상', '검증필요')),
    description text,
    is_blocking boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT no_self_dependency CHECK (source_deliverable_id != target_deliverable_id)
);

-- 3. 검증 시나리오 관리
CREATE TABLE public.rd_dev_verification_scenarios (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.rd_dev_projects(id) ON DELETE CASCADE,
    scenario_name varchar(200) NOT NULL,
    scenario_description text,
    scenario_steps jsonb DEFAULT '[]'::jsonb,
    related_deliverables uuid[] DEFAULT ARRAY[]::uuid[],
    related_kpis uuid[] DEFAULT ARRAY[]::uuid[],
    test_location_id uuid,
    test_date date,
    status varchar(50) DEFAULT '계획' CHECK (status IN ('계획', '준비중', '진행중', '완료', '실패')),
    test_results jsonb DEFAULT '{}'::jsonb,
    attachments jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- 4. 시연/실증 장소 관리
CREATE TABLE public.rd_dev_test_locations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.rd_dev_projects(id) ON DELETE CASCADE,
    location_name varchar(200) NOT NULL,
    location_type varchar(100) CHECK (location_type IN ('온실', '선별장', '트럭현장', '관제센터', '공인시험', '기타')),
    address text,
    facility_details jsonb DEFAULT '{}'::jsonb,
    available_from date,
    available_to date,
    contact_info jsonb DEFAULT '{}'::jsonb,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- verification_scenarios에 외래키 추가 (test_locations 생성 후)
ALTER TABLE public.rd_dev_verification_scenarios
    ADD CONSTRAINT fk_test_location 
    FOREIGN KEY (test_location_id) 
    REFERENCES public.rd_dev_test_locations(id) 
    ON DELETE SET NULL;

-- 5. 모듈·책임 매트릭스
CREATE TABLE public.rd_dev_module_responsibilities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.rd_dev_projects(id) ON DELETE CASCADE,
    module_category varchar(100) NOT NULL,
    module_name varchar(200) NOT NULL,
    module_description text,
    primary_institution_id uuid NOT NULL REFERENCES public.rd_dev_institutions(id) ON DELETE CASCADE,
    supporting_institutions uuid[] DEFAULT ARRAY[]::uuid[],
    deliverable_ids uuid[] DEFAULT ARRAY[]::uuid[],
    performance_level varchar(200),
    integration_points jsonb DEFAULT '[]'::jsonb,
    technical_details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- 6. 사업화 마일스톤
CREATE TABLE public.rd_dev_commercialization (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.rd_dev_projects(id) ON DELETE CASCADE,
    milestone_type varchar(100) NOT NULL CHECK (milestone_type IN ('경제성분석', 'BM개발', '시범운용', '인증획득', '양산준비', '영업홍보', '기타')),
    milestone_name varchar(200) NOT NULL,
    milestone_description text,
    target_date date,
    completion_date date,
    status varchar(50) DEFAULT '계획' CHECK (status IN ('계획', '진행중', '완료', '지연', '취소')),
    deliverables jsonb DEFAULT '[]'::jsonb,
    business_impact text,
    responsible_institution_id uuid REFERENCES public.rd_dev_institutions(id) ON DELETE SET NULL,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- 7. 캘린더 이벤트 통합
CREATE TABLE public.rd_dev_calendar_events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.rd_dev_projects(id) ON DELETE CASCADE,
    event_type varchar(50) NOT NULL CHECK (event_type IN ('마일스톤', '산출물마감', '검증시나리오', '실증', '회의', '보고', 'KPI측정', '기타')),
    event_title varchar(300) NOT NULL,
    event_description text,
    event_date date NOT NULL,
    event_time time,
    end_date date,
    end_time time,
    all_day boolean DEFAULT true,
    related_entity_type varchar(50),
    related_entity_id uuid,
    location_id uuid REFERENCES public.rd_dev_test_locations(id) ON DELETE SET NULL,
    participants jsonb DEFAULT '[]'::jsonb,
    reminder_days integer DEFAULT 7,
    is_completed boolean DEFAULT false,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- 8. 진행 상황 추적 및 리스크
CREATE TABLE public.rd_dev_progress_tracking (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.rd_dev_projects(id) ON DELETE CASCADE,
    tracking_date date NOT NULL,
    phase_id uuid REFERENCES public.rd_dev_phases(id) ON DELETE CASCADE,
    overall_progress integer CHECK (overall_progress >= 0 AND overall_progress <= 100),
    deliverables_on_track integer DEFAULT 0,
    deliverables_delayed integer DEFAULT 0,
    deliverables_completed integer DEFAULT 0,
    kpis_achieved integer DEFAULT 0,
    kpis_pending integer DEFAULT 0,
    risks jsonb DEFAULT '[]'::jsonb,
    achievements jsonb DEFAULT '[]'::jsonb,
    next_quarter_focus jsonb DEFAULT '[]'::jsonb,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, tracking_date)
);

-- Create indexes for better query performance
CREATE INDEX idx_rd_dev_kpis_project ON public.rd_dev_kpis(project_id);
CREATE INDEX idx_rd_dev_kpis_phase ON public.rd_dev_kpis(phase_id);
CREATE INDEX idx_rd_dev_kpis_category ON public.rd_dev_kpis(kpi_category);
CREATE INDEX idx_rd_dev_kpis_status ON public.rd_dev_kpis(status);

CREATE INDEX idx_rd_dev_dependencies_source ON public.rd_dev_deliverable_dependencies(source_deliverable_id);
CREATE INDEX idx_rd_dev_dependencies_target ON public.rd_dev_deliverable_dependencies(target_deliverable_id);
CREATE INDEX idx_rd_dev_dependencies_type ON public.rd_dev_deliverable_dependencies(dependency_type);

CREATE INDEX idx_rd_dev_scenarios_project ON public.rd_dev_verification_scenarios(project_id);
CREATE INDEX idx_rd_dev_scenarios_status ON public.rd_dev_verification_scenarios(status);
CREATE INDEX idx_rd_dev_scenarios_test_date ON public.rd_dev_verification_scenarios(test_date);

CREATE INDEX idx_rd_dev_locations_project ON public.rd_dev_test_locations(project_id);
CREATE INDEX idx_rd_dev_locations_type ON public.rd_dev_test_locations(location_type);

CREATE INDEX idx_rd_dev_modules_project ON public.rd_dev_module_responsibilities(project_id);
CREATE INDEX idx_rd_dev_modules_category ON public.rd_dev_module_responsibilities(module_category);
CREATE INDEX idx_rd_dev_modules_institution ON public.rd_dev_module_responsibilities(primary_institution_id);

CREATE INDEX idx_rd_dev_commercialization_project ON public.rd_dev_commercialization(project_id);
CREATE INDEX idx_rd_dev_commercialization_type ON public.rd_dev_commercialization(milestone_type);
CREATE INDEX idx_rd_dev_commercialization_status ON public.rd_dev_commercialization(status);
CREATE INDEX idx_rd_dev_commercialization_dates ON public.rd_dev_commercialization(target_date, completion_date);

CREATE INDEX idx_rd_dev_calendar_project ON public.rd_dev_calendar_events(project_id);
CREATE INDEX idx_rd_dev_calendar_type ON public.rd_dev_calendar_events(event_type);
CREATE INDEX idx_rd_dev_calendar_date ON public.rd_dev_calendar_events(event_date);
CREATE INDEX idx_rd_dev_calendar_entity ON public.rd_dev_calendar_events(related_entity_type, related_entity_id);

CREATE INDEX idx_rd_dev_progress_project ON public.rd_dev_progress_tracking(project_id);
CREATE INDEX idx_rd_dev_progress_phase ON public.rd_dev_progress_tracking(phase_id);
CREATE INDEX idx_rd_dev_progress_date ON public.rd_dev_progress_tracking(tracking_date);

-- Add comments for documentation
COMMENT ON TABLE public.rd_dev_kpis IS 'KPI and performance metrics tracking for R&D projects';
COMMENT ON TABLE public.rd_dev_deliverable_dependencies IS 'Dependency relationships between deliverables';
COMMENT ON TABLE public.rd_dev_verification_scenarios IS 'Test and verification scenarios with results';
COMMENT ON TABLE public.rd_dev_test_locations IS 'Physical locations for testing and demonstrations';
COMMENT ON TABLE public.rd_dev_module_responsibilities IS 'Module responsibilities matrix by institution';
COMMENT ON TABLE public.rd_dev_commercialization IS 'Commercialization milestones and business development tracking';
COMMENT ON TABLE public.rd_dev_calendar_events IS 'Integrated calendar events for project scheduling';
COMMENT ON TABLE public.rd_dev_progress_tracking IS 'Progress tracking and risk management snapshots';

-- Add column comments for key fields
COMMENT ON COLUMN public.rd_dev_kpis.kpi_category IS 'Category: 주행성능, 정밀도, 안전성, 전력효율, 인식성능, 운영성능';
COMMENT ON COLUMN public.rd_dev_kpis.status IS 'Achievement status: 목표달성, 진행중, 지연, 미측정';
COMMENT ON COLUMN public.rd_dev_deliverable_dependencies.dependency_type IS 'Type: 선행조건, 입력데이터, 통합대상, 검증필요';
COMMENT ON COLUMN public.rd_dev_verification_scenarios.scenario_steps IS 'JSON array of test steps';
COMMENT ON COLUMN public.rd_dev_verification_scenarios.test_results IS 'JSON object containing test results and measurements';
COMMENT ON COLUMN public.rd_dev_test_locations.facility_details IS 'JSON object: {면적, 작물, 설비, 환경조건 등}';
COMMENT ON COLUMN public.rd_dev_module_responsibilities.supporting_institutions IS 'Array of institution UUIDs for collaborative work';
COMMENT ON COLUMN public.rd_dev_commercialization.milestone_type IS 'Type: 경제성분석, BM개발, 시범운용, 인증획득, 양산준비, 영업홍보';
COMMENT ON COLUMN public.rd_dev_calendar_events.event_type IS 'Type: 마일스톤, 산출물마감, 검증시나리오, 실증, 회의, 보고, KPI측정';
COMMENT ON COLUMN public.rd_dev_progress_tracking.risks IS 'JSON array: [{risk, severity, mitigation, status}]';
COMMENT ON COLUMN public.rd_dev_progress_tracking.achievements IS 'JSON array of completed achievements in period';

