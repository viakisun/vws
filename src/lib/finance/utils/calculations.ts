// 자금일보 시스템 계산 유틸리티

/**
 * 두 날짜 사이의 일수 계산
 */
export function daysBetween(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate

  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * 월의 첫째 날과 마지막 날 계산
 */
export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0) // 다음 달의 0일 = 이번 달의 마지막 날

  return { start, end }
}

/**
 * 분기의 첫째 날과 마지막 날 계산
 */
export function getQuarterRange(year: number, quarter: number): { start: Date; end: Date } {
  const startMonth = (quarter - 1) * 3 + 1
  const endMonth = quarter * 3

  const start = new Date(year, startMonth - 1, 1)
  const end = new Date(year, endMonth, 0)

  return { start, end }
}

/**
 * 연도의 첫째 날과 마지막 날 계산
 */
export function getYearRange(year: number): { start: Date; end: Date } {
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)

  return { start, end }
}

/**
 * 금액의 변화율 계산 (퍼센트)
 */
export function calculateChangeRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

/**
 * 복리 계산
 */
export function calculateCompoundInterest(
  principal: number,
  rate: number,
  time: number,
  compoundFrequency: number = 12,
): number {
  return principal * Math.pow(1 + rate / compoundFrequency, compoundFrequency * time)
}

/**
 * 월 상환액 계산 (등본금)
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  months: number,
): number {
  const monthlyRate = annualRate / 12 / 100
  if (monthlyRate === 0) return principal / months

  return (
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
    (Math.pow(1 + monthlyRate, months) - 1)
  )
}

/**
 * 대출 잔액 계산
 */
export function calculateLoanBalance(
  principal: number,
  annualRate: number,
  totalMonths: number,
  paidMonths: number,
): number {
  const monthlyRate = annualRate / 12 / 100
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, totalMonths)

  if (monthlyRate === 0) {
    return principal - monthlyPayment * paidMonths
  }

  return (
    principal * Math.pow(1 + monthlyRate, paidMonths) -
    (monthlyPayment * (Math.pow(1 + monthlyRate, paidMonths) - 1)) / monthlyRate
  )
}

/**
 * 투자 수익률 계산 (CAGR)
 */
export function calculateCAGR(initialValue: number, finalValue: number, years: number): number {
  if (initialValue <= 0 || years <= 0) return 0
  return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100
}

/**
 * 포트폴리오 가중 평균 수익률 계산
 */
export function calculateWeightedAverageReturn(returns: number[], weights: number[]): number {
  if (returns.length !== weights.length) return 0

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  if (totalWeight === 0) return 0

  return returns.reduce((sum, ret, index) => sum + ret * weights[index], 0) / totalWeight
}

/**
 * 위험 조정 수익률 계산 (샤프 비율)
 */
export function calculateSharpeRatio(
  portfolioReturn: number,
  riskFreeRate: number,
  portfolioVolatility: number,
): number {
  if (portfolioVolatility === 0) return 0
  return (portfolioReturn - riskFreeRate) / portfolioVolatility
}

/**
 * 예산 사용률 계산
 */
export function calculateBudgetUtilization(planned: number, actual: number): number {
  if (planned === 0) return actual > 0 ? 100 : 0
  return (actual / planned) * 100
}

/**
 * 예산 초과 여부 확인
 */
export function isOverBudget(planned: number, actual: number, threshold: number = 100): boolean {
  return calculateBudgetUtilization(planned, actual) > threshold
}

/**
 * 현금흐름 분석
 */
export function analyzeCashFlow(
  inflows: number[],
  outflows: number[],
): {
  netCashFlow: number
  operatingCashFlow: number
  freeCashFlow: number
  cashFlowTrend: 'positive' | 'negative' | 'stable'
} {
  const totalInflow = inflows.reduce((sum, inflow) => sum + inflow, 0)
  const totalOutflow = outflows.reduce((sum, outflow) => sum + outflow, 0)
  const netCashFlow = totalInflow - totalOutflow

  // 간단한 트렌드 분석 (최근 3개월 기준)
  const recentInflows = inflows.slice(-3)
  const recentOutflows = outflows.slice(-3)
  const recentNetFlow =
    recentInflows.reduce((sum, inflow) => sum + inflow, 0) -
    recentOutflows.reduce((sum, outflow) => sum + outflow, 0)

  let cashFlowTrend: 'positive' | 'negative' | 'stable' = 'stable'
  if (recentNetFlow > 0) {
    cashFlowTrend = 'positive'
  } else if (recentNetFlow < 0) {
    cashFlowTrend = 'negative'
  }

  return {
    netCashFlow,
    operatingCashFlow: netCashFlow, // 간단히 동일하게 설정
    freeCashFlow: netCashFlow, // 간단히 동일하게 설정
    cashFlowTrend,
  }
}

/**
 * 자금 예측 (간단한 선형 회귀)
 */
export function predictFutureBalance(historicalBalances: number[], days: number): number {
  if (historicalBalances.length < 2) return historicalBalances[0] || 0

  // 간단한 평균 변화율 계산
  const changes: number[] = []
  for (let i = 1; i < historicalBalances.length; i++) {
    changes.push(historicalBalances[i] - historicalBalances[i - 1])
  }

  const averageChange = changes.reduce((sum, change) => sum + change, 0) / changes.length
  const lastBalance = historicalBalances[historicalBalances.length - 1]

  return lastBalance + averageChange * days
}

/**
 * 계좌 잔액 변화 추적
 */
export function trackBalanceChanges(
  balances: Array<{ date: string; balance: number }>,
): Array<{ date: string; balance: number; change: number; changeRate: number }> {
  return balances.map((current, index) => {
    const previous = index > 0 ? balances[index - 1] : null
    const change = previous ? current.balance - previous.balance : 0
    const changeRate = previous ? calculateChangeRate(current.balance, previous.balance) : 0

    return {
      date: current.date,
      balance: current.balance,
      change,
      changeRate,
    }
  })
}

/**
 * 거래 패턴 분석
 */
export function analyzeTransactionPatterns(
  transactions: Array<{ date: string; amount: number; type: string }>,
): {
  averageDailyAmount: number
  mostActiveDay: string
  largestTransaction: number
  smallestTransaction: number
  transactionFrequency: number
} {
  if (transactions.length === 0) {
    return {
      averageDailyAmount: 0,
      mostActiveDay: '',
      largestTransaction: 0,
      smallestTransaction: 0,
      transactionFrequency: 0,
    }
  }

  const amounts = transactions.map((t) => Math.abs(t.amount))
  const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0)

  // 일별 거래 건수 계산
  const dayCounts: Record<string, number> = {}
  transactions.forEach((t) => {
    const day = new Date(t.date).getDay()
    const dayName = ['일', '월', '화', '수', '목', '금', '토'][day]
    dayCounts[dayName] = (dayCounts[dayName] || 0) + 1
  })

  const mostActiveDay = Object.entries(dayCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || ''

  // 거래 빈도 계산 (일당 평균)
  const dateRange = daysBetween(transactions[0].date, transactions[transactions.length - 1].date)
  const transactionFrequency = dateRange > 0 ? transactions.length / dateRange : 0

  return {
    averageDailyAmount: totalAmount / Math.max(dateRange, 1),
    mostActiveDay,
    largestTransaction: Math.max(...amounts),
    smallestTransaction: Math.min(...amounts),
    transactionFrequency,
  }
}
