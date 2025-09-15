export function formatKRW(amount: number): string {
	return amount.toLocaleString('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 });
}

export function formatCurrency(amount: number | undefined | null): string {
	if (amount === undefined || amount === null || isNaN(amount)) {
		return '0원';
	}
	return amount.toLocaleString('ko-KR') + '원';
}

export function formatPercentage(value: number | undefined | null): string {
	if (value === undefined || value === null || isNaN(value)) {
		return '0%';
	}
	return value.toFixed(1) + '%';
}

export function formatDate(dateString: string): string {
	if (!dateString) return '';
	const date = new Date(dateString);
	return date.toLocaleDateString('ko-KR', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});
}

export function getRelativeTime(dateString: string): string {
	if (!dateString) return '';
	const date = new Date(dateString);
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
	
	if (diffInSeconds < 60) {
		return `${diffInSeconds}초 전`;
	} else if (diffInSeconds < 3600) {
		const minutes = Math.floor(diffInSeconds / 60);
		return `${minutes}분 전`;
	} else if (diffInSeconds < 86400) {
		const hours = Math.floor(diffInSeconds / 3600);
		return `${hours}시간 전`;
	} else if (diffInSeconds < 2592000) {
		const days = Math.floor(diffInSeconds / 86400);
		return `${days}일 전`;
	} else if (diffInSeconds < 31536000) {
		const months = Math.floor(diffInSeconds / 2592000);
		return `${months}개월 전`;
	} else {
		const years = Math.floor(diffInSeconds / 31536000);
		return `${years}년 전`;
	}
}

export function pct(n: number): string {
	return `${Math.round(n)}%`;
}

export function formatEmployeeId(id: number): string {
	return `V${id.toString().padStart(5, '0')}`;
}

/**
 * 한국 이름을 성+이름 순서로 표시 (띄우지 않고 붙여서)
 * @param lastName 성
 * @param firstName 이름
 * @returns 성+이름 (예: "김철수")
 */
export function formatKoreanName(lastName: string, firstName: string): string {
	if (!lastName || !firstName) {
		return `${lastName || ''}${firstName || ''}`;
	}
	return `${lastName}${firstName}`;
}

/**
 * 직원 객체에서 한국 이름을 성+이름 순서로 표시
 * @param employee 직원 객체 (last_name, first_name 속성 포함)
 * @returns 성+이름 (예: "김철수")
 */
export function formatEmployeeName(employee: { last_name?: string; first_name?: string }): string {
	return formatKoreanName(employee.last_name || '', employee.first_name || '');
}

