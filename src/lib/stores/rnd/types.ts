// R&D 통합관리 시스템 도메인 모델 및 타입 정의

// ===== 기본 타입 정의 =====
export type UUID = string
export type DateString = string
export type Currency = 'KRW' | 'USD' | 'EUR'
export type HealthStatus = 'green' | 'amber' | 'red'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type DocumentStatus = 'draft' | 'submitted' | 'approved' | 'locked'
export type ProjectStatus = 'planning' | 'active' | 'completed'

// ===== 역할 및 권한 =====
export enum UserRole {
  RESEARCHER = 'RESEARCHER', // 연구원
  PM = 'PM', // PM(과제책임자)
  DEPARTMENT_HEAD = 'DEPARTMENT_HEAD', // 담당부서(구매·기술 등)
  MANAGEMENT_SUPPORT = 'MANAGEMENT_SUPPORT', // 경영지원(회계·총무)
  LAB_HEAD = 'LAB_HEAD', // 연구소장
  EXECUTIVE = 'EXECUTIVE', // 경영진
  AUDITOR = 'AUDITOR', // 감사/외부평가
}

export enum Permission {
  READ_ALL = 'READ_ALL',
  WRITE_ALL = 'WRITE_ALL',
  APPROVE_ALL = 'APPROVE_ALL',
  AUDIT_ALL = 'AUDIT_ALL',
  READ_PROJECT = 'READ_PROJECT',
  WRITE_PROJECT = 'WRITE_PROJECT',
  APPROVE_EXPENSE = 'APPROVE_EXPENSE',
  MANAGE_BUDGET = 'MANAGE_BUDGET',
  MANAGE_PERSONNEL = 'MANAGE_PERSONNEL',
  CREATE_REPORT = 'CREATE_REPORT',
  UPLOAD_DOCUMENT = 'UPLOAD_DOCUMENT',
  VIEW_AUDIT_LOG = 'VIEW_AUDIT_LOG',
}

// ===== 사람(Person) 도메인 =====
export interface Person {
  id: UUID
  name: string
  email: string
  phone?: string
  department: string
  position: string
  roleSet: UserRole[]
  active: boolean
  createdAt: DateString
  updatedAt: DateString
}

export interface Employment {
  id: UUID
  personId: UUID
  startDate: DateString
  endDate?: DateString
  position: string
  employmentType: 'full_time' | 'part_time' | 'contract' | 'intern'
  salary: number
  currency: Currency
  createdAt: DateString
}

export interface SalaryHistory {
  id: UUID
  personId: UUID
  effectiveFrom: DateString
  baseSalary: number
  currency: Currency
  reason: string
  approvedBy: UUID
  createdAt: DateString
}

export interface Skill {
  id: UUID
  name: string
  category: 'technical' | 'management' | 'language' | 'certification'
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  description?: string
}

export interface PersonSkill {
  personId: UUID
  skillId: UUID
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  acquiredDate: DateString
  certifiedBy?: string
}

// ===== 프로젝트(Project) 도메인 =====
export interface Project {
  id: UUID
  code: string
  title: string
  description: string
  sponsor: 'national' | 'private' | 'internal'
  sponsorName: string
  startDate: DateString
  endDate: DateString
  managerId: UUID
  status: ProjectStatus
  totalBudget: number
  currency: Currency
  createdAt: DateString
  updatedAt: DateString
}

export interface ProjectBudgetCategory {
  id: UUID
  projectId: UUID
  categoryCode: string
  plannedAmount: number
  currentAmount: number
  currency: Currency
  createdAt: DateString
  updatedAt: DateString
}

export interface Milestone {
  id: UUID
  projectId: UUID
  quarter: number
  title: string
  description: string
  kpis: Record<string, unknown>
  dueDate: DateString
  ownerId: UUID
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed'
  completedAt?: DateString
  createdAt: DateString
}

export interface ParticipationAssignment {
  id: UUID
  projectId: UUID
  personId: UUID
  dateFrom: DateString
  dateTo: DateString
  ratePct: number // 참여율 (0-100)
  role: string
  createdAt: DateString
  updatedAt: DateString
}

