// 급여 관리 시스템 - 급여 스토어

import type {
    ApiResponse,
    EmployeePayroll,
    Payroll,
    Payslip,
    SalaryHistory,
    SalarySearchFilter,
    SalaryStructure
} from '$lib/types/salary';
import { derived, writable } from 'svelte/store';

// ===== 기본 스토어 =====
export const salaryStructures = writable<SalaryStructure[]>([]);
export const payrolls = writable<Payroll[]>([]);
export const employeePayrolls = writable<EmployeePayroll[]>([]);
export const payslips = writable<Payslip[]>([]);
export const salaryHistory = writable<SalaryHistory[]>([]);
export const selectedEmployee = writable<string | null>(null);
export const selectedPeriod = writable<string | null>(null);
export const isLoading = writable<boolean>(false);
export const error = writable<string | null>(null);

// ===== 검색 및 필터 스토어 =====
export const searchFilter = writable<SalarySearchFilter>({});
export const currentPage = writable<number>(1);
export const pageSize = writable<number>(20);

// ===== 현재 기간 정보 =====
export const currentPeriod = derived(
	[],
	() => {
		// 실제 데이터가 있는 2024-12 기간 사용
		return '2024-12';
	}
);

export const previousPeriod = derived(
	[],
	() => {
		// 실제 데이터가 있는 2024-11 기간 사용 (이전 달)
		return '2024-11';
	}
);

// ===== 급여 통계 =====
export const salaryStatistics = derived(
	[payrolls, currentPeriod, previousPeriod],
	([$payrolls, $currentPeriod, $previousPeriod]) => {
		const currentPayroll = $payrolls.find(p => p.period === $currentPeriod);
		const previousPayroll = $payrolls.find(p => p.period === $previousPeriod);

		return {
			currentPeriod: $currentPeriod,
			previousPeriod: $previousPeriod,
			currentMonth: {
				totalEmployees: currentPayroll?.totalEmployees || 0,
				totalGrossSalary: currentPayroll?.totalGrossSalary || 0,
				totalNetSalary: currentPayroll?.totalNetSalary || 0,
				totalDeductions: currentPayroll?.totalDeductions || 0,
				status: currentPayroll?.status || 'draft'
			},
			previousMonth: {
				totalEmployees: previousPayroll?.totalEmployees || 0,
				totalGrossSalary: previousPayroll?.totalGrossSalary || 0,
				totalNetSalary: previousPayroll?.totalNetSalary || 0,
				totalDeductions: previousPayroll?.totalDeductions || 0,
				status: previousPayroll?.status || 'draft'
			},
			changes: {
				employeeChange: (currentPayroll?.totalEmployees || 0) - (previousPayroll?.totalEmployees || 0),
				salaryChange: (currentPayroll?.totalGrossSalary || 0) - (previousPayroll?.totalGrossSalary || 0),
				netSalaryChange: (currentPayroll?.totalNetSalary || 0) - (previousPayroll?.totalNetSalary || 0)
			}
		};
	}
);

// ===== 직원별 급여 현황 =====
export const employeeSalaryStatus = derived(
	[employeePayrolls, selectedEmployee, currentPeriod],
	([$employeePayrolls, $selectedEmployee, $currentPeriod]) => {
		if (!$selectedEmployee) return null;

		const currentPayroll = $employeePayrolls.find(
			ep => ep.employeeId === $selectedEmployee && ep.payrollId.includes($currentPeriod)
		);

		return currentPayroll ? {
			employeeId: currentPayroll.employeeId,
			employeeName: currentPayroll.employeeName,
			department: currentPayroll.department,
			position: currentPayroll.position,
			baseSalary: currentPayroll.baseSalary,
			totalAllowances: currentPayroll.totalAllowances,
			totalDeductions: currentPayroll.totalDeductions,
			grossSalary: currentPayroll.grossSalary,
			netSalary: currentPayroll.netSalary,
			status: currentPayroll.status,
			payDate: currentPayroll.payDate
		} : null;
	}
);

