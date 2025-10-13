import {
    createCustomer,
    deleteCustomer,
    loadCustomer,
    loadCustomers,
    updateCustomer,
    type CustomerFormData,
} from '$lib/crm/services/crm-customer-service'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockLogger } from '../../helpers/mock-helper'

// Mock fetch globally
global.fetch = vi.fn()

describe('CRM Customer Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogger()
  })

  describe('loadCustomers', () => {
    it('모든 고객을 성공적으로 로드해야 함', async () => {
      const mockCustomers = [
        {
          id: 'customer-1',
          name: '테스트 고객사',
          business_number: '123-45-67890',
          type: 'customer',
          status: 'active',
        },
        {
          id: 'customer-2',
          name: '테스트 공급업체',
          business_number: '987-65-43210',
          type: 'supplier',
          status: 'active',
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockCustomers,
        }),
      } as Response)

      const result = await loadCustomers()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCustomers)
      expect(fetch).toHaveBeenCalledWith('/api/crm/customers')
    })

    it('타입 필터로 고객을 로드해야 함', async () => {
      const mockCustomers = [
        {
          id: 'customer-1',
          name: '테스트 고객사',
          type: 'customer',
          status: 'active',
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockCustomers,
        }),
      } as Response)

      const result = await loadCustomers({ type: 'customer' })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCustomers)
      expect(fetch).toHaveBeenCalledWith('/api/crm/customers?type=customer')
    })

    it('상태 필터로 고객을 로드해야 함', async () => {
      const mockCustomers = [
        {
          id: 'customer-1',
          name: '테스트 고객사',
          type: 'customer',
          status: 'active',
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockCustomers,
        }),
      } as Response)

      const result = await loadCustomers({ status: 'active' })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCustomers)
      expect(fetch).toHaveBeenCalledWith('/api/crm/customers?status=active')
    })

    it('검색어로 고객을 로드해야 함', async () => {
      const mockCustomers = [
        {
          id: 'customer-1',
          name: '테스트 고객사',
          type: 'customer',
          status: 'active',
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockCustomers,
        }),
      } as Response)

      const result = await loadCustomers({ search: '테스트' })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCustomers)
      expect(fetch).toHaveBeenCalledWith('/api/crm/customers?search=%ED%85%8C%EC%8A%A4%ED%8A%B8')
    })

    it('복합 필터로 고객을 로드해야 함', async () => {
      const mockCustomers = [
        {
          id: 'customer-1',
          name: '테스트 고객사',
          type: 'customer',
          status: 'active',
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockCustomers,
        }),
      } as Response)

      const result = await loadCustomers({
        type: 'customer',
        status: 'active',
        search: '테스트',
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCustomers)
      expect(fetch).toHaveBeenCalledWith('/api/crm/customers?type=customer&status=active&search=%ED%85%8C%EC%8A%A4%ED%8A%B8')
    })

    it('API 오류 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await loadCustomers()

      expect(result.success).toBe(false)
      expect(result.error).toBe('고객 로드 중 오류가 발생했습니다.')
    })

    it('API 응답 오류 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: 'Database connection failed',
        }),
      } as Response)

      const result = await loadCustomers()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })
  })

  describe('loadCustomer', () => {
    it('특정 고객을 성공적으로 로드해야 함', async () => {
      const mockCustomer = {
        id: 'customer-1',
        name: '테스트 고객사',
        business_number: '123-45-67890',
        type: 'customer',
        status: 'active',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockCustomer,
        }),
      } as Response)

      const result = await loadCustomer('customer-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCustomer)
      expect(fetch).toHaveBeenCalledWith('/api/crm/customers/customer-1')
    })

    it('존재하지 않는 고객 조회 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: 'Customer not found',
        }),
      } as Response)

      const result = await loadCustomer('non-existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Customer not found')
    })

    it('네트워크 오류 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await loadCustomer('customer-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('고객 조회 중 오류가 발생했습니다.')
    })
  })

  describe('createCustomer', () => {
    it('새 고객을 성공적으로 생성해야 함', async () => {
      const customerData: CustomerFormData = {
        name: '새 고객사',
        business_number: '123-45-67890',
        type: 'customer',
        contact_person: '홍길동',
        contact_phone: '010-1234-5678',
        contact_email: 'hong@example.com',
        address: '서울시 강남구',
        status: 'active',
      }

      const mockCreatedCustomer = {
        id: 'customer-new',
        ...customerData,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockCreatedCustomer,
        }),
      } as Response)

      const result = await createCustomer(customerData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCreatedCustomer)
      expect(fetch).toHaveBeenCalledWith('/api/crm/customers', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      })
    })

    it('OCR 데이터가 포함된 고객을 생성해야 함', async () => {
      const customerData: CustomerFormData = {
        name: 'OCR 고객사',
        business_number: '987-65-43210',
        type: 'customer',
        representative_name: '김대표',
        establishment_date: '2020-01-01',
        corporation_status: true,
        business_type: 'IT서비스',
        business_category: '소프트웨어개발',
        bank_name: '국민은행',
        account_number: '123456-78-901234',
        account_holder: 'OCR 고객사',
        ocr_processed_at: '2025-01-15T10:00:00Z',
        ocr_confidence: 0.95,
        status: 'active',
      }

      const mockCreatedCustomer = {
        id: 'customer-ocr',
        ...customerData,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockCreatedCustomer,
        }),
      } as Response)

      const result = await createCustomer(customerData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCreatedCustomer)
    })

    it('중복 사업자번호로 인한 생성 실패 시 에러를 반환해야 함', async () => {
      const customerData: CustomerFormData = {
        name: '중복 고객사',
        business_number: '123-45-67890',
        type: 'customer',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: 'Business number already exists',
        }),
      } as Response)

      const result = await createCustomer(customerData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Business number already exists')
    })

    it('네트워크 오류 시 에러를 반환해야 함', async () => {
      const customerData: CustomerFormData = {
        name: '새 고객사',
        business_number: '123-45-67890',
        type: 'customer',
      }

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await createCustomer(customerData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('고객 저장 중 오류가 발생했습니다.')
    })
  })

  describe('updateCustomer', () => {
    it('기존 고객을 성공적으로 수정해야 함', async () => {
      const customerId = 'customer-1'
      const updateData: CustomerFormData = {
        name: '수정된 고객사',
        business_number: '123-45-67890',
        type: 'customer',
        contact_person: '수정된 담당자',
        contact_phone: '010-9876-5432',
        status: 'active',
      }

      const mockUpdatedCustomer = {
        id: customerId,
        ...updateData,
        updated_at: '2025-01-15T11:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockUpdatedCustomer,
        }),
      } as Response)

      const result = await updateCustomer(customerId, updateData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUpdatedCustomer)
      expect(fetch).toHaveBeenCalledWith(`/api/crm/customers/${customerId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })
    })

    it('존재하지 않는 고객 수정 시 에러를 반환해야 함', async () => {
      const customerId = 'non-existent'
      const updateData: CustomerFormData = {
        name: '수정된 고객사',
        business_number: '123-45-67890',
        type: 'customer',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: 'Customer not found',
        }),
      } as Response)

      const result = await updateCustomer(customerId, updateData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Customer not found')
    })

    it('네트워크 오류 시 에러를 반환해야 함', async () => {
      const customerId = 'customer-1'
      const updateData: CustomerFormData = {
        name: '수정된 고객사',
        business_number: '123-45-67890',
        type: 'customer',
      }

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await updateCustomer(customerId, updateData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('고객 수정 중 오류가 발생했습니다.')
    })
  })

  describe('deleteCustomer', () => {
    it('고객을 성공적으로 삭제해야 함', async () => {
      const customerId = 'customer-1'

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
        }),
      } as Response)

      const result = await deleteCustomer(customerId)

      expect(result.success).toBe(true)
      expect(fetch).toHaveBeenCalledWith(`/api/crm/customers/${customerId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
    })

    it('존재하지 않는 고객 삭제 시 에러를 반환해야 함', async () => {
      const customerId = 'non-existent'

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: 'Customer not found',
        }),
      } as Response)

      const result = await deleteCustomer(customerId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Customer not found')
    })

    it('네트워크 오류 시 에러를 반환해야 함', async () => {
      const customerId = 'customer-1'

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await deleteCustomer(customerId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('고객 삭제 중 오류가 발생했습니다.')
    })
  })

  describe('Integration tests', () => {
    it('전체 CRUD 워크플로우가 올바르게 작동해야 함', async () => {
      // 1. 고객 생성
      const createData: CustomerFormData = {
        name: 'CRUD 테스트 고객사',
        business_number: '111-22-33333',
        type: 'customer',
        contact_person: 'CRUD 담당자',
        status: 'active',
      }

      const mockCreatedCustomer = {
        id: 'customer-crud',
        ...createData,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      }

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            success: true,
            data: mockCreatedCustomer,
          }),
        } as Response)
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            success: true,
            data: mockCreatedCustomer,
          }),
        } as Response)
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            success: true,
            data: { ...mockCreatedCustomer, name: '수정된 CRUD 고객사' },
          }),
        } as Response)
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            success: true,
          }),
        } as Response)

      // Create
      const createResult = await createCustomer(createData)
      expect(createResult.success).toBe(true)

      // Read
      const readResult = await loadCustomer('customer-crud')
      expect(readResult.success).toBe(true)

      // Update
      const updateResult = await updateCustomer('customer-crud', {
        ...createData,
        name: '수정된 CRUD 고객사',
      })
      expect(updateResult.success).toBe(true)

      // Delete
      const deleteResult = await deleteCustomer('customer-crud')
      expect(deleteResult.success).toBe(true)
    })

    it('OCR 처리된 고객 데이터가 올바르게 처리되어야 함', async () => {
      const ocrData: CustomerFormData = {
        name: 'OCR 처리 고객사',
        business_number: '555-66-77777',
        type: 'customer',
        representative_name: 'OCR 대표자',
        establishment_date: '2019-03-15',
        corporation_status: true,
        business_entity_type: '법인사업자',
        business_type: '서비스업',
        business_category: 'IT서비스',
        bank_name: '신한은행',
        account_number: '110-123-456789',
        account_holder: 'OCR 처리 고객사',
        ocr_processed_at: '2025-01-15T12:00:00Z',
        ocr_confidence: 0.92,
        business_registration_s3_key: 'ocr/business-reg-123.pdf',
        bank_account_s3_key: 'ocr/bank-account-123.pdf',
        status: 'active',
      }

      const mockOcrCustomer = {
        id: 'customer-ocr-test',
        ...ocrData,
        created_at: '2025-01-15T12:00:00Z',
        updated_at: '2025-01-15T12:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockOcrCustomer,
        }),
      } as Response)

      const result = await createCustomer(ocrData)

      expect(result.success).toBe(true)
      expect(result.data?.representative_name).toBe('OCR 대표자')
      expect(result.data?.ocr_confidence).toBe(0.92)
      expect(result.data?.business_registration_s3_key).toBe('ocr/business-reg-123.pdf')
      expect(result.data?.bank_account_s3_key).toBe('ocr/bank-account-123.pdf')
    })
  })
})
