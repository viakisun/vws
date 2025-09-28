import { getDatabasePool } from '../database/connection'

export interface FinancialHealthScore {
  overallScore: number // 전체 점수 (0-100)
  categories: {
    liquidity: number // 유동성 점수
    profitability: number // 수익성 점수
    stability: number // 안정성 점수
    growth: number // 성장성 점수
  }
  recommendations: string[]
  riskFactors: string[]
  trends: {
    score: number
    direction: 'improving' | 'stable' | 'declining'
    period: string
  }
}

export class FinancialHealthAnalyzer {
  private pool = getDatabasePool()

  // 전체 재무 건강도 분석
  async analyzeFinancialHealth(): Promise<FinancialHealthScore> {
    try {
      // 기본 데이터 수집
      const [
        currentBalance,
        monthlyIncome,
        monthlyExpense,
        accountCount,
        transactionCount,
        budgetData,
        loanData,
      ] = await Promise.all([
        this.getCurrentTotalBalance(),
        this.getMonthlyIncome(),
        this.getMonthlyExpense(),
        this.getActiveAccountCount(),
        this.getTransactionCount(),
        this.getBudgetData(),
        this.getLoanData(),
      ])

      // 각 카테고리별 점수 계산
      const liquidity = this.calculateLiquidityScore(currentBalance, monthlyExpense)
      const profitability = this.calculateProfitabilityScore(monthlyIncome, monthlyExpense)
      const stability = this.calculateStabilityScore(accountCount, budgetData, loanData)
      const growth = this.calculateGrowthScore(transactionCount, monthlyIncome)

      // 전체 점수 계산 (가중 평균)
      const overallScore = Math.round(
        liquidity * 0.3 + profitability * 0.3 + stability * 0.25 + growth * 0.15,
      )

      // 권장사항 및 리스크 요인 생성
      const recommendations = this.generateRecommendations({
        liquidity,
        profitability,
        stability,
        growth,
        currentBalance,
        monthlyIncome,
        monthlyExpense,
      })

      const riskFactors = this.identifyRiskFactors({
        liquidity,
        profitability,
        stability,
        growth,
        currentBalance,
        monthlyExpense,
      })

      // 트렌드 분석
      const trends = await this.analyzeTrends()

      return {
        overallScore,
        categories: {
          liquidity,
          profitability,
          stability,
          growth,
        },
        recommendations,
        riskFactors,
        trends: trends as {
          score: number
          direction: 'improving' | 'stable' | 'declining'
          period: string
        },
      }
    } catch (error) {
      console.error('재무 건강도 분석 실패:', error)
      return {
        overallScore: 0,
        categories: {
          liquidity: 0,
          profitability: 0,
          stability: 0,
          growth: 0,
        },
        recommendations: ['데이터 분석에 실패했습니다.'],
        riskFactors: ['시스템 오류가 발생했습니다.'],
        trends: {
          score: 0,
          direction: 'stable' as 'improving' | 'stable' | 'declining',
          period: 'N/A',
        },
      }
    }
  }

  // 유동성 점수 계산 (현금 보유량과 월 지출 대비)
  private calculateLiquidityScore(currentBalance: number, monthlyExpense: number): number {
    if (monthlyExpense === 0) return 100

    const monthsOfExpenses = currentBalance / monthlyExpense

    if (monthsOfExpenses >= 12) return 100
    if (monthsOfExpenses >= 6) return 80
    if (monthsOfExpenses >= 3) return 60
    if (monthsOfExpenses >= 1) return 40
    return 20
  }

  // 수익성 점수 계산 (수입 대비 지출)
  private calculateProfitabilityScore(monthlyIncome: number, monthlyExpense: number): number {
    if (monthlyIncome === 0) return 0

    const profitMargin = (monthlyIncome - monthlyExpense) / monthlyIncome

    if (profitMargin >= 0.3) return 100
    if (profitMargin >= 0.2) return 80
    if (profitMargin >= 0.1) return 60
    if (profitMargin >= 0) return 40
    return 20
  }

  // 안정성 점수 계산 (계좌 다양성, 예산 관리, 대출 관리)
  private calculateStabilityScore(accountCount: number, budgetData: any, loanData: any): number {
    let score = 0

    // 계좌 다양성 (20점)
    if (accountCount >= 5) score += 20
    else if (accountCount >= 3) score += 15
    else if (accountCount >= 2) score += 10
    else score += 5

    // 예산 관리 (40점)
    if (budgetData.totalBudgets >= 10) score += 40
    else if (budgetData.totalBudgets >= 5) score += 30
    else if (budgetData.totalBudgets >= 3) score += 20
    else if (budgetData.totalBudgets >= 1) score += 10

    // 예산 준수율 (40점)
    if (budgetData.complianceRate >= 0.9) score += 40
    else if (budgetData.complianceRate >= 0.8) score += 30
    else if (budgetData.complianceRate >= 0.7) score += 20
    else if (budgetData.complianceRate >= 0.6) score += 10

    return Math.min(score, 100)
  }

  // 성장성 점수 계산 (거래 활동, 수입 증가)
  private calculateGrowthScore(transactionCount: number, monthlyIncome: number): number {
    let score = 0

    // 거래 활동 (50점)
    if (transactionCount >= 100) score += 50
    else if (transactionCount >= 50) score += 40
    else if (transactionCount >= 20) score += 30
    else if (transactionCount >= 10) score += 20
    else score += 10

    // 수입 수준 (50점)
    if (monthlyIncome >= 10000000)
      score += 50 // 1천만원 이상
    else if (monthlyIncome >= 5000000)
      score += 40 // 5백만원 이상
    else if (monthlyIncome >= 3000000)
      score += 30 // 3백만원 이상
    else if (monthlyIncome >= 1000000)
      score += 20 // 1백만원 이상
    else score += 10

    return Math.min(score, 100)
  }