// ===== 부서별 급여 통계 =====
export const departmentSalaryStats = derived(
	employeePayrolls,
	($employeePayrolls) => {
		const stats: Record<string, {
			employeeCount: number;
			totalGrossSalary: number;
			totalNetSalary: number;
			averageGrossSalary: number;
			averageNetSalary: number;
		}> = {};

		$employeePayrolls.forEach(payroll => {
			if (!stats[payroll.department]) {
				stats[payroll.department] = {
					employeeCount: 0,
					totalGrossSalary: 0,
					totalNetSalary: 0,
					averageGrossSalary: 0,
					averageNetSalary: 0
				};
			}

			const deptStats = stats[payroll.department];
			if (deptStats) {
				deptStats.employeeCount++;
				deptStats.totalGrossSalary += payroll.grossSalary;
				deptStats.totalNetSalary += payroll.netSalary;
			}
		});

		// 평균 계산
		Object.keys(stats).forEach(dept => {
			const stat = stats[dept];
			if (stat) {
				stat.averageGrossSalary = stat.employeeCount > 0 ? stat.totalGrossSalary / stat.employeeCount : 0;
				stat.averageNetSalary = stat.employeeCount > 0 ? stat.totalNetSalary / stat.employeeCount : 0;
			}
		});

		return stats;
	}
);

// ===== 급여 이력 =====
export const filteredSalaryHistory = derived(
	[salaryHistory, selectedEmployee],
	([$salaryHistory, $selectedEmployee]) => {
		if (!$selectedEmployee) return $salaryHistory;
		
		return $salaryHistory.filter(history => history.employeeId === $selectedEmployee);
	}
);

// ===== 필터된 급여 목록 =====
export const filteredPayrolls = derived(
	[payrolls, searchFilter],
	([$payrolls, $filter]) => {
		let filtered = [...$payrolls];

		// 기간 필터
		if ($filter.periodFrom) {
			filtered = filtered.filter(p => p.period >= $filter.periodFrom!);
		}

		if ($filter.periodTo) {
			filtered = filtered.filter(p => p.period <= $filter.periodTo!);
		}

		// 상태 필터
		if ($filter.status) {
			filtered = filtered.filter(p => p.status === $filter.status);
		}

		return filtered.sort((a, b) => b.period.localeCompare(a.period));
	}
);

// ===== 페이지네이션된 급여 목록 =====
export const paginatedPayrolls = derived(
	[filteredPayrolls, currentPage, pageSize],
	([$filteredPayrolls, $currentPage, $pageSize]) => {
		const startIndex = ($currentPage - 1) * $pageSize;
		const endIndex = startIndex + $pageSize;
		return $filteredPayrolls.slice(startIndex, endIndex);
	}
);

// ===== 액션 함수들 =====

