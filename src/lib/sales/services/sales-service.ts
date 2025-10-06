/**
 * Sales Service - 영업관리 API 호출
 *
 * Responsibilities:
 * - 거래처, 영업기회, 계약, 거래내역 CRUD API 호출
 * - 에러 처리
 */

import { logger } from '$lib/utils/logger'
import type {
  CustomerFormData,
  OpportunityFormData,
  ContractFormData,
  TransactionFormData,
} from '../stores/sales-store.svelte'

// ============================================================================
// Types
// ============================================================================

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// ============================================================================
// Customer API
// ============================================================================

export async function loadCustomers(): Promise<ApiResponse<any[]>> {
  try {
    const response = await fetch('/api/sales/customers')
    const result = await response.json()
    logger.log('거래처 로드 결과:', result)
    return result
  } catch (error) {
    logger.error('거래처 로드 실패:', error)
    return { success: false, error: '거래처 로드 중 오류가 발생했습니다.' }
  }
}

export async function createCustomer(data: CustomerFormData): Promise<ApiResponse<any>> {
  try {
    const response = await fetch('/api/sales/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await response.json()
    logger.log('거래처 생성 결과:', result)
    return result
  } catch (error) {
    logger.error('거래처 생성 실패:', error)
    return { success: false, error: '거래처 저장 중 오류가 발생했습니다.' }
  }
}

export async function updateCustomer(
  id: number,
  data: CustomerFormData,
): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`/api/sales/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await response.json()
    logger.log('거래처 수정 결과:', result)
    return result
  } catch (error) {
    logger.error('거래처 수정 실패:', error)
    return { success: false, error: '거래처 수정 중 오류가 발생했습니다.' }
  }
}

export async function deleteCustomer(id: number): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`/api/sales/customers/${id}`, {
      method: 'DELETE',
    })
    const result = await response.json()
    return result
  } catch (error) {
    logger.error('거래처 삭제 실패:', error)
    return { success: false, error: '거래처 삭제 중 오류가 발생했습니다.' }
  }
}

// ============================================================================
// Opportunity API
// ============================================================================

export async function loadOpportunities(): Promise<ApiResponse<any[]>> {
  try {
    const response = await fetch('/api/sales/opportunities')
    const result = await response.json()
    return result
  } catch (error) {
    logger.error('영업기회 로드 실패:', error)
    return { success: false, error: '영업기회 로드 중 오류가 발생했습니다.' }
  }
}

export async function createOpportunity(data: OpportunityFormData): Promise<ApiResponse<any>> {
  try {
    const response = await fetch('/api/sales/opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await response.json()
    return result
  } catch (error) {
    logger.error('영업기회 생성 실패:', error)
    return { success: false, error: '영업기회 저장 중 오류가 발생했습니다.' }
  }
}

// ============================================================================
// Contract API
// ============================================================================

export async function loadContracts(): Promise<ApiResponse<any[]>> {
  try {
    const response = await fetch('/api/sales/contracts')
    const result = await response.json()
    return result
  } catch (error) {
    logger.error('계약 로드 실패:', error)
    return { success: false, error: '계약 로드 중 오류가 발생했습니다.' }
  }
}

export async function createContract(data: ContractFormData): Promise<ApiResponse<any>> {
  try {
    const response = await fetch('/api/sales/contracts', {
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

// ============================================================================
// Transaction API
// ============================================================================

export async function loadTransactions(): Promise<ApiResponse<any[]>> {
  try {
    const response = await fetch('/api/sales/transactions')
    const result = await response.json()
    return result
  } catch (error) {
    logger.error('거래 내역 로드 실패:', error)
    return { success: false, error: '거래 내역 로드 중 오류가 발생했습니다.' }
  }
}

export async function createTransaction(data: TransactionFormData): Promise<ApiResponse<any>> {
  try {
    const response = await fetch('/api/sales/transactions', {
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

// ============================================================================
// Batch Load
// ============================================================================

export async function loadAllSalesData() {
  const [customers, opportunities, contracts, transactions] = await Promise.all([
    loadCustomers(),
    loadOpportunities(),
    loadContracts(),
    loadTransactions(),
  ])

  return {
    customers: customers.success ? customers.data || [] : [],
    opportunities: opportunities.success ? opportunities.data || [] : [],
    contracts: contracts.success ? contracts.data || [] : [],
    transactions: transactions.success ? transactions.data || [] : [],
  }
}
