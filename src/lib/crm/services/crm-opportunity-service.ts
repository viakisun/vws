/**
 * CRM Opportunity Service - 영업 기회 관리 API 호출
 */

import type { CRMApiResponse, CRMOpportunity } from '$lib/crm/types'
import { logger } from '$lib/utils/logger'

export interface OpportunityFormData {
  title: string
  customer_id: string
  type: 'sales' | 'purchase'
  stage?: 'prospecting' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  value?: number
  probability?: number
  expected_close_date?: string
  owner_id?: string
  description?: string
  status?: 'active' | 'won' | 'lost'
}

export async function loadOpportunities(params?: {
  stage?: string
  status?: string
  type?: string
  search?: string
}): Promise<CRMApiResponse<CRMOpportunity[]>> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.stage) queryParams.set('stage', params.stage)
    if (params?.status) queryParams.set('status', params.status)
    if (params?.type) queryParams.set('type', params.type)
    if (params?.search) queryParams.set('search', params.search)

    const url = `/api/crm/opportunities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await fetch(url)
    const result = await response.json()
    return result
  } catch (error) {
    logger.error('영업 기회 로드 실패:', error)
    return { success: false, error: '영업 기회 로드 중 오류가 발생했습니다.' }
  }
}

export async function createOpportunity(
  data: OpportunityFormData,
): Promise<CRMApiResponse<CRMOpportunity>> {
  try {
    const response = await fetch('/api/crm/opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await response.json()
    return result
  } catch (error) {
    logger.error('영업 기회 생성 실패:', error)
    return { success: false, error: '영업 기회 저장 중 오류가 발생했습니다.' }
  }
}
