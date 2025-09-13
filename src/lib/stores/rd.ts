import { writable } from 'svelte/store';
import { formatCurrency, formatDate } from '$lib/utils/format';

// 타입 정의
export interface Employee {
	id: string;
	name: string;
	department: string;
	position: string;
	hireDate: string;
	salary: number;
	status: 'active' | 'inactive' | 'resigned';
	skills: string[];
	email: string;
	phone: string;
}

export interface ProjectParticipation {
	id: string;
	employeeId: string;
	projectId: string;
	startDate: string;
	endDate: string;
	participationRate: number; // 0-100%
	monthlySalary: number;
	role: string;
	status: 'active' | 'completed' | 'cancelled';
}

export interface Project {
	id: string;
	name: string;
	description: string;
	startDate: string;
	endDate: string;
	budget: number;
	status: 'planning' | 'active' | 'completed' | 'cancelled' | 'on-hold';
	manager: string;
	department: string;
	category: 'basic-research' | 'applied-research' | 'development' | 'pilot';
	priority: 'high' | 'medium' | 'low';
	client?: string;
	contractNumber?: string;
}

export interface RDBudget {
	id: string;
	projectId: string;
	category: 'personnel' | 'materials' | 'equipment' | 'travel' | 'other';
	subcategory: string;
	plannedAmount: number;
	actualAmount: number;
	description: string;
	year: number;
	month: number;
}

export interface DocumentTemplate {
	id: string;
	name: string;
	category: 'proposal' | 'task-order' | 'result-report' | 'inspection' | 'travel' | 'material' | 'other';
	requiredFields: string[];
	description: string;
	projectType?: string; // 특정 프로젝트 타입에만 적용
}

export interface DocumentSubmission {
	id: string;
	projectId: string;
	templateId: string;
	title: string;
	status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'revision-required';
	submittedBy: string;
	submittedAt: string;
	approvedBy?: string;
	approvedAt?: string;
	fileUrl?: string;
	content?: string; // 온라인 작성된 내용
	rejectionReason?: string;
}

export interface CostAnalysis {
	projectId: string;
	month: string;
	personnelCost: number;
	materialCost: number;
	equipmentCost: number;
	travelCost: number;
	otherCost: number;
	totalCost: number;
	budgetUtilization: number; // 예산 대비 사용률
}

export interface Recommendation {
	id: string;
	type: 'hiring' | 'participation-adjustment' | 'budget-reallocation' | 'timeline-adjustment';
	priority: 'high' | 'medium' | 'low';
	title: string;
	description: string;
	impact: string;
	estimatedCost?: number;
	estimatedBenefit?: number;
	status: 'pending' | 'approved' | 'rejected' | 'implemented';
	createdAt: string;
}

// 목업 데이터
const mockEmployees: Employee[] = [
	{
		id: 'emp-001',
		name: '김연구',
		department: 'R&D',
		position: '선임연구원',
		hireDate: '2022-03-01',
		salary: 6000000,
		status: 'active',
		skills: ['AI/ML', 'Python', 'Data Analysis'],
		email: 'kim.rd@company.com',
		phone: '010-1234-5678'
	},
	{
		id: 'emp-002',
		name: '박개발',
		department: 'R&D',
		position: '연구원',
		hireDate: '2023-01-15',
		salary: 4500000,
		status: 'active',
		skills: ['Frontend', 'React', 'TypeScript'],
		email: 'park.dev@company.com',
		phone: '010-2345-6789'
	},
	{
		id: 'emp-003',
		name: '이분석',
		department: 'R&D',
		position: '주임연구원',
		hireDate: '2021-07-01',
		salary: 5500000,
		status: 'active',
		skills: ['Statistics', 'R', 'Machine Learning'],
		email: 'lee.analysis@company.com',
		phone: '010-3456-7890'
	},
	{
		id: 'emp-004',
		name: '최실험',
		department: 'R&D',
		position: '연구원',
		hireDate: '2023-06-01',
		salary: 4000000,
		status: 'active',
		skills: ['Lab Work', 'Chemistry', 'Data Collection'],
		email: 'choi.lab@company.com',
		phone: '010-4567-8901'
	},
	{
		id: 'emp-005',
		name: '정관리',
		department: 'R&D',
		position: '연구팀장',
		hireDate: '2020-01-01',
		salary: 8000000,
		status: 'active',
		skills: ['Project Management', 'Team Leadership', 'Strategic Planning'],
		email: 'jung.manager@company.com',
		phone: '010-5678-9012'
	}
];

