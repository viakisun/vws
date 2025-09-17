// 글로벌 팩터 관리 스토어
import { writable } from 'svelte/store';

export interface GlobalFactors {
	salaryMultiplier: number; // 급여 배수 (기본값: 1.15)
	participationRateBase: number; // 참여율 기준 (기본값: 100)
}

// 기본값 설정
const defaultFactors: GlobalFactors = {
	salaryMultiplier: 1.15,
	participationRateBase: 100
};

// 스토어 생성
export const globalFactors = writable<GlobalFactors>(defaultFactors);

// 팩터 업데이트 함수
export function updateGlobalFactors(factors: Partial<GlobalFactors>) {
	globalFactors.update(current => ({
		...current,
		...factors
	}));
}

// 급여 배수 가져오기
export function getSalaryMultiplier(): number {
	let multiplier = defaultFactors.salaryMultiplier;
	globalFactors.subscribe(factors => {
		multiplier = factors.salaryMultiplier;
	})();
	return multiplier;
}

// 참여율에 따른 월간 금액 계산
export function calculateMonthlyAmount(contractAmount: number, participationRate: number): number {
	let multiplier = defaultFactors.salaryMultiplier;
	globalFactors.subscribe(factors => {
		multiplier = factors.salaryMultiplier;
	})();
	
	return Math.round(contractAmount * multiplier * (participationRate / 100));
}

// 현금/현물 구분 금액 계산
export function calculateContributionAmounts(
	contractAmount: number, 
	participationRate: number, 
	contributionType: 'cash' | 'in_kind'
): { cash: number; inKind: number } {
	const monthlyAmount = calculateMonthlyAmount(contractAmount, participationRate);
	
	if (contributionType === 'cash') {
		return { cash: monthlyAmount, inKind: 0 };
	} else {
		return { cash: 0, inKind: monthlyAmount };
	}
}
