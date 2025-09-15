-- 사용하지 않는 테이블들 정리 스크립트
-- 실제로 사용되는 테이블들만 남기고 나머지는 모두 삭제

-- ===== 실제로 사용되는 테이블들 =====
-- employees (직원 정보)
-- salary_contracts (급여 계약)
-- payslips (급여명세서)
-- users (사용자)
-- companies (회사)
-- projects (프로젝트)
-- expense_items (비용 항목)
-- transactions (거래)
-- job_titles (직책)
-- positions (직위)
-- departments (부서)
-- executives (경영진)
-- rd_projects (R&D 프로젝트)
-- audit_logs (감사 로그)

-- ===== 사용하지 않는 테이블들 삭제 =====

-- 급여 관련 사용하지 않는 테이블들
DROP TABLE IF EXISTS employee_payrolls CASCADE;
DROP TABLE IF EXISTS payrolls CASCADE;
DROP TABLE IF EXISTS salary_structures CASCADE;
DROP TABLE IF EXISTS salary_history CASCADE;

-- 기타 사용하지 않는 테이블들 (혹시 있다면)
DROP TABLE IF EXISTS payroll_calculations CASCADE;
DROP TABLE IF EXISTS salary_components CASCADE;
DROP TABLE IF EXISTS payroll_periods CASCADE;
DROP TABLE IF EXISTS employee_benefits CASCADE;
DROP TABLE IF EXISTS tax_calculations CASCADE;
DROP TABLE IF EXISTS deduction_types CASCADE;
DROP TABLE IF EXISTS allowance_types CASCADE;

-- 사용하지 않는 뷰들 (혹시 있다면)
DROP VIEW IF EXISTS payroll_summary CASCADE;
DROP VIEW IF EXISTS employee_salary_summary CASCADE;
DROP VIEW IF EXISTS monthly_payroll_report CASCADE;

-- 사용하지 않는 함수들 (혹시 있다면)
DROP FUNCTION IF EXISTS calculate_payroll(period VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS generate_payslip(employee_id UUID, period VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS approve_payroll(payroll_id UUID) CASCADE;

-- 사용하지 않는 트리거들 (혹시 있다면)
DROP TRIGGER IF EXISTS update_payroll_updated_at_trigger ON payrolls CASCADE;
DROP TRIGGER IF EXISTS update_employee_payroll_updated_at_trigger ON employee_payrolls CASCADE;

-- 정리 완료 메시지
SELECT 'Unused tables cleanup completed successfully!' as message;
