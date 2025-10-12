/**
 * CRM Stats Service - CRM 통계 API 호출
 */

import type { CRMApiResponse, CRMCustomerStats, CRMStats } from '$lib/crm/types'
import { logger } from '$lib/utils/logger'

export async function loadCRMStats(params?: {
  period?: 'month' | 'quarter' | 'year'
}): Promise<CRMApiResponse<CRMStats>> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.period) queryParams.set('period', params.period)
    queryParams.set('type', 'overview')

    const url = `/api/crm/stats?${queryParams.toString()}`
    const response = await fetch(url)
    const result = await response.json()
    return result
  } catch (error) {
    logger.error('CRM 통계 로드 실패:', error)
    return { success: false, error: 'CRM 통계 로드 중 오류가 발생했습니다.' }
  }
}

export async function loadCustomerStats(): Promise<CRMApiResponse<CRMCustomerStats[]>> {
  try {
    const queryParams = new URLSearchParams()
    queryParams.set('type', 'customers')

    const url = `/api/crm/stats?${queryParams.toString()}`
    const response = await fetch(url)
    const result = await response.json()
    return result
  } catch (error) {
    logger.error('고객별 통계 로드 실패:', error)
    return { success: false, error: '고객별 통계 로드 중 오류가 발생했습니다.' }
  }
}
