--
-- PostgreSQL database dump
--

\restrict WoQtQwRhA5lUwlN7GPYcBTjadhvIhS1Y3Gdb19x7UCMbInjUuf0McSy9Cqtt8pa

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_global_factors_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_global_factors_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_payslip_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_payslip_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_project_budget_spent_amount(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_project_budget_spent_amount() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
			$$;


--
-- Name: update_salary_contract_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_salary_contract_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id character varying(50) NOT NULL,
    user_id uuid,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50),
    department character varying(100),
    "position" character varying(100),
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


--
-- Name: COLUMN employees.birth_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.employees.birth_date IS 'Employee birth date';


--
-- Name: COLUMN employees.termination_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.employees.termination_date IS 'Employee termination date (when they left the company)';


--
-- Name: salary_contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salary_contracts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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


--
-- Name: active_salary_contracts; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.active_salary_contracts AS
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
   FROM (public.salary_contracts sc
     JOIN public.employees e ON ((sc.employee_id = e.id)))
  WHERE (((sc.status)::text = 'active'::text) AND (sc.start_date <= CURRENT_DATE) AND ((sc.end_date IS NULL) OR (sc.end_date >= CURRENT_DATE)));


--
-- Name: attendance_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_records (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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


--
-- Name: bank_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_accounts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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


--
-- Name: budget_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.budget_categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    parent_category_id uuid,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: budget_evidence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.budget_evidence (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_budget_id uuid NOT NULL,
    evidence_type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    amount numeric(15,2) NOT NULL,
    evidence_date date NOT NULL,
    file_path character varying(500),
    file_name character varying(255),
    file_size integer,
    mime_type character varying(100),
    status character varying(20) DEFAULT 'pending'::character varying,
    created_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    approved_by uuid,
    approved_at timestamp without time zone,
    rejection_reason text
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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


--
-- Name: dashboard_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dashboard_configs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    max_employees integer DEFAULT 0,
    CONSTRAINT departments_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


--
-- Name: document_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_submissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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


--
-- Name: document_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_templates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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


--
-- Name: employee_payrolls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_payrolls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    payroll_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    employee_name character varying(100) NOT NULL,
    employee_id_number character varying(20) NOT NULL,
    department character varying(50) NOT NULL,
    "position" character varying(50) NOT NULL,
    base_salary numeric(12,2) DEFAULT 0 NOT NULL,
    allowances jsonb DEFAULT '[]'::jsonb,
    deductions jsonb DEFAULT '[]'::jsonb,
    total_allowances numeric(12,2) DEFAULT 0 NOT NULL,
    total_deductions numeric(12,2) DEFAULT 0 NOT NULL,
    gross_salary numeric(12,2) DEFAULT 0 NOT NULL,
    net_salary numeric(12,2) DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    pay_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT employee_payrolls_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'calculated'::character varying, 'approved'::character varying, 'paid'::character varying, 'error'::character varying])::text[])))
);


--
-- Name: evaluation_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluation_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    evaluation_id uuid NOT NULL,
    category character varying(100) NOT NULL,
    item_name character varying(255) NOT NULL,
    rating numeric(3,2) NOT NULL,
    comments text,
    weight numeric(3,2) DEFAULT 1.00,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: evaluations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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


--
-- Name: evidence_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evidence_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE evidence_categories; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.evidence_categories IS '증빙 카테고리 (인건비, 연구재료비, 연구활동비, 간접비)';