  // 권장사항 생성
  private generateRecommendations(data: any): string[] {
    const recommendations: string[] = []

    // 유동성 관련
    if (data.liquidity < 60) {
      recommendations.push('비상 자금을 확보하여 유동성을 개선하세요.')
    }

    // 수익성 관련
    if (data.profitability < 60) {
      recommendations.push('수입 증대 또는 지출 절감 방안을 검토하세요.')
    }

    // 안정성 관련
    if (data.stability < 60) {
      recommendations.push('예산 관리 시스템을 강화하고 계좌를 다양화하세요.')
    }

    // 성장성 관련
    if (data.growth < 60) {
      recommendations.push('사업 확장이나 투자 기회를 검토하세요.')
    }

    // 긍정적 권장사항
    if (data.liquidity >= 80) {
      recommendations.push('우수한 유동성 상태입니다. 투자 기회를 고려해보세요.')
    }

    if (data.profitability >= 80) {
      recommendations.push('수익성이 우수합니다. 사업 확장을 검토해보세요.')
    }

    return recommendations
  }

  // 리스크 요인 식별
  private identifyRiskFactors(data: any): string[] {
    const riskFactors: string[] = []

    if (data.liquidity < 40) {
      riskFactors.push('유동성 부족 위험')
    }

    if (data.profitability < 40) {
      riskFactors.push('수익성 저하 위험')
    }

    if (data.currentBalance < data.monthlyExpense * 2) {
      riskFactors.push('현금 부족 위험')
    }

    if (data.monthlyExpense > data.monthlyIncome) {
      riskFactors.push('지속적 손실 위험')
    }

    return riskFactors
  }

  // 트렌드 분석
  private async analyzeTrends(): Promise<{ score: number; direction: string; period: string }> {
    try {
      // 최근 3개월 vs 이전 3개월 비교
      const recentData = await this.getRecentTrendData(3)
      const previousData = await this.getRecentTrendData(6, 3)

      const recentScore = this.calculateTrendScore(recentData)
      const previousScore = this.calculateTrendScore(previousData)

      let direction: 'improving' | 'stable' | 'declining' = 'stable'
      if (recentScore > previousScore + 5) direction = 'improving'
      else if (recentScore < previousScore - 5) direction = 'declining'

      return {
        score: recentScore,
        direction: direction as 'improving' | 'stable' | 'declining',
        period: '최근 3개월',
      }
    } catch (error) {
      return {
        score: 0,
        direction: 'stable',
        period: 'N/A',
      }
    }
  }

  // 헬퍼 메서드들
  private async getCurrentTotalBalance(): Promise<number> {
    const result = await this.pool.query(
      "SELECT SUM(balance) as total FROM finance_accounts WHERE status = 'active'",
    )
    return parseFloat(result.rows[0].total || 0)
  }

  private async getMonthlyIncome(): Promise<number> {
    const result = await this.pool.query(
      `
      SELECT SUM(amount) as total
      FROM finance_transactions
      WHERE type = 'income'
        AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
        AND status = 'completed'
      `,
    )
    return parseFloat(result.rows[0].total || 0)
  }

  private async getMonthlyExpense(): Promise<number> {
    const result = await this.pool.query(
      `
      SELECT SUM(amount) as total
      FROM finance_transactions
      WHERE type = 'expense'
        AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
        AND status = 'completed'
      `,
    )
    return parseFloat(result.rows[0].total || 0)
  }

  private async getActiveAccountCount(): Promise<number> {
    const result = await this.pool.query(
      "SELECT COUNT(*) as count FROM finance_accounts WHERE status = 'active'",
    )
    return parseInt(result.rows[0].count || 0)
  }

  private async getTransactionCount(): Promise<number> {
    const result = await this.pool.query(
      "SELECT COUNT(*) as count FROM finance_transactions WHERE status = 'completed'",
    )
    return parseInt(result.rows[0].count || 0)
  }

  private async getBudgetData(): Promise<{ totalBudgets: number; complianceRate: number }> {
    const result = await this.pool.query(
      `
      SELECT
        COUNT(*) as total_budgets,
        AVG(CASE WHEN actual_amount <= planned_amount THEN 1.0 ELSE 0.0 END) as compliance_rate
      FROM finance_budgets
      WHERE status = 'active'
      `,
    )

    return {
      totalBudgets: parseInt(result.rows[0].total_budgets || 0),
      complianceRate: parseFloat(result.rows[0].compliance_rate || 0),
    }
  }

  private async getLoanData(): Promise<any> {
    const result = await this.pool.query('SELECT COUNT(*) as count FROM finance_loans')
    return { totalLoans: parseInt(result.rows[0].count || 0) }
  }

  private async getRecentTrendData(months: number, offset: number = 0): Promise<any> {
    const result = await this.pool.query(
      `
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
        COUNT(*) as transaction_count
      FROM finance_transactions
      WHERE transaction_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '${months + offset} months'
        AND transaction_date < DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '${offset} months'
        AND status = 'completed'
      `,
    )

    return result.rows[0]
  }

  private calculateTrendScore(data: any): number {
    const income = parseFloat(data.income || 0)
    const expense = parseFloat(data.expense || 0)
    const transactionCount = parseInt(data.transaction_count || 0)

    if (income === 0) return 0

    const profitMargin = (income - expense) / income
    const activityScore = Math.min(transactionCount / 10, 1) * 50

    return Math.round(profitMargin * 50 + activityScore)
  }
}

// 싱글톤 인스턴스
export const financialHealthAnalyzer = new FinancialHealthAnalyzer()
