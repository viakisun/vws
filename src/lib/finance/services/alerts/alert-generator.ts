import { query } from '$lib/database/connection'

export class AlertGenerator {
  // 예산 초과 알림 생성
  async generateBudgetExceededAlert(
    budgetId: string,
    plannedAmount: number,
    actualAmount: number,
  ): Promise<void> {
    try {
      const budget = await query('SELECT name, category_id FROM finance_budgets WHERE id = $1', [
        budgetId,
      ])

      if (budget.rows.length === 0) return

      const budgetName = budget.rows[0].name
      const overAmount = actualAmount - plannedAmount
      const overPercentage = (actualAmount / plannedAmount) * 100 - 100

      const alert = {
        type: 'budget_exceeded',
        severity: overPercentage > 20 ? 'high' : overPercentage > 10 ? 'medium' : 'low',
        title: `예산 초과: ${budgetName}`,
        message: `${budgetName} 예산이 ${overPercentage.toFixed(1)}% 초과되었습니다. (초과 금액: ₩${overAmount.toLocaleString()})`,
        budgetId,
      }

      await this.createAlert(alert)
    } catch (error) {
      console.error('예산 초과 알림 생성 실패:', error)
    }
  }

  // 잔액 부족 알림 생성
  async generateLowBalanceAlert(accountId: string, currentBalance: number): Promise<void> {
    try {
      const account = await query(
        'SELECT name, alert_threshold FROM finance_accounts WHERE id = $1',
        [accountId],
      )

      if (account.rows.length === 0) return

      const accountName = account.rows[0].name
      const alertThreshold = account.rows[0].alert_threshold

      if (alertThreshold && currentBalance < alertThreshold) {
        const alert = {
          type: 'low_balance',
          severity: currentBalance < alertThreshold * 0.5 ? 'high' : 'medium',
          title: `잔액 부족: ${accountName}`,
          message: `${accountName}의 잔액이 ₩${alertThreshold.toLocaleString()} 미만입니다. (현재: ₩${currentBalance.toLocaleString()})`,
          accountId,
        }

        await this.createAlert(alert)
      }
    } catch (error) {
      console.error('잔액 부족 알림 생성 실패:', error)
    }
  }

  // 대용량 거래 알림 생성
  async generateUnusualTransactionAlert(
    transactionId: string,
    amount: number,
    accountId: string,
  ): Promise<void> {
    try {
      // 평균 거래 금액의 3배 이상인 경우 알림
      const avgAmount = await query(
        "SELECT AVG(amount) as avg_amount FROM finance_transactions WHERE account_id = $1 AND created_at >= NOW() - INTERVAL '30 days'",
        [accountId],
      )

      const averageAmount = parseFloat(avgAmount.rows[0].avg_amount || 0)
      const threshold = averageAmount * 3

      if (amount > threshold && averageAmount > 0) {
        const account = await query('SELECT name FROM finance_accounts WHERE id = $1', [accountId])

        if (account.rows.length === 0) return

        const accountName = account.rows[0].name
        const alert = {
          type: 'unusual_transaction',
          severity: amount > threshold * 2 ? 'high' : 'medium',
          title: `대용량 거래 감지: ${accountName}`,
          message: `${accountName}에서 평균 거래 금액의 ${(amount / averageAmount).toFixed(1)}배인 ₩${amount.toLocaleString()} 거래가 발생했습니다.`,
          accountId,
          transactionId,
        }

        await this.createAlert(alert)
      }
    } catch (error) {
      console.error('대용량 거래 알림 생성 실패:', error)
    }
  }

  // 알림 생성 헬퍼 함수
  private async createAlert(alertData: {
    type: string
    severity: string
    title: string
    message: string
    accountId?: string
    transactionId?: string
    budgetId?: string
  }): Promise<void> {
    try {
      await query(
        `
        INSERT INTO finance_alerts (type, severity, title, message, account_id, transaction_id, budget_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          alertData.type,
          alertData.severity,
          alertData.title,
          alertData.message,
          alertData.accountId || null,
          alertData.transactionId || null,
          alertData.budgetId || null,
        ],
      )
    } catch (error) {
      console.error('알림 생성 실패:', error)
    }
  }

  // 거래 생성 후 알림 체크
  async checkAlertsAfterTransaction(
    transactionId: string,
    accountId: string,
    amount: number,
    categoryId: string,
  ): Promise<void> {
    try {
      // 1. 대용량 거래 알림 체크
      await this.generateUnusualTransactionAlert(transactionId, amount, accountId)

      // 2. 예산 초과 알림 체크
      const budgets = await query(
        "SELECT id, planned_amount FROM finance_budgets WHERE category_id = $1 AND status = 'active'",
        [categoryId],
      )

      for (const budget of budgets.rows) {
        const actualAmount = await query(
          `
          SELECT COALESCE(SUM(amount), 0) as total
          FROM finance_transactions
          WHERE category_id = $1
            AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
            AND transaction_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
          `,
          [categoryId],
        )

        const totalActual = parseFloat(actualAmount.rows[0].total)
        const plannedAmount = parseFloat(budget.planned_amount)

        if (totalActual > plannedAmount) {
          await this.generateBudgetExceededAlert(budget.id, plannedAmount, totalActual)
        }
      }

      // 3. 잔액 부족 알림 체크
      const account = await query('SELECT balance FROM finance_accounts WHERE id = $1', [accountId])

      if (account.rows.length > 0) {
        const currentBalance = parseFloat(account.rows[0].balance)
        await this.generateLowBalanceAlert(accountId, currentBalance)
      }
    } catch (error) {
      console.error('거래 후 알림 체크 실패:', error)
    }
  }
}

// 싱글톤 인스턴스
export const alertGenerator = new AlertGenerator()
