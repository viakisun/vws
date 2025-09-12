import type { BankAccount, Transaction, ExpectedTransaction } from '$lib/stores/funds';

export interface AIAnalysisRequest {
	bankAccounts: BankAccount[];
	transactions: Transaction[];
	expectedTransactions: ExpectedTransaction[];
	summary: {
		totalBalance: number;
		totalIncome: number;
		totalExpense: number;
		expectedIncome: number;
		expectedExpense: number;
		netIncome: number;
		expectedNetIncome: number;
	};
	analysisType: 'cost_analysis' | 'cash_flow_forecast' | 'risk_assessment' | 'optimization';
}

export interface AIAnalysisResponse {
	analysisType: string;
	summary: string;
	insights: string[];
	recommendations: string[];
	riskFactors: string[];
	metrics: {
		cashFlowHealth: number; // 0-100
		expenseRatio: number; // 0-1
		incomeStability: number; // 0-100
		riskLevel: 'low' | 'medium' | 'high';
	};
	forecast?: {
		nextMonth: {
			expectedIncome: number;
			expectedExpense: number;
			netCashFlow: number;
		};
		nextQuarter: {
			expectedIncome: number;
			expectedExpense: number;
			netCashFlow: number;
		};
	};
}

// AI 분석을 위한 프롬프트 생성
export function generateAnalysisPrompt(data: AIAnalysisRequest): string {
	const { bankAccounts, transactions, expectedTransactions, summary } = data;
	
	const prompt = `
다음은 회사의 자금 일보 데이터입니다. ${data.analysisType} 분석을 수행해주세요.

## 통장 잔고 현황
${bankAccounts.map(account => 
	`- ${account.name} (${account.bankName}): ${account.balance.toLocaleString()}원`
).join('\n')}

## 실제 거래 내역 (최근 ${transactions.length}건)
${transactions.map(transaction => 
	`- ${transaction.date}: ${transaction.description} (${transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}원) - ${transaction.category}`
).join('\n')}

## 예상 거래 내역
${expectedTransactions.map(transaction => 
	`- ${transaction.date}: ${transaction.description} (${transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}원) - ${transaction.category} [${transaction.status}] (확률: ${transaction.probability}%)`
).join('\n')}

## 요약 정보
- 총 통장 잔고: ${summary.totalBalance.toLocaleString()}원
- 실제 수입: ${summary.totalIncome.toLocaleString()}원
- 실제 지출: ${summary.totalExpense.toLocaleString()}원
- 예상 수입: ${summary.expectedIncome.toLocaleString()}원
- 예상 지출: ${summary.expectedExpense.toLocaleString()}원
- 순이익: ${summary.netIncome.toLocaleString()}원
- 예상 순이익: ${summary.expectedNetIncome.toLocaleString()}원

다음 형식으로 분석 결과를 JSON으로 제공해주세요:
{
	"analysisType": "${data.analysisType}",
	"summary": "전체적인 분석 요약",
	"insights": ["인사이트 1", "인사이트 2", "인사이트 3"],
	"recommendations": ["권장사항 1", "권장사항 2", "권장사항 3"],
	"riskFactors": ["위험요소 1", "위험요소 2"],
	"metrics": {
		"cashFlowHealth": 85,
		"expenseRatio": 0.65,
		"incomeStability": 75,
		"riskLevel": "medium"
	},
	"forecast": {
		"nextMonth": {
			"expectedIncome": 15000000,
			"expectedExpense": 10000000,
			"netCashFlow": 5000000
		},
		"nextQuarter": {
			"expectedIncome": 45000000,
			"expectedExpense": 30000000,
			"netCashFlow": 15000000
		}
	}
}
`;

	return prompt;
}

// 비용 분석을 위한 특화 함수
export function analyzeCosts(transactions: Transaction[]): {
	categories: { [key: string]: number };
	monthlyTrend: { [key: string]: number };
	topExpenses: Array<{ category: string; amount: number; percentage: number }>;
} {
	const expenses = transactions.filter(t => t.type === 'expense');
	const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
	
	// 카테고리별 집계
	const categories: { [key: string]: number } = {};
	expenses.forEach(expense => {
		categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
	});
	
	// 월별 트렌드
	const monthlyTrend: { [key: string]: number } = {};
	expenses.forEach(expense => {
		const month = expense.date.substring(0, 7); // YYYY-MM
		monthlyTrend[month] = (monthlyTrend[month] || 0) + expense.amount;
	});
	
	// 상위 지출 항목
	const topExpenses = Object.entries(categories)
		.map(([category, amount]) => ({
			category,
			amount,
			percentage: (amount / totalExpense) * 100
		}))
		.sort((a, b) => b.amount - a.amount)
		.slice(0, 5);
	
	return { categories, monthlyTrend, topExpenses };
}

