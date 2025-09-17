export type ProjectStatus = '정상' | '진행중' | '지연' | '위험' | '완료';

export interface Project {
	id: string;
	name: string;
	status: ProjectStatus;
	budgetKRW: number;
	spentKRW: number;
	progressPct: number; // 0-100
	startDate: string; // ISO
	dueDate: string; // ISO
	organization: string;
	personnelIds: string[];
	risks: Risk[];
}

export interface Risk {
	id: string;
	severity: '낮음' | '보통' | '높음' | '긴급';
	description: string;
	impact: '일정' | '예산' | '품질' | '범위';
	status: '열림' | '완화' | '해결';
}

export interface Personnel {
	id: string;
	name: string;
	role: string; // 직급/역할
	organization: string; // 부서
	employmentType: '연봉제' | '프로젝트단가';
	status: '재직' | '신규' | '퇴사예정';
	annualSalaryKRW?: number;
	dailyRateKRW?: number;
	participations: Participation[];
}

export interface Participation {
	projectId: string;
	allocationPct: number; // 0-100
	startDate: string;
	endDate?: string;
	quarterlyBreakdown?: Record<string, number>; // e.g., { '2025-Q3': 1_200_000 }
}

export type ExpenseCategory = '인건비' | '재료비' | '연구활동비' | '여비';

export interface BudgetAllocation {
	year: number;
	quarter: 1 | 2 | 3 | 4;
	category: ExpenseCategory;
	amountKRW: number;
	cashKRW: number;
	inKindKRW: number;
}

export interface ExpenseDocument {
	id: string;
	projectId: string;
	category: ExpenseCategory;
	quarter: 1 | 2 | 3 | 4;
	status: '대기' | '승인' | '반려';
	title: string;
	amountKRW: number;
	attachments: number;
	createdAt: string;
	appRoute: string[]; // 결재선
}

// 추가 타입 정의
export interface AuditLog {
	id: string;
	actorId: string;
	action: string;
	entity: string;
	entityId: string;
	ipAddress: string;
	userAgent: string;
	timestamp: string;
	details?: Record<string, any>;
}

export interface Person {
	id: string;
	name: string;
	email: string;
	phone?: string;
	department?: string;
	position?: string;
	status: 'active' | 'inactive';
	createdAt: string;
	updatedAt: string;
}

export interface Document {
	id: string;
	title: string;
	type: string;
	content: string;
	authorId: string;
	status: 'draft' | 'published' | 'archived';
	createdAt: string;
	updatedAt: string;
	tags?: string[];
}

export interface BudgetCategoryMaster {
	id: string;
	name: string;
	code: string;
	description: string;
	parentId?: string;
	level: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface ExpenseItem {
	id: string;
	projectId: string;
	category: string;
	description: string;
	amount: number;
	currency: string;
	date: string;
	status: 'pending' | 'approved' | 'rejected';
	createdBy: string;
	createdAt: string;
	updatedAt: string;
}

// 추가 타입들
export interface Approval {
	id: string;
	entityType: string;
	entityId: string;
	status: 'pending' | 'approved' | 'rejected';
	requestedBy: string;
	requestedAt: string;
	approvedBy?: string;
	approvedAt?: string;
	rejectionReason?: string;
	notes?: string;
}

export interface Employment {
	id: string;
	employeeId: string;
	companyId: string;
	position: string;
	department: string;
	employmentType: 'full-time' | 'part-time' | 'contract' | 'intern';
	startDate: string;
	endDate?: string;
	salary: number;
	status: 'active' | 'inactive' | 'terminated';
	createdAt: string;
	updatedAt: string;
}

export interface SalaryHistory {
	id: string;
	employeeId: string;
	effectiveDate: string;
	salary: number;
	currency: string;
	changeReason: string;
	approvedBy: string;
	createdAt: string;
}

export interface ProjectBudgetCategory {
	id: string;
	projectId: string;
	categoryId: string;
	budgetAmount: number;
	spentAmount: number;
	currency: string;
	createdAt: string;
	updatedAt: string;
}

export interface Milestone {
	id: string;
	projectId: string;
	title: string;
	description: string;
	dueDate: string;
	completedDate?: string;
	status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
	assignedTo?: string;
	createdAt: string;
	updatedAt: string;
}

export interface ParticipationAssignment {
	id: string;
	projectId: string;
	employeeId: string;
	allocationPercentage: number;
	startDate: string;
	endDate?: string;
	role: string;
	status: 'active' | 'inactive';
	createdAt: string;
	updatedAt: string;
}