const mockProjects: Project[] = [
	{
		id: 'proj-001',
		name: 'AI 기반 스마트팩토리 솔루션 개발',
		description: '제조업체를 위한 AI 기반 품질관리 및 예측정비 시스템 개발',
		startDate: '2024-01-01',
		endDate: '2024-12-31',
		budget: 500000000,
		status: 'active',
		manager: '정관리',
		department: 'R&D',
		category: 'development',
		priority: 'high',
		client: 'ABC 제조',
		contractNumber: 'CON-2024-001'
	},
	{
		id: 'proj-002',
		name: '차세대 배터리 기술 연구',
		description: '고용량 리튬이온 배터리 기술 개발 및 상용화 연구',
		startDate: '2024-03-01',
		endDate: '2025-02-28',
		budget: 800000000,
		status: 'active',
		manager: '김연구',
		department: 'R&D',
		category: 'basic-research',
		priority: 'high',
		client: '정부과제',
		contractNumber: 'GOV-2024-003'
	},
	{
		id: 'proj-003',
		name: 'IoT 센서 네트워크 최적화',
		description: '대규모 IoT 센서 네트워크의 에너지 효율성 및 통신 최적화',
		startDate: '2024-02-01',
		endDate: '2024-11-30',
		budget: 300000000,
		status: 'active',
		manager: '박개발',
		department: 'R&D',
		category: 'applied-research',
		priority: 'medium',
		client: 'XYZ 테크',
		contractNumber: 'CON-2024-002'
	},
	{
		id: 'proj-004',
		name: '데이터 분석 플랫폼 구축',
		description: '빅데이터 분석을 위한 통합 플랫폼 개발',
		startDate: '2024-04-01',
		endDate: '2024-10-31',
		budget: 200000000,
		status: 'planning',
		manager: '이분석',
		department: 'R&D',
		category: 'development',
		priority: 'medium',
		client: '내부 프로젝트'
	}
];

const mockParticipations: ProjectParticipation[] = [
	// 김연구 - AI 스마트팩토리 (50%), 배터리 연구 (30%)
	{
		id: 'part-001',
		employeeId: 'emp-001',
		projectId: 'proj-001',
		startDate: '2024-01-01',
		endDate: '2024-12-31',
		participationRate: 50,
		monthlySalary: 6000000,
		role: 'AI 알고리즘 개발',
		status: 'active'
	},
	{
		id: 'part-002',
		employeeId: 'emp-001',
		projectId: 'proj-002',
		startDate: '2024-03-01',
		endDate: '2025-02-28',
		participationRate: 30,
		monthlySalary: 6000000,
		role: '데이터 분석',
		status: 'active'
	},
	// 박개발 - AI 스마트팩토리 (40%), IoT 센서 (60%)
	{
		id: 'part-003',
		employeeId: 'emp-002',
		projectId: 'proj-001',
		startDate: '2024-01-01',
		endDate: '2024-12-31',
		participationRate: 40,
		monthlySalary: 4500000,
		role: '프론트엔드 개발',
		status: 'active'
	},
	{
		id: 'part-004',
		employeeId: 'emp-002',
		projectId: 'proj-003',
		startDate: '2024-02-01',
		endDate: '2024-11-30',
		participationRate: 60,
		monthlySalary: 4500000,
		role: '시스템 개발',
		status: 'active'
	},
	// 이분석 - 배터리 연구 (70%), 데이터 플랫폼 (30%)
	{
		id: 'part-005',
		employeeId: 'emp-003',
		projectId: 'proj-002',
		startDate: '2024-03-01',
		endDate: '2025-02-28',
		participationRate: 70,
		monthlySalary: 5500000,
		role: '통계 분석',
		status: 'active'
	},
	{
		id: 'part-006',
		employeeId: 'emp-003',
		projectId: 'proj-004',
		startDate: '2024-04-01',
		endDate: '2024-10-31',
		participationRate: 30,
		monthlySalary: 5500000,
		role: '데이터 분석',
		status: 'active'
	},
	// 최실험 - 배터리 연구 (50%)
	{
		id: 'part-007',
		employeeId: 'emp-004',
		projectId: 'proj-002',
		startDate: '2024-03-01',
		endDate: '2025-02-28',
		participationRate: 50,
		monthlySalary: 4000000,
		role: '실험 및 데이터 수집',
		status: 'active'
	},
	// 정관리 - 모든 프로젝트 관리 (각 20%)
	{
		id: 'part-008',
		employeeId: 'emp-005',
		projectId: 'proj-001',
		startDate: '2024-01-01',
		endDate: '2024-12-31',
		participationRate: 20,
		monthlySalary: 8000000,
		role: '프로젝트 관리',
		status: 'active'
	},
	{
		id: 'part-009',
		employeeId: 'emp-005',
		projectId: 'proj-002',
		startDate: '2024-03-01',
		endDate: '2025-02-28',
		participationRate: 20,
		monthlySalary: 8000000,
		role: '프로젝트 관리',
		status: 'active'
	},
	{
		id: 'part-010',
		employeeId: 'emp-005',
		projectId: 'proj-003',
		startDate: '2024-02-01',
		endDate: '2024-11-30',
		participationRate: 20,
		monthlySalary: 8000000,
		role: '프로젝트 관리',
		status: 'active'
	}
];

