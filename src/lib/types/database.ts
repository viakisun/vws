// ===== 데이터베이스 쿼리 결과 타입 정의 =====
// API 엔드포인트에서 사용하는 데이터베이스 쿼리 결과의 타입을 명시적으로 정의

// ===== 기본 데이터베이스 엔티티 타입 =====

export interface DatabaseEmployee {
  id: string
  employee_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  department?: string
  position?: string
  salary?: number
  hire_date?: string
  birth_date?: string
  termination_date?: string
  status: string
  employment_type?: string
  job_title_id?: string
  created_at: string
  updated_at: string
  // JOIN 결과 필드
  job_title_name?: string
  job_title_level?: string
  job_title_category?: string
  [key: string]: unknown
}

export interface DatabaseProject {
  id: string
  code: string
  title: string
  description?: string
  sponsor?: string
  sponsor_type: string
  start_date?: string
  end_date?: string
  manager_id?: string
  status: string
  budget_total?: number
  research_type?: string
  technology_area?: string
  priority: string
  created_at: string
  updated_at: string
  // JOIN 결과 필드
  manager_name?: string
  member_count?: number
  total_participation_rate?: number
  [key: string]: unknown
}

export interface DatabaseProjectMember {
  id: string
  project_id: string
  employee_id: string
  role: string
  start_date: string
  end_date?: string
  participation_rate: number
  monthly_salary?: number
  annual_salary?: number
  status: string
  notes?: string
  created_at: string
  updated_at: string
  // JOIN 결과 필드
  employee_name?: string
  department?: string
  [key: string]: unknown
}

export interface DatabaseProjectBudget {
  id: string
  project_id: string
  period_number: number
  start_date?: string
  end_date?: string
  government_funding_amount?: number
  company_cash_amount?: number
  company_in_kind_amount?: number
  personnel_cost?: number
  material_cost?: number
  research_activity_cost?: number
  indirect_cost?: number
  other_cost?: number
  total_budget?: number
  spent_amount?: number
  currency: string
  status: string
  notes?: string
  created_at: string
  updated_at: string
  [key: string]: unknown
}

export interface DatabaseCompany {
  id: string
  name: string
  type?: string
  status?: string
  industry?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  description?: string
  created_at: string
  updated_at: string
  [key: string]: unknown
}

export interface DatabaseDepartment {
  id: string
  name: string
  description?: string
  status: string
  max_employees?: number
  created_at: string
  updated_at: string
  [key: string]: unknown
}

export interface DatabaseUser {
  id: string
  email: string
  name: string
  role: string
  department?: string
  position?: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_login?: string
}

export interface DatabaseExecutive {
  id: string
  employee_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  department?: string
  position?: string
  hire_date?: string
  salary?: number
  status: string
  created_at: string
  updated_at: string
}

export interface DatabaseJobTitle {
  id: string
  name: string
  level?: string
  category?: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DatabaseDepartment {
  id: string
  name: string
  description?: string
  manager_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DatabasePosition {
  id: string
  name: string
  level?: string
  department_id?: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// ===== 급여 관련 타입 =====

export interface DatabaseSalaryContract {
  id: string
  employee_id: string
  start_date: string
  end_date?: string
  annual_salary: number
  monthly_salary: number
  contract_type: string
  status: string
  notes?: string
  created_at: string
  updated_at: string
  created_by?: string
  // JOIN 결과 필드
  employee_name?: string
  employee_id_number?: string
  department?: string
  position?: string
  contract_end_display?: string
  status_display?: string
  [key: string]: unknown
}

export interface DatabasePayslip {
  id: string
  employee_id: string
  pay_period_start: string
  pay_period_end: string
  base_salary: number
  total_allowances: number
  total_deductions: number
  net_salary: number
  status: string
  generated_at: string
  created_at: string
  updated_at: string
  // JOIN 결과 필드
  employee_name?: string
  department?: string
  position?: string
  hire_date?: string
}

// ===== 프로젝트 관리 관련 타입 =====

export interface DatabaseEvidenceItem {
  id: string
  project_id: string
  name: string
  description?: string
  category: string
  status: string
  amount?: number
  currency?: string
  evidence_date?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface DatabaseEvidenceDocument {
  id: string
  evidence_id: string
  document_type: string
  file_name: string
  file_path: string
  file_size?: number
  mime_type?: string
  uploaded_by?: string
  uploaded_at: string
  status: string
  created_at: string
  updated_at: string
}

export interface DatabaseGlobalFactor {
  id: string
  factor_name: string
  factor_value: number
  factor_type: string
  description?: string
  is_active: boolean
  effective_from: string
  effective_to?: string
  created_at: string
  updated_at: string
}

// ===== R&D 프로젝트 관련 타입 =====

export interface DatabaseRDProject {
  id: string
  project_id: string
  research_type: string
  technology_area?: string
  research_goal?: string
  expected_outcome?: string
  status: string
  created_at: string
  updated_at: string
  // JOIN 결과 필드
  code?: string
  title?: string
  description?: string
  sponsor?: string
  sponsor_type?: string
  start_date?: string
  end_date?: string
  manager_id?: string
  project_status?: string
  budget_total?: number
}

// ===== API 응답 타입 =====

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  count?: number
  pagination?: {
    limit: number
    offset: number
    total: number
  }
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    limit: number
    offset: number
    total: number
  }
}

// ===== 쿼리 파라미터 타입 =====

export interface QueryParams {
  limit?: number
  offset?: number
  status?: string
  department?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ProjectQueryParams extends QueryParams {
  sponsorType?: string
  researchType?: string
  priority?: string
  managerId?: string
  startDateFrom?: string
  startDateTo?: string
}

export interface EmployeeQueryParams extends QueryParams {
  employmentType?: string
  jobTitleId?: string
  hireDateFrom?: string
  hireDateTo?: string
}

// ===== 유틸리티 타입 =====

export type DatabaseRow = Record<string, unknown>

export type QueryResult<T = DatabaseRow> = {
  rows: T[]
  rowCount: number
  command: string
}

// ===== 타입 가드 함수 =====

export function isDatabaseEmployee(row: unknown): row is DatabaseEmployee {
  return (
    typeof row === 'object' &&
    row !== null &&
    'id' in row &&
    'employee_id' in row &&
    'first_name' in row &&
    'last_name' in row &&
    'email' in row
  )
}

export function isDatabaseProject(row: unknown): row is DatabaseProject {
  return (
    typeof row === 'object' &&
    row !== null &&
    'id' in row &&
    'code' in row &&
    'title' in row &&
    'status' in row
  )
}

export function isDatabaseProjectMember(row: unknown): row is DatabaseProjectMember {
  return (
    typeof row === 'object' &&
    row !== null &&
    'id' in row &&
    'project_id' in row &&
    'employee_id' in row &&
    'participation_rate' in row
  )
}

export function isDatabaseProjectBudget(row: unknown): row is DatabaseProjectBudget {
  return (
    typeof row === 'object' &&
    row !== null &&
    'id' in row &&
    'project_id' in row &&
    'period_number' in row
  )
}
