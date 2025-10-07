import { query } from '$lib/database/connection'
import { financialHealthAnalyzer } from '../analysis/financial-health'
import { emailService } from '../email/email-service'
import { assetForecaster } from '../forecasting/asset-forecaster'
import { logger } from '$lib/utils/logger'

export interface ScheduledReport {
  id: string
  name: string
  type: 'daily' | 'weekly' | 'monthly'
  schedule: string // cron expression
  isActive: boolean
  lastRun?: string
  nextRun?: string
  recipients: string[]
  templateId: string
}

export class ReportScheduler {
  private schedules: Map<string, ScheduledReport> = new Map()
  private intervalId?: NodeJS.Timeout

  constructor() {
    this.initializeSchedules()
  }

  // 스케줄러 시작
  start(): void {
    logger.info('📅 리포트 스케줄러를 시작합니다...')

    // 매분마다 스케줄 확인
    this.intervalId = setInterval(() => {
      this.checkSchedules()
    }, 60000) // 1분마다

    // 초기 실행
    this.checkSchedules()
  }

  // 스케줄러 중지
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
      logger.info('📅 리포트 스케줄러를 중지했습니다.')
    }
  }

  // 스케줄 확인 및 실행
  private async checkSchedules(): Promise<void> {
    const now = new Date()

    for (const [id, schedule] of this.schedules) {
      if (!schedule.isActive) continue

      const shouldRun = this.shouldRunSchedule(schedule, now)
      if (shouldRun) {
        logger.info(`📊 스케줄된 리포트 실행: ${schedule.name}`)
        await this.executeSchedule(schedule)

        // 마지막 실행 시간 업데이트
        schedule.lastRun = now.toISOString()
        schedule.nextRun = this.calculateNextRun(schedule, now)
      }
    }
  }

  // 스케줄 실행 여부 확인
  private shouldRunSchedule(schedule: ScheduledReport, now: Date): boolean {
    if (!schedule.lastRun) return true

    const lastRun = new Date(schedule.lastRun)
    const timeDiff = now.getTime() - lastRun.getTime()

    switch (schedule.type) {
      case 'daily':
        return timeDiff >= 24 * 60 * 60 * 1000 // 24시간
      case 'weekly':
        return timeDiff >= 7 * 24 * 60 * 60 * 1000 // 7일
      case 'monthly':
        return timeDiff >= 30 * 24 * 60 * 60 * 1000 // 30일
      default:
        return false
    }
  }

  // 스케줄 실행
  private async executeSchedule(schedule: ScheduledReport): Promise<void> {
    try {
      switch (schedule.type) {
        case 'daily':
          await this.executeDailyReport(schedule)
          break
        case 'weekly':
          await this.executeWeeklyReport(schedule)
          break
        case 'monthly':
          await this.executeMonthlyReport(schedule)
          break
      }
    } catch (error) {
      logger.error(`스케줄 실행 실패 (${schedule.name}):`, error)
    }
  }

  // 일일 리포트 실행
  private async executeDailyReport(schedule: ScheduledReport): Promise<void> {
    const today = new Date().toISOString().split('T')[0]

    // 일일 리포트 데이터 생성
    const reportData = await this.generateDailyReportData(today)

    // 이메일 발송
    await emailService.sendDailyReport(today, reportData)
  }

  // 주간 리포트 실행
  private async executeWeeklyReport(schedule: ScheduledReport): Promise<void> {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)

    // 주간 리포트 데이터 생성
    const reportData = await this.generateWeeklyReportData(startDate, endDate)

    // 이메일 발송 (일일 리포트 템플릿 재사용)
    await emailService.sendTemplateEmail('daily-report', schedule.recipients, {
      date: `${startDate.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]}`,
      currentBalance: reportData.currentBalance,
      todayIncome: reportData.totalIncome,
      todayExpense: reportData.totalExpense,
      netCashFlow: reportData.netCashFlow,
      accountCount: reportData.accountCount,
      transactionCount: reportData.transactionCount,
      alerts: reportData.alerts,
    })
  }

  // 월간 리포트 실행
  private async executeMonthlyReport(schedule: ScheduledReport): Promise<void> {
    const endDate = new Date()
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
    const monthKey = startDate.toISOString().substring(0, 7)

    // 월간 리포트 데이터 생성
    const reportData = await this.generateMonthlyReportData(startDate, endDate)

    // 이메일 발송
    await emailService.sendMonthlyReport(monthKey, reportData)
  }

  // 일일 리포트 데이터 생성
  private async generateDailyReportData(date: string): Promise<any> {
    try {
      // 현재 총 잔액
      const balanceResult = await query(
        "SELECT SUM(balance) as total FROM finance_accounts WHERE status = 'active'",
      )
      const currentBalance = parseFloat(balanceResult.rows[0].total || 0)

      // 당일 거래 내역
      const transactionResult = await query(
        `
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
        COUNT(*) as count
      FROM finance_transactions
      WHERE transaction_date = $1 AND status = 'completed'
      `,
        [date],
      )

      const todayIncome = parseFloat(transactionResult.rows[0].income || 0)
      const todayExpense = parseFloat(transactionResult.rows[0].expense || 0)
      const transactionCount = parseInt(transactionResult.rows[0].count || 0)

      // 계좌 수
      const accountResult = await query(
        "SELECT COUNT(*) as count FROM finance_accounts WHERE status = 'active'",
      )
      const accountCount = parseInt(accountResult.rows[0].count || 0)

      // 알림 생성
      const alerts: string[] = []
      const netCashFlow = todayIncome - todayExpense
      if (netCashFlow < 0) {
        alerts.push(`당일 현금흐름이 마이너스입니다. (₩${Math.abs(netCashFlow).toLocaleString()})`)
      }

      return {
        currentBalance,
        todayIncome,
        todayExpense,
        netCashFlow,
        accountCount,
        transactionCount,
        alerts,
      }
    } catch (error) {
      logger.error('일일 리포트 데이터 생성 실패:', error)
      // 데이터베이스가 없거나 연결 실패 시 기본값 반환
      return {
        currentBalance: 0,
        todayIncome: 0,
        todayExpense: 0,
        netCashFlow: 0,
        accountCount: 0,
        transactionCount: 0,
        alerts: ['데이터베이스 연결 실패'],
      }
    }
  }

  // 주간 리포트 데이터 생성
  private async generateWeeklyReportData(startDate: Date, endDate: Date): Promise<any> {
    try {
      // 주간 거래 내역
      const transactionResult = await query(
        `
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
        COUNT(*) as count
      FROM finance_transactions
      WHERE transaction_date >= $1 AND transaction_date <= $2 AND status = 'completed'
      `,
        [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
      )

      const totalIncome = parseFloat(transactionResult.rows[0].income || 0)
      const totalExpense = parseFloat(transactionResult.rows[0].expense || 0)
      const transactionCount = parseInt(transactionResult.rows[0].count || 0)

      // 현재 총 잔액
      const balanceResult = await query(
        "SELECT SUM(balance) as total FROM finance_accounts WHERE status = 'active'",
      )
      const currentBalance = parseFloat(balanceResult.rows[0].total || 0)

      // 계좌 수
      const accountResult = await query(
        "SELECT COUNT(*) as count FROM finance_accounts WHERE status = 'active'",
      )
      const accountCount = parseInt(accountResult.rows[0].count || 0)

      // 알림 생성
      const alerts: string[] = []
      const netCashFlow = totalIncome - totalExpense
      if (netCashFlow < 0) {
        alerts.push(`주간 현금흐름이 마이너스입니다. (₩${Math.abs(netCashFlow).toLocaleString()})`)
      }

      return {
        currentBalance,
        totalIncome,
        totalExpense,
        netCashFlow,
        accountCount,
        transactionCount,
        alerts,
      }
    } catch (error) {
      logger.error('주간 리포트 데이터 생성 실패:', error)
      return {
        currentBalance: 0,
        totalIncome: 0,
        totalExpense: 0,
        netCashFlow: 0,
        accountCount: 0,
        transactionCount: 0,
        alerts: ['데이터베이스 연결 실패'],
      }
    }
  }

  // 월간 리포트 데이터 생성
  private async generateMonthlyReportData(startDate: Date, endDate: Date): Promise<any> {
    try {
      // 월간 거래 내역
      const transactionResult = await query(
        `
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
        COUNT(*) as count
      FROM finance_transactions
      WHERE transaction_date >= $1 AND transaction_date <= $2 AND status = 'completed'
      `,
        [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
      )

      const totalIncome = parseFloat(transactionResult.rows[0].income || 0)
      const totalExpense = parseFloat(transactionResult.rows[0].expense || 0)
      const transactionCount = parseInt(transactionResult.rows[0].count || 0)

      // 계좌별 요약
      const accountResult = await query(
        `
      SELECT name, balance
      FROM finance_accounts
      WHERE status = 'active'
      ORDER BY balance DESC
      `,
      )
      const accountSummaries = accountResult.rows.map((row) => ({
        name: row.name,
        balance: parseFloat(row.balance),
      }))

      // 예산 분석
      const budgetResult = await query(
        `
      SELECT
        name,
        planned_amount,
        actual_amount,
        (actual_amount / planned_amount * 100) as utilization_rate
      FROM finance_budgets
      WHERE status = 'active'
      ORDER BY utilization_rate DESC
      `,
      )
      const budgetAnalyses = budgetResult.rows.map((row) => ({
        name: row.name,
        plannedAmount: parseFloat(row.planned_amount),
        actualAmount: parseFloat(row.actual_amount),
        utilizationRate: parseFloat(row.utilization_rate),
      }))

      // 자산 예측
      const forecasts = await assetForecaster.forecastMonthlyAssets(3)

      // 재무 건강도
      const healthScore = await financialHealthAnalyzer.analyzeFinancialHealth()

      return {
        totalIncome,
        totalExpense,
        netCashFlow: totalIncome - totalExpense,
        accountSummaries,
        budgetAnalyses,
        forecasts,
        healthScore: healthScore.overallScore,
      }
    } catch (error) {
      logger.error('월간 리포트 데이터 생성 실패:', error)
      return {
        totalIncome: 0,
        totalExpense: 0,
        netCashFlow: 0,
        accountSummaries: [],
        budgetAnalyses: [],
        forecasts: [],
        healthScore: 0,
      }
    }
  }

  // 다음 실행 시간 계산
  private calculateNextRun(schedule: ScheduledReport, now: Date): string {
    const nextRun = new Date(now)

    switch (schedule.type) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1)
        nextRun.setHours(8, 0, 0, 0) // 다음날 오전 8시
        break
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7)
        nextRun.setHours(9, 0, 0, 0) // 다음주 월요일 오전 9시
        break
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1)
        nextRun.setDate(1)
        nextRun.setHours(10, 0, 0, 0) // 다음달 1일 오전 10시
        break
    }

    return nextRun.toISOString()
  }

  // 스케줄 초기화
  private initializeSchedules(): void {
    // 일일 리포트 스케줄
    this.schedules.set('daily-report', {
      id: 'daily-report',
      name: '일일 자금일보',
      type: 'daily',
      schedule: '0 8 * * *', // 매일 오전 8시
      isActive: true,
      recipients: ['ceo@company.com', 'cfo@company.com'],
      templateId: 'daily-report',
    })

    // 주간 리포트 스케줄
    this.schedules.set('weekly-report', {
      id: 'weekly-report',
      name: '주간 자금 현황',
      type: 'weekly',
      schedule: '0 9 * * 1', // 매주 월요일 오전 9시
      isActive: true,
      recipients: ['ceo@company.com', 'cfo@company.com', 'accountant@company.com'],
      templateId: 'daily-report',
    })

    // 월간 리포트 스케줄
    this.schedules.set('monthly-report', {
      id: 'monthly-report',
      name: '월간 종합 리포트',
      type: 'monthly',
      schedule: '0 10 1 * *', // 매월 1일 오전 10시
      isActive: true,
      recipients: ['ceo@company.com', 'cfo@company.com', 'accountant@company.com'],
      templateId: 'monthly-report',
    })
  }

  // 스케줄 관리
  addSchedule(schedule: ScheduledReport): void {
    this.schedules.set(schedule.id, schedule)
  }

  removeSchedule(scheduleId: string): void {
    this.schedules.delete(scheduleId)
  }

  getSchedules(): ScheduledReport[] {
    return Array.from(this.schedules.values())
  }

  updateSchedule(scheduleId: string, updates: Partial<ScheduledReport>): void {
    const schedule = this.schedules.get(scheduleId)
    if (schedule) {
      Object.assign(schedule, updates)
    }
  }

  // 수동 리포트 실행
  async executeReportManually(reportType: 'daily' | 'weekly' | 'monthly'): Promise<boolean> {
    try {
      const schedule = Array.from(this.schedules.values()).find((s) => s.type === reportType)
      if (!schedule) {
        logger.error(`리포트 타입을 찾을 수 없습니다: ${reportType}`)
        return false
      }

      await this.executeSchedule(schedule)
      return true
    } catch (error) {
      logger.error(`수동 리포트 실행 실패 (${reportType}):`, error)
      return false
    }
  }
}

// 싱글톤 인스턴스
export const reportScheduler = new ReportScheduler()
