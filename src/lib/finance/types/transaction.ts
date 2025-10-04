import type { BaseEntity } from './index'

// 거래 타입
export type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment'

// 거래 상태
export type TransactionStatus = 'pending' | 'completed' | 'cancelled' | 'failed'

// 거래 카테고리
export interface TransactionCategory extends BaseEntity {
  name: string
  type: TransactionType
  parentId?: string // 상위 카테고리 ID (계층 구조)
  color: string // UI에서 사용할 색상
  description?: string
  isActive: boolean
  isSystem: boolean // 시스템 기본 카테고리 여부
  accountingCode?: string // 회계 코드 (예: 4110, 5110 등)
  taxCode?: string // 세무 코드 (예: 01, 02 등)
  isDefault: boolean // 기본 선택 여부
}

// 거래 정보
export interface Transaction extends BaseEntity {
  accountId: string
  account?: import('./account').Account
  categoryId: string
  category?: TransactionCategory
  amount: number // 입금이면 양수, 출금이면 음수
  type: TransactionType // 'income' | 'expense'
  status: TransactionStatus
  description: string // 적요
  transactionDate: string
  counterparty?: string // 의뢰인/수취인
  deposits?: number // 입금 (양수)
  withdrawals?: number // 출금 (양수)
  balance?: number // 거래후잔액
}

// 정기 거래 패턴
export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  interval: number // 간격 (예: 매 2주마다)
  endDate?: string // 종료일
  maxOccurrences?: number // 최대 발생 횟수
}

// 거래 첨부파일
export interface TransactionAttachment {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  url: string
  uploadedAt: string
}

// 거래 생성 요청
export interface CreateTransactionRequest {
  accountId: string
  categoryId: string
  amount: number
  type: TransactionType
  description: string
  transactionDate: string
  referenceNumber?: string
  notes?: string
  tags?: string[]
  isRecurring?: boolean
  recurringPattern?: RecurringPattern
}

// 거래 업데이트 요청
export interface UpdateTransactionRequest extends Partial<CreateTransactionRequest> {
  id: string
}

// 거래 필터
export interface TransactionFilter {
  accountId?: string
  categoryId?: string
  type?: TransactionType
  status?: TransactionStatus
  dateFrom?: string
  dateTo?: string
  amountMin?: number
  amountMax?: number
  search?: string
  tags?: string[]
}

// 거래 통계
export interface TransactionStats {
  totalIncome: number
  totalExpense: number
  netAmount: number
  transactionCount: number
  averageAmount: number
  largestTransaction: number
  smallestTransaction: number
}

// 일별 거래 요약
export interface DailyTransactionSummary {
  date: string
  totalIncome: number
  totalExpense: number
  netAmount: number
  transactionCount: number
  transactions: Transaction[]
}

// 월별 거래 요약
export interface MonthlyTransactionSummary {
  year: number
  month: number
  totalIncome: number
  totalExpense: number
  netAmount: number
  transactionCount: number
  dailySummaries: DailyTransactionSummary[]
}
