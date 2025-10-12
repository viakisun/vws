// CRM 고객 관련 타입 정의

export interface CRMCustomer {
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
  
  // OCR 관련 필드
  business_registration_file_url?: string
  bank_account_file_url?: string
  representative_name?: string
  establishment_date?: string
  corporation_status?: boolean
  business_type?: string
  business_category?: string
  bank_name?: string
  account_number?: string
  account_holder?: string
  ocr_processed_at?: string
  ocr_confidence?: number
  
  created_at: string
  updated_at: string
}

// 고객 타입 (기존 호환성)
export type Customer = CRMCustomer

// 고객별 통계
export interface CRMCustomerStats {
  customer_id: string
  customer_name: string
  total_sales: number
  total_purchases: number
  pending_amount: number
  overdue_amount: number
  transaction_count: number
}

export type CustomerStats = CRMCustomerStats

