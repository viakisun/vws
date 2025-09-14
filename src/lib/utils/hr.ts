// 인사 관리 시스템 유틸리티 함수

import type { Employee, EmployeeLevel, EmployeeStatus, EmploymentType } from '$lib/types/hr';

// ===== 직원 관련 유틸리티 =====

/**
 * 직원 이름을 한국식으로 포맷팅 (성+이름)
 */
export function formatEmployeeName(employee: Employee): string {
	return employee.name;
}

/**
 * 직원 상태에 따른 배지 색상 반환
 */
export function getStatusBadgeColor(status: EmployeeStatus): string {
	switch (status) {
		case 'active':
			return 'bg-green-100 text-green-800';
		case 'inactive':
			return 'bg-gray-100 text-gray-800';
		case 'on-leave':
			return 'bg-yellow-100 text-yellow-800';
		case 'terminated':
			return 'bg-red-100 text-red-800';
		default:
			return 'bg-gray-100 text-gray-800';
	}
}

/**
 * 직원 상태 한글 라벨 반환
 */
export function getStatusLabel(status: EmployeeStatus): string {
	switch (status) {
		case 'active':
			return '재직중';
		case 'inactive':
			return '비활성';
		case 'on-leave':
			return '휴직중';
		case 'terminated':
			return '퇴사';
		default:
			return '알 수 없음';
	}
}

/**
 * 고용 형태에 따른 배지 색상 반환
 */
export function getEmploymentTypeBadgeColor(type: EmploymentType): string {
	switch (type) {
		case 'full-time':
			return 'bg-blue-100 text-blue-800';
		case 'part-time':
			return 'bg-purple-100 text-purple-800';
		case 'contract':
			return 'bg-orange-100 text-orange-800';
		case 'intern':
			return 'bg-pink-100 text-pink-800';
		default:
			return 'bg-gray-100 text-gray-800';
	}
}

/**
 * 고용 형태 한글 라벨 반환
 */
export function getEmploymentTypeLabel(type: EmploymentType): string {
	switch (type) {
		case 'full-time':
			return '정규직';
		case 'part-time':
			return '파트타임';
		case 'contract':
			return '계약직';
		case 'intern':
			return '인턴';
		default:
			return '알 수 없음';
	}
}

/**
 * 직원 레벨 한글 라벨 반환
 */
export function getLevelLabel(level: EmployeeLevel): string {
	switch (level) {
		case 'intern':
			return '인턴';
		case 'junior':
			return '주니어';
		case 'mid':
			return '미드레벨';
		case 'senior':
			return '시니어';
		case 'lead':
			return '리드';
		case 'manager':
			return '매니저';
		case 'director':
			return '디렉터';
		default:
			return '알 수 없음';
	}
}

/**
 * 팀 리더 여부 확인
 */
export function isTeamLeader(employee: Employee): boolean {
	const leaderPositions = ['CEO', 'CFO', 'CTO', '대표이사', '재무이사', '기술이사', '연구소장', '상무'];
	return leaderPositions.includes(employee.position);
}

/**
 * 계약직 여부 확인
 */
export function isContractEmployee(employee: Employee): boolean {
	return employee.employmentType === 'contract';
}

/**
 * 퇴사 예정자 여부 확인
 */
export function isTerminationPending(employee: Employee): boolean {
	if (!employee.terminationDate || employee.status === 'terminated') {
		return false;
	}

	const now = new Date();
	const terminationDate = new Date(employee.terminationDate);
	const oneMonthFromNow = new Date();
	oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

	return terminationDate >= now && terminationDate <= oneMonthFromNow;
}

/**
 * 퇴사까지 남은 일수 계산
 */
export function getDaysUntilTermination(employee: Employee): number | null {
	if (!employee.terminationDate || employee.status === 'terminated') {
		return null;
	}

	const now = new Date();
	const terminationDate = new Date(employee.terminationDate);
	const diffTime = terminationDate.getTime() - now.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	return diffDays;
}

/**
 * 근속년수 계산
 */
export function getTenureYears(employee: Employee): number {
	const hireDate = new Date(employee.hireDate);
	const now = new Date();
	const diffTime = now.getTime() - hireDate.getTime();
	const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);

	return Math.floor(diffYears * 10) / 10; // 소수점 첫째 자리까지
}

/**
 * 근속년수 라벨 반환
 */
export function getTenureLabel(employee: Employee): string {
	const years = getTenureYears(employee);
	if (years < 1) {
		return '1년 미만';
	} else if (years < 2) {
		return '1년 이상 2년 미만';
	} else if (years < 5) {
		return '2년 이상 5년 미만';
	} else if (years < 10) {
		return '5년 이상 10년 미만';
	} else {
		return '10년 이상';
	}
}

// ===== 날짜 관련 유틸리티 =====

/**
 * 날짜를 한국식으로 포맷팅
 */
