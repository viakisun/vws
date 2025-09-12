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

