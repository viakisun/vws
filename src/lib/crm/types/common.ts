// CRM 공통 타입 정의

// 대시보드용 통계 타입
export interface CRMStats {
  totalCustomers: number
  activeOpportunities: number
  totalSalesValue: number
  monthlyRevenue: number
  paymentOverdue: number
  conversionRate: number
}

// 기존 호환성
export type SalesStats = CRMStats

// API 응답 타입
export interface CRMApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 기존 호환성
export type SalesApiResponse<T> = CRMApiResponse<T>

// 필터링 옵션
export interface CRMFilters {
  customer_type?: 'customer' | 'supplier' | 'both'
  status?: string
  date_from?: string
  date_to?: string
  search?: string
}

// 기존 호환성
export type SalesFilters = CRMFilters

// 견적서 (2단계 기능)
export interface CRMQuotation {
  id: string
  quotation_number: string
  title: string
  customer_id: string
  opportunity_id?: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  valid_until?: string
  total_amount: number
  description?: string
  owner_id?: string
  created_at: string
  updated_at: string
}

export type Quotation = CRMQuotation

// 거래명세서 (2단계 기능)
export interface CRMInvoice {
  id: string
  invoice_number: string
  title: string
  customer_id: string
  contract_id?: string
  quotation_id?: string
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

export type Invoice = CRMInvoice
