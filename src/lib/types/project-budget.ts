// 프로젝트 연차별 예산 구조 타입 정의

export interface ProjectBudgetStructure {
  projectId: string
  totalBudget: number // 전체 사업비 (모든 연차 합계)
  annualBudgets: AnnualBudget[] // 연차별 예산
  createdAt: string
  updatedAt: string
}

export interface AnnualBudget {
  id: string
  projectId: string
  year: number // 연차 (1차년도, 2차년도 등)
  startDate?: string // 연차 시작일
  endDate?: string // 연차 종료일

  // 지원금 (현금만)
  governmentFunding: number // 정부 지원금 (현금)

  // 기업부담금
  companyCash: number // 기업부담금 (현금)
  companyInKind: number // 기업부담금 (현물)

  // 계산된 값들
  totalCash: number // 현금 총액 (지원금 + 기업부담금 현금)
  totalInKind: number // 현물 총액 (기업부담금 현물)
  yearlyTotal: number // 연차 사업비 (현금 + 현물)

  status: 'draft' | 'submitted' | 'approved' | 'active' | 'completed'
  notes?: string
  createdAt: string
  updatedAt: string
}

// 예산 입력/수정을 위한 폼 데이터 타입
export interface AnnualBudgetFormData {
  year: number
  startDate?: string
  endDate?: string
  governmentFunding: number
  companyCash: number
  companyInKind: number
  notes?: string
}

// 예산 요약 정보
export interface BudgetSummary {
  projectId: string
  totalYears: number
  totalBudget: number
  totalGovernmentFunding: number
  totalCompanyCash: number
  totalCompanyInKind: number
  totalCash: number
  totalInKind: number

  // 비율 정보
  governmentFundingRatio: number // 지원금 비율
  companyBurdenRatio: number // 기업부담 비율
  cashRatio: number // 현금 비율
  inKindRatio: number // 현물 비율
}

// API 응답 타입
export interface BudgetApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 예산 검증 결과
export interface BudgetValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}