// ===== 예산 카테고리 =====
export interface BudgetCategory {
  id: UUID
  code: string
  name: string
  nameKo: string
  description: string
  requiredDocuments: RequiredDocument[]
  defaultWorkflow: WorkflowStep[]
  defaultSlaDays: number
  defaultOwners: string[]
  active: boolean
  createdAt: DateString
}

export interface RequiredDocument {
  type: string
  required: boolean
  templateId?: string
  description: string
}

export interface WorkflowStep {
  step: number
  role: UserRole
  action: 'approve' | 'review' | 'execute'
  required: boolean
  slaDays: number
}

// ===== 지출 및 증빙 =====
export interface ExpenseItem {
  id: UUID
  projectId: UUID
  categoryCode: string
  requesterId: UUID
  amount: number
  currency: Currency
  description: string
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'executed' | 'completed'
  deptOwner: string
  createdAt: DateString
  updatedAt: DateString
}

export interface Document {
  id: UUID
  expenseId?: UUID
  projectId?: UUID
  type: DocumentType
  filename: string
  originalFilename: string
  storageUrl: string
  sha256: string
  version: number
  signedBy?: UUID
  signedAt?: DateString
  verifiedBy?: UUID
  verifiedAt?: DateString
  meta: Record<string, unknown>
  createdAt: DateString
  createdBy?: UUID
  status?: string
}

export enum DocumentType {
  REQUISITION = 'REQUISITION', // 기안서
  QUOTE = 'QUOTE', // 견적서
  PURCHASE_ORDER = 'PURCHASE_ORDER', // 발주서
  TAX_INVOICE = 'TAX_INVOICE', // 세금계산서
  DELIVERY_NOTE = 'DELIVERY_NOTE', // 납품서
  INSPECTION_REPORT = 'INSPECTION_REPORT', // 검수보고서
  RECEIPT = 'RECEIPT', // 영수증
  MEETING_MINUTES = 'MEETING_MINUTES', // 회의록
  TRAVEL_REPORT = 'TRAVEL_REPORT', // 출장보고서
  PATENT_DOCUMENT = 'PATENT_DOCUMENT', // 특허서류
  RESEARCH_NOTE = 'RESEARCH_NOTE', // 연구노트
  DELIVERABLE = 'DELIVERABLE', // 산출물
  CONTRACT = 'CONTRACT', // 계약서
  OTHER = 'OTHER', // 기타
}

// ===== 결재 시스템 =====
export interface Approval {
  id: UUID
  subjectType: 'expense' | 'milestone' | 'document' | 'project'
  subjectId: UUID
  stepNo: number
  approverId: UUID
  decision: ApprovalStatus
  comment?: string
  decidedAt?: DateString
  createdAt: DateString
}

export interface ApprovalWorkflow {
  id: UUID
  subjectType: string
  subjectId: UUID
  currentStep: number
  totalSteps: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  createdAt: DateString
  updatedAt: DateString
}

// ===== 연구노트 =====
export interface ResearchNote {
  id: UUID
  projectId: UUID
  authorId: UUID
  weekOf: DateString
  title: string
  contentMd: string
  attachments: DocumentAttachment[]
  signedAt?: DateString
  verifiedBy?: UUID
  verifiedAt?: DateString
  createdAt: DateString
}

export interface DocumentAttachment {
  documentId: UUID
  description: string
}

// ===== 리포트 =====
export interface Report {
  id: UUID
  projectId: UUID
  type: 'weekly' | 'quarterly' | 'annual'
  periodStart: DateString
  periodEnd: DateString
  summaryJson: Record<string, unknown>
  fileUrl?: string
  generatedBy: UUID
  generatedAt: DateString
}

// ===== 업로드 번들 =====
export interface SubmissionBundle {
  id: UUID
  projectId: UUID
  period: string
  fileUrl: string
  manifestXml: string
  checksum: string
  createdBy: UUID
  createdAt: DateString
  status: 'generating' | 'ready' | 'uploaded' | 'failed'
}

