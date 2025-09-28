import type { BaseEntity } from './index'

// 은행 정보
export interface Bank extends BaseEntity {
  name: string
  code: string
  color: string // UI에서 사용할 색상
  isActive: boolean
}

// 계좌 타입
export type AccountType = 'checking' | 'savings' | 'business' | 'investment' | 'loan'

// 계좌 상태
export type AccountStatus = 'active' | 'inactive' | 'suspended' | 'closed'

// 계좌 정보
export interface Account extends BaseEntity {
  name: string
  accountNumber: string
  bankId: string
  bank?: Bank
  accountType: AccountType
  balance: number
  status: AccountStatus
  description?: string
  isPrimary: boolean // 주요 계좌 여부
  alertThreshold?: number // 잔액 알림 임계값
}

// 계좌 생성 요청
export interface CreateAccountRequest {
  name: string
  accountNumber: string
  bankId: string
  accountType: AccountType
  initialBalance: number
  description?: string
  isPrimary?: boolean
  alertThreshold?: number
}

// 계좌 업데이트 요청
export interface UpdateAccountRequest extends Partial<CreateAccountRequest> {
  id: string
}

// 계좌 필터
export interface AccountFilter {
  bankId?: string
  accountType?: AccountType
  status?: AccountStatus
  isPrimary?: boolean
  search?: string
}

// 계좌 요약 정보
export interface AccountSummary {
  account: Account
  totalInflow: number // 총 입금액
  totalOutflow: number // 총 출금액
  netFlow: number // 순 현금흐름
  transactionCount: number // 거래 건수
  lastTransactionDate?: string // 마지막 거래일
}

// 은행별 계좌 요약
export interface BankSummary {
  bank: Bank
  accounts: Account[]
  totalBalance: number
  accountCount: number
  primaryAccount?: Account
}