const mockDocumentTemplates: DocumentTemplate[] = [
	{
		id: 'template-001',
		name: '연구과제 기안서',
		category: 'proposal',
		requiredFields: ['과제명', '연구목표', '연구내용', '예산계획', '일정계획', '연구진'],
		description: '새로운 연구과제 제안을 위한 기안서',
		projectType: 'all'
	},
	{
		id: 'template-002',
		name: '과업지시서',
		category: 'task-order',
		requiredFields: ['과업명', '담당자', '과업내용', '완료기한', '산출물'],
		description: '연구원에게 과업을 지시하는 문서',
		projectType: 'all'
	},
	{
		id: 'template-003',
		name: '연구결과보고서',
		category: 'result-report',
		requiredFields: ['연구목표', '연구방법', '연구결과', '결론', '향후계획'],
		description: '연구 결과를 정리한 보고서',
		projectType: 'all'
	},
	{
		id: 'template-004',
		name: '검수보고서',
		category: 'inspection',
		requiredFields: ['검수대상', '검수내용', '검수결과', '개선사항'],
		description: '연구 결과물에 대한 검수 보고서',
		projectType: 'all'
	},
	{
		id: 'template-005',
		name: '출장보고서',
		category: 'travel',
		requiredFields: ['출장목적', '출장지', '출장기간', '출장내용', '경비'],
		description: '연구 관련 출장 보고서',
		projectType: 'all'
	},
	{
		id: 'template-006',
		name: '재료비 사용보고서',
		category: 'material',
		requiredFields: ['재료명', '수량', '단가', '총액', '사용목적', '구매처'],
		description: '연구용 재료 구매 및 사용 보고서',
		projectType: 'all'
	}
];

const mockDocumentSubmissions: DocumentSubmission[] = [
	{
		id: 'doc-001',
		projectId: 'proj-001',
		templateId: 'template-001',
		title: 'AI 스마트팩토리 솔루션 개발 기안서',
		status: 'approved',
		submittedBy: '정관리',
		submittedAt: '2024-01-15',
		approvedBy: '이사장',
		approvedAt: '2024-01-20',
		fileUrl: '/documents/proj-001-proposal.pdf'
	},
	{
		id: 'doc-002',
		projectId: 'proj-001',
		templateId: 'template-002',
		title: 'AI 알고리즘 개발 과업지시서',
		status: 'approved',
		submittedBy: '정관리',
		submittedAt: '2024-01-25',
		approvedBy: '김연구',
		approvedAt: '2024-01-26',
		fileUrl: '/documents/proj-001-task-001.pdf'
	},
	{
		id: 'doc-003',
		projectId: 'proj-002',
		templateId: 'template-001',
		title: '차세대 배터리 기술 연구 기안서',
		status: 'approved',
		submittedBy: '김연구',
		submittedAt: '2024-02-28',
		approvedBy: '이사장',
		approvedAt: '2024-03-05',
		fileUrl: '/documents/proj-002-proposal.pdf'
	},
	{
		id: 'doc-004',
		projectId: 'proj-001',
		templateId: 'template-006',
		title: '1분기 재료비 사용보고서',
		status: 'submitted',
		submittedBy: '박개발',
		submittedAt: '2024-04-01',
		fileUrl: '/documents/proj-001-materials-q1.pdf'
	}
];

