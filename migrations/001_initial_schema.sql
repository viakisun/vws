-- =====================================================
-- Migration 001: Initial Schema
-- =====================================================
-- 목적: 현재 운영 중인 데이터베이스의 전체 스키마
-- 날짜: 2025-10-12
-- 소스: RDS PostgreSQL 16.10
--
-- 이 파일은 기존의 모든 migration 파일을 대체합니다.
-- 실제 운영 중인 데이터베이스에서 덤프한 스키마입니다.
-- =====================================================

--
-- PostgreSQL database dump
--

\restrict 1CvHfB9LnuB8wZEgrVQLKM7NulQ5dYg6xhR3e58ZEvRhIXH5MpNIi4v3kpuJtYE

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
-- Name: bank_code; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.bank_code AS ENUM (
    '1001',
    '1002',
    '1003'
);


--
-- Name: TYPE bank_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.bank_code IS '은행 코드: 1001(하나), 1002(농협), 1003(전북)';


--
-- Name: calculate_user_permissions(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_user_permissions(p_user_id uuid) RETURNS TABLE(permission_code character varying, resource character varying, action character varying, scope character varying)
    LANGUAGE sql STABLE
    AS $$
WITH RECURSIVE role_hierarchy AS (
  -- 사용자가 직접 할당받은 역할
  SELECT r.id, r.parent_role_id, r.priority
  FROM roles r
  JOIN user_roles ur ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id
    AND ur.is_active = true
    AND r.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)

  UNION

  -- 상위 역할 상속
  SELECT r.id, r.parent_role_id, r.priority
  FROM roles r
  JOIN role_hierarchy rh ON r.id = rh.parent_role_id
  WHERE r.is_active = true
)
SELECT DISTINCT
  p.code as permission_code,
  p.resource,
  p.action,
  p.scope
FROM role_hierarchy rh
JOIN role_permissions rp ON rp.role_id = rh.id
JOIN permissions p ON p.id = rp.permission_id
WHERE p.is_active = true
ORDER BY p.resource, p.action;
$$;


--
-- Name: calculate_work_hours(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_work_hours() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    work_hours DECIMAL(4,2) := 0;
    break_hours DECIMAL(4,2) := 0;
BEGIN
    -- 출근/퇴근 시간이 모두 있는 경우
    IF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
        -- 기본 근무시간 계산
        work_hours := EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 3600;
        
        -- 휴게시간이 있는 경우
        IF NEW.break_start_time IS NOT NULL AND NEW.break_end_time IS NOT NULL THEN
            break_hours := EXTRACT(EPOCH FROM (NEW.break_end_time - NEW.break_start_time)) / 3600;
            work_hours := work_hours - break_hours;
        ELSE
            -- 휴게시간이 기록되지 않은 경우
            -- 근무시간이 4시간을 초과하는 경우에만 점심시간 1시간 자동 차감
            IF work_hours > 4 THEN
                work_hours := work_hours - 1;
            END IF;
        END IF;
        
        -- 총 근무시간 저장 (음수 방지)
        NEW.total_work_hours := GREATEST(work_hours, 0);
        
        -- 8시간 초과시 초과근무 계산
        IF work_hours > 8 THEN
            NEW.overtime_hours := work_hours - 8;
        ELSE
            NEW.overtime_hours := 0;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: cleanup_expired_notifications(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_expired_notifications() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL 
    AND expires_at < CURRENT_TIMESTAMP;
END;
$$;


--
-- Name: get_org_tree(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_org_tree(root_org_id uuid DEFAULT NULL::uuid) RETURNS TABLE(id uuid, code character varying, name character varying, parent_id uuid, level integer, path text, depth integer)
    LANGUAGE sql STABLE
    AS $$
WITH RECURSIVE org_tree AS (
  -- Base case: 루트 조직들 (parent_id가 NULL이거나 지정된 root)
  SELECT 
    ou.id,
    ou.code,
    ou.name,
    ou.parent_id,
    ou.level,
    ou.name::TEXT as path,
    0 as depth
  FROM org_units ou
  WHERE (root_org_id IS NULL AND ou.parent_id IS NULL) 
     OR (root_org_id IS NOT NULL AND ou.id = root_org_id)
     AND ou.is_active = true
  
  UNION ALL
  
  -- Recursive case: 하위 조직들
  SELECT 
    ou.id,
    ou.code,
    ou.name,
    ou.parent_id,
    ou.level,
    ot.path || ' > ' || ou.name as path,
    ot.depth + 1 as depth
  FROM org_units ou
  JOIN org_tree ot ON ou.parent_id = ot.id
  WHERE ou.is_active = true
)
SELECT * FROM org_tree ORDER BY path;
$$;


--
-- Name: FUNCTION get_org_tree(root_org_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_org_tree(root_org_id uuid) IS '조직 트리 구조 조회';


--
-- Name: invalidate_permission_cache(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.invalidate_permission_cache() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- employee_roles 테이블 변경 시
  IF TG_TABLE_NAME = 'employee_roles' THEN
    DELETE FROM permission_cache
    WHERE employee_id = COALESCE(NEW.employee_id, OLD.employee_id);
    
  -- role_permissions 테이블 변경 시
  ELSIF TG_TABLE_NAME = 'role_permissions' THEN
    DELETE FROM permission_cache
    WHERE employee_id IN (
      SELECT employee_id FROM employee_roles 
      WHERE role_id = COALESCE(NEW.role_id, OLD.role_id) 
        AND is_active = true
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: set_announcement_published_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_announcement_published_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- 공지사항이 발행되는 경우 published_at 설정
    IF NEW.is_published = true AND (OLD.is_published IS NULL OR OLD.is_published = false) THEN
        NEW.published_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- 공지사항이 비발행으로 변경되는 경우 published_at 초기화
    IF NEW.is_published = false AND OLD.is_published = true THEN
        NEW.published_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: set_notification_read_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_notification_read_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- 알림이 읽음으로 변경되는 경우 read_at 설정
    IF NEW.is_read = true AND (OLD.is_read IS NULL OR OLD.is_read = false) THEN
        NEW.read_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- 알림이 읽지 않음으로 변경되는 경우 read_at 초기화
    IF NEW.is_read = false AND OLD.is_read = true THEN
        NEW.read_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: set_thread_resolved_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_thread_resolved_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.state = 'resolved' AND OLD.state != 'resolved' THEN
        NEW.resolved_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: update_announcements_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_announcements_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_attendance_check_in_date(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_attendance_check_in_date() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.check_in_date = NEW.check_in_time::date;
  RETURN NEW;
END;
$$;


--
-- Name: update_attendance_records_check_in_date(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_attendance_records_check_in_date() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.check_in_date = NEW.check_in_time::date;
  RETURN NEW;
END;
$$;


--
-- Name: update_attendance_settings_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_attendance_settings_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_attendance_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_attendance_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_certificate_requests_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_certificate_requests_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


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
-- Name: update_leave_balance_on_approval(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_leave_balance_on_approval() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    balance_record RECORD;
BEGIN
    -- 휴가가 승인된 경우에만 처리
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- 해당 연도의 연차 잔여일수 레코드 조회
        SELECT * INTO balance_record 
        FROM leave_balances 
        WHERE employee_id = NEW.employee_id AND year = current_year;
        
        -- 레코드가 없으면 생성
        IF NOT FOUND THEN
            INSERT INTO leave_balances (employee_id, year, total_annual_leave, remaining_annual_leave, total_sick_leave, remaining_sick_leave)
            VALUES (NEW.employee_id, current_year, 15, 15, 5, 5);
            
            SELECT * INTO balance_record 
            FROM leave_balances 
            WHERE employee_id = NEW.employee_id AND year = current_year;
        END IF;
        
        -- 연차 타입에 따라 잔여일수 차감
        IF NEW.leave_type = 'annual' THEN
            UPDATE leave_balances 
            SET used_annual_leave = used_annual_leave + NEW.days,
                remaining_annual_leave = remaining_annual_leave - NEW.days
            WHERE employee_id = NEW.employee_id AND year = current_year;
        ELSIF NEW.leave_type = 'sick' THEN
            UPDATE leave_balances 
            SET used_sick_leave = used_sick_leave + NEW.days,
                remaining_sick_leave = remaining_sick_leave - NEW.days
            WHERE employee_id = NEW.employee_id AND year = current_year;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: update_leave_balances_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_leave_balances_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_leave_requests_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_leave_requests_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_notifications_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_notifications_updated_at() RETURNS trigger
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
-- Name: update_payslips_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_payslips_updated_at() RETURNS trigger
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
-- Name: update_roles_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_roles_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
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


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id character varying(50) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50),
    department character varying(100),
    "position" character varying(100),
    employment_type character varying(50),
    hire_date timestamp with time zone,
    salary numeric(12,2),
    status character varying(50) DEFAULT 'active'::character varying,
    address text,
    emergency_contact jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    job_title_id uuid,
    birth_date date,
    termination_date date,
    picture text
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
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
-- Name: announcement_reads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcement_reads (
    id integer NOT NULL,
    announcement_id integer NOT NULL,
    employee_id uuid NOT NULL,
    read_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: announcement_reads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.announcement_reads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: announcement_reads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.announcement_reads_id_seq OWNED BY public.announcement_reads.id;


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    author_id uuid NOT NULL,
    priority character varying(20) DEFAULT 'normal'::character varying,
    category character varying(50) DEFAULT 'general'::character varying,
    is_published boolean DEFAULT false,
    published_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT announcements_category_check CHECK (((category)::text = ANY ((ARRAY['general'::character varying, 'hr'::character varying, 'finance'::character varying, 'it'::character varying, 'safety'::character varying, 'event'::character varying, 'policy'::character varying])::text[]))),
    CONSTRAINT announcements_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying])::text[])))
);


--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- Name: attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance (
    id integer NOT NULL,
    employee_id uuid NOT NULL,
    check_in_time timestamp with time zone,
    check_out_time timestamp with time zone,
    break_start_time timestamp with time zone,
    break_end_time timestamp with time zone,
    total_work_hours numeric(4,2) DEFAULT 0,
    overtime_hours numeric(4,2) DEFAULT 0,
    status character varying(20) DEFAULT 'present'::character varying,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    check_in_ip character varying(45),
    check_out_ip character varying(45),
    check_in_date date,
    CONSTRAINT attendance_status_check CHECK (((status)::text = ANY ((ARRAY['present'::character varying, 'absent'::character varying, 'late'::character varying, 'early_leave'::character varying, 'half_day'::character varying])::text[])))
);


--
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attendance_id_seq OWNED BY public.attendance.id;


--
-- Name: attendance_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_records (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid NOT NULL,
    check_in_time timestamp with time zone,
    check_out_time timestamp with time zone,
    work_hours numeric(4,2) DEFAULT 0,
    overtime_hours numeric(4,2) DEFAULT 0,
    status character varying(50) DEFAULT 'present'::character varying,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    check_in_date date
);


--
-- Name: attendance_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_settings (
    id integer NOT NULL,
    company_id uuid,
    work_start_time time without time zone DEFAULT '09:00:00'::time without time zone NOT NULL,
    work_end_time time without time zone DEFAULT '18:00:00'::time without time zone NOT NULL,
    late_threshold_minutes integer DEFAULT 10,
    early_leave_threshold_minutes integer DEFAULT 10,
    allowed_ips text[],
    require_ip_check boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: attendance_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attendance_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: attendance_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attendance_settings_id_seq OWNED BY public.attendance_settings.id;


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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    approved_by uuid,
    approved_at timestamp with time zone,
    rejection_reason text
);


--
-- Name: certificate_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificate_requests (
    id integer NOT NULL,
    employee_id uuid NOT NULL,
    certificate_type character varying(50) NOT NULL,
    purpose character varying(200) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    approved_by uuid,
    approved_at timestamp with time zone,
    issued_at timestamp with time zone,
    file_path character varying(500),
    rejection_reason text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT certificate_requests_certificate_type_check CHECK (((certificate_type)::text = ANY ((ARRAY['employment'::character varying, 'income'::character varying, 'career'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT certificate_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'issued'::character varying])::text[])))
);


--
-- Name: certificate_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.certificate_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: certificate_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.certificate_requests_id_seq OWNED BY public.certificate_requests.id;


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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    code character varying(50)
);


--
-- Name: dashboard_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dashboard_configs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    layout_config jsonb DEFAULT '{}'::jsonb,
    widgets jsonb DEFAULT '[]'::jsonb,
    is_default boolean DEFAULT false,
    is_public boolean DEFAULT false,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: document_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_submissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    project_id uuid,
    template_id uuid,
    submitter_employee_id uuid,
    document_data jsonb NOT NULL,
    file_url character varying(500),
    status character varying(50) DEFAULT 'draft'::character varying,
    submitted_at timestamp with time zone,
    approved_by_employee_id uuid,
    approved_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    created_by_employee_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: employee_departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_departments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid NOT NULL,
    department_id uuid NOT NULL,
    role character varying(100),
    is_primary boolean DEFAULT true,
    start_date date DEFAULT CURRENT_DATE NOT NULL,
    end_date date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_date_order CHECK (((end_date IS NULL) OR (end_date >= start_date)))
);


--
-- Name: TABLE employee_departments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.employee_departments IS '직원-부서 관계 (히스토리 지원, 다중 소속 가능)';


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
-- Name: employee_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_roles (
    employee_id uuid NOT NULL,
    role_id uuid NOT NULL,
    assigned_by_employee_id uuid,
    assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    submitted_at timestamp with time zone,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: evidence_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evidence_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    code character varying(10) NOT NULL,
    parent_code character varying(10),
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true
);


--
-- Name: TABLE evidence_categories; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.evidence_categories IS '증빙 카테고리 (인건비, 연구재료비, 연구활동비, 간접비)';


--
-- Name: COLUMN evidence_categories.code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.evidence_categories.code IS '카테고리 코드 (예: 1001=인건비, 2001=연구재료비, 3001=연구활동비)';


--
-- Name: COLUMN evidence_categories.parent_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.evidence_categories.parent_code IS '상위 카테고리 코드 (계층 구조용)';


--
-- Name: COLUMN evidence_categories.display_order; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.evidence_categories.display_order IS '표시 순서';


--
-- Name: COLUMN evidence_categories.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.evidence_categories.is_active IS '활성화 여부';


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
    upload_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    uploader_id uuid,
    status character varying(20) DEFAULT 'uploaded'::character varying NOT NULL,
    reviewer_id uuid,
    review_date timestamp with time zone,
    review_notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
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
    budget_amount bigint DEFAULT 0 NOT NULL,
    spent_amount bigint DEFAULT 0 NOT NULL,
    assignee_id uuid,
    assignee_name character varying(100),
    progress integer DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'planned'::character varying NOT NULL,
    due_date date,
    start_date date,
    end_date date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    employee_id uuid,
    project_member_id uuid,
    evidence_month date,
    vendor_id uuid,
    vendor_name character varying(200),
    item_detail text,
    tax_amount bigint DEFAULT 0,
    payment_date date,
    notes text,
    CONSTRAINT evidence_items_progress_check CHECK (((progress >= 0) AND (progress <= 100))),
    CONSTRAINT evidence_items_status_check CHECK (((status)::text = ANY ((ARRAY['planned'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'reviewing'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: TABLE evidence_items; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.evidence_items IS '연구활동비 통합 완료: 3002, 3003, 3005, 3006 → 3001';


--
-- Name: COLUMN evidence_items.employee_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.evidence_items.employee_id IS '직원 ID (인건비 증빙용)';


--
-- Name: COLUMN evidence_items.project_member_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.evidence_items.project_member_id IS '참여연구원 ID (연결 레코드)';


--
-- Name: COLUMN evidence_items.evidence_month; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.evidence_items.evidence_month IS '증빙 대상 월 (YYYY-MM-01)';


--
-- Name: COLUMN evidence_items.vendor_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.evidence_items.vendor_id IS '거래처 ID (sales_customers 참조)';


--
-- Name: COLUMN evidence_items.vendor_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.evidence_items.vendor_name IS '거래처명 (비정규화, 검색 및 표시용)';


--
-- Name: COLUMN evidence_items.item_detail; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.evidence_items.item_detail IS '품목 상세 (예: 시험용 드론 프레임, 라스베리파이 CM4)';


--
-- Name: COLUMN evidence_items.tax_amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.evidence_items.tax_amount IS '세액 (원 단위)';


--
-- Name: COLUMN evidence_items.payment_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.evidence_items.payment_date IS '지급일';


--
-- Name: COLUMN evidence_items.notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.evidence_items.notes IS '비고';


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
    sent_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    read_at timestamp with time zone
);


--
-- Name: TABLE evidence_notifications; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.evidence_notifications IS '증빙 알림 (마감일 알림, 지연 알림 등)';


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
    reviewed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT evidence_review_history_review_status_check CHECK (((review_status)::text = ANY ((ARRAY['approved'::character varying, 'rejected'::character varying, 'needs_revision'::character varying])::text[])))
);


--
-- Name: TABLE evidence_review_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.evidence_review_history IS '증빙 검토 이력 (검토자, 검토 결과, 검토 의견)';


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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT evidence_schedules_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]))),
    CONSTRAINT evidence_schedules_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'overdue'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: TABLE evidence_schedules; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.evidence_schedules IS '증빙 일정 (서류 준비, 검토, 승인 일정)';


