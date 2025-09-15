// 급여 계약 관리 Svelte Store

import type {
    ApiResponse,
    CreateSalaryContractRequest,
    CurrentSalaryInfo,
    PaginatedResponse,
    SalaryContract,
    SalaryContractFilter,
    SalaryContractStats,
    UpdateSalaryContractRequest
} from '$lib/types/salary-contracts';
import { derived, writable } from 'svelte/store';

// ===== 기본 상태 =====
export const contracts = writable<SalaryContract[]>([]);
export const contractStats = writable<SalaryContractStats | null>(null);
export const currentSalaryInfo = writable<CurrentSalaryInfo | null>(null);
export const selectedContract = writable<SalaryContract | null>(null);
export const isLoading = writable<boolean>(false);
export const error = writable<string | null>(null);

// ===== 필터링 상태 =====
export const contractFilter = writable<SalaryContractFilter>({
	employeeId: '',
	department: '',
	position: '',
	contractType: '',
	status: '',
	startDateFrom: '',
	startDateTo: '',
	search: ''
});

export const pagination = writable({
	page: 1,
	limit: 50,
	total: 0,
	totalPages: 0
});

// ===== Derived Stores =====

// 필터링된 계약 목록
export const filteredContracts = derived(
	[contracts, contractFilter],
	([$contracts, $filter]) => {
		return $contracts.filter(contract => {
			if ($filter.employeeId && contract.employeeId !== $filter.employeeId) return false;
			if ($filter.department && contract.department !== $filter.department) return false;
			if ($filter.position && contract.position !== $filter.position) return false;
			if ($filter.contractType && contract.contractType !== $filter.contractType) return false;
			if ($filter.status && contract.status !== $filter.status) return false;
			if ($filter.startDateFrom && contract.startDate < $filter.startDateFrom) return false;
			if ($filter.startDateTo && contract.startDate > $filter.startDateTo) return false;
			if ($filter.search) {
				const searchLower = $filter.search.toLowerCase();
				const searchableText = `${contract.employeeName} ${contract.employeeIdNumber} ${contract.department} ${contract.position}`.toLowerCase();
				if (!searchableText.includes(searchLower)) return false;
			}
			return true;
		});
	}
);

// 현재 유효한 계약만
export const activeContracts = derived(
	contracts,
	($contracts) => {
		const today = new Date().toISOString().split('T')[0];
		return $contracts.filter(contract => 
			contract.status === 'active' && 
			contract.startDate <= today && 
			(!contract.endDate || contract.endDate >= today)
		);
	}
);

// 만료된 계약
export const expiredContracts = derived(
	contracts,
	($contracts) => {
		const today = new Date().toISOString().split('T')[0];
		return $contracts.filter(contract => 
			contract.status === 'expired' || 
			(contract.endDate && contract.endDate < today)
		);
	}
);

// 계약 유형별 통계
export const contractsByType = derived(
	contracts,
	($contracts) => {
		const stats: Record<string, number> = {};
		$contracts.forEach(contract => {
			stats[contract.contractType] = (stats[contract.contractType] || 0) + 1;
		});
		return stats;
	}
);

// 부서별 통계
export const contractsByDepartment = derived(
	contracts,
	($contracts) => {
		const stats: Record<string, number> = {};
		$contracts.forEach(contract => {
			const dept = contract.department || '부서없음';
			stats[dept] = (stats[dept] || 0) + 1;
		});
		return stats;
	}
);

// ===== API 호출 함수들 =====