export function formatDate(dateString: string): string {
	if (!dateString) return '';
	const date = new Date(dateString);
	return date.toLocaleDateString('ko-KR', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

/**
 * 날짜를 간단한 형식으로 포맷팅 (YYYY-MM-DD)
 */
export function formatDateShort(dateString: string): string {
	if (!dateString) return '';
	const date = new Date(dateString);
	return date.toISOString().split('T')[0];
}

/**
 * 상대적 시간 표시 (예: "3일 전", "1주 후")
 */
export function getRelativeTime(dateString: string): string {
	if (!dateString) return '';
	const date = new Date(dateString);
	const now = new Date();
	const diffTime = date.getTime() - now.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays === 0) {
		return '오늘';
	} else if (diffDays === 1) {
		return '내일';
	} else if (diffDays === -1) {
		return '어제';
	} else if (diffDays > 0) {
		return `${diffDays}일 후`;
	} else {
		return `${Math.abs(diffDays)}일 전`;
	}
}

// ===== 검색 및 필터링 유틸리티 =====

/**
 * 직원 검색 (이름, 이메일, 사번)
 */
export function searchEmployees(employees: Employee[], query: string): Employee[] {
	if (!query.trim()) return employees;

	const lowercaseQuery = query.toLowerCase();
	return employees.filter(emp =>
		emp.name.toLowerCase().includes(lowercaseQuery) ||
		emp.email.toLowerCase().includes(lowercaseQuery) ||
		emp.employeeId.toLowerCase().includes(lowercaseQuery)
	);
}

/**
 * 직원 필터링
 */
export function filterEmployees(
	employees: Employee[],
	filters: {
		department?: string;
		position?: string;
		status?: EmployeeStatus;
		employmentType?: EmploymentType;
		level?: EmployeeLevel;
	}
): Employee[] {
	return employees.filter(emp => {
		if (filters.department && emp.department !== filters.department) return false;
		if (filters.position && emp.position !== filters.position) return false;
		if (filters.status && emp.status !== filters.status) return false;
		if (filters.employmentType && emp.employmentType !== filters.employmentType) return false;
		if (filters.level && emp.level !== filters.level) return false;
		return true;
	});
}

// ===== 정렬 유틸리티 =====

/**
 * 직원 정렬 옵션
 */
export type EmployeeSortOption = 
	| 'name' 
	| 'employeeId' 
	| 'department' 
	| 'position' 
	| 'hireDate' 
	| 'status';

/**
 * 직원 목록 정렬
 */
export function sortEmployees(
	employees: Employee[],
	sortBy: EmployeeSortOption,
	direction: 'asc' | 'desc' = 'asc'
): Employee[] {
	const sorted = [...employees].sort((a, b) => {
		let aValue: string | number;
		let bValue: string | number;

		switch (sortBy) {
			case 'name':
				aValue = a.name;
				bValue = b.name;
				break;
			case 'employeeId':
				aValue = a.employeeId;
				bValue = b.employeeId;
				break;
			case 'department':
				aValue = a.department;
				bValue = b.department;
				break;
			case 'position':
				aValue = a.position;
				bValue = b.position;
				break;
			case 'hireDate':
				aValue = new Date(a.hireDate).getTime();
				bValue = new Date(b.hireDate).getTime();
				break;
			case 'status':
				aValue = a.status;
				bValue = b.status;
				break;
			default:
				return 0;
		}

		if (typeof aValue === 'string' && typeof bValue === 'string') {
			return direction === 'asc' 
				? aValue.localeCompare(bValue, 'ko')
				: bValue.localeCompare(aValue, 'ko');
		}

		if (aValue < bValue) return direction === 'asc' ? -1 : 1;
		if (aValue > bValue) return direction === 'asc' ? 1 : -1;
		return 0;
	});

	return sorted;
}

// ===== 통계 유틸리티 =====

/**
 * 부서별 직원 수 통계
 */
export function getDepartmentStats(employees: Employee[]): Record<string, number> {
	const stats: Record<string, number> = {};
	employees.forEach(emp => {
		stats[emp.department] = (stats[emp.department] || 0) + 1;
	});
	return stats;
}

/**
 * 직위별 직원 수 통계
 */
export function getPositionStats(employees: Employee[]): Record<string, number> {
	const stats: Record<string, number> = {};
	employees.forEach(emp => {
		stats[emp.position] = (stats[emp.position] || 0) + 1;
	});
	return stats;
}

/**
 * 고용 형태별 직원 수 통계
 */
export function getEmploymentTypeStats(employees: Employee[]): Record<EmploymentType, number> {
	const stats: Record<EmploymentType, number> = {
		'full-time': 0,
		'part-time': 0,
		'contract': 0,
		'intern': 0
	};
	employees.forEach(emp => {
		stats[emp.employmentType]++;
	});
	return stats;
}

// ===== 검증 유틸리티 =====

/**
 * 이메일 형식 검증
 */
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * 전화번호 형식 검증
 */
export function isValidPhone(phone: string): boolean {
	const phoneRegex = /^[0-9-+\s()]+$/;
	return phoneRegex.test(phone) && phone.length >= 10;
}

/**
 * 사번 형식 검증
 */
export function isValidEmployeeId(employeeId: string): boolean {
	return /^[A-Za-z0-9_-]+$/.test(employeeId) && employeeId.length >= 3;
}