// ===== 감사 로그 =====
export interface AuditLog {
  id: UUID
  actorId: UUID
  action: string
  entity: string
  entityId: UUID
  diff: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  createdAt: DateString
}

// ===== 헬스 인디케이터 =====
export interface HealthIndicator {
  id: UUID
  projectId: UUID
  schedule: number // 0-100
  budget: number // 0-100
  people: number // 0-100
  risk: number // 0-100
  overall: HealthStatus
  calculatedAt: DateString
}

// ===== 알림 및 SLA =====
export interface Alert {
  id: UUID
  type: 'warning' | 'error' | 'info' | 'success'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  entityType?: string
  entityId?: UUID
  recipients: UUID[]
  sentAt?: DateString
  readBy: UUID[]
  createdAt: DateString
}

export interface AlertRule {
  id: UUID
  name: string
  description: string
  condition: string // YAML 조건
  actions: string[] // 실행할 액션들
  active: boolean
  createdAt: DateString
}

// ===== 대체 인력 추천 =====
export interface ReplacementCandidate {
  id: UUID
  originalPersonId: UUID
  projectId: UUID
  candidateId: UUID
  skillMatch: number // 0-100
  availability: number // 0-100
  experience: number // 0-100
  recommendationScore: number // 0-100
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: DateString
}

// ===== KPI 및 성과 지표 =====
export interface KPI {
  id: UUID
  projectId: UUID
  name: string
  description: string
  target: number
  actual: number
  unit: string
  period: 'weekly' | 'monthly' | 'quarterly' | 'annual'
  calculatedAt: DateString
}

// ===== 통계 및 집계 =====
export interface ProjectStatistics {
  projectId: UUID
  totalBudget: number
  spentAmount: number
  remainingAmount: number
  utilizationRate: number
  totalPersonnel: number
  activePersonnel: number
  completedMilestones: number
  totalMilestones: number
  milestoneCompletionRate: number
  riskLevel: HealthStatus
  lastUpdated: DateString
}

export interface PersonnelStatistics {
  personId: UUID
  totalProjects: number
  activeProjects: number
  totalParticipationRate: number
  averageParticipationRate: number
  completedMilestones: number
  researchNotesSubmitted: number
  lastActivity: DateString
}

// ===== 검색 및 필터링 =====
export interface SearchFilter {
  query?: string
  projectId?: UUID
  personId?: UUID
  status?: string
  dateFrom?: DateString
  dateTo?: DateString
  category?: string
  role?: UserRole
  limit?: number
  offset?: number
}

export interface SearchResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// ===== API 응답 타입 =====
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: DateString
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// ===== 폼 데이터 타입 =====
export interface ProjectFormData {
  code: string
  title: string
  description: string
  sponsor: 'national' | 'private' | 'internal'
  sponsorName: string
  startDate: DateString
  endDate: DateString
  managerId: UUID
  totalBudget: number
  currency: Currency
}

export interface ExpenseFormData {
  projectId: UUID
  categoryCode: string
  amount: number
  currency: Currency
  description: string
  deptOwner: string
}

export interface MilestoneFormData {
  projectId: UUID
  quarter: number
  title: string
  description: string
  dueDate: DateString
  ownerId: UUID
  kpis: Record<string, unknown>
}

// ===== 대시보드 데이터 타입 =====
export interface DashboardData {
  projects: {
    total: number
    active: number
    completed: number
    atRisk: number
  }
  budget: {
    totalAllocated: number
    spent: number
    remaining: number
    utilizationRate: number
  }
  personnel: {
    total: number
    active: number
    onLeave: number
    utilizationRate: number
  }
  expenses: {
    pending: number
    approved: number
    rejected: number
    totalAmount: number
  }
  researchNotes: {
    submitted: number
    pending: number
    overdue: number
  }
  approvals: {
    pending: number
    completed: number
    overdue: number
  }
}

// ===== 모든 타입은 이미 위에서 export됨 =====
