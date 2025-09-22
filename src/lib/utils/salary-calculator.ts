/**
 * 급여 계산 전용 유틸리티 함수들
 * 모든 급여 관련 계산을 중앙화하여 일관성 보장
 */

/**
 * 월간 급여 계산 (반올림 없이 정수로 처리)
 * @param annualSalary 연봉 (원)
 * @param participationRate 참여율 (%)
 * @returns 월간 급여 (원, 정수)
 */
export function calculateMonthlySalary(annualSalary: number, participationRate: number): number {
	if (!annualSalary || !participationRate || isNaN(annualSalary) || isNaN(participationRate)) {
		return 0
	}

	// 연봉 * (참여율/100) / 12개월
	const monthlyAmount = (annualSalary * participationRate) / 100 / 12

	// 반올림 없이 버림 처리로 정수 반환
	return Math.floor(monthlyAmount)
}

/**
 * 연봉에서 월급 계산 (반올림 없이 정수로 처리)
 * @param annualSalary 연봉 (원)
 * @returns 월급 (원, 정수)
 */
export function calculateMonthlyFromAnnual(annualSalary: number): number {
	if (!annualSalary || isNaN(annualSalary)) {
		return 0
	}

	return Math.floor(annualSalary / 12)
}

/**
 * 프로젝트 예산 항목별 배분 계산 (반올림 없이 정수로 처리)
 * @param totalBudget 총 예산 (원)
 * @param percentage 배분 비율 (%)
 * @returns 배분된 금액 (원, 정수)
 */
export function calculateBudgetAllocation(totalBudget: number, percentage: number): number {
	if (!totalBudget || !percentage || isNaN(totalBudget) || isNaN(percentage)) {
		return 0
	}

	return Math.floor((totalBudget * percentage) / 100)
}

/**
 * 급여 관련 모든 계산에서 일관된 반올림 처리
 * @param amount 계산된 금액
 * @returns 정수로 변환된 금액
 */
export function normalizeSalaryAmount(amount: number): number {
	if (!amount || isNaN(amount)) {
		return 0
	}

	return Math.floor(amount)
}
