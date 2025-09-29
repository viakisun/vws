import { query } from '$lib/database/connection'
// 타입 정의
interface FinancialForecast {
  month: string
  projectedIncome: number
  projectedExpense: number
  projectedNetCashFlow: number
  projectedEndingBalance: number
}

interface AccountBalanceHistory {
  accountId: string
  date: string
  balance: number
}

export class AssetForecaster {
  // 월말 자산 예측
  async forecastMonthlyAssets(months: number = 12): Promise<FinancialForecast[]> {
    try {
      const forecasts: FinancialForecast[] = []
      const currentDate = new Date()

      // 최근 6개월 거래 데이터 분석
      const historicalData = await this.getHistoricalData(6)

      for (let i = 1; i <= months; i++) {
        const forecastDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
        const monthKey = forecastDate.toISOString().substring(0, 7) // YYYY-MM

        const forecast = await this.calculateMonthlyForecast(monthKey, historicalData)
        forecasts.push(forecast)
      }

      return forecasts
    } catch (error) {
      console.error('자산 예측 실패:', error)
      return []
    }
  }

  // 개별 계좌 잔액 예측
  async forecastAccountBalance(
    accountId: string,
    days: number = 30,
  ): Promise<AccountBalanceHistory[]> {
    try {
      const historicalBalances = await this.getAccountBalanceHistory(accountId, 90) // 최근 90일
      const forecasts: AccountBalanceHistory[] = []

      if (historicalBalances.length < 2) {
        return forecasts
      }

      // 선형 회귀를 사용한 예측
      const trend = this.calculateTrend(historicalBalances)
      const lastBalance = historicalBalances[historicalBalances.length - 1]

      for (let i = 1; i <= days; i++) {
        const forecastDate = new Date()
        forecastDate.setDate(forecastDate.getDate() + i)

        const forecastBalance = lastBalance.balance + trend * i

        forecasts.push({
          accountId,
          date: forecastDate.toISOString().split('T')[0],
          balance: Math.max(0, forecastBalance), // 음수 방지
        })
      }

      return forecasts
    } catch (error) {
      console.error('계좌 잔액 예측 실패:', error)
      return []
    }
  }

  // 현금흐름 예측
  async forecastCashFlow(months: number = 6): Promise<{
    monthlyForecasts: FinancialForecast[]
    riskFactors: string[]
    recommendations: string[]
  }> {
    try {
      const monthlyForecasts = await this.forecastMonthlyAssets(months)
      const riskFactors = this.analyzeRiskFactors(monthlyForecasts)
      const recommendations = this.generateRecommendations(monthlyForecasts, riskFactors)

      return {
        monthlyForecasts,
        riskFactors,
        recommendations,
      }
    } catch (error) {
      console.error('현금흐름 예측 실패:', error)
      return {
        monthlyForecasts: [],
        riskFactors: [],
        recommendations: [],
      }
    }
  }

  // 최근 거래 데이터 조회
  private async getHistoricalData(months: number) {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    const result = await query(
      `
      SELECT
        DATE_TRUNC('month', transaction_date) as month,
        type,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count
      FROM finance_transactions
      WHERE transaction_date >= $1
        AND status = 'completed'
      GROUP BY DATE_TRUNC('month', transaction_date), type
      ORDER BY month DESC
      `,
      [startDate.toISOString().split('T')[0]],
    )

    return result.rows
  }

  // 계좌 잔액 히스토리 조회
  private async getAccountBalanceHistory(accountId: string, days: number) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const result = await query(
      `
      SELECT
        transaction_date as date,
        SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as daily_change
      FROM finance_transactions
      WHERE account_id = $1
        AND transaction_date >= $2
        AND status = 'completed'
      GROUP BY transaction_date
      ORDER BY transaction_date
      `,
      [accountId, startDate.toISOString().split('T')[0]],
    )

    // 잔액 누적 계산
    const balances: AccountBalanceHistory[] = []
    let currentBalance = 0

    for (const row of result.rows) {
      currentBalance += parseFloat(row.daily_change)
      balances.push({
        accountId,
        date: row.date,
        balance: currentBalance,
      })
    }