--
-- Name: evidence_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evidence_types (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: expense_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    project_id uuid,
    category_code character varying(50) NOT NULL,
    requester_employee_id uuid,
    amount numeric(15,2) NOT NULL,
    currency character varying(3) DEFAULT 'KRW'::character varying,
    description text,
    status character varying(50) DEFAULT 'pending'::character varying,
    dept_owner character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: finance_account_tag_relations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finance_account_tag_relations (
    account_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: finance_account_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finance_account_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    color character varying(7) DEFAULT '#3B82F6'::character varying,
    description text,
    tag_type character varying(20) DEFAULT 'custom'::character varying,
    is_system boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT finance_account_tags_tag_type_check CHECK (((tag_type)::text = ANY ((ARRAY['dashboard'::character varying, 'revenue'::character varying, 'operation'::character varying, 'rnd'::character varying, 'custom'::character varying])::text[])))
);


--
-- Name: finance_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finance_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    account_number character varying(50) NOT NULL,
    bank_id uuid NOT NULL,
    account_type character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    description text,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT finance_accounts_account_type_check CHECK (((account_type)::text = ANY ((ARRAY['checking'::character varying, 'savings'::character varying, 'business'::character varying, 'investment'::character varying, 'loan'::character varying])::text[]))),
    CONSTRAINT finance_accounts_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'suspended'::character varying, 'closed'::character varying])::text[])))
);


--
-- Name: finance_banks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finance_banks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(20) NOT NULL,
    color character varying(7) DEFAULT '#3B82F6'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: finance_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finance_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(20) NOT NULL,
    parent_id uuid,
    color character varying(7) DEFAULT '#6B7280'::character varying,
    description text,
    is_active boolean DEFAULT true,
    is_system boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    accounting_code character varying(10),
    tax_code character varying(10),
    is_default boolean DEFAULT false,
    code character varying(10),
    account_code character varying(20),
    CONSTRAINT finance_categories_type_check CHECK (((type)::text = ANY ((ARRAY['income'::character varying, 'expense'::character varying, 'transfer'::character varying, 'adjustment'::character varying])::text[])))
);


--
-- Name: finance_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finance_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    category_id uuid NOT NULL,
    amount numeric(15,2) NOT NULL,
    type character varying(20) NOT NULL,
    description text,
    reference character varying(100),
    transaction_date timestamp with time zone NOT NULL,
    created_by character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    status character varying(20) DEFAULT 'completed'::character varying,
    reference_number character varying(100),
    notes text,
    tags text[],
    is_recurring boolean DEFAULT false,
    recurring_pattern text,
    counterparty character varying(255),
    deposits bigint DEFAULT 0,
    withdrawals bigint DEFAULT 0,
    balance bigint DEFAULT 0,
    CONSTRAINT finance_transactions_type_check CHECK (((type)::text = ANY ((ARRAY['income'::character varying, 'expense'::character varying, 'transfer'::character varying, 'adjustment'::character varying])::text[])))
);


--
-- Name: global_factors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.global_factors (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    factor_name character varying(100) NOT NULL,
    factor_value character varying(255) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leave_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid NOT NULL,
    leave_type_id uuid NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    total_days numeric(4,2) NOT NULL,
    reason text,
    status character varying(50) DEFAULT 'pending'::character varying,
    approved_by uuid,
    approved_at timestamp with time zone,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    employee_id uuid NOT NULL,
    title character varying(200) NOT NULL,
    message text NOT NULL,
    type character varying(50) NOT NULL,
    category character varying(50) DEFAULT 'general'::character varying,
    is_read boolean DEFAULT false,
    read_at timestamp with time zone,
    action_url character varying(500),
    action_data jsonb,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notifications_category_check CHECK (((category)::text = ANY ((ARRAY['general'::character varying, 'attendance'::character varying, 'leave'::character varying, 'salary'::character varying, 'announcement'::character varying, 'system'::character varying, 'approval'::character varying, 'planner'::character varying])::text[]))),
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['info'::character varying, 'warning'::character varying, 'error'::character varying, 'success'::character varying, 'approval_request'::character varying, 'system'::character varying, 'reminder'::character varying, 'mention'::character varying, 'assignment'::character varying, 'reply'::character varying, 'status_change'::character varying])::text[])))
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: org_memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.org_memberships (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid NOT NULL,
    org_unit_id uuid NOT NULL,
    role character varying(100),
    is_primary boolean DEFAULT true,
    start_date date DEFAULT CURRENT_DATE NOT NULL,
    end_date date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_membership_date_order CHECK (((end_date IS NULL) OR (end_date >= start_date)))
);


