// CRM 영업 기회 관련 타입 정의

import type { CRMCustomer } from './customer'

export interface CRMOpportunity {
  id: string
  title: string
  customer_id: string
  customer?: CRMCustomer // 조인된 데이터
  type: 'sales' | 'purchase'
  stage: 'prospecting' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  value: number
  probability: number // 0-100
  expected_close_date?: string
  owner_id?: string
  description?: string
  status: 'active' | 'won' | 'lost'
  created_at: string
  updated_at: string
}

// 기존 호환성
export type Opportunity = CRMOpportunity

