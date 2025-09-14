export function formatKRW(amount: number): string {
	return amount.toLocaleString('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 });
}

export function formatCurrency(amount: number | undefined | null): string {
	if (amount === undefined || amount === null || isNaN(amount)) {
		return '0원';
	}
	return amount.toLocaleString('ko-KR') + '원';
}

export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString('ko-KR', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});
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