--
-- Name: TABLE org_memberships; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.org_memberships IS '조직 소속 관계 (히스토리 지원, 다중 소속 가능)';


--
-- Name: org_units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.org_units (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    parent_id uuid,
    level integer DEFAULT 1 NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE org_units; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.org_units IS '조직 단위 (본부, 팀, 파트 등)';


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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
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
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: permission_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permission_audit_log (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid,
    action character varying(50) NOT NULL,
    target_employee_id uuid,
    target_role_id uuid,
    target_permission_id uuid,
    details jsonb,
    performed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: permission_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permission_cache (
    employee_id uuid NOT NULL,
    permissions jsonb NOT NULL,
    roles jsonb NOT NULL,
    calculated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp with time zone DEFAULT (CURRENT_TIMESTAMP + '01:00:00'::interval)
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(200) NOT NULL,
    resource character varying(100) NOT NULL,
    action character varying(50) NOT NULL,
    scope character varying(50) DEFAULT 'all'::character varying,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: planner_activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_activity_log (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid NOT NULL,
    action character varying(100) NOT NULL,
    actor_id uuid NOT NULL,
    old_value jsonb,
    new_value jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    product_id uuid,
    milestone_id uuid,
    CONSTRAINT planner_activity_log_entity_type_check CHECK (((entity_type)::text = ANY ((ARRAY['initiative'::character varying, 'formation'::character varying, 'thread'::character varying, 'product'::character varying, 'milestone'::character varying])::text[])))
);


--
-- Name: TABLE planner_activity_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.planner_activity_log IS 'Audit log for all significant changes in planner entities';


--
-- Name: planner_formation_initiatives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_formation_initiatives (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    formation_id uuid NOT NULL,
    initiative_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    allocation_percentage integer DEFAULT 100,
    start_date date,
    end_date date,
    CONSTRAINT planner_formation_initiatives_allocation_check CHECK (((allocation_percentage >= 0) AND (allocation_percentage <= 100)))
);


--
-- Name: COLUMN planner_formation_initiatives.allocation_percentage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.planner_formation_initiatives.allocation_percentage IS 'Percentage of team capacity allocated to this initiative (0-100)';


--
-- Name: planner_formation_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_formation_members (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    formation_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    role character varying(50) DEFAULT 'contributor'::character varying NOT NULL,
    bandwidth character varying(50) DEFAULT 'partial'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT planner_formation_members_bandwidth_check CHECK (((bandwidth)::text = ANY ((ARRAY['full'::character varying, 'partial'::character varying, 'support'::character varying])::text[]))),
    CONSTRAINT planner_formation_members_role_check CHECK (((role)::text = ANY ((ARRAY['driver'::character varying, 'contributor'::character varying, 'advisor'::character varying, 'observer'::character varying])::text[])))
);


--
-- Name: COLUMN planner_formation_members.bandwidth; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.planner_formation_members.bandwidth IS 'How much capacity this person has for this formation';


--
-- Name: planner_formations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_formations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    cadence_type character varying(50) DEFAULT 'weekly'::character varying NOT NULL,
    cadence_anchor_time timestamp with time zone,
    energy_state character varying(50) DEFAULT 'healthy'::character varying NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT planner_formations_cadence_type_check CHECK (((cadence_type)::text = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'biweekly'::character varying, 'async'::character varying])::text[]))),
    CONSTRAINT planner_formations_energy_state_check CHECK (((energy_state)::text = ANY ((ARRAY['aligned'::character varying, 'healthy'::character varying, 'strained'::character varying, 'blocked'::character varying])::text[])))
);


--
-- Name: TABLE planner_formations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.planner_formations IS 'Working groups assembled to execute on initiatives';


--
-- Name: COLUMN planner_formations.energy_state; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.planner_formations.energy_state IS 'Team health indicator';


--
-- Name: planner_initiatives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_initiatives (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(500) NOT NULL,
    intent text NOT NULL,
    success_criteria text[],
    owner_id uuid NOT NULL,
    formation_id uuid,
    horizon timestamp with time zone,
    context_links jsonb DEFAULT '[]'::jsonb,
    pause_reason text,
    abandonment_reason text,
    shipped_notes text,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    product_id uuid,
    milestone_id uuid,
    stage character varying(50) DEFAULT 'shaping'::character varying NOT NULL,
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    CONSTRAINT planner_initiatives_stage_check CHECK (((stage)::text = ANY ((ARRAY['shaping'::character varying, 'building'::character varying, 'testing'::character varying, 'shipping'::character varying, 'done'::character varying])::text[]))),
    CONSTRAINT planner_initiatives_status_check CHECK (((status)::text = ANY ((ARRAY['inbox'::character varying, 'active'::character varying, 'paused'::character varying, 'shipped'::character varying, 'abandoned'::character varying])::text[])))
);


--
-- Name: TABLE planner_initiatives; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.planner_initiatives IS 'Strategic outcomes teams are committed to delivering';


--
-- Name: COLUMN planner_initiatives.intent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.planner_initiatives.intent IS 'The WHY - explains purpose and context';


--
-- Name: COLUMN planner_initiatives.success_criteria; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.planner_initiatives.success_criteria IS 'What will be true when this succeeds';


--
-- Name: COLUMN planner_initiatives.horizon; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.planner_initiatives.horizon IS 'Expected resolution signal (not a deadline)';


--
-- Name: COLUMN planner_initiatives.product_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.planner_initiatives.product_id IS 'The product this initiative belongs to';


--
-- Name: COLUMN planner_initiatives.milestone_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.planner_initiatives.milestone_id IS 'Optional milestone this initiative contributes to';


--
-- Name: COLUMN planner_initiatives.stage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.planner_initiatives.stage IS 'Current stage of initiative: shaping, building, testing, shipping, done';


--
-- Name: COLUMN planner_initiatives.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.planner_initiatives.status IS 'Current status of initiative: active, paused, shipped, abandoned';


--
-- Name: planner_milestones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_milestones (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    target_date date,
    status character varying(50) DEFAULT 'upcoming'::character varying NOT NULL,
    achieved_at timestamp with time zone,
    achievement_notes text,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT planner_milestones_status_check CHECK (((status)::text = ANY ((ARRAY['upcoming'::character varying, 'in_progress'::character varying, 'achieved'::character varying, 'missed'::character varying])::text[])))
);


--
-- Name: TABLE planner_milestones; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.planner_milestones IS 'Time-based goals and releases for each product';


--
-- Name: planner_product_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_product_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: planner_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_products (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(200) NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    owner_id uuid NOT NULL,
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    repository_url character varying(500),
    documentation_url character varying(500),
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    category character varying(100),
    display_order integer DEFAULT 0,
    CONSTRAINT planner_products_status_check CHECK (((status)::text = ANY ((ARRAY['planning'::character varying, 'development'::character varying, 'beta'::character varying, 'active'::character varying, 'maintenance'::character varying, 'sunset'::character varying, 'archived'::character varying])::text[])))
);


--
-- Name: TABLE planner_products; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.planner_products IS 'Products/services that the company builds and maintains';


--
-- Name: planner_thread_contributors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_thread_contributors (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    thread_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: planner_thread_replies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_thread_replies (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    thread_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    mentions jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE planner_thread_replies; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.planner_thread_replies IS 'Discussion threads within each thread';


--
-- Name: planner_threads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_threads (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    initiative_id uuid NOT NULL,
    title character varying(500) NOT NULL,
    body text,
    shape character varying(50) NOT NULL,
    state character varying(50) DEFAULT 'proposed'::character varying NOT NULL,
    owner_id uuid NOT NULL,
    external_links jsonb DEFAULT '[]'::jsonb,
    resolution text,
    resolved_at timestamp with time zone,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    mentions jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT planner_threads_shape_check CHECK (((shape)::text = ANY ((ARRAY['decision'::character varying, 'build'::character varying, 'research'::character varying, 'block'::character varying, 'question'::character varying])::text[]))),
    CONSTRAINT planner_threads_state_check CHECK (((state)::text = ANY ((ARRAY['proposed'::character varying, 'active'::character varying, 'resolved'::character varying, 'archived'::character varying])::text[])))
);


--
-- Name: TABLE planner_threads; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.planner_threads IS 'Atomic units of progress and communication within initiatives';


--
-- Name: COLUMN planner_threads.shape; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.planner_threads.shape IS 'Nature of the thread: decision, build, research, block, question';


--
-- Name: planner_todos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_todos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    initiative_id uuid NOT NULL,
    title character varying(500) NOT NULL,
    description text,
    assignee_id uuid,
    status character varying(20) DEFAULT 'todo'::character varying NOT NULL,
    due_date timestamp with time zone,
    completed_at timestamp with time zone,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    external_links jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT planner_todos_status_check CHECK (((status)::text = ANY ((ARRAY['todo'::character varying, 'in_progress'::character varying, 'done'::character varying])::text[])))
);


--
-- Name: TABLE planner_todos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.planner_todos IS 'Todos/tasks for initiatives in the planner system';


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
-- Name: project_budgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_budgets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    project_id uuid,
    personnel_cost bigint DEFAULT 0,
    research_material_cost bigint DEFAULT 0,
    research_activity_cost bigint DEFAULT 0,
    indirect_cost bigint DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    personnel_cost_cash bigint DEFAULT 0,
    personnel_cost_in_kind bigint DEFAULT 0,
    research_material_cost_cash bigint DEFAULT 0,
    research_material_cost_in_kind bigint DEFAULT 0,
    research_activity_cost_cash bigint DEFAULT 0,
    research_activity_cost_in_kind bigint DEFAULT 0,
    indirect_cost_cash bigint DEFAULT 0,
    indirect_cost_in_kind bigint DEFAULT 0,
    period_number integer DEFAULT 1,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    government_funding_amount bigint DEFAULT 0,
    company_cash_amount bigint DEFAULT 0,
    company_in_kind_amount bigint DEFAULT 0,
    research_stipend bigint DEFAULT 0,
    research_stipend_cash bigint DEFAULT 0,
    research_stipend_in_kind bigint DEFAULT 0
);


--
-- Name: COLUMN project_budgets.personnel_cost; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.project_budgets.personnel_cost IS '인건비 총액 (레거시 - 세부 항목용으로 사용)';


--
-- Name: COLUMN project_budgets.research_material_cost; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.project_budgets.research_material_cost IS '연구재료비 총액 (레거시 - 세부 항목용으로 사용)';


--
-- Name: COLUMN project_budgets.research_activity_cost; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.project_budgets.research_activity_cost IS '연구활동비 총액 (레거시 - 세부 항목용으로 사용)';


