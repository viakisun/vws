/**
 * CRM Transaction Service - 거래 내역 관리 API 호출
 */

import type { CRMApiResponse, CRMTransaction } from '$lib/crm/types'
import { logger } from '$lib/utils/logger'

export interface TransactionFormData {
  customer_id: string
  type: 'sales' | 'purchase'
  amount: number
  transaction_date: string
  contract_id?: string
  due_date?: string
  payment_date?: string
  payment_status?: 'pending' | 'paid' | 'overdue'
  description?: string
  notes?: string
  created_by?: string
}

export async function loadTransactions(params?: {
  type?: string
  payment_status?: string
  customer_id?: string
  contract_id?: string
  date_from?: string
  date_to?: string
  search?: string
}): Promise<CRMApiResponse<CRMTransaction[]>> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.type) queryParams.set('type', params.type)
    if (params?.payment_status) queryParams.set('payment_status', params.payment_status)
    if (params?.customer_id) queryParams.set('customer_id', params.customer_id)
    if (params?.contract_id) queryParams.set('contract_id', params.contract_id)
    if (params?.date_from) queryParams.set('date_from', params.date_from)
    if (params?.date_to) queryParams.set('date_to', params.date_to)
    if (params?.search) queryParams.set('search', params.search)

    const url = `/api/crm/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await fetch(url)
    const result = await response.json()
    return result
  } catch (error) {
    logger.error('거래 내역 로드 실패:', error)
    return { success: false, error: '거래 내역 로드 중 오류가 발생했습니다.' }
  }
}

export async function createTransaction(
  data: TransactionFormData,
): Promise<CRMApiResponse<CRMTransaction>> {
  try {
    const response = await fetch('/api/crm/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await response.json()
    return result
  } catch (error) {
    logger.error('거래 생성 실패:', error)
    return { success: false, error: '거래 저장 중 오류가 발생했습니다.' }
  }
}

