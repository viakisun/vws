// ===== 기본 타입 정의 =====
export type ProjectStatus = '정상' | '진행중' | '지연' | '위험' | '완료'

// ===== 핵심 엔티티 타입 =====
export interface Person {
  id: string
  name: string
  email: string
  phone?: string
  department?: string
  position?: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
  roleSet?: string[]
  active?: boolean
}

export interface Project {
  id: string
  code: string
  title: string
  description?: string
  sponsor?: string
  sponsorName?: string
  sponsorType: 'government' | 'private' | 'internal'
  startDate?: string
  endDate?: string
  managerId?: string
  managerName?: string
  status: 'planning' | 'active' | 'completed' | 'cancelled' | 'suspended'
  budgetTotal?: number
  budgetCurrency: string
  researchType?: 'basic' | 'applied' | 'development'
  technologyArea?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  memberCount?: number
  totalParticipationRate?: number
  createdAt: string
  updatedAt: string
  // 추가 속성들 (기존 호환성 유지)
  name?: string
  budgetKRW?: number
  spentKRW?: number
  progressPct?: number
  dueDate?: string
  organization?: string
  personnelIds?: string[]
  risks?: Risk[]
}

export interface Risk {
  id: string
  severity: '낮음' | '보통' | '높음' | '긴급'
  description: string
  impact: '일정' | '예산' | '품질' | '범위'
  status: '열림' | '완화' | '해결'
  // 추가 속성들
  projectId?: string
  riskType?: 'technical' | 'schedule' | 'budget' | 'resource' | 'external'
  title?: string
  probability?: 'low' | 'medium' | 'high'
  mitigationPlan?: string
  ownerId?: string
  ownerName?: string
  createdAt?: string
  updatedAt?: string
}

export interface Personnel {
  id: string
  name: string
  role: string // 직급/역할
  organization: string // 부서
  employmentType: '연봉제' | '프로젝트단가'
  status: '재직' | '신규' | '퇴사예정'
  annualSalaryKRW?: number
  dailyRateKRW?: number
  participations: Participation[]
}

export interface Participation {
  projectId: string
  allocationPct: number // 0-100
  startDate: string
  endDate?: string
  quarterlyBreakdown?: Record<string, number> // e.g., { '2025-Q3': 1_200_000 }
}