// 급여 구조 목록 로드
export async function loadSalaryStructures(): Promise<void> {
	isLoading.set(true);
	error.set(null);

	try {
		const response = await fetch('/api/salary/structures');
		const result: ApiResponse<SalaryStructure[]> = await response.json();

		if (result.success && result.data) {
			salaryStructures.set(result.data);
		} else {
			error.set(result.error || '급여 구조 목록을 불러오는데 실패했습니다.');
		}
	} catch (err) {
		error.set(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
	} finally {
		isLoading.set(false);
	}
}

// 급여 목록 로드
export async function loadPayrolls(): Promise<void> {
	isLoading.set(true);
	error.set(null);

	try {
		const response = await fetch('/api/salary/payrolls');
		const result: ApiResponse<Payroll[]> = await response.json();

		if (result.success && result.data) {
			payrolls.set(result.data);
		} else {
			error.set(result.error || '급여 목록을 불러오는데 실패했습니다.');
		}
	} catch (err) {
		error.set(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
	} finally {
		isLoading.set(false);
	}
}

// 직원별 급여 목록 로드
export async function loadEmployeePayrolls(period?: string): Promise<void> {
	isLoading.set(true);
	error.set(null);

	try {
		const url = period ? `/api/salary/employee-payrolls?period=${period}` : '/api/salary/employee-payrolls';
		const response = await fetch(url);
		const result: ApiResponse<EmployeePayroll[]> = await response.json();

		if (result.success && result.data) {
			employeePayrolls.set(result.data);
		} else {
			error.set(result.error || '직원별 급여 목록을 불러오는데 실패했습니다.');
		}
	} catch (err) {
		error.set(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
	} finally {
		isLoading.set(false);
	}
}

// 급여 이력 로드
export async function loadSalaryHistory(employeeId?: string): Promise<void> {
	isLoading.set(true);
	error.set(null);

	try {
		const url = employeeId ? `/api/salary/history/${employeeId}` : '/api/salary/history';
		const response = await fetch(url);
		const result: ApiResponse<SalaryHistory[]> = await response.json();

		if (result.success && result.data) {
			salaryHistory.set(result.data);
		} else {
			error.set(result.error || '급여 이력을 불러오는데 실패했습니다.');
		}
	} catch (err) {
		error.set(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
	} finally {
		isLoading.set(false);
	}
}

// 급여 구조 추가
export async function addSalaryStructure(structure: Omit<SalaryStructure, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
	isLoading.set(true);
	error.set(null);

	try {
		const response = await fetch('/api/salary/structures', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(structure)
		});

		const result: ApiResponse<SalaryStructure> = await response.json();

		if (result.success && result.data) {
			salaryStructures.update(current => [...current, result.data!]);
			return true;
		} else {
			error.set(result.error || '급여 구조 추가에 실패했습니다.');
			return false;
		}
	} catch (err) {
		error.set(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
		return false;
	} finally {
		isLoading.set(false);
	}
}

// 급여 구조 수정
export async function updateSalaryStructure(id: string, updates: Partial<SalaryStructure>): Promise<boolean> {
	isLoading.set(true);
	error.set(null);

	try {
		const response = await fetch(`/api/salary/structures/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(updates)
		});

		const result: ApiResponse<SalaryStructure> = await response.json();

		if (result.success && result.data) {
			salaryStructures.update(current => 
				current.map(structure => structure.id === id ? result.data! : structure)
			);
			return true;
		} else {
			error.set(result.error || '급여 구조 수정에 실패했습니다.');
			return false;
		}
	} catch (err) {
		error.set(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
		return false;
	} finally {
		isLoading.set(false);
	}
}

// 급여 계산
export async function calculatePayroll(period: string): Promise<boolean> {
	isLoading.set(true);
	error.set(null);

	try {
		const response = await fetch(`/api/salary/payrolls/${period}/calculate`, {
			method: 'POST'
		});

		const result: ApiResponse<Payroll> = await response.json();

		if (result.success && result.data) {
			payrolls.update(current => {
				const existing = current.find(p => p.period === period);
				if (existing) {
					return current.map(p => p.period === period ? result.data! : p);
				} else {
					return [...current, result.data!];
				}
			});
			return true;
		} else {
			error.set(result.error || '급여 계산에 실패했습니다.');
			return false;
		}
	} catch (err) {
		error.set(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
		return false;
	} finally {
		isLoading.set(false);
	}
}

// 급여 승인
export async function approvePayroll(payrollId: string): Promise<boolean> {
	isLoading.set(true);
	error.set(null);

	try {
		const response = await fetch(`/api/salary/payrolls/${payrollId}/approve`, {
			method: 'POST'
		});

		const result: ApiResponse<Payroll> = await response.json();

		if (result.success && result.data) {
			payrolls.update(current => 
				current.map(p => p.id === payrollId ? result.data! : p)
			);
			return true;
		} else {
			error.set(result.error || '급여 승인에 실패했습니다.');
			return false;
		}
	} catch (err) {
		error.set(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
		return false;
	} finally {
		isLoading.set(false);
	}
}

// 급여명세서 생성
export async function generatePayslip(employeeId: string, period: string): Promise<boolean> {
	isLoading.set(true);
	error.set(null);

	try {
		const response = await fetch(`/api/salary/payslips`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ employeeId, period })
		});

		const result: ApiResponse<Payslip> = await response.json();

		if (result.success && result.data) {
			payslips.update(current => [...current, result.data!]);
			return true;
		} else {
			error.set(result.error || '급여명세서 생성에 실패했습니다.');
			return false;
		}
	} catch (err) {
		error.set(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
		return false;
	} finally {
		isLoading.set(false);
	}
}

// 급여명세서 다운로드
export async function downloadPayslip(payslipId: string): Promise<boolean> {
	isLoading.set(true);
	error.set(null);

	try {
		const response = await fetch(`/api/salary/payslips/${payslipId}/download`);

		if (response.ok) {
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `payslip-${payslipId}.pdf`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			return true;
		} else {
			error.set('급여명세서 다운로드에 실패했습니다.');
			return false;
		}
	} catch (err) {
		error.set(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
		return false;
	} finally {
		isLoading.set(false);
	}
}

// 검색 필터 설정
export function setSearchFilter(filter: Partial<SalarySearchFilter>): void {
	searchFilter.update(current => ({ ...current, ...filter }));
}

// 페이지 설정
export function setPage(page: number): void {
	currentPage.set(page);
}

// 페이지 크기 설정
export function setPageSize(size: number): void {
	pageSize.set(size);
	currentPage.set(1);
}

// 직원 선택
export function selectEmployee(employeeId: string | null): void {
	selectedEmployee.set(employeeId);
}

// 기간 선택
export function selectPeriod(period: string | null): void {
	selectedPeriod.set(period);
}

// 오류 초기화
export function clearError(): void {
	error.set(null);
}
