// 사업·R&D·HR 통합관리 시스템 타입 정의

export interface Person {
	id: string;
	name: string;
	email: string;
	department: string;
	roleSet: string[]; // ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7']
	active: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface Employment {
	id: string;
	personId: string;
	startDate: string;
	endDate?: string;
	position: string;
	employmentType: 'full-time' | 'part-time' | 'contract' | 'intern';
	createdAt: string;
	updatedAt: string;
}

export interface SalaryHistory {
	id: string;
	personId: string;
	effectiveFrom: string;
	baseSalary: number;
	currency: string;
	createdAt: string;
	updatedAt: string;
}

export interface Project {
	id: string;
	code: string;
	title: string;
	sponsor: string;
	startDate: string;
	endDate: string;
	managerId: string;
	status: 'planning' | 'active' | 'completed' | 'cancelled' | 'on-hold';
	description?: string;
	createdAt: string;
	updatedAt: string;
}

export interface ProjectBudgetCategory {
	id: string;
	projectId: string;
	categoryCode: string;
	plannedAmount: number;
	currentAmount: number;
	currency: string;
	createdAt: string;
	updatedAt: string;
}

export interface Milestone {
	id: string;
	projectId: string;
	quarter: number;
	title: string;
	kpis: Record<string, any>;
	dueDate: string;
	ownerId: string;
	status: 'not-started' | 'in-progress' | 'completed' | 'delayed';
	deliverables: string[];
	createdAt: string;
	updatedAt: string;
}

export interface ParticipationAssignment {
	id: string;
	projectId: string;
	personId: string;
	dateFrom: string;
	dateTo: string;
	ratePct: number;
	createdAt: string;
	updatedAt: string;
}

export interface ExpenseItem {
	id: string;
	projectId: string;
	categoryCode: string;
	requesterId: string;
	amount: number;
	currency: string;
	status: 'draft' | 'pending-approval' | 'approved' | 'executed' | 'completed' | 'rejected';
	deptOwner: string;
	description?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Document {
	id: string;
	expenseId?: string;
	projectId?: string;
	type: 'requisition' | 'quote' | 'purchase-order' | 'tax-invoice' | 'delivery-note' | 'inspection-report' | 'receipt' | 'meeting-minutes' | 'travel-report' | 'patent-application' | 'research-note' | 'other';
	filename: string;
	storageUrl: string;
	sha256: string;
	version: number;
	signedBy?: string;
	signedAt?: string;
	meta: Record<string, any>;
	createdAt: string;
	updatedAt: string;
}

export interface Approval {
	id: string;
	subjectType: 'expense' | 'milestone' | 'participation' | 'document' | 'project';
	subjectId: string;
	stepNo: number;
	approverId: string;
	decision: 'pending' | 'approved' | 'rejected' | 'returned';
	decidedAt?: string;
	comment?: string;
	createdAt: string;
	updatedAt: string;
}

export interface ResearchNote {
	id: string;
	projectId: string;
	authorId: string;
	weekOf: string;
	title: string;
	contentMd: string;
	attachments: string[];
	signedAt?: string;
	verifiedBy?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Report {
	id: string;
	projectId: string;
	type: 'weekly' | 'quarterly';
	periodStart: string;
	periodEnd: string;
	summaryJson: Record<string, any>;
	fileUrl?: string;
	generatedAt: string;
	createdAt: string;
	updatedAt: string;
}

export interface SubmissionBundle {
	id: string;
	projectId: string;
	period: string;
	fileUrl: string;
	manifestXml: string;
	checksum: string;
	createdBy: string;
	createdAt: string;
	status: 'generating' | 'ready' | 'uploaded' | 'failed';
}

export interface AuditLog {
	id: string;
	actorId: string;
	action: string;
	entity: string;
	entityId: string;
	diff: Record<string, any>;
	at: string;
}

export interface BudgetCategoryMaster {
	categoryCode: string;
	nameKo: string;
	requiredDocs: Array<{
		type: string;
		required: boolean;
		templateId?: string;
	}>;
	defaultWorkflow: Record<string, any>;
	defaultSlaDays: number;
	defaultOwners: Record<string, any>;
}

export interface HealthIndicator {
	projectId: string;
	schedule: number; // 0-100
	budget: number; // 0-100
	people: number; // 0-100
	risk: number; // 0-100
	overall: 'green' | 'amber' | 'red';
	lastUpdated: string;
}

export interface Notification {
	id: string;
	userId: string;
	title: string;
	message: string;
	type: 'info' | 'warning' | 'error' | 'success';
	priority: 'low' | 'medium' | 'high' | 'urgent';
	read: boolean;
	actionUrl?: string;
	createdAt: string;
}

export interface SLAAlert {
	id: string;
	entityType: string;
	entityId: string;
	alertType: 'sla-warning' | 'sla-breach' | 'escalation';
	message: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	assignedTo: string[];
	status: 'active' | 'resolved' | 'escalated';
	createdAt: string;
	resolvedAt?: string;
}

export interface ReplacementRecommendation {
	id: string;
	projectId: string;
	departingPersonId: string;
	recommendedPersons: Array<{
		personId: string;
		score: number;
		reason: string;
		availability: number;
	}>;
	status: 'pending' | 'approved' | 'rejected';
	approvedBy?: string;
	approvedAt?: string;
	createdAt: string;
}
