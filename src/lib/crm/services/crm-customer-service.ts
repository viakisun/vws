/**
 * CRM Customer Service - 고객 관리 API 호출
 *
 * Responsibilities:
 * - 고객 CRUD API 호출
 * - 에러 처리
 */

import type { CRMApiResponse, CRMCustomer } from '$lib/crm/types'
import { logger } from '$lib/utils/logger'

export interface CustomerFormData {
  name: string
  business_number: string
  type: 'customer' | 'supplier' | 'both'
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  address?: string
  industry?: string
  payment_terms?: number
  status?: 'active' | 'inactive'
  notes?: string

  // OCR 관련 필드
  business_registration_file_url?: string
  bank_account_file_url?: string
  representative_name?: string
  establishment_date?: string
  corporation_status?: boolean
  business_entity_type?: string
  business_type?: string
  business_category?: string
  bank_name?: string
  account_number?: string
  account_holder?: string
  ocr_processed_at?: string
  ocr_confidence?: number
  business_registration_s3_key?: string
  bank_account_s3_key?: string
}

export async function loadCustomers(params?: {
  type?: string
  status?: string
  search?: string
}): Promise<CRMApiResponse<CRMCustomer[]>> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.type) queryParams.set('type', params.type)
    if (params?.status) queryParams.set('status', params.status)
    if (params?.search) queryParams.set('search', params.search)

    const url = `/api/crm/customers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await fetch(url)
    const result = await response.json()
    logger.log('고객 로드 결과:', result)
    return result
  } catch (error) {
    logger.error('고객 로드 실패:', error)
    return { success: false, error: '고객 로드 중 오류가 발생했습니다.' }
  }
}

export async function loadCustomer(id: string): Promise<CRMApiResponse<CRMCustomer>> {
  try {
    const response = await fetch(`/api/crm/customers/${id}`)
    const result = await response.json()
    return result
  } catch (error) {
    logger.error('고객 조회 실패:', error)
    return { success: false, error: '고객 조회 중 오류가 발생했습니다.' }
  }
}

export async function createCustomer(data: CustomerFormData): Promise<CRMApiResponse<CRMCustomer>> {
  try {
    const response = await fetch('/api/crm/customers', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await response.json()
    logger.log('고객 생성 결과:', result)
    return result
  } catch (error) {
    logger.error('고객 생성 실패:', error)
    return { success: false, error: '고객 저장 중 오류가 발생했습니다.' }
  }
}

export async function updateCustomer(
  id: string,
  data: CustomerFormData,
): Promise<CRMApiResponse<CRMCustomer>> {
  try {
    const response = await fetch(`/api/crm/customers/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await response.json()
    logger.log('고객 수정 결과:', result)
    return result
  } catch (error) {
    logger.error('고객 수정 실패:', error)
    return { success: false, error: '고객 수정 중 오류가 발생했습니다.' }
  }
}

export async function deleteCustomer(id: string): Promise<CRMApiResponse<void>> {
  try {
    const response = await fetch(`/api/crm/customers/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    const result = await response.json()
    return result
  } catch (error) {
    logger.error('고객 삭제 실패:', error)
    return { success: false, error: '고객 삭제 중 오류가 발생했습니다.' }
  }
}
