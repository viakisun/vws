import type { BaseEntity } from './index'
import type { Account } from './account'
import type { Transaction } from './transaction'

// 리포트 타입
export type ReportType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'

// 리포트 상태
export type ReportStatus = 'draft' | 'generating' | 'completed' | 'failed'

// 자금일보 (Daily Finance Report)
export interface DailyFinanceReport extends BaseEntity {
  reportDate: string
  status: ReportStatus
  openingBalance: number // 시초 잔액
  closingBalance: number // 종료 잔액
  totalInflow: number // 총 입금
  totalOutflow: number // 총 출금
  netFlow: number // 순 현금흐름
  transactionCount: number // 거래 건수
  accountSummaries: AccountDailySummary[] // 계좌별 요약
  categorySummaries: CategoryDailySummary[] // 카테고리별 요약
  alerts: FinanceAlert[] // 알림 사항
  notes?: string // 메모
  generatedAt?: string // 생성 시간
  generatedBy?: string // 생성자
}

// 계좌별 일일 요약
export interface AccountDailySummary {
  account: Account
  openingBalance: number
  closingBalance: number
  totalInflow: number
  totalOutflow: number
  netFlow: number
  transactionCount: number
  largestTransaction: number
  averageTransaction: number
}

// 카테고리별 일일 요약
export interface CategoryDailySummary {
  categoryId: string
  categoryName: string
  totalAmount: number
  transactionCount: number
  percentage: number // 전체 대비 비율
}

// 자금 알림
export interface FinanceAlert {
  id: string
  type: 'low_balance' | 'high_expense' | 'budget_exceeded' | 'unusual_transaction'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  accountId?: string
  transactionId?: string
  budgetId?: string
  createdAt: string
  isRead: boolean
  isResolved: boolean
}

// 월별 자금 리포트
export interface MonthlyFinanceReport extends BaseEntity {
  year: number
  month: number
  status: ReportStatus
  openingBalance: number
  closingBalance: number
  totalIncome: number
  totalExpense: number
  netAmount: number
  transactionCount: number
  dailyReports: DailyFinanceReport[]
  budgetAnalysis: BudgetAnalysisSummary
  trends: FinanceTrend[]
  predictions: FinancePrediction[]
  generatedAt?: string
}

// 예산 분석 요약
export interface BudgetAnalysisSummary {
  totalPlannedIncome: number
  totalActualIncome: number
  incomeVariance: number
  totalPlannedExpense: number
  totalActualExpense: number
  expenseVariance: number
  budgetUtilizationRate: number
  overBudgetCategories: string[]
}

// 자금 트렌드
export interface FinanceTrend {
  period: string
  metric: 'balance' | 'income' | 'expense' | 'net_flow'
  value: number
  change: number
  changePercentage: number
  direction: 'up' | 'down' | 'stable'
}

// 자금 예측
export interface FinancePrediction {
  date: string
  predictedBalance: number
  confidence: number // 신뢰도 (0-100)
  factors: string[] // 예측에 영향을 미치는 요인들
  scenarios: PredictionScenario[]
}

// 예측 시나리오
export interface PredictionScenario {
  name: string
  probability: number
  predictedBalance: number
  description: string
}

// 자금 현황 대시보드 데이터
export interface FinanceDashboard {
  currentBalance: number
  monthlyIncome: number
  monthlyExpense: number
  netCashFlow: number
  accountBalances: AccountBalance[]
  recentTransactions: Transaction[]
  upcomingPayments: UpcomingPayment[]
  budgetStatus: BudgetStatusSummary
  alerts: FinanceAlert[]
  trends: FinanceTrend[]
  predictions: FinancePrediction[]
  lastUpdated: string
}

// 계좌 잔액 정보
export interface AccountBalance {
  account: Account
  currentBalance: number
  changeToday: number
  changePercentage: number
  isLowBalance: boolean
}

// 예정된 지급
export interface UpcomingPayment {
  id: string
  description: string
  amount: number
  dueDate: string
  type: 'salary' | 'loan' | 'rent' | 'other'
  accountId: string
  isRecurring: boolean
  priority: 'low' | 'medium' | 'high'
}

// 예산 상태 요약
export interface BudgetStatusSummary {
  totalBudget: number
  totalSpent: number
  remainingBudget: number
  utilizationRate: number
  overBudgetCount: number
  nearLimitCount: number
}

// 리포트 생성 요청
export interface GenerateReportRequest {
  type: ReportType
  startDate: string
  endDate?: string
  includeAccounts?: string[]
  includeCategories?: string[]
  format?: 'json' | 'pdf' | 'excel'
  emailRecipients?: string[]
}

// 리포트 필터
export interface ReportFilter {
  type?: ReportType
  startDate?: string
  endDate?: string
  status?: ReportStatus
  accountIds?: string[]
  categoryIds?: string[]
}

// 자금 흐름 분석
export interface CashFlowAnalysis {
  period: string
  operatingCashFlow: number // 영업 현금흐름
  investingCashFlow: number // 투자 현금흐름
  financingCashFlow: number // 재무 현금흐름
  netCashFlow: number // 순 현금흐름
  freeCashFlow: number // 잉여 현금흐름
}
