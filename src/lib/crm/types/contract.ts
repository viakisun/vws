// CRM 계약 관련 타입 정의

import type { CRMCustomer } from './customer'

export interface CRMContract {
  id: string
  contract_number: string
  title: string
  customer_id: string
  customer?: CRMCustomer // 조인된 데이터
  type: 'sales' | 'purchase'
  status: 'active' | 'completed' | 'cancelled'
  start_date: string
  end_date?: string
  total_amount: number
  paid_amount: number
  payment_terms: number
  description?: string
  owner_id?: string
  created_at: string
  updated_at: string
}

// 기존 호환성
export type Contract = CRMContract