    return balances
  }

  // 월별 예측 계산
  private async calculateMonthlyForecast(
    monthKey: string,
    historicalData: any[],
  ): Promise<FinancialForecast> {
    // 수입/지출 패턴 분석
    const incomePattern = this.analyzePattern(historicalData, 'income')
    const expensePattern = this.analyzePattern(historicalData, 'expense')

    // 계절성 고려 (예: 연말 보너스, 여름휴가비 등)
    const seasonalAdjustment = this.getSeasonalAdjustment(monthKey)

    const projectedIncome = incomePattern.average * seasonalAdjustment.income
    const projectedExpense = expensePattern.average * seasonalAdjustment.expense

    // 현재 총 잔액 조회
    const currentBalance = await this.getCurrentTotalBalance()

    return {
      month: monthKey,
      projectedIncome,
      projectedExpense,
      projectedNetCashFlow: projectedIncome - projectedExpense,
      projectedEndingBalance: currentBalance + (projectedIncome - projectedExpense),
    }
  }

  // 패턴 분석
  private analyzePattern(data: any[], type: string) {
    const filteredData = data.filter((row) => row.type === type)

    if (filteredData.length === 0) {
      return { average: 0, trend: 0, volatility: 0 }
    }

    const amounts = filteredData.map((row) => parseFloat(row.total_amount))
    const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length

    // 트렌드 계산 (최근 3개월 vs 이전 3개월)
    const recent = amounts.slice(0, 3)
    const previous = amounts.slice(3, 6)
    const recentAvg = recent.reduce((sum, amount) => sum + amount, 0) / recent.length
    const previousAvg = previous.reduce((sum, amount) => sum + amount, 0) / previous.length
    const trend = previousAvg > 0 ? (recentAvg - previousAvg) / previousAvg : 0

    // 변동성 계산 (표준편차)
    const variance =
      amounts.reduce((sum, amount) => sum + Math.pow(amount - average, 2), 0) / amounts.length
    const volatility = Math.sqrt(variance)

    return { average, trend, volatility }
  }

  // 계절성 조정 계수
  private getSeasonalAdjustment(monthKey: string) {
    const month = parseInt(monthKey.split('-')[1])

    // 계절성 패턴 (한국 기준)
    const seasonalPatterns = {
      income: {
        1: 1.2, // 1월: 연말정산, 보너스
        2: 0.9, // 2월: 설날
        3: 1.0, // 3월: 평상시
        4: 1.0, // 4월: 평상시
        5: 1.1, // 5월: 어린이날, 가정의날
        6: 1.0, // 6월: 평상시
        7: 1.0, // 7월: 평상시
        8: 0.9, // 8월: 여름휴가
        9: 1.0, // 9월: 평상시
        10: 1.0, // 10월: 평상시
        11: 1.0, // 11월: 평상시
        12: 1.3, // 12월: 연말 보너스, 연말정산
      },
      expense: {
        1: 1.1, // 1월: 연말 지출
        2: 1.2, // 2월: 설날 지출
        3: 1.0, // 3월: 평상시
        4: 1.0, // 4월: 평상시
        5: 1.1, // 5월: 어린이날, 가정의날
        6: 1.0, // 6월: 평상시
        7: 1.0, // 7월: 평상시
        8: 1.2, // 8월: 여름휴가
        9: 1.0, // 9월: 평상시
        10: 1.0, // 10월: 평상시
        11: 1.0, // 11월: 평상시
        12: 1.3, // 12월: 연말 지출
      },
    }

    return {
      income: seasonalPatterns.income[month] || 1.0,
      expense: seasonalPatterns.expense[month] || 1.0,
    }
  }

  // 현재 총 잔액 조회
  private async getCurrentTotalBalance(): Promise<number> {
    const result = await query(
      "SELECT SUM(balance) as total_balance FROM finance_accounts WHERE status = 'active'",
    )

    return parseFloat(result.rows[0].total_balance || 0)
  }

  // 트렌드 계산
  private calculateTrend(balances: AccountBalanceHistory[]): number {
    if (balances.length < 2) return 0

    const firstBalance = balances[0].balance
    const lastBalance = balances[balances.length - 1].balance
    const days = balances.length

    return (lastBalance - firstBalance) / days
  }

  // 리스크 요인 분석
  private analyzeRiskFactors(forecasts: FinancialForecast[]): string[] {
    const riskFactors: string[] = []

    // 연속 마이너스 현금흐름 체크
    let negativeMonths = 0
    for (const forecast of forecasts) {
      if (forecast.projectedNetCashFlow < 0) {
        negativeMonths++
      } else {
        negativeMonths = 0
      }
    }

    if (negativeMonths >= 3) {
      riskFactors.push(`${negativeMonths}개월 연속 마이너스 현금흐름 예상`)
    }

    // 잔액 부족 위험 체크
    const minBalance = Math.min(...forecasts.map((f) => f.projectedEndingBalance))
    if (minBalance < 10000000) {
      // 1천만원 미만
      riskFactors.push('예상 잔액이 1천만원 미만으로 위험')
    }

    // 지출 급증 체크
    const expenseGrowth = forecasts.slice(-3).reduce((sum, f) => sum + f.projectedExpense, 0) / 3
    const earlyExpenseGrowth =
      forecasts.slice(0, 3).reduce((sum, f) => sum + f.projectedExpense, 0) / 3

    if (expenseGrowth > earlyExpenseGrowth * 1.5) {
      riskFactors.push('지출 급증 예상')
    }

    return riskFactors
  }

  // 권장사항 생성
  private generateRecommendations(forecasts: FinancialForecast[], riskFactors: string[]): string[] {
    const recommendations: string[] = []

    if (riskFactors.length === 0) {
      recommendations.push('현재 자금 상황이 안정적입니다.')
      return recommendations
    }

    // 리스크 요인별 권장사항
    if (riskFactors.some((factor) => factor.includes('마이너스 현금흐름'))) {
      recommendations.push('수입 증대 방안 검토가 필요합니다.')
      recommendations.push('불필요한 지출을 줄이는 방안을 고려하세요.')
    }

    if (riskFactors.some((factor) => factor.includes('잔액 부족'))) {
      recommendations.push('비상 자금 확보를 위한 대출 상담을 권장합니다.')
      recommendations.push('투자 자금의 일부를 현금으로 전환을 고려하세요.')
    }

    if (riskFactors.some((factor) => factor.includes('지출 급증'))) {
      recommendations.push('예산 재검토 및 지출 통제가 필요합니다.')
      recommendations.push('고정비 절감 방안을 검토하세요.')
    }

    return recommendations
  }
}

// 싱글톤 인스턴스
export const assetForecaster = new AssetForecaster()