--
-- Name: evidence_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evidence_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    evidence_item_id uuid NOT NULL,
    document_type character varying(100) NOT NULL,
    document_name character varying(200) NOT NULL,
    file_path character varying(500),
    file_size bigint,
    mime_type character varying(100),
    upload_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    uploader_id uuid,
    status character varying(20) DEFAULT 'uploaded'::character varying NOT NULL,
    reviewer_id uuid,
    review_date timestamp without time zone,
    review_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT evidence_documents_status_check CHECK (((status)::text = ANY ((ARRAY['uploaded'::character varying, 'reviewed'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: TABLE evidence_documents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.evidence_documents IS '증빙 서류 (급여명세서, 구매계약서, 세금계산서 등)';


--
-- Name: evidence_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evidence_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_budget_id uuid NOT NULL,
    category_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    budget_amount numeric(15,2) DEFAULT 0 NOT NULL,
    spent_amount numeric(15,2) DEFAULT 0 NOT NULL,
    assignee_id uuid,
    assignee_name character varying(100),
    progress integer DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'planned'::character varying NOT NULL,
    due_date date,
    start_date date,
    end_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT evidence_items_progress_check CHECK (((progress >= 0) AND (progress <= 100))),
    CONSTRAINT evidence_items_status_check CHECK (((status)::text = ANY ((ARRAY['planned'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'reviewing'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: TABLE evidence_items; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.evidence_items IS '증빙 항목 (월별 인건비, 항목별 재료비/연구활동비/간접비)';


--
-- Name: evidence_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evidence_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    evidence_item_id uuid NOT NULL,
    task_name character varying(200) NOT NULL,
    description text,
    due_date date NOT NULL,
    completed_date date,
    assignee_id uuid,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    priority character varying(10) DEFAULT 'medium'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT evidence_schedules_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]))),
    CONSTRAINT evidence_schedules_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'overdue'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: TABLE evidence_schedules; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.evidence_schedules IS '증빙 일정 (서류 준비, 검토, 승인 일정)';


--
-- Name: project_budgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_budgets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    project_id uuid,
    fiscal_year integer NOT NULL,
    total_budget numeric(15,2) NOT NULL,
    personnel_cost numeric(15,2) DEFAULT 0,
    research_material_cost numeric(15,2) DEFAULT 0,
    research_activity_cost numeric(15,2) DEFAULT 0,
    research_stipend numeric(15,2) DEFAULT 0,
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
    research_stipend_cash numeric(15,2) DEFAULT 0,
    research_stipend_in_kind numeric(15,2) DEFAULT 0,
    indirect_cost_cash numeric(15,2) DEFAULT 0,
    indirect_cost_in_kind numeric(15,2) DEFAULT 0,
    period_number integer DEFAULT 1,
    start_date date,
    end_date date
);


--
-- Name: evidence_items_detail; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.evidence_items_detail AS
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
           FROM public.evidence_documents ed
          WHERE (ed.evidence_item_id = ei.id)) AS document_count,
    ( SELECT count(*) AS count
           FROM public.evidence_documents ed
          WHERE ((ed.evidence_item_id = ei.id) AND ((ed.status)::text = 'approved'::text))) AS approved_document_count,
    ( SELECT count(*) AS count
           FROM public.evidence_schedules es
          WHERE ((es.evidence_item_id = ei.id) AND ((es.status)::text = 'pending'::text))) AS pending_schedule_count,
    ( SELECT count(*) AS count
           FROM public.evidence_schedules es
          WHERE ((es.evidence_item_id = ei.id) AND ((es.status)::text = 'overdue'::text))) AS overdue_schedule_count
   FROM ((public.evidence_items ei
     JOIN public.project_budgets pb ON ((ei.project_budget_id = pb.id)))
     JOIN public.evidence_categories ec ON ((ei.category_id = ec.id)));


--
-- Name: evidence_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evidence_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    evidence_item_id uuid,
    evidence_schedule_id uuid,
    recipient_id uuid NOT NULL,
    notification_type character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    read_at timestamp without time zone
);


--
-- Name: TABLE evidence_notifications; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.evidence_notifications IS '증빙 알림 (마감일 알림, 지연 알림 등)';


--
-- Name: evidence_progress_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.evidence_progress_summary AS
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
   FROM ((public.project_budgets pb
     LEFT JOIN public.evidence_items ei ON ((pb.id = ei.project_budget_id)))
     LEFT JOIN public.evidence_categories ec ON ((ei.category_id = ec.id)))
  GROUP BY pb.id, pb.period_number, pb.fiscal_year, ec.name;


--
-- Name: evidence_review_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evidence_review_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    evidence_item_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    review_type character varying(50) NOT NULL,
    review_status character varying(20) NOT NULL,
    review_notes text,
    reviewed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT evidence_review_history_review_status_check CHECK (((review_status)::text = ANY ((ARRAY['approved'::character varying, 'rejected'::character varying, 'needs_revision'::character varying])::text[])))
);


--
-- Name: TABLE evidence_review_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.evidence_review_history IS '증빙 검토 이력 (검토자, 검토 결과, 검토 의견)';


--
-- Name: evidence_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evidence_types (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: evidence_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evidence_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evidence_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evidence_types_id_seq OWNED BY public.evidence_types.id;


--
-- Name: executives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.executives (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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


--
-- Name: expense_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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


--
-- Name: feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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


--
-- Name: global_factors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.global_factors (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    factor_name character varying(100) NOT NULL,
    factor_value character varying(255) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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


--
-- Name: job_titles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_titles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    level integer NOT NULL,
    category character varying(50) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: leave_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leave_balances (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid NOT NULL,
    leave_type_id uuid NOT NULL,
    year integer NOT NULL,
    total_days numeric(4,2) DEFAULT 0,
    used_days numeric(4,2) DEFAULT 0,
    remaining_days numeric(4,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leave_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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


--
-- Name: leave_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leave_types (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    max_days integer DEFAULT 0,
    is_paid boolean DEFAULT true,
    requires_approval boolean DEFAULT true,
    advance_notice_days integer DEFAULT 0,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: participation_rate_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participation_rate_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid,
    project_id uuid,
    old_rate integer,
    new_rate integer NOT NULL,
    change_reason character varying(255),
    change_date date NOT NULL,
    changed_by uuid,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: participation_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participation_rates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid,
    project_id uuid,
    participation_rate integer NOT NULL,
    start_date date NOT NULL,
    end_date date,
    status character varying(50) DEFAULT 'active'::character varying,
    created_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT participation_rates_participation_rate_check CHECK (((participation_rate >= 0) AND (participation_rate <= 100)))
);


--
-- Name: payrolls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payrolls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    period character varying(7) NOT NULL,
    pay_date date NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    total_employees integer DEFAULT 0 NOT NULL,
    total_gross_salary numeric(15,2) DEFAULT 0 NOT NULL,
    total_deductions numeric(15,2) DEFAULT 0 NOT NULL,
    total_net_salary numeric(15,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by character varying(50) NOT NULL,
    approved_by character varying(50),
    approved_at timestamp with time zone,
    CONSTRAINT payrolls_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'calculated'::character varying, 'approved'::character varying, 'paid'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: payslip_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payslip_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    default_payments jsonb DEFAULT '[{"id": "basic_salary", "name": "기본급", "type": "basic", "amount": 0, "isTaxable": true}, {"id": "position_allowance", "name": "직책수당", "type": "allowance", "amount": 0, "isTaxable": true}, {"id": "bonus", "name": "상여금", "type": "bonus", "amount": 0, "isTaxable": true}, {"id": "meal_allowance", "name": "식대", "type": "allowance", "amount": 300000, "isTaxable": false}, {"id": "vehicle_maintenance", "name": "차량유지", "type": "allowance", "amount": 200000, "isTaxable": false}, {"id": "annual_leave_allowance", "name": "연차수당", "type": "allowance", "amount": 0, "isTaxable": true}, {"id": "year_end_settlement", "name": "연말정산", "type": "settlement", "amount": 0, "isTaxable": true}]'::jsonb NOT NULL,
    default_deductions jsonb DEFAULT '[{"id": "health_insurance", "name": "건강보험", "rate": 0.034, "type": "insurance", "amount": 0, "isMandatory": true}, {"id": "long_term_care", "name": "장기요양보험", "rate": 0.0034, "type": "insurance", "amount": 0, "isMandatory": true}, {"id": "national_pension", "name": "국민연금", "rate": 0.045, "type": "pension", "amount": 0, "isMandatory": true}, {"id": "employment_insurance", "name": "고용보험", "rate": 0.008, "type": "insurance", "amount": 0, "isMandatory": true}, {"id": "income_tax", "name": "갑근세", "rate": 0.13, "type": "tax", "amount": 0, "isMandatory": true}, {"id": "local_tax", "name": "주민세", "rate": 0.013, "type": "tax", "amount": 0, "isMandatory": true}, {"id": "other", "name": "기타", "rate": 0, "type": "other", "amount": 0, "isMandatory": false}]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE payslip_templates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.payslip_templates IS '직원별 급여명세서 기본 템플릿을 저장하는 테이블';


--
-- Name: payslips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payslips (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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
    "position" character varying(100),
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


--
-- Name: TABLE payslips; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.payslips IS '급여명세서 정보를 저장하는 테이블';


--
-- Name: COLUMN payslips.old_deductions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.payslips.old_deductions IS '공제사항 정보 (JSON 배열)';


--
-- Name: COLUMN payslips.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.payslips.status IS '급여명세서 상태 (draft, final, paid)';


--
-- Name: performance_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.performance_records (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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


--
-- Name: positions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.positions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    department character varying(100) NOT NULL,
    level integer DEFAULT 1,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT positions_level_check CHECK (((level >= 1) AND (level <= 10))),
    CONSTRAINT positions_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


--
-- Name: project_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_members (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    project_id uuid,
    employee_id uuid,
    role character varying(100) NOT NULL,
    start_date date NOT NULL,
    end_date date,
    participation_rate integer NOT NULL,
    monthly_salary numeric(12,2),
    status character varying(50) DEFAULT 'active'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    contribution_type character varying(20) DEFAULT 'cash'::character varying,
    monthly_amount numeric(12,2) DEFAULT 0,
    CONSTRAINT project_members_participation_rate_check CHECK (((participation_rate >= 0) AND (participation_rate <= 100)))
);


--
-- Name: project_milestones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_milestones (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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


--
-- Name: project_participations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_participations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    project_id uuid,
    employee_id uuid,
    start_date date NOT NULL,
    end_date date,
    participation_rate integer NOT NULL,
    monthly_salary numeric(12,2),
    role character varying(100),
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT project_participations_participation_rate_check CHECK (((participation_rate >= 0) AND (participation_rate <= 100)))
);


--
-- Name: project_risks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_risks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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


--
-- Name: rd_budget_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_budget_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    project_id uuid,
    category character varying(50) NOT NULL,
    subcategory character varying(100),
    description text,
    budgeted_amount numeric(15,2) NOT NULL,
    spent_amount numeric(15,2) DEFAULT 0,
    currency character varying(3) DEFAULT 'KRW'::character varying,
    fiscal_year integer,
    quarter integer,
    status character varying(50) DEFAULT 'planned'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: rd_employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_employees (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid,
    specialization character varying(100),
    research_areas text[],
    publications integer DEFAULT 0,
    patents integer DEFAULT 0,
    experience_years integer DEFAULT 0,
    education_level character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: rd_projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rd_projects (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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


--
-- Name: report_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_executions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    template_id uuid NOT NULL,
    executed_by uuid,
    execution_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    parameters jsonb DEFAULT '{}'::jsonb,
    result_data jsonb DEFAULT '{}'::jsonb,
    execution_time_ms integer,
    status character varying(50) DEFAULT 'completed'::character varying,
    error_message text,
    file_path text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: report_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_subscriptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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


--
-- Name: report_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_templates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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


--
-- Name: salary_contract_history; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.salary_contract_history AS
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
   FROM (public.salary_contracts sc
     JOIN public.employees e ON ((sc.employee_id = e.id)))
  ORDER BY sc.start_date DESC;


--
-- Name: salary_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salary_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    period character varying(7) NOT NULL,
    base_salary numeric(12,2) DEFAULT 0 NOT NULL,
    total_allowances numeric(12,2) DEFAULT 0 NOT NULL,
    total_deductions numeric(12,2) DEFAULT 0 NOT NULL,
    gross_salary numeric(12,2) DEFAULT 0 NOT NULL,
    net_salary numeric(12,2) DEFAULT 0 NOT NULL,
    change_type character varying(20) NOT NULL,
    change_reason text NOT NULL,
    effective_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by character varying(50) NOT NULL,
    CONSTRAINT salary_history_change_type_check CHECK (((change_type)::text = ANY ((ARRAY['initial'::character varying, 'promotion'::character varying, 'demotion'::character varying, 'adjustment'::character varying, 'bonus'::character varying, 'overtime'::character varying, 'deduction'::character varying, 'other'::character varying])::text[])))
);


--
-- Name: salary_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salary_payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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


--
-- Name: salary_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salary_settings (
    id character varying(50) NOT NULL,
    company_id character varying(50) NOT NULL,
    pay_day integer DEFAULT 25 NOT NULL,
    overtime_rate numeric(5,2) DEFAULT 1.5 NOT NULL,
    holiday_rate numeric(5,2) DEFAULT 2.0 NOT NULL,
    night_shift_rate numeric(5,2) DEFAULT 1.3 NOT NULL,
    weekend_rate numeric(5,2) DEFAULT 1.2 NOT NULL,
    tax_settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    deduction_settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: salary_structures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salary_structures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    base_salary numeric(12,2) DEFAULT 0 NOT NULL,
    allowances jsonb DEFAULT '[]'::jsonb,
    deductions jsonb DEFAULT '[]'::jsonb,
    total_allowances numeric(12,2) DEFAULT 0 NOT NULL,
    total_deductions numeric(12,2) DEFAULT 0 NOT NULL,
    net_salary numeric(12,2) DEFAULT 0 NOT NULL,
    effective_date date NOT NULL,
    end_date date,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by character varying(50) NOT NULL,
    approved_by character varying(50),
    approved_at timestamp with time zone,
    CONSTRAINT salary_structures_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'pending'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: transaction_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transaction_categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    parent_id uuid,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    department character varying(100),
    "position" character varying(100),
    role character varying(50) DEFAULT 'user'::character varying,
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: work_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_schedules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid NOT NULL,
    schedule_type character varying(50) DEFAULT 'standard'::character varying,
    start_time time without time zone DEFAULT '09:00:00'::time without time zone,
    end_time time without time zone DEFAULT '18:00:00'::time without time zone,
    break_duration integer DEFAULT 60,
    work_days jsonb DEFAULT '["monday", "tuesday", "wednesday", "thursday", "friday"]'::jsonb,
    overtime_threshold integer DEFAULT 8,
    status character varying(50) DEFAULT 'active'::character varying,
    effective_from date NOT NULL,
    effective_to date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: evidence_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_types ALTER COLUMN id SET DEFAULT nextval('public.evidence_types_id_seq'::regclass);


--
-- Name: attendance_records attendance_records_employee_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_employee_id_date_key UNIQUE (employee_id, date);


--
-- Name: attendance_records attendance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_pkey PRIMARY KEY (id);


--
-- Name: bank_accounts bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: budget_categories budget_categories_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_categories
    ADD CONSTRAINT budget_categories_code_key UNIQUE (code);


--
-- Name: budget_categories budget_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_categories
    ADD CONSTRAINT budget_categories_pkey PRIMARY KEY (id);


--
-- Name: budget_evidence budget_evidence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_evidence
    ADD CONSTRAINT budget_evidence_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: dashboard_configs dashboard_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_configs
    ADD CONSTRAINT dashboard_configs_pkey PRIMARY KEY (id);


--
-- Name: departments departments_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_name_key UNIQUE (name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: document_submissions document_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_submissions
    ADD CONSTRAINT document_submissions_pkey PRIMARY KEY (id);


--
-- Name: document_templates document_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_templates
    ADD CONSTRAINT document_templates_pkey PRIMARY KEY (id);


--
-- Name: employee_payrolls employee_payrolls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_payrolls
    ADD CONSTRAINT employee_payrolls_pkey PRIMARY KEY (id);


--
-- Name: employees employees_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_email_key UNIQUE (email);


--
-- Name: employees employees_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_id_key UNIQUE (employee_id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: evaluation_items evaluation_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_items
    ADD CONSTRAINT evaluation_items_pkey PRIMARY KEY (id);


--
-- Name: evaluations evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_pkey PRIMARY KEY (id);


--
-- Name: evidence_categories evidence_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_categories
    ADD CONSTRAINT evidence_categories_pkey PRIMARY KEY (id);


--
-- Name: evidence_documents evidence_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_documents
    ADD CONSTRAINT evidence_documents_pkey PRIMARY KEY (id);


--
-- Name: evidence_items evidence_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_items
    ADD CONSTRAINT evidence_items_pkey PRIMARY KEY (id);


--
-- Name: evidence_notifications evidence_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_notifications
    ADD CONSTRAINT evidence_notifications_pkey PRIMARY KEY (id);


--
-- Name: evidence_review_history evidence_review_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_review_history
    ADD CONSTRAINT evidence_review_history_pkey PRIMARY KEY (id);


--
-- Name: evidence_schedules evidence_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_schedules
    ADD CONSTRAINT evidence_schedules_pkey PRIMARY KEY (id);


--
-- Name: evidence_types evidence_types_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_types
    ADD CONSTRAINT evidence_types_code_key UNIQUE (code);


--
-- Name: evidence_types evidence_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_types
    ADD CONSTRAINT evidence_types_pkey PRIMARY KEY (id);


--
-- Name: executives executives_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.executives
    ADD CONSTRAINT executives_email_key UNIQUE (email);


--
-- Name: executives executives_executive_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.executives
    ADD CONSTRAINT executives_executive_id_key UNIQUE (executive_id);


--
-- Name: executives executives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.executives
    ADD CONSTRAINT executives_pkey PRIMARY KEY (id);


--
-- Name: expense_items expense_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_items
    ADD CONSTRAINT expense_items_pkey PRIMARY KEY (id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: global_factors global_factors_factor_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_factors
    ADD CONSTRAINT global_factors_factor_name_key UNIQUE (factor_name);


--
-- Name: global_factors global_factors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_factors
    ADD CONSTRAINT global_factors_pkey PRIMARY KEY (id);


--
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- Name: job_titles job_titles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_titles
    ADD CONSTRAINT job_titles_name_key UNIQUE (name);


--
-- Name: job_titles job_titles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_titles
    ADD CONSTRAINT job_titles_pkey PRIMARY KEY (id);


--
-- Name: leave_balances leave_balances_employee_id_leave_type_id_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_employee_id_leave_type_id_year_key UNIQUE (employee_id, leave_type_id, year);


--
-- Name: leave_balances leave_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_pkey PRIMARY KEY (id);


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);


--
-- Name: leave_types leave_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_pkey PRIMARY KEY (id);


--
-- Name: participation_rate_history participation_rate_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participation_rate_history
    ADD CONSTRAINT participation_rate_history_pkey PRIMARY KEY (id);


--
-- Name: participation_rates participation_rates_employee_id_project_id_start_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participation_rates
    ADD CONSTRAINT participation_rates_employee_id_project_id_start_date_key UNIQUE (employee_id, project_id, start_date);


--
-- Name: participation_rates participation_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participation_rates
    ADD CONSTRAINT participation_rates_pkey PRIMARY KEY (id);


--
-- Name: payrolls payrolls_period_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT payrolls_period_key UNIQUE (period);


--
-- Name: payrolls payrolls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT payrolls_pkey PRIMARY KEY (id);


--
-- Name: payslip_templates payslip_templates_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payslip_templates
    ADD CONSTRAINT payslip_templates_employee_id_key UNIQUE (employee_id);


--
-- Name: payslip_templates payslip_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payslip_templates
    ADD CONSTRAINT payslip_templates_pkey PRIMARY KEY (id);


--
-- Name: payslips payslips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_pkey PRIMARY KEY (id);


--
-- Name: performance_records performance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_records
    ADD CONSTRAINT performance_records_pkey PRIMARY KEY (id);


--
-- Name: positions positions_name_department_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_name_department_key UNIQUE (name, department);


--
-- Name: positions positions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (id);


--
-- Name: project_budgets project_budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_budgets
    ADD CONSTRAINT project_budgets_pkey PRIMARY KEY (id);


--
-- Name: project_budgets project_budgets_project_id_fiscal_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_budgets
    ADD CONSTRAINT project_budgets_project_id_fiscal_year_key UNIQUE (project_id, fiscal_year);


--
-- Name: project_members project_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_pkey PRIMARY KEY (id);


--
-- Name: project_members project_members_project_id_employee_id_start_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_project_id_employee_id_start_date_key UNIQUE (project_id, employee_id, start_date);


--
-- Name: project_milestones project_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_milestones
    ADD CONSTRAINT project_milestones_pkey PRIMARY KEY (id);


--
-- Name: project_participations project_participations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_participations
    ADD CONSTRAINT project_participations_pkey PRIMARY KEY (id);


--
-- Name: project_risks project_risks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_risks
    ADD CONSTRAINT project_risks_pkey PRIMARY KEY (id);


--
-- Name: projects projects_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_code_key UNIQUE (code);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: rd_budget_items rd_budget_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_budget_items
    ADD CONSTRAINT rd_budget_items_pkey PRIMARY KEY (id);


--
-- Name: rd_employees rd_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_employees
    ADD CONSTRAINT rd_employees_pkey PRIMARY KEY (id);


--
-- Name: rd_projects rd_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_projects
    ADD CONSTRAINT rd_projects_pkey PRIMARY KEY (id);


--
-- Name: report_executions report_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_executions
    ADD CONSTRAINT report_executions_pkey PRIMARY KEY (id);


--
-- Name: report_subscriptions report_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_subscriptions
    ADD CONSTRAINT report_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: report_templates report_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_templates
    ADD CONSTRAINT report_templates_pkey PRIMARY KEY (id);


--
-- Name: salary_contracts salary_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_contracts
    ADD CONSTRAINT salary_contracts_pkey PRIMARY KEY (id);


--
-- Name: salary_history salary_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_history
    ADD CONSTRAINT salary_history_pkey PRIMARY KEY (id);


--
-- Name: salary_payments salary_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_payments
    ADD CONSTRAINT salary_payments_pkey PRIMARY KEY (id);


--
-- Name: salary_settings salary_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_settings
    ADD CONSTRAINT salary_settings_pkey PRIMARY KEY (id);


--
-- Name: salary_structures salary_structures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_structures
    ADD CONSTRAINT salary_structures_pkey PRIMARY KEY (id);


--
-- Name: transaction_categories transaction_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_categories
    ADD CONSTRAINT transaction_categories_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: work_schedules work_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_schedules
    ADD CONSTRAINT work_schedules_pkey PRIMARY KEY (id);


--
-- Name: idx_budget_evidence_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_budget_evidence_created_by ON public.budget_evidence USING btree (created_by);


--
-- Name: idx_budget_evidence_evidence_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_budget_evidence_evidence_date ON public.budget_evidence USING btree (evidence_date);


--
-- Name: idx_budget_evidence_project_budget_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_budget_evidence_project_budget_id ON public.budget_evidence USING btree (project_budget_id);


--
-- Name: idx_budget_evidence_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_budget_evidence_status ON public.budget_evidence USING btree (status);


--
-- Name: idx_companies_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_companies_name ON public.companies USING btree (name);


--
-- Name: idx_document_submissions_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_submissions_project_id ON public.document_submissions USING btree (project_id);


--
-- Name: idx_employee_payrolls_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_payrolls_employee_id ON public.employee_payrolls USING btree (employee_id);


--
-- Name: idx_employee_payrolls_pay_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_payrolls_pay_date ON public.employee_payrolls USING btree (pay_date);


--
-- Name: idx_employee_payrolls_payroll_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_payrolls_payroll_id ON public.employee_payrolls USING btree (payroll_id);


--
-- Name: idx_employee_payrolls_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_payrolls_status ON public.employee_payrolls USING btree (status);


--
-- Name: idx_employees_birth_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_birth_date ON public.employees USING btree (birth_date);


--
-- Name: idx_employees_department; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_department ON public.employees USING btree (department);


--
-- Name: idx_employees_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_employee_id ON public.employees USING btree (employee_id);


--
-- Name: idx_employees_termination_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_termination_date ON public.employees USING btree (termination_date);


--
-- Name: idx_evidence_documents_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_documents_item ON public.evidence_documents USING btree (evidence_item_id);


--
-- Name: idx_evidence_documents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_documents_status ON public.evidence_documents USING btree (status);


--
-- Name: idx_evidence_documents_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_documents_type ON public.evidence_documents USING btree (document_type);


--
-- Name: idx_evidence_items_assignee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_items_assignee ON public.evidence_items USING btree (assignee_id);


--
-- Name: idx_evidence_items_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_items_category ON public.evidence_items USING btree (category_id);


--
-- Name: idx_evidence_items_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_items_due_date ON public.evidence_items USING btree (due_date);


--
-- Name: idx_evidence_items_project_budget; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_items_project_budget ON public.evidence_items USING btree (project_budget_id);


--
-- Name: idx_evidence_items_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_items_status ON public.evidence_items USING btree (status);


--
-- Name: idx_evidence_notifications_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_notifications_read ON public.evidence_notifications USING btree (is_read);


--
-- Name: idx_evidence_notifications_recipient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_notifications_recipient ON public.evidence_notifications USING btree (recipient_id);


--
-- Name: idx_evidence_review_history_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_review_history_item ON public.evidence_review_history USING btree (evidence_item_id);


--
-- Name: idx_evidence_review_history_reviewer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_review_history_reviewer ON public.evidence_review_history USING btree (reviewer_id);


--
-- Name: idx_evidence_schedules_assignee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_schedules_assignee ON public.evidence_schedules USING btree (assignee_id);


--
-- Name: idx_evidence_schedules_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_schedules_due_date ON public.evidence_schedules USING btree (due_date);


--
-- Name: idx_evidence_schedules_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_schedules_item ON public.evidence_schedules USING btree (evidence_item_id);


--
-- Name: idx_evidence_schedules_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_schedules_status ON public.evidence_schedules USING btree (status);


--
-- Name: idx_executives_executive_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_executives_executive_id ON public.executives USING btree (executive_id);


--
-- Name: idx_executives_job_title_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_executives_job_title_id ON public.executives USING btree (job_title_id);


--
-- Name: idx_global_factors_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_global_factors_name ON public.global_factors USING btree (factor_name);


--
-- Name: idx_job_titles_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_titles_category ON public.job_titles USING btree (category);


--
-- Name: idx_job_titles_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_titles_level ON public.job_titles USING btree (level);


--
-- Name: idx_participation_rates_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participation_rates_employee ON public.participation_rates USING btree (employee_id);


--
-- Name: idx_participation_rates_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participation_rates_project ON public.participation_rates USING btree (project_id);


--
-- Name: idx_participation_rates_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participation_rates_status ON public.participation_rates USING btree (status);


--
-- Name: idx_payrolls_pay_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payrolls_pay_date ON public.payrolls USING btree (pay_date);


--
-- Name: idx_payrolls_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payrolls_period ON public.payrolls USING btree (period);


--
-- Name: idx_payrolls_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payrolls_status ON public.payrolls USING btree (status);


--
-- Name: idx_payslips_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payslips_employee_id ON public.payslips USING btree (employee_id);


--
-- Name: idx_payslips_employee_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payslips_employee_period ON public.payslips USING btree (employee_id, period);


--
-- Name: idx_payslips_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payslips_period ON public.payslips USING btree (period);


--
-- Name: idx_payslips_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payslips_status ON public.payslips USING btree (status);


--
-- Name: idx_project_budgets_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_budgets_project ON public.project_budgets USING btree (project_id);


--
-- Name: idx_project_budgets_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_budgets_year ON public.project_budgets USING btree (fiscal_year);


--
-- Name: idx_project_members_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_members_employee ON public.project_members USING btree (employee_id);


--
-- Name: idx_project_members_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_members_project ON public.project_members USING btree (project_id);


--
-- Name: idx_project_members_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_members_status ON public.project_members USING btree (status);


--
-- Name: idx_project_participations_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_participations_employee_id ON public.project_participations USING btree (employee_id);


--
-- Name: idx_project_participations_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_participations_project_id ON public.project_participations USING btree (project_id);


--
-- Name: idx_projects_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_code ON public.projects USING btree (code);


--
-- Name: idx_projects_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_dates ON public.projects USING btree (start_date, end_date);


--
-- Name: idx_projects_manager; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_manager ON public.projects USING btree (manager_id);


--
-- Name: idx_projects_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_status ON public.projects USING btree (status);


--
-- Name: idx_rd_budget_items_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_budget_items_project_id ON public.rd_budget_items USING btree (project_id);


--
-- Name: idx_salary_contracts_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_salary_contracts_dates ON public.salary_contracts USING btree (start_date, end_date);


--
-- Name: idx_salary_contracts_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_salary_contracts_employee_id ON public.salary_contracts USING btree (employee_id);


--
-- Name: idx_salary_contracts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_salary_contracts_status ON public.salary_contracts USING btree (status);


--
-- Name: idx_salary_history_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_salary_history_employee_id ON public.salary_history USING btree (employee_id);


--
-- Name: idx_salary_history_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_salary_history_period ON public.salary_history USING btree (period);


--
-- Name: idx_salary_structures_effective_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_salary_structures_effective_date ON public.salary_structures USING btree (effective_date);


--
-- Name: idx_salary_structures_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_salary_structures_employee_id ON public.salary_structures USING btree (employee_id);


--
-- Name: idx_salary_structures_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_salary_structures_status ON public.salary_structures USING btree (status);


--
-- Name: idx_transactions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_date ON public.transactions USING btree (date);


--
-- Name: idx_transactions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_type ON public.transactions USING btree (type);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: budget_evidence trigger_budget_evidence_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_budget_evidence_updated_at BEFORE UPDATE ON public.budget_evidence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: budget_evidence trigger_update_budget_spent_amount; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_budget_spent_amount AFTER INSERT OR UPDATE ON public.budget_evidence FOR EACH ROW EXECUTE FUNCTION public.update_project_budget_spent_amount();


--
-- Name: global_factors trigger_update_global_factors_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_global_factors_updated_at BEFORE UPDATE ON public.global_factors FOR EACH ROW EXECUTE FUNCTION public.update_global_factors_updated_at();


--
-- Name: payslip_templates trigger_update_payslip_template_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_payslip_template_updated_at BEFORE UPDATE ON public.payslip_templates FOR EACH ROW EXECUTE FUNCTION public.update_payslip_updated_at();


--
-- Name: payslips trigger_update_payslip_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_payslip_updated_at BEFORE UPDATE ON public.payslips FOR EACH ROW EXECUTE FUNCTION public.update_payslip_updated_at();


--
-- Name: salary_contracts trigger_update_salary_contract_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_salary_contract_updated_at BEFORE UPDATE ON public.salary_contracts FOR EACH ROW EXECUTE FUNCTION public.update_salary_contract_updated_at();


--
-- Name: evidence_categories update_evidence_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_evidence_categories_updated_at BEFORE UPDATE ON public.evidence_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: evidence_documents update_evidence_documents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_evidence_documents_updated_at BEFORE UPDATE ON public.evidence_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: evidence_items update_evidence_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_evidence_items_updated_at BEFORE UPDATE ON public.evidence_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: evidence_schedules update_evidence_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_evidence_schedules_updated_at BEFORE UPDATE ON public.evidence_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: attendance_records attendance_records_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: budget_categories budget_categories_parent_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_categories
    ADD CONSTRAINT budget_categories_parent_category_id_fkey FOREIGN KEY (parent_category_id) REFERENCES public.budget_categories(id);


--
-- Name: budget_evidence budget_evidence_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_evidence
    ADD CONSTRAINT budget_evidence_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.employees(id);


--
-- Name: budget_evidence budget_evidence_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_evidence
    ADD CONSTRAINT budget_evidence_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employees(id);


--
-- Name: budget_evidence budget_evidence_project_budget_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_evidence
    ADD CONSTRAINT budget_evidence_project_budget_id_fkey FOREIGN KEY (project_budget_id) REFERENCES public.project_budgets(id) ON DELETE CASCADE;


--
-- Name: dashboard_configs dashboard_configs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_configs
    ADD CONSTRAINT dashboard_configs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.employees(id);


--
-- Name: document_submissions document_submissions_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_submissions
    ADD CONSTRAINT document_submissions_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: document_submissions document_submissions_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_submissions
    ADD CONSTRAINT document_submissions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.rd_projects(id);


--
-- Name: document_submissions document_submissions_submitter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_submissions
    ADD CONSTRAINT document_submissions_submitter_id_fkey FOREIGN KEY (submitter_id) REFERENCES public.users(id);


--
-- Name: document_submissions document_submissions_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_submissions
    ADD CONSTRAINT document_submissions_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.document_templates(id);


--
-- Name: document_templates document_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_templates
    ADD CONSTRAINT document_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: employee_payrolls employee_payrolls_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_payrolls
    ADD CONSTRAINT employee_payrolls_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_payrolls employee_payrolls_payroll_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_payrolls
    ADD CONSTRAINT employee_payrolls_payroll_id_fkey FOREIGN KEY (payroll_id) REFERENCES public.payrolls(id) ON DELETE CASCADE;


--
-- Name: employees employees_job_title_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_job_title_id_fkey FOREIGN KEY (job_title_id) REFERENCES public.job_titles(id);


--
-- Name: employees employees_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.employees(id);


--
-- Name: employees employees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: evaluation_items evaluation_items_evaluation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_items
    ADD CONSTRAINT evaluation_items_evaluation_id_fkey FOREIGN KEY (evaluation_id) REFERENCES public.evaluations(id) ON DELETE CASCADE;


--
-- Name: evaluations evaluations_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: evaluations evaluations_evaluator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_evaluator_id_fkey FOREIGN KEY (evaluator_id) REFERENCES public.employees(id);


--
-- Name: evidence_documents evidence_documents_evidence_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_documents
    ADD CONSTRAINT evidence_documents_evidence_item_id_fkey FOREIGN KEY (evidence_item_id) REFERENCES public.evidence_items(id) ON DELETE CASCADE;


--
-- Name: evidence_documents evidence_documents_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_documents
    ADD CONSTRAINT evidence_documents_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.employees(id);


--
-- Name: evidence_documents evidence_documents_uploader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_documents
    ADD CONSTRAINT evidence_documents_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES public.employees(id);


--
-- Name: evidence_items evidence_items_assignee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_items
    ADD CONSTRAINT evidence_items_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.employees(id);


--
-- Name: evidence_items evidence_items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_items
    ADD CONSTRAINT evidence_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.evidence_categories(id);


--
-- Name: evidence_items evidence_items_project_budget_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_items
    ADD CONSTRAINT evidence_items_project_budget_id_fkey FOREIGN KEY (project_budget_id) REFERENCES public.project_budgets(id) ON DELETE CASCADE;


--
-- Name: evidence_notifications evidence_notifications_evidence_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_notifications
    ADD CONSTRAINT evidence_notifications_evidence_item_id_fkey FOREIGN KEY (evidence_item_id) REFERENCES public.evidence_items(id) ON DELETE CASCADE;


--
-- Name: evidence_notifications evidence_notifications_evidence_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_notifications
    ADD CONSTRAINT evidence_notifications_evidence_schedule_id_fkey FOREIGN KEY (evidence_schedule_id) REFERENCES public.evidence_schedules(id) ON DELETE CASCADE;


--
-- Name: evidence_notifications evidence_notifications_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_notifications
    ADD CONSTRAINT evidence_notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.employees(id);


--
-- Name: evidence_review_history evidence_review_history_evidence_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_review_history
    ADD CONSTRAINT evidence_review_history_evidence_item_id_fkey FOREIGN KEY (evidence_item_id) REFERENCES public.evidence_items(id) ON DELETE CASCADE;


--
-- Name: evidence_review_history evidence_review_history_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_review_history
    ADD CONSTRAINT evidence_review_history_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.employees(id);


--
-- Name: evidence_schedules evidence_schedules_assignee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_schedules
    ADD CONSTRAINT evidence_schedules_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.employees(id);


--
-- Name: evidence_schedules evidence_schedules_evidence_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_schedules
    ADD CONSTRAINT evidence_schedules_evidence_item_id_fkey FOREIGN KEY (evidence_item_id) REFERENCES public.evidence_items(id) ON DELETE CASCADE;


--
-- Name: executives executives_job_title_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.executives
    ADD CONSTRAINT executives_job_title_id_fkey FOREIGN KEY (job_title_id) REFERENCES public.job_titles(id);


--
-- Name: expense_items expense_items_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_items
    ADD CONSTRAINT expense_items_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: expense_items expense_items_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_items
    ADD CONSTRAINT expense_items_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id);


--
-- Name: feedback feedback_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: feedback feedback_feedback_giver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_feedback_giver_id_fkey FOREIGN KEY (feedback_giver_id) REFERENCES public.employees(id);


--
-- Name: goals goals_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employees(id);


--
-- Name: goals goals_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: leave_balances leave_balances_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: leave_balances leave_balances_leave_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id);


--
-- Name: leave_requests leave_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.employees(id);


--
-- Name: leave_requests leave_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: leave_requests leave_requests_leave_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id);


--
-- Name: participation_rate_history participation_rate_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participation_rate_history
    ADD CONSTRAINT participation_rate_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.employees(id);


--
-- Name: participation_rate_history participation_rate_history_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participation_rate_history
    ADD CONSTRAINT participation_rate_history_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: participation_rate_history participation_rate_history_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participation_rate_history
    ADD CONSTRAINT participation_rate_history_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: participation_rates participation_rates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participation_rates
    ADD CONSTRAINT participation_rates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employees(id);


--
-- Name: participation_rates participation_rates_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participation_rates
    ADD CONSTRAINT participation_rates_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: participation_rates participation_rates_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participation_rates
    ADD CONSTRAINT participation_rates_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: payslip_templates payslip_templates_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payslip_templates
    ADD CONSTRAINT payslip_templates_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: payslips payslips_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: performance_records performance_records_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_records
    ADD CONSTRAINT performance_records_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: performance_records performance_records_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_records
    ADD CONSTRAINT performance_records_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.employees(id);


--
-- Name: project_budgets project_budgets_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_budgets
    ADD CONSTRAINT project_budgets_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_members project_members_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: project_members project_members_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_milestones project_milestones_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_milestones
    ADD CONSTRAINT project_milestones_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_participations project_participations_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_participations
    ADD CONSTRAINT project_participations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.rd_employees(id);


--
-- Name: project_participations project_participations_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_participations
    ADD CONSTRAINT project_participations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.rd_projects(id);


--
-- Name: project_risks project_risks_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_risks
    ADD CONSTRAINT project_risks_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.employees(id);


--
-- Name: project_risks project_risks_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_risks
    ADD CONSTRAINT project_risks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: projects projects_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id);


--
-- Name: rd_budget_items rd_budget_items_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_budget_items
    ADD CONSTRAINT rd_budget_items_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.rd_projects(id);


--
-- Name: rd_employees rd_employees_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_employees
    ADD CONSTRAINT rd_employees_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: rd_projects rd_projects_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rd_projects
    ADD CONSTRAINT rd_projects_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: report_executions report_executions_executed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_executions
    ADD CONSTRAINT report_executions_executed_by_fkey FOREIGN KEY (executed_by) REFERENCES public.employees(id);


--
-- Name: report_executions report_executions_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_executions
    ADD CONSTRAINT report_executions_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.report_templates(id);


--
-- Name: report_subscriptions report_subscriptions_subscriber_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_subscriptions
    ADD CONSTRAINT report_subscriptions_subscriber_id_fkey FOREIGN KEY (subscriber_id) REFERENCES public.employees(id);


--
-- Name: report_subscriptions report_subscriptions_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_subscriptions
    ADD CONSTRAINT report_subscriptions_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.report_templates(id);


--
-- Name: report_templates report_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_templates
    ADD CONSTRAINT report_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employees(id);


--
-- Name: salary_contracts salary_contracts_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_contracts
    ADD CONSTRAINT salary_contracts_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: salary_history salary_history_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_history
    ADD CONSTRAINT salary_history_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: salary_payments salary_payments_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_payments
    ADD CONSTRAINT salary_payments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: salary_structures salary_structures_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_structures
    ADD CONSTRAINT salary_structures_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: transaction_categories transaction_categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_categories
    ADD CONSTRAINT transaction_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.transaction_categories(id);


--
-- Name: transactions transactions_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id);


--
-- Name: transactions transactions_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.transaction_categories(id);


--
-- Name: transactions transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: work_schedules work_schedules_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_schedules
    ADD CONSTRAINT work_schedules_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- PostgreSQL database dump complete
--

\unrestrict WoQtQwRhA5lUwlN7GPYcBTjadhvIhS1Y3Gdb19x7UCMbInjUuf0McSy9Cqtt8pa

