import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'

export class AlertGenerator {
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
      logger.error('대용량 거래 알림 생성 실패:', error)
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
  }): Promise<void> {
    try {
      await query(
        `
        INSERT INTO finance_alerts (type, severity, title, message, account_id, transaction_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          alertData.type,
          alertData.severity,
          alertData.title,
          alertData.message,
          alertData.accountId || null,
          alertData.transactionId || null,
        ],
      )
    } catch (error) {
      logger.error('알림 생성 실패:', error)
    }
  }

  // 거래 생성 후 알림 체크
  async checkAlertsAfterTransaction(
    transactionId: string,
    accountId: string,
    amount: number,
  ): Promise<void> {
    try {
      // 대용량 거래 알림 체크
      await this.generateUnusualTransactionAlert(transactionId, amount, accountId)
    } catch (error) {
      logger.error('거래 후 알림 체크 실패:', error)
    }
  }
}

// 싱글톤 인스턴스
export const alertGenerator = new AlertGenerator()
