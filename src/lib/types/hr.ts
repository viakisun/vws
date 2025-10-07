// 인사 관리 시스템 타입 정의

// ===== 기본 타입 =====
export type EmployeeId = string
export type DepartmentId = string
export type PositionId = string
export type ManagerId = string

// ===== 직원 관련 타입 =====
export interface Employee {
  id: EmployeeId
  employee_id: string // 사번
  first_name: string
  last_name: string
  name?: string // Computed field
  email: string
  phone: string
  address?: string
  department: string
  position: string
  job_title_id?: string // 직책 ID (optional)
  level?: EmployeeLevel
  employment_type: EmploymentType
  hire_date: string
  birth_date?: string
  salary?: number
  status: EmployeeStatus
  manager_id?: ManagerId
  profile_image?: string
  emergency_contact?: EmergencyContact
  personal_info?: PersonalInfo
  created_at?: string
  updated_at?: string
  termination_date?: string
}

export type EmployeeLevel = 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director'
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'intern'
export type EmployeeStatus = 'active' | 'inactive' | 'on-leave' | 'terminated'

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
}

export interface PersonalInfo {
  birthDate: string
  gender: 'male' | 'female' | 'other'
  nationality: string
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed'
}

// ===== 부서 관련 타입 =====
export interface Department {
  id: DepartmentId
  name: string
  description?: string
  manager_id?: ManagerId
  parent_department_id?: DepartmentId
  headcount?: number // T.O (정원)
  level?: number
  order?: number
  status?: 'active' | 'inactive'
  created_at?: string
  updated_at?: string
}

// ===== 직위 관련 타입 =====
export interface Position {
  id: PositionId
  name: string
  code?: string
  level?: number
  min_salary?: number
  max_salary?: number
  description?: string
  requirements?: string
  responsibilities?: string
  status?: 'active' | 'inactive'
  created_at?: string
  updated_at?: string
}

// ===== 근로 계약서 관련 타입 =====
export interface EmploymentContract {
  id: string
  employeeId: EmployeeId
  contractType: ContractType
  startDate: string
  endDate?: string
  salary: number
  workingHours: number
  probationPeriod?: number // 개월
  noticePeriod: number // 개월
  benefits: string[]
  terms: string
  status: ContractStatus
  createdAt: string
  updatedAt: string
}

export type ContractType = 'permanent' | 'fixed-term' | 'probation' | 'internship'
export type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated'

// ===== 직무기술서 관련 타입 =====
export interface JobDescription {
  id: string
  positionId: PositionId
  title: string
  summary: string
  responsibilities: string[]
  requirements: JobRequirement[]
  skills: string[]
  experience: string
  education: string
  benefits: string[]
  workingConditions: string
  createdAt: string
  updatedAt: string
}

export interface JobRequirement {
  skill: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  required: boolean
}

