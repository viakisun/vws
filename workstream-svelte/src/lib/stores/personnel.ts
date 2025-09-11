import { writable } from 'svelte/store';
import type { Personnel } from '$lib/types';

const initialPersonnel: Personnel[] = [
	{
		id: 'E-101',
		name: '김철수',
		role: '대리',
		organization: '개발팀',
		employmentType: '연봉제',
		status: '재직',
		annualSalaryKRW: 62_000_000,
		participations: [
			{ projectId: 'P-001', allocationPct: 60, startDate: '2025-07-01' }
		]
	},
	{
		id: 'E-205',
		name: '이영희',
		role: '과장',
		organization: '기획팀',
		employmentType: '연봉제',
		status: '재직',
		annualSalaryKRW: 73_000_000,
		participations: [
			{ projectId: 'P-001', allocationPct: 20, startDate: '2025-07-01' },
			{ projectId: 'P-002', allocationPct: 40, startDate: '2025-05-01' }
		]
	},
	{
		id: 'E-309',
		name: '박민수',
		role: '주임',
		organization: '영업팀',
		employmentType: '연봉제',
		status: '퇴사예정',
		annualSalaryKRW: 51_000_000,
		participations: [
			{ projectId: 'P-003', allocationPct: 50, startDate: '2025-09-01' }
		]
	}
];

export const personnelStore = writable<Personnel[]>(initialPersonnel);

export function estimateMonthlyCostKRW(annualSalaryKRW: number, allocationPct: number): number {
	return Math.round((annualSalaryKRW * (allocationPct / 100)) / 12);
}