const mockRDBudgets: RDBudget[] = [
	// AI 스마트팩토리 프로젝트 예산
	{
		id: 'budget-001',
		projectId: 'proj-001',
		category: 'personnel',
		subcategory: '개발인력',
		plannedAmount: 200000000,
		actualAmount: 85000000,
		description: 'AI 알고리즘 개발 및 프론트엔드 개발 인력비',
		year: 2024,
		month: 6
	},
	{
		id: 'budget-002',
		projectId: 'proj-001',
		category: 'materials',
		subcategory: '개발도구',
		plannedAmount: 50000000,
		actualAmount: 15000000,
		description: '개발용 소프트웨어 라이선스 및 하드웨어',
		year: 2024,
		month: 6
	},
	{
		id: 'budget-003',
		projectId: 'proj-001',
		category: 'equipment',
		subcategory: '서버장비',
		plannedAmount: 100000000,
		actualAmount: 80000000,
		description: 'AI 모델 학습용 GPU 서버',
		year: 2024,
		month: 6
	},
	// 배터리 연구 프로젝트 예산
	{
		id: 'budget-004',
		projectId: 'proj-002',
		category: 'personnel',
		subcategory: '연구인력',
		plannedAmount: 400000000,
		actualAmount: 120000000,
		description: '배터리 기술 연구 인력비',
		year: 2024,
		month: 6
	},
	{
		id: 'budget-005',
		projectId: 'proj-002',
		category: 'materials',
		subcategory: '실험재료',
		plannedAmount: 200000000,
		actualAmount: 45000000,
		description: '배터리 소재 및 실험용 재료',
		year: 2024,
		month: 6
	},
	{
		id: 'budget-006',
		projectId: 'proj-002',
		category: 'equipment',
		subcategory: '분석장비',
		plannedAmount: 150000000,
		actualAmount: 120000000,
		description: '배터리 성능 분석 장비',
		year: 2024,
		month: 6
	}
];

const mockRecommendations: Recommendation[] = [
	{
		id: 'rec-001',
		type: 'hiring',
		priority: 'high',
		title: 'AI 전문가 채용 필요',
		description: 'AI 스마트팩토리 프로젝트의 진행률이 예상보다 낮습니다. 추가 AI 전문가 채용이 필요합니다.',
		impact: '프로젝트 완료 지연 방지, 품질 향상',
		estimatedCost: 80000000,
		estimatedBenefit: 200000000,
		status: 'pending',
		createdAt: '2024-06-15'
	},
	{
		id: 'rec-002',
		type: 'participation-adjustment',
		priority: 'medium',
		title: '김연구 참여율 조정',
		description: '김연구원의 총 참여율이 80%로 높습니다. 배터리 연구 프로젝트의 참여율을 20%로 줄이는 것을 권장합니다.',
		impact: '업무 부담 감소, 프로젝트 품질 향상',
		estimatedCost: 0,
		estimatedBenefit: 50000000,
		status: 'pending',
		createdAt: '2024-06-10'
	},
	{
		id: 'rec-003',
		type: 'budget-reallocation',
		priority: 'low',
		title: 'IoT 프로젝트 예산 재배분',
		description: 'IoT 센서 네트워크 프로젝트의 재료비 예산이 부족합니다. 장비비에서 일부를 이전하는 것을 권장합니다.',
		impact: '프로젝트 지연 방지',
		estimatedCost: 0,
		estimatedBenefit: 30000000,
		status: 'approved',
		createdAt: '2024-06-05'
	}
];

// 스토어 생성
export const employees = writable<Employee[]>(mockEmployees);
export const projects = writable<Project[]>(mockProjects);
export const participations = writable<ProjectParticipation[]>(mockParticipations);
export const rdBudgets = writable<RDBudget[]>(mockRDBudgets);
export const documentTemplates = writable<DocumentTemplate[]>(mockDocumentTemplates);
export const documentSubmissions = writable<DocumentSubmission[]>(mockDocumentSubmissions);
export const recommendations = writable<Recommendation[]>(mockRecommendations);

// 유틸리티 함수들
export function getEmployeeById(id: string): Employee | undefined {
	let employee: Employee | undefined;
	employees.subscribe(emps => {
		employee = emps.find(emp => emp.id === id);
	})();
	return employee;
}

export function getProjectById(id: string): Project | undefined {
	let project: Project | undefined;
	projects.subscribe(projs => {
		project = projs.find(proj => proj.id === id);
	})();
	return project;
}

export function getParticipationsByEmployee(employeeId: string): ProjectParticipation[] {
	let participationsList: ProjectParticipation[] = [];
	participations.subscribe(parts => {
		participationsList = parts.filter(part => part.employeeId === employeeId && part.status === 'active');
	})();
	return participationsList;
}