// 현금 흐름 예측을 위한 함수
export function predictCashFlow(
	bankAccounts: BankAccount[],
	expectedTransactions: ExpectedTransaction[],
	months: number = 3
): Array<{
	month: string;
	startingBalance: number;
	expectedIncome: number;
	expectedExpense: number;
	endingBalance: number;
}> {
	const currentBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0);
	const predictions = [];
	
	for (let i = 0; i < months; i++) {
		const targetDate = new Date();
		targetDate.setMonth(targetDate.getMonth() + i);
		const monthKey = targetDate.toISOString().substring(0, 7);
		
		// 해당 월의 예상 거래 필터링
		const monthTransactions = expectedTransactions.filter(t => 
			t.date.startsWith(monthKey) && t.status !== 'cancelled'
		);
		
		const expectedIncome = monthTransactions
			.filter(t => t.type === 'income')
			.reduce((sum, t) => sum + (t.amount * (t.probability || 100) / 100), 0);
		
		const expectedExpense = monthTransactions
			.filter(t => t.type === 'expense')
			.reduce((sum, t) => sum + (t.amount * (t.probability || 100) / 100), 0);
		
		const startingBalance = i === 0 ? currentBalance : predictions[i - 1].endingBalance;
		const endingBalance = startingBalance + expectedIncome - expectedExpense;
		
		predictions.push({
			month: monthKey,
			startingBalance,
			expectedIncome,
			expectedExpense,
			endingBalance
		});
	}
	
	return predictions;
}

// 위험도 평가 함수
export function assessRisk(
	bankAccounts: BankAccount[],
	transactions: Transaction[],
	expectedTransactions: ExpectedTransaction[]
): {
	riskLevel: 'low' | 'medium' | 'high';
	riskFactors: string[];
	riskScore: number; // 0-100
} {
	const riskFactors: string[] = [];
	let riskScore = 0;
	
	// 현금 부족 위험
	const totalBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0);
	const monthlyExpense = transactions
		.filter(t => t.type === 'expense')
		.reduce((sum, t) => sum + t.amount, 0) / 12; // 월평균
	
	if (totalBalance < monthlyExpense * 3) {
		riskFactors.push('현금 보유량이 3개월 운영비보다 적음');
		riskScore += 30;
	}
	
	// 수입 불안정성
	const incomeTransactions = transactions.filter(t => t.type === 'income');
	const incomeVariability = calculateVariability(incomeTransactions.map(t => t.amount));
	if (incomeVariability > 0.5) {
		riskFactors.push('수입 변동성이 높음');
		riskScore += 20;
	}
	
	// 예상 거래의 불확실성
	const uncertainTransactions = expectedTransactions.filter(t => 
		t.status === 'pending' && (t.probability || 100) < 80
	);
	if (uncertainTransactions.length > 3) {
		riskFactors.push('불확실한 예상 거래가 많음');
		riskScore += 15;
	}
	
	// 지출 집중도
	const expenses = transactions.filter(t => t.type === 'expense');
	const expenseCategories = expenses.reduce((acc, t) => {
		acc[t.category] = (acc[t.category] || 0) + t.amount;
		return acc;
	}, {} as { [key: string]: number });
	
	const maxCategoryExpense = Math.max(...Object.values(expenseCategories));
	const totalExpense = Object.values(expenseCategories).reduce((sum, val) => sum + val, 0);
	
	if (maxCategoryExpense / totalExpense > 0.6) {
		riskFactors.push('특정 카테고리 지출이 과도하게 집중됨');
		riskScore += 10;
	}
	
	let riskLevel: 'low' | 'medium' | 'high' = 'low';
	if (riskScore >= 50) riskLevel = 'high';
	else if (riskScore >= 25) riskLevel = 'medium';
	
	return { riskLevel, riskFactors, riskScore };
}

// 변동성 계산 함수
function calculateVariability(values: number[]): number {
	if (values.length < 2) return 0;
	
	const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
	const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
	const standardDeviation = Math.sqrt(variance);
	
	return standardDeviation / mean;
}