// 급여 계약 목록 로드
export async function loadContracts(filter?: Partial<SalaryContractFilter>): Promise<void> {
	isLoading.set(true);
	error.set(null);

	try {
		const currentFilter = filter || {};
		const currentPagination = { page: 1, limit: 50 };
		
		const params = new URLSearchParams();
		Object.entries(currentFilter).forEach(([key, value]) => {
			if (value) params.append(key, String(value));
		});
		params.append('page', String(currentPagination.page));
		params.append('limit', String(currentPagination.limit));

		const response = await fetch(`/api/salary/contracts?${params.toString()}`);
		const result: ApiResponse<PaginatedResponse<SalaryContract>> = await response.json();

		console.log('loadContracts API response:', result);

		if (result.success && result.data) {
			console.log('Setting contracts data:', result.data.data);
			contracts.set(result.data.data);
			pagination.set({
				page: result.data.page,
				limit: result.data.limit,
				total: result.data.total,
				totalPages: result.data.totalPages
			});
		} else {
			error.set(result.error || '급여 계약 목록을 불러오는데 실패했습니다.');
		}
	} catch (err) {
		error.set(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
	} finally {
		isLoading.set(false);
	}
}

// 급여 계약 통계 로드
export async function loadContractStats(): Promise<void> {
	isLoading.set(true);
	error.set(null);

	try {
		const response = await fetch('/api/salary/contracts/stats');
		const result: ApiResponse<SalaryContractStats> = await response.json();

		if (result.success && result.data) {
			contractStats.set(result.data);
		} else {
			error.set(result.error || '급여 계약 통계를 불러오는데 실패했습니다.');
		}
	} catch (err) {
		error.set(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
	} finally {
		isLoading.set(false);
	}
}

// 직원별 급여 정보 로드
export async function loadEmployeeSalaryInfo(employeeId: string): Promise<void> {
	isLoading.set(true);
	error.set(null);

	try {
		const response = await fetch(`/api/salary/contracts/employee/${employeeId}`);
		const result: ApiResponse<CurrentSalaryInfo> = await response.json();

		if (result.success && result.data) {
			currentSalaryInfo.set(result.data);
		} else {
			error.set(result.error || '직원 급여 정보를 불러오는데 실패했습니다.');
		}
	} catch (err) {
		error.set(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
	} finally {
		isLoading.set(false);
	}
}

// 급여 계약 생성
export async function createContract(contractData: CreateSalaryContractRequest): Promise<boolean> {
	isLoading.set(true);
	error.set(null);

	try {
		const response = await fetch('/api/salary/contracts', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(contractData)
		});

		const result: ApiResponse<SalaryContract> = await response.json();

		if (result.success && result.data) {
			// 새 계약을 목록에 추가
			contracts.update(current => [result.data!, ...current]);
			return true;
		} else {
			error.set(result.error || '급여 계약 생성에 실패했습니다.');
			return false;
		}
	} catch (err) {
		error.set(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
		return false;
	} finally {
		isLoading.set(false);
	}
}

// 급여 계약 수정
export async function updateContract(contractId: string, updateData: UpdateSalaryContractRequest): Promise<boolean> {
	isLoading.set(true);
	error.set(null);

	try {
		const response = await fetch(`/api/salary/contracts/${contractId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(updateData)
		});

		const result: ApiResponse<SalaryContract> = await response.json();

		if (result.success && result.data) {
			// 목록에서 해당 계약 업데이트
			contracts.update(current => 
				current.map(contract => 
					contract.id === contractId ? result.data! : contract
				)
			);
			return true;
		} else {
			error.set(result.error || '급여 계약 수정에 실패했습니다.');
			return false;
		}
	} catch (err) {
		error.set(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
		return false;
	} finally {
		isLoading.set(false);
	}
}

// 급여 계약 삭제
export async function deleteContract(contractId: string): Promise<boolean> {
	isLoading.set(true);
	error.set(null);

	try {
		const response = await fetch(`/api/salary/contracts/${contractId}`, {
			method: 'DELETE'
		});

		const result: ApiResponse<{ id: string }> = await response.json();

		if (result.success) {
			// 목록에서 해당 계약 제거
			contracts.update(current => 
				current.filter(contract => contract.id !== contractId)
			);
			return true;
		} else {
			error.set(result.error || '급여 계약 삭제에 실패했습니다.');
			return false;
		}
	} catch (err) {
		error.set(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
		return false;
	} finally {
		isLoading.set(false);
	}
}

// 특정 급여 계약 조회
export async function loadContract(contractId: string): Promise<void> {
	isLoading.set(true);
	error.set(null);

	try {
		const response = await fetch(`/api/salary/contracts/${contractId}`);
		const result: ApiResponse<SalaryContract> = await response.json();

		if (result.success && result.data) {
			selectedContract.set(result.data);
		} else {
			error.set(result.error || '급여 계약 조회에 실패했습니다.');
		}
	} catch (err) {
		error.set(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
	} finally {
		isLoading.set(false);
	}
}

// 필터 업데이트
export function updateFilter(newFilter: Partial<SalaryContractFilter>): void {
	contractFilter.update(current => ({ ...current, ...newFilter }));
}

// 필터 초기화
export function resetFilter(): void {
	contractFilter.set({
		employeeId: '',
		department: '',
		position: '',
		contractType: '',
		status: '',
		startDateFrom: '',
		startDateTo: '',
		search: ''
	});
}

// 페이지네이션 업데이트
export function updatePagination(page: number): void {
	pagination.update(current => ({ ...current, page }));
}

// 선택된 계약 초기화
export function clearSelectedContract(): void {
	selectedContract.set(null);
}
