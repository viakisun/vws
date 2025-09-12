export function formatKRW(amount: number): string {
	return amount.toLocaleString('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 });
}

export function formatCurrency(amount: number): string {
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

