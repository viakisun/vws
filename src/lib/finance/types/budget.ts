import type { BaseEntity } from './index'

// 예산 타입
export type BudgetType = 'income' | 'expense' | 'investment'

// 예산 주기
export type BudgetPeriod = 'monthly' | 'quarterly' | 'yearly'

// 예산 상태
export type BudgetStatus = 'draft' | 'active' | 'completed' | 'cancelled'

// 예산 정보
export interface Budget extends BaseEntity {
  name: string
  type: BudgetType
  period: BudgetPeriod
  year: number
  month?: number // 월별 예산인 경우
  quarter?: number // 분기별 예산인 경우
  categoryId?: string // 특정 카테고리 예산인 경우
  accountId?: string // 특정 계좌 예산인 경우
  plannedAmount: number // 계획 금액
  actualAmount: number // 실제 금액
  status: BudgetStatus
  description?: string
  tags?: string[]
  isRecurring: boolean // 정기 예산 여부
}

// 예산 생성 요청
export interface CreateBudgetRequest {
  name: string
  type: BudgetType
  period: BudgetPeriod
  year: number
  month?: number
  quarter?: number
  categoryId?: string
  accountId?: string
  plannedAmount: number
  description?: string
  tags?: string[]
  isRecurring?: boolean
}

// 예산 업데이트 요청
export interface UpdateBudgetRequest extends Partial<CreateBudgetRequest> {
  id: string
}

// 예산 필터
export interface BudgetFilter {
  type?: BudgetType
  period?: BudgetPeriod
  year?: number
  month?: number
  quarter?: number
  status?: BudgetStatus
  categoryId?: string
  accountId?: string
}

// 예산 vs 실적 분석
export interface BudgetAnalysis {
  budget: Budget
  actualAmount: number
  variance: number // 차이 (실제 - 계획)
  variancePercentage: number // 차이 비율
  isOverBudget: boolean // 예산 초과 여부
  remainingAmount: number // 남은 예산
  utilizationRate: number // 사용률
}

// 월별 예산 요약
export interface MonthlyBudgetSummary {
  year: number
  month: number
  totalPlannedIncome: number
  totalPlannedExpense: number
  totalActualIncome: number
  totalActualExpense: number
  netPlannedAmount: number
  netActualAmount: number
  budgetAnalyses: BudgetAnalysis[]
}

// 예산 템플릿 (정기 예산 생성용)
export interface BudgetTemplate extends BaseEntity {
  name: string
  type: BudgetType
  categoryId?: string
  accountId?: string
  plannedAmount: number
  description?: string
  tags?: string[]
  isActive: boolean
}

// 급여 예산 (특별한 예산 타입)
export interface SalaryBudget extends BaseEntity {
  year: number
  month: number
  totalSalary: number // 총 급여액
  employeeCount: number // 직원 수
  averageSalary: number // 평균 급여
  bonusAmount?: number // 보너스
  overtimeAmount?: number // 초과근무 수당
  deductions: SalaryDeduction[] // 공제 항목
  netSalary: number // 실지급액
}

// 급여 공제 항목
export interface SalaryDeduction {
  name: string
  amount: number
  type: 'tax' | 'insurance' | 'pension' | 'other'
  description?: string
}

// 고정비 예산 (특별한 예산 타입)
export interface FixedCostBudget extends BaseEntity {
  year: number
  month: number
  rent: number // 임대료
  utilities: number // 공과금
  insurance: number // 보험료
  loanPayments: number // 대출 상환
  maintenance: number // 유지보수비
  other: number // 기타 고정비
  total: number // 총 고정비
}