--
-- Name: COLUMN project_budgets.indirect_cost; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.project_budgets.indirect_cost IS '간접비 총액 (레거시 - 세부 항목용으로 사용)';


--
-- Name: COLUMN project_budgets.personnel_cost_cash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.project_budgets.personnel_cost_cash IS '인건비 현금 (연구개발비 세부 항목용)';


--
-- Name: COLUMN project_budgets.personnel_cost_in_kind; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.project_budgets.personnel_cost_in_kind IS '인건비 현물 (연구개발비 세부 항목용)';


--
-- Name: COLUMN project_budgets.research_material_cost_cash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.project_budgets.research_material_cost_cash IS '연구재료비 현금 (연구개발비 세부 항목용)';


--
-- Name: COLUMN project_budgets.research_material_cost_in_kind; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.project_budgets.research_material_cost_in_kind IS '연구재료비 현물 (연구개발비 세부 항목용)';


--
-- Name: COLUMN project_budgets.research_activity_cost_cash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.project_budgets.research_activity_cost_cash IS '연구활동비 현금 (연구개발비 세부 항목용)';


--
-- Name: COLUMN project_budgets.research_activity_cost_in_kind; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.project_budgets.research_activity_cost_in_kind IS '연구활동비 현물 (연구개발비 세부 항목용)';


--
-- Name: COLUMN project_budgets.indirect_cost_cash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.project_budgets.indirect_cost_cash IS '간접비 현금 (연구개발비 세부 항목용)';


--
-- Name: COLUMN project_budgets.indirect_cost_in_kind; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.project_budgets.indirect_cost_in_kind IS '간접비 현물 (연구개발비 세부 항목용)';


--
-- Name: COLUMN project_budgets.government_funding_amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.project_budgets.government_funding_amount IS '정부지원금 총액 (연차별 예산용)';


--
-- Name: COLUMN project_budgets.company_cash_amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.project_budgets.company_cash_amount IS '기업부담금 현금 총액 (연차별 예산용)';


--
-- Name: COLUMN project_budgets.company_in_kind_amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.project_budgets.company_in_kind_amount IS '기업부담금 현물 총액 (연차별 예산용)';


--
-- Name: project_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_members (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    project_id uuid,
    employee_id uuid,
    role character varying(100) NOT NULL,
    participation_rate numeric(5,2) NOT NULL,
    monthly_salary numeric(12,2),
    status character varying(50) DEFAULT 'active'::character varying,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    monthly_amount numeric(12,2) DEFAULT 0,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone,
    cash_amount numeric(12,2) DEFAULT 0,
    in_kind_amount numeric(12,2) DEFAULT 0,
    CONSTRAINT project_members_participation_rate_check CHECK (((participation_rate >= (0)::numeric) AND (participation_rate <= (100)::numeric)))
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    manager_employee_id uuid,
    status character varying(50) DEFAULT 'planning'::character varying,
    budget_total numeric(15,2),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    sponsor_name character varying(255),
    budget_currency character varying(3) DEFAULT 'KRW'::character varying,
    research_type character varying(50),
    technology_area character varying(100),
    priority character varying(50) DEFAULT 'medium'::character varying,
    project_task_name text,
    dedicated_agency text,
    dedicated_agency_contact_name text,
    dedicated_agency_contact_phone text,
    dedicated_agency_contact_email text,
    sponsor_contact_name character varying(100),
    sponsor_contact_phone character varying(50),
    sponsor_contact_email character varying(255)
);


--
-- Name: TABLE projects; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.projects IS '연구개발사업 기본 정보 (사업 기간은 project_budgets에서 유추)';


--
-- Name: COLUMN projects.title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.projects.title IS '사업명';


--
-- Name: COLUMN projects.sponsor; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.projects.sponsor IS '주관기관';


--
-- Name: COLUMN projects.project_task_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.projects.project_task_name IS '과제명';


--
-- Name: COLUMN projects.dedicated_agency; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.projects.dedicated_agency IS '전담기관';


--
-- Name: COLUMN projects.dedicated_agency_contact_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.projects.dedicated_agency_contact_name IS '전담기관 담당자 이름';


--
-- Name: COLUMN projects.dedicated_agency_contact_phone; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.projects.dedicated_agency_contact_phone IS '전담기관 담당자 전화번호';


--
-- Name: COLUMN projects.dedicated_agency_contact_email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.projects.dedicated_agency_contact_email IS '전담기관 담당자 이메일';


--
-- Name: COLUMN projects.sponsor_contact_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.projects.sponsor_contact_name IS '주관기관 담당자 이름';


--
-- Name: COLUMN projects.sponsor_contact_phone; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.projects.sponsor_contact_phone IS '주관기관 담당자 전화번호';


--
-- Name: COLUMN projects.sponsor_contact_email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.projects.sponsor_contact_email IS '주관기관 담당자 이메일';


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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: report_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_executions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    template_id uuid NOT NULL,
    executed_by uuid,
    execution_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    parameters jsonb DEFAULT '{}'::jsonb,
    result_data jsonb DEFAULT '{}'::jsonb,
    execution_time_ms integer,
    status character varying(50) DEFAULT 'completed'::character varying,
    error_message text,
    file_path text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    last_sent timestamp with time zone,
    next_send timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: reporting_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reporting_lines (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid NOT NULL,
    manager_id uuid NOT NULL,
    report_type character varying(50) DEFAULT 'direct'::character varying,
    start_date date DEFAULT CURRENT_DATE NOT NULL,
    end_date date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_not_self_report CHECK ((employee_id <> manager_id)),
    CONSTRAINT chk_report_date_order CHECK (((end_date IS NULL) OR (end_date >= start_date)))
);


--
-- Name: TABLE reporting_lines; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.reporting_lines IS '보고 라인 (조직도와 독립적)';


--
-- Name: reporting_relationships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reporting_relationships (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid NOT NULL,
    manager_id uuid NOT NULL,
    report_type character varying(50) DEFAULT 'direct'::character varying,
    start_date date DEFAULT CURRENT_DATE NOT NULL,
    end_date date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_not_self_report CHECK ((employee_id <> manager_id)),
    CONSTRAINT chk_relationship_date_order CHECK (((end_date IS NULL) OR (end_date >= start_date)))
);


--
-- Name: TABLE reporting_relationships; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.reporting_relationships IS '보고 관계 (조직도와 독립적)';


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    granted_by_employee_id uuid,
    granted_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    name_ko character varying(100) NOT NULL,
    description text,
    parent_role_id uuid,
    priority integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
-- Name: sales_contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_contracts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contract_number character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    customer_id uuid NOT NULL,
    type character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    start_date date NOT NULL,
    end_date date,
    total_amount numeric(15,2) DEFAULT 0.00 NOT NULL,
    paid_amount numeric(15,2) DEFAULT 0.00,
    payment_terms integer DEFAULT 30,
    description text,
    owner_id character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sales_contracts_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT sales_contracts_type_check CHECK (((type)::text = ANY ((ARRAY['sales'::character varying, 'purchase'::character varying])::text[])))
);


--
-- Name: sales_customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    business_number character varying(20),
    contact_person character varying(100),
    contact_phone character varying(20),
    contact_email character varying(100),
    address text,
    industry character varying(100),
    payment_terms integer DEFAULT 30,
    status character varying(20) DEFAULT 'active'::character varying,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sales_customers_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[]))),
    CONSTRAINT sales_customers_type_check CHECK (((type)::text = ANY ((ARRAY['customer'::character varying, 'supplier'::character varying, 'both'::character varying])::text[])))
);


--
-- Name: sales_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_number character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    customer_id uuid NOT NULL,
    contract_id uuid,
    quotation_id uuid,
    type character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying,
    issue_date date NOT NULL,
    due_date date,
    payment_date date,
    total_amount numeric(15,2) DEFAULT 0.00 NOT NULL,
    paid_amount numeric(15,2) DEFAULT 0.00,
    description text,
    owner_id character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sales_invoices_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'sent'::character varying, 'paid'::character varying, 'overdue'::character varying])::text[]))),
    CONSTRAINT sales_invoices_type_check CHECK (((type)::text = ANY ((ARRAY['sales'::character varying, 'purchase'::character varying])::text[])))
);


--
-- Name: sales_opportunities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_opportunities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(200) NOT NULL,
    customer_id uuid NOT NULL,
    type character varying(20) NOT NULL,
    stage character varying(20) NOT NULL,
    value numeric(15,2) DEFAULT 0.00 NOT NULL,
    probability integer DEFAULT 50,
    expected_close_date date,
    owner_id character varying(100),
    description text,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sales_opportunities_probability_check CHECK (((probability >= 0) AND (probability <= 100))),
    CONSTRAINT sales_opportunities_stage_check CHECK (((stage)::text = ANY ((ARRAY['prospecting'::character varying, 'proposal'::character varying, 'negotiation'::character varying, 'closed-won'::character varying, 'closed-lost'::character varying])::text[]))),
    CONSTRAINT sales_opportunities_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'won'::character varying, 'lost'::character varying])::text[]))),
    CONSTRAINT sales_opportunities_type_check CHECK (((type)::text = ANY ((ARRAY['sales'::character varying, 'purchase'::character varying])::text[])))
);


--
-- Name: sales_quotations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_quotations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quotation_number character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    customer_id uuid NOT NULL,
    opportunity_id uuid,
    status character varying(20) DEFAULT 'draft'::character varying,
    valid_until date,
    total_amount numeric(15,2) DEFAULT 0.00 NOT NULL,
    description text,
    owner_id character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sales_quotations_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'sent'::character varying, 'accepted'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: sales_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    transaction_number character varying(50) NOT NULL,
    contract_id uuid,
    customer_id uuid NOT NULL,
    type character varying(20) NOT NULL,
    amount numeric(15,2) DEFAULT 0.00 NOT NULL,
    transaction_date date NOT NULL,
    due_date date,
    payment_date date,
    payment_status character varying(20) DEFAULT 'pending'::character varying,
    description text,
    notes text,
    created_by character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sales_transactions_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'overdue'::character varying])::text[]))),
    CONSTRAINT sales_transactions_type_check CHECK (((type)::text = ANY ((ARRAY['sales'::character varying, 'purchase'::character varying])::text[])))
);


