import { writable, derived, get } from 'svelte/store';
import type { Project, ExpenseDocument } from '$lib/types';

const initialProjects: Project[] = [
	{
		id: 'P-001',
		name: '스마트 제조 혁신 플랫폼',
		status: '진행중',
		budgetKRW: 1_200_000_000,
		spentKRW: 760_000_000,
		progressPct: 68,
		startDate: '2025-07-01',
		dueDate: '2026-06-30',
		organization: '개발팀',
		personnelIds: ['E-101', 'E-205'],
		risks: [
			{ id: 'R1', severity: '보통', description: '부품 수급 지연 가능성', impact: '일정', status: '열림' }
		]
	},
	{
		id: 'P-002',
		name: 'AI 품질 예측 시스템',
		status: '지연',
		budgetKRW: 800_000_000,
		spentKRW: 620_000_000,
		progressPct: 54,
		startDate: '2025-05-01',
		dueDate: '2026-04-30',
		organization: '연구팀',
		personnelIds: ['E-205'],
		risks: [
			{ id: 'R2', severity: '높음', description: '데이터 품질 불안정', impact: '품질', status: '열림' }
		]
	},
	{
		id: 'P-003',
		name: '클라우드 전환 프로젝트',
		status: '정상',
		budgetKRW: 600_000_000,
		spentKRW: 240_000_000,
		progressPct: 32,
		startDate: '2025-09-01',
		dueDate: '2026-08-31',
		organization: '인프라팀',
		personnelIds: ['E-309'],
		risks: []
	}
];

const initialDocs: ExpenseDocument[] = [
	{ id: 'D-001', projectId: 'P-001', category: '재료비', quarter: 3, status: '대기', title: '연구용 장비 구입', amountKRW: 15_000_000, attachments: 4, createdAt: '2025-09-05', appRoute: ['김연구원', '이팀장', '박이사'] },
	{ id: 'D-014', projectId: 'P-002', category: '인건비', quarter: 3, status: '승인', title: '여름휴가 신청', amountKRW: 0, attachments: 2, createdAt: '2025-08-10', appRoute: ['최사원', '김대리', '이부장'] },
	{ id: 'D-020', projectId: 'P-003', category: '여비', quarter: 2, status: '반려', title: '부산 전시회 참가', amountKRW: 2_200_000, attachments: 3, createdAt: '2025-07-21', appRoute: ['정주임', '이팀장'] }
];

export const projectsStore = writable<Project[]>(initialProjects);
export const expenseDocsStore = writable<ExpenseDocument[]>(initialDocs);

export const pendingDocCount = derived(expenseDocsStore, (arr) => arr.filter((d) => d.status === '대기').length);

export function updateExpenseStatus(id: string, status: '대기' | '승인' | '반려') {
	expenseDocsStore.update((arr) => arr.map((d) => (d.id === id ? { ...d, status } : d)));
}

// Budget thresholds and quarterly budgets
export const budgetThresholds = {
	warning: 0.8,
	critical: 0.95,
	over: 1.0
};

// Example quarterly personnel budgets per project (KRW)
export const quarterlyPersonnelBudgets = writable<Record<string, Record<string, number>>>(
	{
		P_001: {}, // kept for reference if IDs change
		'P-001': { '2025-Q3': 300_000_000, '2025-Q4': 300_000_000, '2026-Q1': 300_000_000, '2026-Q2': 300_000_000 },
		'P-002': { '2025-Q3': 200_000_000, '2025-Q4': 200_000_000, '2026-Q1': 200_000_000 },
		'P-003': { '2025-Q4': 150_000_000, '2026-Q1': 200_000_000, '2026-Q2': 250_000_000 }
	}
);

// Overall budget utilization from project-level budget/spent
export const overallBudget = derived(projectsStore, (arr) => {
	const totalBudgetKRW = arr.reduce((s, p) => s + (p.budgetKRW ?? 0), 0);
	const totalSpentKRW = arr.reduce((s, p) => s + (p.spentKRW ?? 0), 0);
	const utilization = totalBudgetKRW > 0 ? totalSpentKRW / totalBudgetKRW : 0;
	return { totalBudgetKRW, totalSpentKRW, utilization };
});

// Per-project alerts based on utilization against thresholds
export const budgetAlerts = derived(projectsStore, (arr) => {
	return arr
		.map((p) => {
			const util = p.budgetKRW > 0 ? p.spentKRW / p.budgetKRW : 0;
			let level: 'warning' | 'critical' | 'over' | null = null;
			if (util >= budgetThresholds.over) level = 'over';
			else if (util >= budgetThresholds.critical) level = 'critical';
			else if (util >= budgetThresholds.warning) level = 'warning';
			return level ? { projectId: p.id, name: p.name, utilization: util, level } : null;
		})
		.filter(Boolean) as Array<{ projectId: string; name: string; utilization: number; level: 'warning' | 'critical' | 'over' }>;
});

export function getQuarterSummary(quarter: string): { totalBudgetKRW: number } {
	const q = get(quarterlyPersonnelBudgets);
	const totalBudgetKRW = Object.values(q).reduce((sum, m) => sum + (m[quarter] ?? 0), 0);
	return { totalBudgetKRW };
}

// Approval history for expense documents
export const expenseHistories = writable<Record<string, Array<{ status: '대기' | '승인' | '반려'; reason?: string; at: string }>>>({});

export function addExpenseHistory(id: string, status: '대기' | '승인' | '반려', reason?: string) {
	expenseHistories.update((h) => {
		const list = h[id] ?? [];
		return { ...h, [id]: [...list, { status, reason, at: new Date().toISOString() }] };
	});
}

