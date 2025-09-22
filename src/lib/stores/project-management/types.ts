// Project Management System Types
// 프로젝트 관리 시스템을 위한 타입 정의

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
}

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

// 대시보드용 요약 정보
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

// API 요청/응답 타입
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

// 필터링 및 검색 타입
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

// 통계 및 차트 데이터 타입
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

// 알림 및 경고 타입
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

// 감사 및 보안 관련 타입
export interface AuditLog {
	id: string
	actorId: string
	action: string
	entity: string
	entityId: string
	diff: { old: any; new: any }
	at: string
	metadata?: Record<string, any>
}

export interface Person {
	id: string
	name: string
	email: string
	department: string
	roleSet: string[]
	active: boolean
	createdAt: string
	updatedAt: string
}

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
}

export interface Employment {
	id: string
	employeeId: string
	startDate: string
	endDate?: string
	position: string
	department: string
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
	changeReason: string
	createdAt: string
}

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
}

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
	parameters?: Record<string, any>
}

// BudgetCategoryMaster는 BudgetCategory의 별칭
export type BudgetCategoryMaster = BudgetCategory

// ===== 제출 번들 타입 =====
export interface SubmissionBundle {
	id: string
	projectId: string
	categoryId: string
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
}

// ProjectBudgetCategory는 BudgetCategory의 별칭
export type ProjectBudgetCategory = BudgetCategory
