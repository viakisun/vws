// 영업관리 시스템 타입 정의 (상용화 목표 - 단순화)

export interface Customer {
  id: string
  name: string
  business_number: string
  type: 'customer' | 'supplier' | 'both'
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  address?: string
  industry?: string
  payment_terms: number // 결제 조건 (일)
  status: 'active' | 'inactive'
  notes?: string
  created_at: string
  updated_at: string
}

export interface Opportunity {
  id: string
  title: string
  customer_id: string
  customer?: Customer // 조인된 데이터
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

export interface Contract {
  id: string
  contract_number: string
  title: string
  customer_id: string
  customer?: Customer // 조인된 데이터
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

export interface Transaction {
  id: string
  transaction_number: string
  contract_id?: string
  contract?: Contract // 조인된 데이터
  customer_id: string
  customer?: Customer // 조인된 데이터
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

// 2단계 기능 (선택적)
export interface Quotation {
  id: string
  quotation_number: string
  title: string
  customer_id: string
  customer?: Customer
  opportunity_id?: string
  opportunity?: Opportunity
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  valid_until?: string
  total_amount: number
  description?: string
  owner_id?: string
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  title: string
  customer_id: string
  customer?: Customer
  contract_id?: string
  contract?: Contract
  quotation_id?: string
  quotation?: Quotation
  type: 'sales' | 'purchase'
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  issue_date: string
  due_date?: string
  payment_date?: string
  total_amount: number
  paid_amount: number
  description?: string
  owner_id?: string
  created_at: string
  updated_at: string
}

// 대시보드용 통계 타입
export interface SalesStats {
  totalCustomers: number
  activeOpportunities: number
  totalSalesValue: number
  monthlyRevenue: number
  paymentOverdue: number
  conversionRate: number
}

// 거래처별 통계
export interface CustomerStats {
  customer_id: string
  customer_name: string
  total_sales: number
  total_purchases: number
  pending_amount: number
  overdue_amount: number
  transaction_count: number
}

// API 응답 타입
export interface SalesApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 필터링 옵션
export interface SalesFilters {
  customer_type?: 'customer' | 'supplier' | 'both'
  status?: string
  date_from?: string
  date_to?: string
  search?: string
}