// ===== 프로젝트 관리 관련 타입 =====
export interface ProjectMember {
  id: string
  projectId: string
  employeeId: string
  employeeName?: string
  department?: string
  role: string
  startDate: string
  endDate?: string
  participationRate: number
  monthlySalary?: number
  status: 'active' | 'inactive' | 'completed' | 'withdrawn'
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ProjectBudget {
  id: string
  projectId: string
  fiscalYear: number
  totalBudget: number
  personnelCost: number
  materialCost: number
  researchActivityCost: number
  indirectCost: number
  otherCost: number
  spentAmount: number
  currency: string
  status: 'planned' | 'approved' | 'executing' | 'completed'
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ParticipationRate {
  id: string
  employeeId: string
  employeeName?: string
  projectId: string
  projectName?: string
  participationRate: number
  startDate: string
  endDate?: string
  status: 'active' | 'inactive' | 'completed'
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface ParticipationRateHistory {
  id: string
  employeeId: string
  employeeName?: string
  projectId: string
  projectName?: string
  oldRate?: number
  newRate: number
  changeReason:
    | 'project_start'
    | 'project_end'
    | 'manual_adjustment'
    | 'employee_leave'
    | 'employee_join'
  changeDate: string
  changedBy?: string
  changedByName?: string
  notes?: string
  createdAt: string
}

export interface ProjectMilestone {
  id: string
  projectId: string
  title: string
  description?: string
  milestoneDate: string
  status: 'pending' | 'completed' | 'delayed' | 'cancelled'
  completionDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ProjectRisk {
  id: string
  projectId: string
  riskType: 'technical' | 'schedule' | 'budget' | 'resource' | 'external'
  title: string
  description?: string
  probability: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  status: 'open' | 'mitigated' | 'closed'
  mitigationPlan?: string
  ownerId?: string
  ownerName?: string
  createdAt: string
  updatedAt: string
}

// ===== 예산 및 비용 관련 타입 =====
export type ExpenseCategory = '인건비' | '재료비' | '연구활동비' | '여비'

export interface BudgetAllocation {
  year: number
  quarter: 1 | 2 | 3 | 4
  category: ExpenseCategory
  amountKRW: number
  cashKRW: number
  inKindKRW: number
}

export interface BudgetCategory {
  id: string
  code: string
  name: string
  description?: string
  parentCategoryId?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  // 추가 속성들
  categoryCode?: string
  nameKo?: string
  requiredDocs?: Document[]
  defaultWorkflow?: {
    steps: string[]
    sla: number
  }
  defaultSlaDays?: number
  defaultOwners?: {
    primary: string
    secondary: string
  }
}

export interface BudgetCategoryMaster {
  id: string
  name: string
  code: string
  description: string
  parentId?: string
  level: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  categoryCode?: string
  nameKo?: string
}

export interface ProjectBudgetCategory {
  id: string
  projectId: string
  categoryId: string
  budgetAmount: number
  spentAmount: number
  currency: string
  createdAt: string
  updatedAt: string
}

export interface ExpenseItem {
  id: string
  expenseId: string
  category: string
  description: string
  amount: number
  currency: string
  receiptPath?: string
  createdAt: string
  updatedAt: string
  // 추가 속성들
  status?: 'pending' | 'approved' | 'rejected' | 'completed'
  projectId?: string
  date?: string
  createdBy?: string
}

export interface ExpenseDocument {
  id: string
  projectId: string
  category: ExpenseCategory
  quarter: 1 | 2 | 3 | 4
  status: '대기' | '승인' | '반려'
  title: string
  amountKRW: number
  attachments: number
  createdAt: string
  appRoute: string[] // 결재선
}

// ===== 문서 및 승인 관련 타입 =====
export interface Document {
  id: string
  title: string
  type: string
  content?: string
  filePath?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  // 추가 속성들
  required?: boolean
  templateId?: string
  authorId?: string
  status?: 'draft' | 'published' | 'archived'
  tags?: string[]
  projectId?: string
  documentType?: string
}

export interface Approval {
  id: string
  entityType: string
  entityId: string
  status: 'pending' | 'approved' | 'rejected'
  requestedBy: string
  approvedBy?: string
  requestedAt: string
  approvedAt?: string
  notes?: string
  // 추가 속성들
  decision?: 'approve' | 'reject' | 'pending'
  createdAt?: string
  updatedAt?: string
  subjectType?: string
  subjectId?: string
  rejectionReason?: string
}

// ===== 고용 및 급여 관련 타입 =====
export interface Employment {
  id: string
  employeeId: string
  companyId?: string
  position: string
  department: string
  employmentType: 'full-time' | 'part-time' | 'contract' | 'intern'
  startDate: string
  endDate?: string
  salary: number
  status: 'active' | 'inactive' | 'terminated'
  createdAt: string
  updatedAt: string
}

export interface SalaryHistory {
  id: string
  employeeId: string
  effectiveDate: string
  salary: number
  currency: string
  changeReason: string
  approvedBy: string
  createdAt: string
  // 추가 속성들
  personId?: string
  effectiveFrom?: string
  baseSalary?: number
  updatedAt?: string
}

// ===== 마일스톤 및 참여 관련 타입 =====
export interface Milestone {
  id: string
  projectId: string
  title: string
  description?: string
  dueDate: string
  status: 'pending' | 'completed' | 'overdue'
  completedAt?: string
  createdAt: string
  updatedAt: string
  // 추가 속성들
  deliverables?: unknown[]
  kpis?: unknown[]
  quarter?: number
  assignedTo?: string
  completedDate?: string
}

export interface ParticipationAssignment {
  id: string
  employeeId: string
  projectId: string
  participationRate: number
  startDate: string
  endDate?: string
  role: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
  // 추가 속성들
  personId?: string
  dateFrom?: string
  dateTo?: string
  ratePct?: number
  allocationPercentage?: number
}

// ===== 연구 및 보고서 관련 타입 =====
export interface ResearchNote {
  id: string
  projectId: string
  title: string
  content: string
  authorId: string
  authorName: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface Report {
  id: string
  title: string
  type: string
  content: string
  generatedBy: string
  generatedAt: string
  parameters?: Record<string, unknown>
}

export interface SubmissionBundle {
  id: string
  projectId: string
  categoryId?: string
  title: string
  description?: string
  documents: Document[]
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'
  submittedBy: string
  submittedAt?: string
  reviewedBy?: string
  reviewedAt?: string
  comments?: string
  createdAt: string
  updatedAt: string
  // 추가 속성들
  submissionType?: string
}

// ===== 알림 및 모니터링 관련 타입 =====
export interface HealthIndicator {
  id: string
  projectId: string
  indicatorType: string
  value: number
  threshold: number
  status: 'healthy' | 'warning' | 'critical'
  measuredAt: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  read: boolean
  createdAt: string
  actionUrl?: string
}

export interface SLAAlert {
  id: string
  entityType: string
  entityId: string
  alertType: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  triggeredAt: string
  resolvedAt?: string
  assignedTo?: string
}

export interface ReplacementRecommendation {
  id: string
  entityType: string
  entityId: string
  recommendationType: string
  reason: string
  suggestedReplacement: string
  confidence: number
  createdAt: string
}

// ===== 감사 및 보안 관련 타입 =====
export interface AuditLog {
  id: string
  actorId: string
  action: string
  entity: string
  entityId: string
  diff: { old: any; new: any }
  at: string
  metadata?: Record<string, unknown>
  // 추가 속성들
  ipAddress?: string
  userAgent?: string
  timestamp?: string
  details?: Record<string, unknown>
}

// ===== 대시보드 및 요약 관련 타입 =====
export interface ProjectSummary {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalBudget: number
  currentYearBudget: number
  totalMembers: number
  overParticipationEmployees: number
}

export interface EmployeeParticipationSummary {
  employeeId: string
  employeeName: string
  department: string
  activeProjects: number
  totalParticipationRate: number
  participationStatus: 'OVER_LIMIT' | 'FULL' | 'AVAILABLE'
  projects: Array<{
    projectId: string
    projectName: string
    participationRate: number
    role: string
  }>
}

export interface BudgetSummaryByYear {
  fiscalYear: number
  projectCount: number
  totalBudget: number
  totalPersonnelCost: number
  totalMaterialCost: number
  totalResearchActivityCost: number
  totalIndirectCost: number
  totalOtherCost: number
  totalSpentAmount: number
}

// ===== API 요청/응답 타입 =====
export interface CreateProjectRequest {
  code: string
  title: string
  description?: string
  sponsor?: string
  sponsorName?: string
  sponsorType: 'government' | 'private' | 'internal'
  startDate?: string
  endDate?: string
  managerId?: string
  budgetTotal?: number
  researchType?: 'basic' | 'applied' | 'development'
  technologyArea?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  id: string
}

export interface AddProjectMemberRequest {
  projectId: string
  employeeId: string
  role: string
  startDate: string
  endDate?: string
  participationRate: number
  monthlySalary?: number
  notes?: string
}

export interface UpdateProjectMemberRequest extends Partial<AddProjectMemberRequest> {
  id: string
}

export interface CreateProjectBudgetRequest {
  projectId: string
  fiscalYear: number
  totalBudget: number
  personnelCost?: number
  materialCost?: number
  researchActivityCost?: number
  indirectCost?: number
  otherCost?: number
  notes?: string
}

export interface UpdateProjectBudgetRequest extends Partial<CreateProjectBudgetRequest> {
  id: string
}

export interface UpdateParticipationRateRequest {
  employeeId: string
  projectId: string
  participationRate: number
  changeReason:
    | 'project_start'
    | 'project_end'
    | 'manual_adjustment'
    | 'employee_leave'
    | 'employee_join'
  notes?: string
}

// ===== 필터링 및 검색 타입 =====
export interface ProjectFilters {
  status?: string
  sponsorType?: string
  researchType?: string
  priority?: string
  managerId?: string
  startDateFrom?: string
  startDateTo?: string
  search?: string
}

export interface ParticipationRateFilters {
  employeeId?: string
  projectId?: string
  status?: string
  participationStatus?: 'OVER_LIMIT' | 'FULL' | 'AVAILABLE'
  department?: string
}

// ===== 통계 및 차트 데이터 타입 =====
export interface ProjectStatusStats {
  planning: number
  active: number
  completed: number
  cancelled: number
  suspended: number
}

export interface BudgetDistributionStats {
  personnelCost: number
  materialCost: number
  researchActivityCost: number
  indirectCost: number
  otherCost: number
}

export interface ParticipationRateStats {
  overLimit: number
  full: number
  available: number
  averageRate: number
}

// ===== 알림 및 경고 타입 =====
export interface ParticipationRateAlert {
  employeeId: string
  employeeName: string
  totalParticipationRate: number
  excessRate: number
  projects: Array<{
    projectId: string
    projectName: string
    participationRate: number
  }>
}

export interface BudgetAlert {
  projectId: string
  projectName: string
  fiscalYear: number
  alertType: 'over_budget' | 'near_budget' | 'under_utilized'
  message: string
  amount?: number
  percentage?: number
}

// ===== 데이터베이스 타입 =====
export interface DatabaseUser {
  id: string
  email: string
  name: string
  department?: string
  position?: string
  role: string
  is_active: boolean
  last_login?: Date
  created_at: Date
  updated_at: Date
  password_hash?: string
  [key: string]: unknown
}

export interface DatabaseCompany {
  id: string
  name: string
  type: string
  industry?: string
  status: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  website?: string
  revenue?: number
  employees?: number
  notes?: string
  tags: unknown[]
  created_at: Date
  updated_at: Date
  [key: string]: unknown
}

export interface DatabaseProject {
  id: string
  code: string
  title: string
  description?: string
  sponsor?: string
  sponsor_type?: string
  start_date?: Date
  end_date?: Date
  manager_id?: string
  status: string
  budget_total?: number
  created_at: Date
  updated_at: Date
  [key: string]: unknown
}

// ===== HR 관련 타입 =====
export interface Employee {
  id: string
  employee_id: string
  first_name: string
  last_name: string
  middle_name?: string
  email: string
  phone?: string
  department: string
  position: string
  job_title?: string
  job_title_name?: string
  employment_type: 'full-time' | 'part-time' | 'contract' | 'intern'
  hire_date: string
  termination_date?: string
  status: 'active' | 'inactive' | 'terminated'
  salary?: number
  manager_id?: string
  created_at: string
  updated_at: string
}

export interface Department {
  id: string
  name: string
  description?: string
  manager_id?: string
  budget?: number
  max_employees?: number
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Position {
  id: string
  title: string
  name?: string
  department_id: string
  department?: string
  level: number
  description?: string
  requirements?: string[]
  salary_range?: {
    min: number
    max: number
  }
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Executive {
  id: string
  name: string
  position: string
  email: string
  phone?: string
  department: string
  level: 'C-Level' | 'VP' | 'Director' | 'Manager'
  job_title_name?: string
  job_title_level?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface JobTitle {
  id: string
  title: string
  name?: string
  level: string
  department: string
  category?: string
  description?: string
  requirements?: string[]
  is_active?: boolean
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

// ===== 타입 별칭 =====
// BudgetCategoryMaster와 ProjectBudgetCategory는 BudgetCategory와 동일
export type BudgetCategoryMaster = BudgetCategory
export type ProjectBudgetCategory = BudgetCategory