// ===== 임원 관련 타입 =====
export interface Executive {
  id: string
  employeeId: EmployeeId
  name: string
  position: string
  department: string
  email: string
  phone: string
  startDate: string
  endDate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ===== 직책 관련 타입 =====
export interface JobTitle {
  id: string
  name: string
  title: string
  level: number
  category: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ===== 성과 평가 관련 타입 =====
export interface PerformanceReview {
  id: string
  employeeId: EmployeeId
  reviewerId: ManagerId
  period: string // "2024-Q1", "2024-H1" 등
  startDate: string
  endDate: string
  goals: PerformanceGoal[]
  achievements: string[]
  strengths: string[]
  improvements: string[]
  overallRating: PerformanceRating
  competencyRatings: CompetencyRating[]
  feedback: string
  developmentPlan: string
  nextReviewDate: string
  status: ReviewStatus
  createdAt: string
  updatedAt: string
}

export interface PerformanceGoal {
  id: string
  description: string
  target: string
  actual?: string
  weight: number // 0-100
  achievement: number // 0-100
}

export interface CompetencyRating {
  competency: string
  rating: PerformanceRating
  comments: string
}

export type PerformanceRating = 'exceeds' | 'meets' | 'below' | 'unsatisfactory'
export type ReviewStatus = 'draft' | 'in-progress' | 'completed' | 'approved'

// ===== 교육 및 개발 관련 타입 =====
export interface TrainingProgram {
  id: string
  name: string
  description: string
  type: TrainingType
  duration: number // 시간
  cost: number
  provider: string
  requirements: string[]
  objectives: string[]
  content: string[]
  certification?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface EmployeeTraining {
  id: string
  employeeId: EmployeeId
  trainingId: string
  enrollmentDate: string
  completionDate?: string
  status: TrainingStatus
  score?: number
  certificate?: string
  feedback?: string
}

export type TrainingType = 'mandatory' | 'optional' | 'certification' | 'workshop' | 'seminar'
export type TrainingStatus = 'enrolled' | 'in-progress' | 'completed' | 'failed' | 'cancelled'

// ===== 급여 관련 타입 =====
export interface SalaryStructure {
  id: string
  employeeId: EmployeeId
  baseSalary: number
  allowances: Allowance[]
  deductions: Deduction[]
  effectiveDate: string
  status: 'active' | 'inactive' | 'pending'
  createdAt: string
  updatedAt: string
}

export interface Allowance {
  type: string // 'housing', 'transport', 'meal', 'overtime' 등
  amount: number
  description?: string
}

export interface Deduction {
  type: string // 'tax', 'insurance', 'pension' 등
  amount: number
  description?: string
}

// ===== 복리후생 관련 타입 =====
export interface Benefit {
  id: string
  name: string
  type: BenefitType
  description: string
  eligibility: string[]
  coverage: number // 0-100
  cost: number
  provider?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface EmployeeBenefit {
  id: string
  employeeId: EmployeeId
  benefitId: string
  enrollmentDate: string
  terminationDate?: string
  status: 'active' | 'inactive' | 'pending'
  notes?: string
}

export type BenefitType =
  | 'health'
  | 'dental'
  | 'vision'
  | 'life'
  | 'disability'
  | 'retirement'
  | 'vacation'
  | 'other'

// ===== 휴가 관련 타입 =====
export interface LeavePolicy {
  id: string
  name: string
  type: LeaveType
  eligibility: string[]
  daysPerYear: number
  carryOver: boolean
  maxCarryOver: number
  noticeRequired: number // 일
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LeaveRequest {
  id: string
  employeeId: EmployeeId
  leaveType: LeaveType
  startDate: string
  endDate: string
  days: number
  reason: string
  status: LeaveStatus
  approvedBy?: ManagerId
  approvedAt?: string
  comments?: string
  createdAt: string
  updatedAt: string
}

export type LeaveType =
  | 'annual'
  | 'sick'
  | 'personal'
  | 'maternity'
  | 'paternity'
  | 'bereavement'
  | 'unpaid'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

// ===== 조직도 관련 타입 =====
export interface OrganizationChart {
  id: string
  name: string
  structure: OrganizationNode
  version: number
  effectiveDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface OrganizationNode {
  id: string
  name: string
  type: 'department' | 'position' | 'employee'
  children?: OrganizationNode[]
  employeeId?: EmployeeId
  positionId?: PositionId
  departmentId?: DepartmentId
}

// ===== 검색 및 필터 관련 타입 =====
export interface EmployeeSearchFilter {
  query?: string
  department?: string
  position?: string
  status?: EmployeeStatus
  employmentType?: EmploymentType
  level?: EmployeeLevel
  hireDateFrom?: string
  hireDateTo?: string
}

export interface EmployeeSearchResult {
  employees: Employee[]
  total: number
  page: number
  limit: number
}

// ===== 통계 관련 타입 =====
export interface EmployeeStatistics {
  totalEmployees: number
  activeEmployees: number
  byDepartment: Record<string, number>
  byPosition: Record<string, number>
  byEmploymentType: Record<EmploymentType, number>
  byLevel: Record<EmployeeLevel, number>
  recentHires: number
  recentTerminations: number
  averageTenure: number
}

// ===== API 응답 관련 타입 =====
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
