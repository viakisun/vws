import { BankCode } from '$lib/types/bank-codes'
export { BankCode }

// 파싱된 거래 내역 인터페이스
export interface ParsedTransaction {
  transactionDate: string
  description: string // 적요
  counterparty?: string // 의뢰인/수취인
  deposits?: number // 입금 (양수)
  withdrawals?: number // 출금 (양수)
  balance?: number // 거래후잔액
  bankCode: BankCode
  categoryCode?: string // 거래 카테고리 코드 (예: '급여', '마케팅' 등)
}

// 은행별 파싱 결과
export interface BankStatementParseResult {
  bankCode: BankCode
  bankName: string
  accountNumber: string
  transactions: ParsedTransaction[]
  errors: string[]
}

// 은행 감지 결과
export interface BankDetectionResult {
  bankCode: BankCode | null
  bankName: string
  confidence: 'high' | 'medium' | 'low'
}
