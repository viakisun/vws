export function formatKRW(amount: number): string {
	return amount.toLocaleString('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 });
}

export function pct(n: number): string {
	return `${Math.round(n)}%`;
}