--
-- Name: system_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_type character varying(50) DEFAULT 'admin'::character varying NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    email character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    picture text
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    date timestamp with time zone NOT NULL,
    created_by_employee_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_effective_roles; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.user_effective_roles AS
 WITH RECURSIVE role_hierarchy AS (
         SELECT ur.employee_id AS user_id,
            r.id AS role_id,
            r.code,
            r.name,
            r.name_ko,
            r.priority,
            'direct'::text AS assignment_type
           FROM (public.employee_roles ur
             JOIN public.roles r ON ((r.id = ur.role_id)))
          WHERE ((ur.is_active = true) AND (r.is_active = true) AND ((ur.expires_at IS NULL) OR (ur.expires_at > CURRENT_TIMESTAMP)))
        UNION
         SELECT rh.user_id,
            r.id AS role_id,
            r.code,
            r.name,
            r.name_ko,
            r.priority,
            'inherited'::text AS assignment_type
           FROM (role_hierarchy rh
             JOIN public.roles r ON ((r.id = ( SELECT roles.parent_role_id
                   FROM public.roles
                  WHERE (roles.id = rh.role_id)))))
          WHERE (r.is_active = true)
        )
 SELECT DISTINCT user_id,
    role_id,
    code,
    name,
    name_ko,
    priority,
    assignment_type
   FROM role_hierarchy;


--
-- Name: v_employee_current_manager; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_employee_current_manager AS
 SELECT rr.employee_id,
    rr.manager_id,
    (((e.first_name)::text || ' '::text) || (e.last_name)::text) AS manager_name,
    e.employee_id AS manager_employee_id,
    rr.report_type
   FROM (public.reporting_relationships rr
     JOIN public.employees e ON ((rr.manager_id = e.id)))
  WHERE (rr.end_date IS NULL);


--
-- Name: VIEW v_employee_current_manager; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_employee_current_manager IS '직원의 현재 보고 관계';


--
-- Name: v_employee_current_org; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_employee_current_org AS
 SELECT om.employee_id,
    om.org_unit_id,
    ou.code AS org_code,
    ou.name AS org_name,
    ou.level AS org_level,
    om.role,
    om.is_primary
   FROM (public.org_memberships om
     JOIN public.org_units ou ON ((om.org_unit_id = ou.id)))
  WHERE ((om.end_date IS NULL) AND (ou.is_active = true));


--
-- Name: VIEW v_employee_current_org; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_employee_current_org IS '직원의 현재 조직 소속 정보';


--
-- Name: v_projects_with_dates; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_projects_with_dates AS
 SELECT id,
    code,
    title,
    project_task_name,
    description,
    sponsor,
    sponsor_name,
    sponsor_type,
    sponsor_contact_name,
    sponsor_contact_phone,
    sponsor_contact_email,
    manager_employee_id,
    status,
    budget_total,
    budget_currency,
    research_type,
    technology_area,
    priority,
    dedicated_agency,
    dedicated_agency_contact_name,
    dedicated_agency_contact_phone,
    dedicated_agency_contact_email,
    created_at,
    updated_at,
    ( SELECT min(pb.start_date) AS min
           FROM public.project_budgets pb
          WHERE (pb.project_id = p.id)) AS calculated_start_date,
    ( SELECT max(pb.end_date) AS max
           FROM public.project_budgets pb
          WHERE (pb.project_id = p.id)) AS calculated_end_date
   FROM public.projects p;


--
-- Name: VIEW v_projects_with_dates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_projects_with_dates IS '프로젝트 정보(주관기관 담당자 포함)와 연차별 예산을 기반으로 계산된 시작일/종료일을 포함하는 뷰';


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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: announcement_reads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcement_reads ALTER COLUMN id SET DEFAULT nextval('public.announcement_reads_id_seq'::regclass);


--
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- Name: attendance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance ALTER COLUMN id SET DEFAULT nextval('public.attendance_id_seq'::regclass);


--
-- Name: attendance_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_settings ALTER COLUMN id SET DEFAULT nextval('public.attendance_settings_id_seq'::regclass);


--
-- Name: certificate_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_requests ALTER COLUMN id SET DEFAULT nextval('public.certificate_requests_id_seq'::regclass);