export function getParticipationsByProject(projectId: string): ProjectParticipation[] {
	let participationsList: ProjectParticipation[] = [];
	participations.subscribe(parts => {
		participationsList = parts.filter(part => part.projectId === projectId && part.status === 'active');
	})();
	return participationsList;
}

export function calculatePersonnelCost(projectId: string, month: string): number {
	let totalCost = 0;
	participations.subscribe(parts => {
		const projectParts = parts.filter(part => 
			part.projectId === projectId && 
			part.status === 'active' &&
			part.startDate <= month &&
			(part.endDate >= month || !part.endDate)
		);
		
		totalCost = projectParts.reduce((sum, part) => {
			return sum + (part.monthlySalary * part.participationRate / 100);
		}, 0);
	})();
	return totalCost;
}

export function getTotalParticipationRate(employeeId: string): number {
	let totalRate = 0;
	participations.subscribe(parts => {
		const employeeParts = parts.filter(part => 
			part.employeeId === employeeId && 
			part.status === 'active'
		);
		
		totalRate = employeeParts.reduce((sum, part) => sum + part.participationRate, 0);
	})();
	return totalRate;
}

export function getProjectBudgetUtilization(projectId: string): number {
	let utilization = 0;
	rdBudgets.subscribe(budgets => {
		const projectBudgets = budgets.filter(budget => budget.projectId === projectId);
		const totalPlanned = projectBudgets.reduce((sum, budget) => sum + budget.plannedAmount, 0);
		const totalActual = projectBudgets.reduce((sum, budget) => sum + budget.actualAmount, 0);
		utilization = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
	})();
	return utilization;
}

export function getDocumentSubmissionStatus(projectId: string): { submitted: number; total: number; pending: number } {
	let status = { submitted: 0, total: 0, pending: 0 };
	
	documentTemplates.subscribe(templates => {
		documentSubmissions.subscribe(submissions => {
			const projectSubmissions = submissions.filter(sub => sub.projectId === projectId);
			status.total = templates.length;
			status.submitted = projectSubmissions.filter(sub => sub.status === 'approved').length;
			status.pending = projectSubmissions.filter(sub => sub.status === 'draft' || sub.status === 'submitted').length;
		})();
	})();
	
	return status;
}

// CRUD 함수들
export function addEmployee(employee: Omit<Employee, 'id'>): void {
	employees.update(emps => {
		const newEmployee: Employee = {
			...employee,
			id: `emp-${Date.now()}`
		};
		return [...emps, newEmployee];
	});
}

export function updateEmployee(id: string, updates: Partial<Employee>): void {
	employees.update(emps => 
		emps.map(emp => emp.id === id ? { ...emp, ...updates } : emp)
	);
}

export function addProject(project: Omit<Project, 'id'>): void {
	projects.update(projs => {
		const newProject: Project = {
			...project,
			id: `proj-${Date.now()}`
		};
		return [...projs, newProject];
	});
}

export function updateProject(id: string, updates: Partial<Project>): void {
	projects.update(projs => 
		projs.map(proj => proj.id === id ? { ...proj, ...updates } : proj)
	);
}

export function addParticipation(participation: Omit<ProjectParticipation, 'id'>): void {
	participations.update(parts => {
		const newParticipation: ProjectParticipation = {
			...participation,
			id: `part-${Date.now()}`
		};
		return [...parts, newParticipation];
	});
}

export function updateParticipation(id: string, updates: Partial<ProjectParticipation>): void {
	participations.update(parts => 
		parts.map(part => part.id === id ? { ...part, ...updates } : part)
	);
}

export function addDocumentSubmission(submission: Omit<DocumentSubmission, 'id'>): void {
	documentSubmissions.update(subs => {
		const newSubmission: DocumentSubmission = {
			...submission,
			id: `doc-${Date.now()}`
		};
		return [...subs, newSubmission];
	});
}

export function updateDocumentSubmission(id: string, updates: Partial<DocumentSubmission>): void {
	documentSubmissions.update(subs => 
		subs.map(sub => sub.id === id ? { ...sub, ...updates } : sub)
	);
}

export function addRecommendation(recommendation: Omit<Recommendation, 'id'>): void {
	recommendations.update(recs => {
		const newRecommendation: Recommendation = {
			...recommendation,
			id: `rec-${Date.now()}`
		};
		return [...recs, newRecommendation];
	});
}

export function updateRecommendation(id: string, updates: Partial<Recommendation>): void {
	recommendations.update(recs => 
		recs.map(rec => rec.id === id ? { ...rec, ...updates } : rec)
	);
}
