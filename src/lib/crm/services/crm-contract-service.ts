/**
 * CRM Contract Service - 계약 관리 API 호출
 */

import type { CRMApiResponse, CRMContract } from '$lib/crm/types'
import { logger } from '$lib/utils/logger'

export interface ContractFormData {
  title: string
  customer_id: string
  type: 'sales' | 'purchase'
  status?: 'active' | 'completed' | 'cancelled'
  start_date: string
  end_date?: string
  total_amount?: number
  paid_amount?: number
  payment_terms?: number
  description?: string
  owner_id?: string
}

export async function loadContracts(params?: {
  status?: string
  type?: string
  search?: string
}): Promise<CRMApiResponse<CRMContract[]>> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.set('status', params.status)
    if (params?.type) queryParams.set('type', params.type)
    if (params?.search) queryParams.set('search', params.search)

    const url = `/api/crm/contracts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await fetch(url)
    const result = await response.json()
    return result
  } catch (error) {
    logger.error('계약 로드 실패:', error)
    return { success: false, error: '계약 로드 중 오류가 발생했습니다.' }
  }
}

export async function createContract(
  data: ContractFormData,
): Promise<CRMApiResponse<CRMContract>> {
  try {
    const response = await fetch('/api/crm/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await response.json()
    return result
  } catch (error) {
    logger.error('계약 생성 실패:', error)
    return { success: false, error: '계약 저장 중 오류가 발생했습니다.' }
  }
}

