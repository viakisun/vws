// CRM 거래 내역 관련 타입 정의

import type { CRMContract } from './contract'
import type { CRMCustomer } from './customer'

export interface CRMTransaction {
  id: string
  transaction_number: string
  contract_id?: string
  contract?: CRMContract // 조인된 데이터
  customer_id: string
  customer?: CRMCustomer // 조인된 데이터
  type: 'sales' | 'purchase'
  amount: number
  transaction_date: string
  due_date?: string
  payment_date?: string
  payment_status: 'pending' | 'paid' | 'overdue'
  description?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

// 기존 호환성
export type Transaction = CRMTransaction