--
-- Name: evidence_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_types ALTER COLUMN id SET DEFAULT nextval('public.evidence_types_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: announcement_reads announcement_reads_announcement_id_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcement_reads
    ADD CONSTRAINT announcement_reads_announcement_id_employee_id_key UNIQUE (announcement_id, employee_id);


--
-- Name: announcement_reads announcement_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcement_reads
    ADD CONSTRAINT announcement_reads_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_employee_id_check_in_date_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_employee_id_check_in_date_unique UNIQUE (employee_id, check_in_date);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: attendance_records attendance_records_employee_id_check_in_date_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_employee_id_check_in_date_unique UNIQUE (employee_id, check_in_date);


--
-- Name: attendance_records attendance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_pkey PRIMARY KEY (id);


--
-- Name: attendance_settings attendance_settings_company_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_settings
    ADD CONSTRAINT attendance_settings_company_id_key UNIQUE (company_id);


--
-- Name: attendance_settings attendance_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_settings
    ADD CONSTRAINT attendance_settings_pkey PRIMARY KEY (id);


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
-- Name: certificate_requests certificate_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_requests
    ADD CONSTRAINT certificate_requests_pkey PRIMARY KEY (id);


--
-- Name: companies companies_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_code_key UNIQUE (code);


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
-- Name: employee_departments employee_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_departments
    ADD CONSTRAINT employee_departments_pkey PRIMARY KEY (id);


--
-- Name: employee_payrolls employee_payrolls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_payrolls
    ADD CONSTRAINT employee_payrolls_pkey PRIMARY KEY (id);


--
-- Name: employee_roles employee_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_roles
    ADD CONSTRAINT employee_roles_pkey PRIMARY KEY (employee_id, role_id);


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
-- Name: evidence_categories evidence_categories_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_categories
    ADD CONSTRAINT evidence_categories_code_unique UNIQUE (code);


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
-- Name: finance_account_tag_relations finance_account_tag_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_account_tag_relations
    ADD CONSTRAINT finance_account_tag_relations_pkey PRIMARY KEY (account_id, tag_id);


--
-- Name: finance_account_tags finance_account_tags_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_account_tags
    ADD CONSTRAINT finance_account_tags_name_key UNIQUE (name);


--
-- Name: finance_account_tags finance_account_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_account_tags
    ADD CONSTRAINT finance_account_tags_pkey PRIMARY KEY (id);


--
-- Name: finance_accounts finance_accounts_bank_id_account_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_accounts
    ADD CONSTRAINT finance_accounts_bank_id_account_number_key UNIQUE (bank_id, account_number);


--
-- Name: finance_accounts finance_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_accounts
    ADD CONSTRAINT finance_accounts_pkey PRIMARY KEY (id);


--
-- Name: finance_banks finance_banks_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_banks
    ADD CONSTRAINT finance_banks_code_key UNIQUE (code);


--
-- Name: finance_banks finance_banks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_banks
    ADD CONSTRAINT finance_banks_pkey PRIMARY KEY (id);


--
-- Name: finance_categories finance_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_categories
    ADD CONSTRAINT finance_categories_pkey PRIMARY KEY (id);


--
-- Name: finance_transactions finance_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT finance_transactions_pkey PRIMARY KEY (id);


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
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: org_memberships org_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_memberships
    ADD CONSTRAINT org_memberships_pkey PRIMARY KEY (id);


--
-- Name: org_units org_units_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_units
    ADD CONSTRAINT org_units_code_key UNIQUE (code);


--
-- Name: org_units org_units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_units
    ADD CONSTRAINT org_units_pkey PRIMARY KEY (id);


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
-- Name: permission_audit_log permission_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_audit_log
    ADD CONSTRAINT permission_audit_log_pkey PRIMARY KEY (id);


--
-- Name: permission_cache permission_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_cache
    ADD CONSTRAINT permission_cache_pkey PRIMARY KEY (employee_id);


--
-- Name: permissions permissions_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_code_key UNIQUE (code);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: planner_activity_log planner_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_activity_log
    ADD CONSTRAINT planner_activity_log_pkey PRIMARY KEY (id);


--
-- Name: planner_formation_initiatives planner_formation_initiatives_formation_id_initiative_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_formation_initiatives
    ADD CONSTRAINT planner_formation_initiatives_formation_id_initiative_id_key UNIQUE (formation_id, initiative_id);


--
-- Name: planner_formation_initiatives planner_formation_initiatives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_formation_initiatives
    ADD CONSTRAINT planner_formation_initiatives_pkey PRIMARY KEY (id);


--
-- Name: planner_formation_members planner_formation_members_formation_id_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_formation_members
    ADD CONSTRAINT planner_formation_members_formation_id_employee_id_key UNIQUE (formation_id, employee_id);


--
-- Name: planner_formation_members planner_formation_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_formation_members
    ADD CONSTRAINT planner_formation_members_pkey PRIMARY KEY (id);


--
-- Name: planner_formations planner_formations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_formations
    ADD CONSTRAINT planner_formations_pkey PRIMARY KEY (id);


--
-- Name: planner_initiatives planner_initiatives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_initiatives
    ADD CONSTRAINT planner_initiatives_pkey PRIMARY KEY (id);


--
-- Name: planner_milestones planner_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_milestones
    ADD CONSTRAINT planner_milestones_pkey PRIMARY KEY (id);


--
-- Name: planner_product_categories planner_product_categories_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_product_categories
    ADD CONSTRAINT planner_product_categories_code_key UNIQUE (code);


--
-- Name: planner_product_categories planner_product_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_product_categories
    ADD CONSTRAINT planner_product_categories_name_key UNIQUE (name);


--
-- Name: planner_product_categories planner_product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_product_categories
    ADD CONSTRAINT planner_product_categories_pkey PRIMARY KEY (id);


--
-- Name: planner_products planner_products_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_products
    ADD CONSTRAINT planner_products_code_key UNIQUE (code);


--
-- Name: planner_products planner_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_products
    ADD CONSTRAINT planner_products_pkey PRIMARY KEY (id);


--
-- Name: planner_thread_contributors planner_thread_contributors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_thread_contributors
    ADD CONSTRAINT planner_thread_contributors_pkey PRIMARY KEY (id);


--
-- Name: planner_thread_contributors planner_thread_contributors_thread_id_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_thread_contributors
    ADD CONSTRAINT planner_thread_contributors_thread_id_employee_id_key UNIQUE (thread_id, employee_id);


--
-- Name: planner_thread_replies planner_thread_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_thread_replies
    ADD CONSTRAINT planner_thread_replies_pkey PRIMARY KEY (id);


--
-- Name: planner_threads planner_threads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_threads
    ADD CONSTRAINT planner_threads_pkey PRIMARY KEY (id);


--
-- Name: planner_todos planner_todos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_todos
    ADD CONSTRAINT planner_todos_pkey PRIMARY KEY (id);


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
-- Name: project_budgets project_budgets_project_id_period_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_budgets
    ADD CONSTRAINT project_budgets_project_id_period_number_key UNIQUE (project_id, period_number);


--
-- Name: project_members project_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_pkey PRIMARY KEY (id);


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
-- Name: reporting_lines reporting_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reporting_lines
    ADD CONSTRAINT reporting_lines_pkey PRIMARY KEY (id);


--
-- Name: reporting_relationships reporting_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reporting_relationships
    ADD CONSTRAINT reporting_relationships_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_code_key UNIQUE (code);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


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
-- Name: sales_contracts sales_contracts_contract_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_contracts
    ADD CONSTRAINT sales_contracts_contract_number_key UNIQUE (contract_number);


--
-- Name: sales_contracts sales_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_contracts
    ADD CONSTRAINT sales_contracts_pkey PRIMARY KEY (id);


--
-- Name: sales_customers sales_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_customers
    ADD CONSTRAINT sales_customers_pkey PRIMARY KEY (id);


--
-- Name: sales_invoices sales_invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: sales_invoices sales_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_pkey PRIMARY KEY (id);


--
-- Name: sales_opportunities sales_opportunities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_opportunities
    ADD CONSTRAINT sales_opportunities_pkey PRIMARY KEY (id);


--
-- Name: sales_quotations sales_quotations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_quotations
    ADD CONSTRAINT sales_quotations_pkey PRIMARY KEY (id);


--
-- Name: sales_quotations sales_quotations_quotation_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_quotations
    ADD CONSTRAINT sales_quotations_quotation_number_key UNIQUE (quotation_number);


--
-- Name: sales_transactions sales_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_transactions
    ADD CONSTRAINT sales_transactions_pkey PRIMARY KEY (id);


--
-- Name: sales_transactions sales_transactions_transaction_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_transactions
    ADD CONSTRAINT sales_transactions_transaction_number_key UNIQUE (transaction_number);


--
-- Name: system_accounts system_accounts_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_accounts
    ADD CONSTRAINT system_accounts_email_key UNIQUE (email);


--
-- Name: system_accounts system_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_accounts
    ADD CONSTRAINT system_accounts_pkey PRIMARY KEY (id);


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
-- Name: work_schedules work_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_schedules
    ADD CONSTRAINT work_schedules_pkey PRIMARY KEY (id);


--
-- Name: idx_announcement_reads_announcement; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcement_reads_announcement ON public.announcement_reads USING btree (announcement_id);


--
-- Name: idx_announcement_reads_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcement_reads_employee ON public.announcement_reads USING btree (employee_id);


--
-- Name: idx_announcements_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcements_category ON public.announcements USING btree (category);


--
-- Name: idx_announcements_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcements_expires ON public.announcements USING btree (expires_at);


--
-- Name: idx_announcements_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcements_priority ON public.announcements USING btree (priority);


--
-- Name: idx_announcements_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcements_published ON public.announcements USING btree (is_published, published_at);


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
-- Name: idx_certificate_requests_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificate_requests_employee ON public.certificate_requests USING btree (employee_id);


--
-- Name: idx_certificate_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificate_requests_status ON public.certificate_requests USING btree (status);


--
-- Name: idx_certificate_requests_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificate_requests_type ON public.certificate_requests USING btree (certificate_type);


--
-- Name: idx_companies_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_companies_code ON public.companies USING btree (code);


--
-- Name: idx_companies_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_companies_name ON public.companies USING btree (name);


--
-- Name: idx_document_submissions_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_submissions_project_id ON public.document_submissions USING btree (project_id);


--
-- Name: idx_employee_departments_current; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_departments_current ON public.employee_departments USING btree (employee_id) WHERE (end_date IS NULL);


--
-- Name: idx_employee_departments_department; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_departments_department ON public.employee_departments USING btree (department_id);


--
-- Name: idx_employee_departments_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_departments_employee ON public.employee_departments USING btree (employee_id);


--
-- Name: idx_employee_departments_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_departments_primary ON public.employee_departments USING btree (employee_id, is_primary) WHERE (end_date IS NULL);


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
-- Name: idx_employee_roles_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_roles_employee ON public.employee_roles USING btree (employee_id) WHERE (is_active = true);


--
-- Name: idx_employee_roles_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_roles_expires ON public.employee_roles USING btree (expires_at) WHERE (expires_at IS NOT NULL);


--
-- Name: idx_employee_roles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_roles_role ON public.employee_roles USING btree (role_id) WHERE (is_active = true);


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
-- Name: idx_evidence_categories_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_categories_code ON public.evidence_categories USING btree (code);


--
-- Name: idx_evidence_categories_display_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_categories_display_order ON public.evidence_categories USING btree (display_order);


--
-- Name: idx_evidence_categories_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_categories_is_active ON public.evidence_categories USING btree (is_active);


--
-- Name: idx_evidence_categories_parent_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_categories_parent_code ON public.evidence_categories USING btree (parent_code);


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
-- Name: idx_evidence_items_category_vendor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_items_category_vendor ON public.evidence_items USING btree (category_id, vendor_id);


--
-- Name: idx_evidence_items_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_items_due_date ON public.evidence_items USING btree (due_date);


--
-- Name: idx_evidence_items_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_items_employee_id ON public.evidence_items USING btree (employee_id);


--
-- Name: idx_evidence_items_evidence_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_items_evidence_month ON public.evidence_items USING btree (evidence_month);


--
-- Name: idx_evidence_items_payment_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_items_payment_date ON public.evidence_items USING btree (payment_date);


--
-- Name: idx_evidence_items_project_budget; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_items_project_budget ON public.evidence_items USING btree (project_budget_id);


--
-- Name: idx_evidence_items_project_member_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_items_project_member_id ON public.evidence_items USING btree (project_member_id);


--
-- Name: idx_evidence_items_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_items_status ON public.evidence_items USING btree (status);


--
-- Name: idx_evidence_items_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_items_vendor_id ON public.evidence_items USING btree (vendor_id);


--
-- Name: idx_evidence_items_vendor_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidence_items_vendor_name ON public.evidence_items USING btree (vendor_name);


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
-- Name: idx_finance_categories_account_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_finance_categories_account_code ON public.finance_categories USING btree (account_code);


--
-- Name: idx_finance_categories_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_finance_categories_code ON public.finance_categories USING btree (code);


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
-- Name: idx_leave_balances_employee_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leave_balances_employee_year ON public.leave_balances USING btree (employee_id, year);


--
-- Name: idx_leave_requests_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leave_requests_date ON public.leave_requests USING btree (start_date, end_date);


--
-- Name: idx_leave_requests_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leave_requests_employee ON public.leave_requests USING btree (employee_id);


--
-- Name: idx_leave_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leave_requests_status ON public.leave_requests USING btree (status);


--
-- Name: idx_notifications_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_category ON public.notifications USING btree (category);


--
-- Name: idx_notifications_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_employee ON public.notifications USING btree (employee_id);


--
-- Name: idx_notifications_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_expires ON public.notifications USING btree (expires_at);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_org_memberships_current; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_memberships_current ON public.org_memberships USING btree (employee_id) WHERE (end_date IS NULL);


--
-- Name: idx_org_memberships_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_memberships_employee ON public.org_memberships USING btree (employee_id);


--
-- Name: idx_org_memberships_org_unit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_memberships_org_unit ON public.org_memberships USING btree (org_unit_id);


--
-- Name: idx_org_memberships_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_memberships_primary ON public.org_memberships USING btree (employee_id, is_primary) WHERE (end_date IS NULL);


--
-- Name: idx_org_units_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_units_active ON public.org_units USING btree (is_active);


--
-- Name: idx_org_units_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_units_code ON public.org_units USING btree (code);


--
-- Name: idx_org_units_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_units_parent ON public.org_units USING btree (parent_id);


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
-- Name: idx_payslips_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payslips_created_at ON public.payslips USING btree (created_at);


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
-- Name: idx_permission_audit_performed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permission_audit_performed ON public.permission_audit_log USING btree (performed_at DESC);


--
-- Name: idx_permission_audit_target_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permission_audit_target_user ON public.permission_audit_log USING btree (target_employee_id);


--
-- Name: idx_permission_audit_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permission_audit_user ON public.permission_audit_log USING btree (employee_id);


--
-- Name: idx_permission_cache_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permission_cache_expires ON public.permission_cache USING btree (expires_at);


--
-- Name: idx_permissions_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permissions_action ON public.permissions USING btree (action);


--
-- Name: idx_permissions_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permissions_code ON public.permissions USING btree (code) WHERE (is_active = true);


--
-- Name: idx_permissions_resource; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permissions_resource ON public.permissions USING btree (resource) WHERE (is_active = true);


--
-- Name: idx_planner_activity_log_actor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_activity_log_actor ON public.planner_activity_log USING btree (actor_id);


--
-- Name: idx_planner_activity_log_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_activity_log_created ON public.planner_activity_log USING btree (created_at);


--
-- Name: idx_planner_activity_log_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_activity_log_entity ON public.planner_activity_log USING btree (entity_type, entity_id);


--
-- Name: idx_planner_formation_initiatives_formation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_formation_initiatives_formation ON public.planner_formation_initiatives USING btree (formation_id);


--
-- Name: idx_planner_formation_initiatives_initiative; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_formation_initiatives_initiative ON public.planner_formation_initiatives USING btree (initiative_id);


--
-- Name: idx_planner_formation_members_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_formation_members_employee ON public.planner_formation_members USING btree (employee_id);


--
-- Name: idx_planner_formation_members_formation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_formation_members_formation ON public.planner_formation_members USING btree (formation_id);


--
-- Name: idx_planner_formation_members_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_formation_members_role ON public.planner_formation_members USING btree (role);


--
-- Name: idx_planner_formations_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_formations_deleted ON public.planner_formations USING btree (deleted_at);


--
-- Name: idx_planner_formations_energy; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_formations_energy ON public.planner_formations USING btree (energy_state);


--
-- Name: idx_planner_initiatives_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_initiatives_deleted ON public.planner_initiatives USING btree (deleted_at);


--
-- Name: idx_planner_initiatives_formation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_initiatives_formation ON public.planner_initiatives USING btree (formation_id);


--
-- Name: idx_planner_initiatives_horizon; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_initiatives_horizon ON public.planner_initiatives USING btree (horizon);


--
-- Name: idx_planner_initiatives_milestone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_initiatives_milestone ON public.planner_initiatives USING btree (milestone_id);


--
-- Name: idx_planner_initiatives_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_initiatives_owner ON public.planner_initiatives USING btree (owner_id);


--
-- Name: idx_planner_initiatives_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_initiatives_product ON public.planner_initiatives USING btree (product_id);


--
-- Name: idx_planner_initiatives_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_initiatives_search ON public.planner_initiatives USING gin (to_tsvector('english'::regconfig, (((title)::text || ' '::text) || intent)));


--
-- Name: idx_planner_initiatives_stage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_initiatives_stage ON public.planner_initiatives USING btree (stage);


--
-- Name: idx_planner_initiatives_stage_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_initiatives_stage_status ON public.planner_initiatives USING btree (stage, status);


--
-- Name: idx_planner_initiatives_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_initiatives_status ON public.planner_initiatives USING btree (status);


--
-- Name: idx_planner_milestones_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_milestones_deleted ON public.planner_milestones USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_planner_milestones_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_milestones_product ON public.planner_milestones USING btree (product_id);


--
-- Name: idx_planner_milestones_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_milestones_status ON public.planner_milestones USING btree (status);


--
-- Name: idx_planner_milestones_target_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_milestones_target_date ON public.planner_milestones USING btree (target_date);


--
-- Name: idx_planner_products_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_products_category ON public.planner_products USING btree (category);


--
-- Name: idx_planner_products_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_products_deleted ON public.planner_products USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_planner_products_display_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_products_display_order ON public.planner_products USING btree (display_order);


--
-- Name: idx_planner_products_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_products_owner ON public.planner_products USING btree (owner_id);


--
-- Name: idx_planner_products_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_products_status ON public.planner_products USING btree (status);


--
-- Name: idx_planner_thread_contributors_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_thread_contributors_employee ON public.planner_thread_contributors USING btree (employee_id);


--
-- Name: idx_planner_thread_contributors_thread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_thread_contributors_thread ON public.planner_thread_contributors USING btree (thread_id);


--
-- Name: idx_planner_thread_replies_author; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_thread_replies_author ON public.planner_thread_replies USING btree (author_id);


--
-- Name: idx_planner_thread_replies_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_thread_replies_created ON public.planner_thread_replies USING btree (created_at);


--
-- Name: idx_planner_thread_replies_thread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_thread_replies_thread ON public.planner_thread_replies USING btree (thread_id);


--
-- Name: idx_planner_threads_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_threads_deleted ON public.planner_threads USING btree (deleted_at);


--
-- Name: idx_planner_threads_initiative; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_threads_initiative ON public.planner_threads USING btree (initiative_id);


--
-- Name: idx_planner_threads_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_threads_owner ON public.planner_threads USING btree (owner_id);


--
-- Name: idx_planner_threads_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_threads_search ON public.planner_threads USING gin (to_tsvector('english'::regconfig, (((title)::text || ' '::text) || COALESCE(body, ''::text))));


--
-- Name: idx_planner_threads_shape; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_threads_shape ON public.planner_threads USING btree (shape);


--
-- Name: idx_planner_threads_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_threads_state ON public.planner_threads USING btree (state);


--
-- Name: idx_planner_todos_assignee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_todos_assignee_id ON public.planner_todos USING btree (assignee_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_planner_todos_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_todos_due_date ON public.planner_todos USING btree (due_date) WHERE (deleted_at IS NULL);


--
-- Name: idx_planner_todos_initiative_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_todos_initiative_id ON public.planner_todos USING btree (initiative_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_planner_todos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_todos_status ON public.planner_todos USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_project_budgets_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_budgets_period ON public.project_budgets USING btree (period_number);


--
-- Name: idx_project_budgets_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_budgets_project ON public.project_budgets USING btree (project_id);


--
-- Name: idx_project_budgets_project_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_budgets_project_dates ON public.project_budgets USING btree (project_id, start_date, end_date);


--
-- Name: INDEX idx_project_budgets_project_dates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_project_budgets_project_dates IS 'v_projects_with_dates 뷰의 MIN/MAX 계산 성능 최적화를 위한 복합 인덱스';


--
-- Name: idx_project_members_cash_amount; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_members_cash_amount ON public.project_members USING btree (cash_amount);


--
-- Name: idx_project_members_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_members_employee ON public.project_members USING btree (employee_id);


--
-- Name: idx_project_members_in_kind_amount; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_members_in_kind_amount ON public.project_members USING btree (in_kind_amount);


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
-- Name: idx_projects_manager; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_manager ON public.projects USING btree (manager_employee_id);


--
-- Name: idx_projects_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_status ON public.projects USING btree (status);


--
-- Name: idx_rd_budget_items_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rd_budget_items_project_id ON public.rd_budget_items USING btree (project_id);


--
-- Name: idx_reporting_lines_current; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reporting_lines_current ON public.reporting_lines USING btree (employee_id) WHERE (end_date IS NULL);


--
-- Name: idx_reporting_lines_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reporting_lines_employee ON public.reporting_lines USING btree (employee_id);


--
-- Name: idx_reporting_lines_manager; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reporting_lines_manager ON public.reporting_lines USING btree (manager_id);


--
-- Name: idx_reporting_relationships_current; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reporting_relationships_current ON public.reporting_relationships USING btree (employee_id) WHERE (end_date IS NULL);


--
-- Name: idx_reporting_relationships_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reporting_relationships_employee ON public.reporting_relationships USING btree (employee_id);


--
-- Name: idx_reporting_relationships_manager; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reporting_relationships_manager ON public.reporting_relationships USING btree (manager_id);


--
-- Name: idx_role_permissions_permission; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_permissions_permission ON public.role_permissions USING btree (permission_id);


--
-- Name: idx_role_permissions_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_permissions_role ON public.role_permissions USING btree (role_id);


--
-- Name: idx_roles_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_roles_code ON public.roles USING btree (code) WHERE (is_active = true);


--
-- Name: idx_roles_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_roles_parent ON public.roles USING btree (parent_role_id) WHERE (parent_role_id IS NOT NULL);


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
-- Name: idx_sales_contracts_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_contracts_customer_id ON public.sales_contracts USING btree (customer_id);


--
-- Name: idx_sales_contracts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_contracts_status ON public.sales_contracts USING btree (status);


--
-- Name: idx_sales_customers_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_customers_name ON public.sales_customers USING btree (name);


--
-- Name: idx_sales_customers_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_customers_type ON public.sales_customers USING btree (type);


--
-- Name: idx_sales_opportunities_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_opportunities_customer_id ON public.sales_opportunities USING btree (customer_id);


--
-- Name: idx_sales_opportunities_stage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_opportunities_stage ON public.sales_opportunities USING btree (stage);


--
-- Name: idx_sales_transactions_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_transactions_customer_id ON public.sales_transactions USING btree (customer_id);


--
-- Name: idx_sales_transactions_transaction_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_transactions_transaction_date ON public.sales_transactions USING btree (transaction_date);


--
-- Name: idx_sales_transactions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_transactions_type ON public.sales_transactions USING btree (type);


--
-- Name: idx_system_accounts_account_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_accounts_account_type ON public.system_accounts USING btree (account_type);


--
-- Name: idx_transactions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_date ON public.transactions USING btree (date);


--
-- Name: idx_transactions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_type ON public.transactions USING btree (type);


--
-- Name: planner_threads auto_set_thread_resolved_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER auto_set_thread_resolved_at BEFORE UPDATE ON public.planner_threads FOR EACH ROW EXECUTE FUNCTION public.set_thread_resolved_at();


--
-- Name: attendance trigger_calculate_work_hours; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_calculate_work_hours BEFORE INSERT OR UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.calculate_work_hours();


--
-- Name: employee_roles trigger_invalidate_cache_on_employee_role_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_invalidate_cache_on_employee_role_change AFTER INSERT OR DELETE OR UPDATE ON public.employee_roles FOR EACH ROW EXECUTE FUNCTION public.invalidate_permission_cache();


--
-- Name: role_permissions trigger_invalidate_cache_on_role_permission_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_invalidate_cache_on_role_permission_change AFTER INSERT OR DELETE OR UPDATE ON public.role_permissions FOR EACH ROW EXECUTE FUNCTION public.invalidate_permission_cache();


--
-- Name: announcements trigger_set_announcement_published_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_announcement_published_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.set_announcement_published_at();


--
-- Name: notifications trigger_set_notification_read_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_notification_read_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.set_notification_read_at();


--
-- Name: announcements trigger_update_announcements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_announcements_updated_at();


--
-- Name: attendance trigger_update_attendance_check_in_date; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_attendance_check_in_date BEFORE INSERT OR UPDATE OF check_in_time ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.update_attendance_check_in_date();


--
-- Name: attendance_records trigger_update_attendance_records_check_in_date; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_attendance_records_check_in_date BEFORE INSERT OR UPDATE OF check_in_time ON public.attendance_records FOR EACH ROW EXECUTE FUNCTION public.update_attendance_records_check_in_date();


--
-- Name: attendance_settings trigger_update_attendance_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_attendance_settings_updated_at BEFORE UPDATE ON public.attendance_settings FOR EACH ROW EXECUTE FUNCTION public.update_attendance_settings_updated_at();


--
-- Name: attendance trigger_update_attendance_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.update_attendance_updated_at();


--
-- Name: budget_evidence trigger_update_budget_spent_amount; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_budget_spent_amount AFTER INSERT OR UPDATE ON public.budget_evidence FOR EACH ROW EXECUTE FUNCTION public.update_project_budget_spent_amount();


--
-- Name: certificate_requests trigger_update_certificate_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_certificate_requests_updated_at BEFORE UPDATE ON public.certificate_requests FOR EACH ROW EXECUTE FUNCTION public.update_certificate_requests_updated_at();


--
-- Name: global_factors trigger_update_global_factors_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_global_factors_updated_at BEFORE UPDATE ON public.global_factors FOR EACH ROW EXECUTE FUNCTION public.update_global_factors_updated_at();


--
-- Name: leave_requests trigger_update_leave_balance_on_approval; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_leave_balance_on_approval AFTER UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.update_leave_balance_on_approval();


--
-- Name: leave_balances trigger_update_leave_balances_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_leave_balances_updated_at BEFORE UPDATE ON public.leave_balances FOR EACH ROW EXECUTE FUNCTION public.update_leave_balances_updated_at();


--
-- Name: leave_requests trigger_update_leave_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.update_leave_requests_updated_at();


--
-- Name: notifications trigger_update_notifications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.update_notifications_updated_at();


--
-- Name: payslip_templates trigger_update_payslip_template_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_payslip_template_updated_at BEFORE UPDATE ON public.payslip_templates FOR EACH ROW EXECUTE FUNCTION public.update_payslip_updated_at();


--
-- Name: payslips trigger_update_payslip_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_payslip_updated_at BEFORE UPDATE ON public.payslips FOR EACH ROW EXECUTE FUNCTION public.update_payslip_updated_at();


--
-- Name: roles trigger_update_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_roles_updated_at();


--
-- Name: salary_contracts trigger_update_salary_contract_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_salary_contract_updated_at BEFORE UPDATE ON public.salary_contracts FOR EACH ROW EXECUTE FUNCTION public.update_salary_contract_updated_at();


--
-- Name: payslips update_payslips_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_payslips_updated_at BEFORE UPDATE ON public.payslips FOR EACH ROW EXECUTE FUNCTION public.update_payslips_updated_at();


--
-- Name: announcement_reads announcement_reads_announcement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcement_reads
    ADD CONSTRAINT announcement_reads_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.announcements(id) ON DELETE CASCADE;


--
-- Name: announcement_reads announcement_reads_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcement_reads
    ADD CONSTRAINT announcement_reads_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: announcements announcements_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: attendance attendance_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: attendance_records attendance_records_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: attendance_settings attendance_settings_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_settings
    ADD CONSTRAINT attendance_settings_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


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
-- Name: certificate_requests certificate_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_requests
    ADD CONSTRAINT certificate_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.employees(id);


--
-- Name: certificate_requests certificate_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_requests
    ADD CONSTRAINT certificate_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: document_submissions document_submissions_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_submissions
    ADD CONSTRAINT document_submissions_approved_by_fkey FOREIGN KEY (approved_by_employee_id) REFERENCES public.employees(id);


--
-- Name: document_submissions document_submissions_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_submissions
    ADD CONSTRAINT document_submissions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.rd_projects(id);


--
-- Name: document_submissions document_submissions_submitter_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_submissions
    ADD CONSTRAINT document_submissions_submitter_fkey FOREIGN KEY (submitter_employee_id) REFERENCES public.employees(id);


--
-- Name: document_submissions document_submissions_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_submissions
    ADD CONSTRAINT document_submissions_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.document_templates(id);


--
-- Name: document_templates document_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_templates
    ADD CONSTRAINT document_templates_created_by_fkey FOREIGN KEY (created_by_employee_id) REFERENCES public.employees(id);


--
-- Name: employee_departments employee_departments_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_departments
    ADD CONSTRAINT employee_departments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


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
-- Name: employee_roles employee_roles_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_roles
    ADD CONSTRAINT employee_roles_assigned_by_fkey FOREIGN KEY (assigned_by_employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: employee_roles employee_roles_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_roles
    ADD CONSTRAINT employee_roles_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_roles employee_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_roles
    ADD CONSTRAINT employee_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: employees employees_job_title_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_job_title_id_fkey FOREIGN KEY (job_title_id) REFERENCES public.job_titles(id);


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
-- Name: evidence_items evidence_items_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_items
    ADD CONSTRAINT evidence_items_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: evidence_items evidence_items_project_budget_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_items
    ADD CONSTRAINT evidence_items_project_budget_id_fkey FOREIGN KEY (project_budget_id) REFERENCES public.project_budgets(id) ON DELETE CASCADE;


--
-- Name: evidence_items evidence_items_project_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_items
    ADD CONSTRAINT evidence_items_project_member_id_fkey FOREIGN KEY (project_member_id) REFERENCES public.project_members(id) ON DELETE SET NULL;


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
-- Name: expense_items expense_items_requester_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_items
    ADD CONSTRAINT expense_items_requester_fkey FOREIGN KEY (requester_employee_id) REFERENCES public.employees(id);


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
-- Name: finance_account_tag_relations finance_account_tag_relations_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_account_tag_relations
    ADD CONSTRAINT finance_account_tag_relations_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.finance_accounts(id) ON DELETE CASCADE;


--
-- Name: finance_account_tag_relations finance_account_tag_relations_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_account_tag_relations
    ADD CONSTRAINT finance_account_tag_relations_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.finance_account_tags(id) ON DELETE CASCADE;


--
-- Name: finance_accounts finance_accounts_bank_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_accounts
    ADD CONSTRAINT finance_accounts_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES public.finance_banks(id);


--
-- Name: finance_categories finance_categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_categories
    ADD CONSTRAINT finance_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.finance_categories(id);


--
-- Name: finance_transactions finance_transactions_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT finance_transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.finance_accounts(id);


--
-- Name: finance_transactions finance_transactions_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT finance_transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.finance_categories(id);


--
-- Name: evidence_items fk_evidence_items_vendor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence_items
    ADD CONSTRAINT fk_evidence_items_vendor FOREIGN KEY (vendor_id) REFERENCES public.sales_customers(id) ON DELETE SET NULL;


--
-- Name: planner_initiatives fk_planner_initiatives_formation; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_initiatives
    ADD CONSTRAINT fk_planner_initiatives_formation FOREIGN KEY (formation_id) REFERENCES public.planner_formations(id) ON DELETE SET NULL;


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
-- Name: notifications notifications_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: org_memberships org_memberships_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_memberships
    ADD CONSTRAINT org_memberships_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: org_memberships org_memberships_org_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_memberships
    ADD CONSTRAINT org_memberships_org_unit_id_fkey FOREIGN KEY (org_unit_id) REFERENCES public.org_units(id) ON DELETE CASCADE;


--
-- Name: org_units org_units_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_units
    ADD CONSTRAINT org_units_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.org_units(id) ON DELETE SET NULL;


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
-- Name: permission_audit_log permission_audit_log_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_audit_log
    ADD CONSTRAINT permission_audit_log_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: permission_audit_log permission_audit_log_target_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_audit_log
    ADD CONSTRAINT permission_audit_log_target_employee_id_fkey FOREIGN KEY (target_employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: permission_audit_log permission_audit_log_target_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_audit_log
    ADD CONSTRAINT permission_audit_log_target_permission_id_fkey FOREIGN KEY (target_permission_id) REFERENCES public.permissions(id) ON DELETE SET NULL;


--
-- Name: permission_audit_log permission_audit_log_target_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_audit_log
    ADD CONSTRAINT permission_audit_log_target_role_id_fkey FOREIGN KEY (target_role_id) REFERENCES public.roles(id) ON DELETE SET NULL;


--
-- Name: permission_cache permission_cache_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_cache
    ADD CONSTRAINT permission_cache_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: planner_activity_log planner_activity_log_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_activity_log
    ADD CONSTRAINT planner_activity_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: planner_activity_log planner_activity_log_milestone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_activity_log
    ADD CONSTRAINT planner_activity_log_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.planner_milestones(id);


--
-- Name: planner_activity_log planner_activity_log_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_activity_log
    ADD CONSTRAINT planner_activity_log_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.planner_products(id);


--
-- Name: planner_formation_initiatives planner_formation_initiatives_formation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_formation_initiatives
    ADD CONSTRAINT planner_formation_initiatives_formation_id_fkey FOREIGN KEY (formation_id) REFERENCES public.planner_formations(id) ON DELETE CASCADE;


--
-- Name: planner_formation_initiatives planner_formation_initiatives_initiative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_formation_initiatives
    ADD CONSTRAINT planner_formation_initiatives_initiative_id_fkey FOREIGN KEY (initiative_id) REFERENCES public.planner_initiatives(id) ON DELETE CASCADE;


--
-- Name: planner_formation_members planner_formation_members_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_formation_members
    ADD CONSTRAINT planner_formation_members_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: planner_formation_members planner_formation_members_formation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_formation_members
    ADD CONSTRAINT planner_formation_members_formation_id_fkey FOREIGN KEY (formation_id) REFERENCES public.planner_formations(id) ON DELETE CASCADE;


--
-- Name: planner_initiatives planner_initiatives_milestone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_initiatives
    ADD CONSTRAINT planner_initiatives_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.planner_milestones(id);


--
-- Name: planner_initiatives planner_initiatives_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_initiatives
    ADD CONSTRAINT planner_initiatives_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: planner_initiatives planner_initiatives_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_initiatives
    ADD CONSTRAINT planner_initiatives_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.planner_products(id);


--
-- Name: planner_milestones planner_milestones_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_milestones
    ADD CONSTRAINT planner_milestones_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.planner_products(id) ON DELETE CASCADE;


--
-- Name: planner_products planner_products_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_products
    ADD CONSTRAINT planner_products_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.employees(id);


--
-- Name: planner_thread_contributors planner_thread_contributors_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_thread_contributors
    ADD CONSTRAINT planner_thread_contributors_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: planner_thread_contributors planner_thread_contributors_thread_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_thread_contributors
    ADD CONSTRAINT planner_thread_contributors_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.planner_threads(id) ON DELETE CASCADE;


--
-- Name: planner_thread_replies planner_thread_replies_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_thread_replies
    ADD CONSTRAINT planner_thread_replies_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: planner_thread_replies planner_thread_replies_thread_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_thread_replies
    ADD CONSTRAINT planner_thread_replies_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.planner_threads(id) ON DELETE CASCADE;


--
-- Name: planner_threads planner_threads_initiative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_threads
    ADD CONSTRAINT planner_threads_initiative_id_fkey FOREIGN KEY (initiative_id) REFERENCES public.planner_initiatives(id) ON DELETE CASCADE;


--
-- Name: planner_threads planner_threads_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_threads
    ADD CONSTRAINT planner_threads_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: planner_todos planner_todos_assignee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_todos
    ADD CONSTRAINT planner_todos_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: planner_todos planner_todos_initiative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_todos
    ADD CONSTRAINT planner_todos_initiative_id_fkey FOREIGN KEY (initiative_id) REFERENCES public.planner_initiatives(id) ON DELETE CASCADE;


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
-- Name: projects projects_manager_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_manager_fkey FOREIGN KEY (manager_employee_id) REFERENCES public.employees(id);


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
-- Name: reporting_lines reporting_lines_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reporting_lines
    ADD CONSTRAINT reporting_lines_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: reporting_lines reporting_lines_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reporting_lines
    ADD CONSTRAINT reporting_lines_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: reporting_relationships reporting_relationships_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reporting_relationships
    ADD CONSTRAINT reporting_relationships_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: reporting_relationships reporting_relationships_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reporting_relationships
    ADD CONSTRAINT reporting_relationships_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_granted_by_fkey FOREIGN KEY (granted_by_employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: roles roles_parent_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_parent_role_id_fkey FOREIGN KEY (parent_role_id) REFERENCES public.roles(id) ON DELETE SET NULL;


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
-- Name: sales_contracts sales_contracts_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_contracts
    ADD CONSTRAINT sales_contracts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.sales_customers(id);


--
-- Name: sales_invoices sales_invoices_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.sales_contracts(id);


--
-- Name: sales_invoices sales_invoices_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.sales_customers(id);


--
-- Name: sales_invoices sales_invoices_quotation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.sales_quotations(id);


--
-- Name: sales_opportunities sales_opportunities_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_opportunities
    ADD CONSTRAINT sales_opportunities_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.sales_customers(id);


--
-- Name: sales_quotations sales_quotations_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_quotations
    ADD CONSTRAINT sales_quotations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.sales_customers(id);


--
-- Name: sales_quotations sales_quotations_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_quotations
    ADD CONSTRAINT sales_quotations_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.sales_opportunities(id);


--
-- Name: sales_transactions sales_transactions_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_transactions
    ADD CONSTRAINT sales_transactions_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.sales_contracts(id);


--
-- Name: sales_transactions sales_transactions_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_transactions
    ADD CONSTRAINT sales_transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.sales_customers(id);


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
    ADD CONSTRAINT transactions_created_by_fkey FOREIGN KEY (created_by_employee_id) REFERENCES public.employees(id);


--
-- Name: work_schedules work_schedules_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_schedules
    ADD CONSTRAINT work_schedules_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 1CvHfB9LnuB8wZEgrVQLKM7NulQ5dYg6xhR3e58ZEvRhIXH5MpNIi4v3kpuJtYE

