// 자금일보 시스템 - 메인 타입 정의
export * from './account'
export * from './transaction'
export * from './budget'
export * from './report'

// 공통 타입들
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 자금일보 시스템 설정
export interface FinanceConfig {
  dailyReportTime: string // 매일 자금일보 발송 시간 (예: "09:00")
  reportRecipients: string[] // 자금일보 수신자 이메일 목록
  alertThresholds: {
    lowBalance: number // 잔액 부족 알림 임계값
    highExpense: number // 고액 지출 알림 임계값
  }
  budgetPeriod: 'monthly' | 'quarterly' | 'yearly' // 예산 설정 주기
}
