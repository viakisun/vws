import {
    createContract,
    loadContracts,
    type ContractFormData,
} from '$lib/crm/services/crm-contract-service'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockLogger } from '../../helpers/mock-helper'

// Mock fetch globally
global.fetch = vi.fn()

describe('CRM Contract Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogger()
  })

  describe('loadContracts', () => {
    it('모든 계약을 성공적으로 로드해야 함', async () => {
      const mockContracts = [
        {
          id: 'contract-1',
          title: '테스트 판매 계약',
          customer_id: 'customer-1',
          type: 'sales',
          status: 'active',
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          total_amount: 1000000,
          paid_amount: 0,
          payment_terms: 30,
        },
        {
          id: 'contract-2',
          title: '테스트 구매 계약',
          customer_id: 'customer-2',
          type: 'purchase',
          status: 'active',
          start_date: '2025-02-01',
          end_date: '2025-11-30',
          total_amount: 500000,
          paid_amount: 100000,
          payment_terms: 15,
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockContracts,
        }),
      } as Response)

      const result = await loadContracts()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockContracts)
      expect(fetch).toHaveBeenCalledWith('/api/crm/contracts')
    })

    it('상태 필터로 계약을 로드해야 함', async () => {
      const mockContracts = [
        {
          id: 'contract-1',
          title: '활성 계약',
          customer_id: 'customer-1',
          type: 'sales',
          status: 'active',
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          total_amount: 1000000,
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockContracts,
        }),
      } as Response)

      const result = await loadContracts({ status: 'active' })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockContracts)
      expect(fetch).toHaveBeenCalledWith('/api/crm/contracts?status=active')
    })

    it('타입 필터로 계약을 로드해야 함', async () => {
      const mockContracts = [
        {
          id: 'contract-1',
          title: '판매 계약만',
          customer_id: 'customer-1',
          type: 'sales',
          status: 'active',
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          total_amount: 1000000,
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockContracts,
        }),
      } as Response)

      const result = await loadContracts({ type: 'sales' })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockContracts)
      expect(fetch).toHaveBeenCalledWith('/api/crm/contracts?type=sales')
    })

    it('검색어로 계약을 로드해야 함', async () => {
      const mockContracts = [
        {
          id: 'contract-1',
          title: '테스트 계약',
          customer_id: 'customer-1',
          type: 'sales',
          status: 'active',
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          total_amount: 1000000,
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockContracts,
        }),
      } as Response)

      const result = await loadContracts({ search: '테스트' })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockContracts)
      expect(fetch).toHaveBeenCalledWith('/api/crm/contracts?search=%ED%85%8C%EC%8A%A4%ED%8A%B8')
    })

    it('복합 필터로 계약을 로드해야 함', async () => {
      const mockContracts = [
        {
          id: 'contract-1',
          title: '활성 판매 계약',
          customer_id: 'customer-1',
          type: 'sales',
          status: 'active',
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          total_amount: 1000000,
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockContracts,
        }),
      } as Response)

      const result = await loadContracts({
        status: 'active',
        type: 'sales',
        search: '활성',
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockContracts)
      expect(fetch).toHaveBeenCalledWith('/api/crm/contracts?status=active&type=sales&search=%ED%99%9C%EC%84%B1')
    })

    it('API 오류 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await loadContracts()

      expect(result.success).toBe(false)
      expect(result.error).toBe('계약 로드 중 오류가 발생했습니다.')
    })

    it('API 응답 오류 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: 'Database connection failed',
        }),
      } as Response)

      const result = await loadContracts()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })
  })

  describe('createContract', () => {
    it('새 계약을 성공적으로 생성해야 함', async () => {
      const contractData: ContractFormData = {
        title: '새 판매 계약',
        customer_id: 'customer-1',
        type: 'sales',
        status: 'active',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        total_amount: 2000000,
        paid_amount: 0,
        payment_terms: 30,
        description: '새로운 판매 계약입니다.',
        owner_id: 'user-1',
      }

      const mockCreatedContract = {
        id: 'contract-new',
        ...contractData,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockCreatedContract,
        }),
      } as Response)

      const result = await createContract(contractData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCreatedContract)
      expect(fetch).toHaveBeenCalledWith('/api/crm/contracts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData),
      })
    })

    it('최소 필수 정보로 계약을 생성해야 함', async () => {
      const contractData: ContractFormData = {
        title: '최소 계약',
        customer_id: 'customer-1',
        type: 'sales',
        start_date: '2025-01-01',
      }

      const mockCreatedContract = {
        id: 'contract-minimal',
        title: '최소 계약',
        customer_id: 'customer-1',
        type: 'sales',
        status: 'active',
        start_date: '2025-01-01',
        end_date: null,
        total_amount: null,
        paid_amount: null,
        payment_terms: null,
        description: null,
        owner_id: null,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockCreatedContract,
        }),
      } as Response)

      const result = await createContract(contractData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCreatedContract)
    })

    it('구매 계약을 생성해야 함', async () => {
      const contractData: ContractFormData = {
        title: '구매 계약',
        customer_id: 'customer-2',
        type: 'purchase',
        status: 'active',
        start_date: '2025-02-01',
        end_date: '2025-11-30',
        total_amount: 1500000,
        paid_amount: 300000,
        payment_terms: 15,
        description: '부품 구매 계약입니다.',
        owner_id: 'user-2',
      }

      const mockCreatedContract = {
        id: 'contract-purchase',
        ...contractData,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockCreatedContract,
        }),
      } as Response)

      const result = await createContract(contractData)

      expect(result.success).toBe(true)
      expect(result.data?.type).toBe('purchase')
    })

    it('완료된 계약을 생성해야 함', async () => {
      const contractData: ContractFormData = {
        title: '완료된 계약',
        customer_id: 'customer-3',
        type: 'sales',
        status: 'completed',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        total_amount: 3000000,
        paid_amount: 3000000,
        payment_terms: 30,
        description: '완료된 프로젝트 계약입니다.',
        owner_id: 'user-3',
      }

      const mockCreatedContract = {
        id: 'contract-completed',
        ...contractData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-12-31T23:59:59Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockCreatedContract,
        }),
      } as Response)

      const result = await createContract(contractData)

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('completed')
      expect(result.data?.paid_amount).toBe(3000000)
    })

    it('취소된 계약을 생성해야 함', async () => {
      const contractData: ContractFormData = {
        title: '취소된 계약',
        customer_id: 'customer-4',
        type: 'sales',
        status: 'cancelled',
        start_date: '2025-01-01',
        end_date: null,
        total_amount: 1000000,
        paid_amount: 0,
        payment_terms: 30,
        description: '고객 요청으로 취소된 계약입니다.',
        owner_id: 'user-4',
      }

      const mockCreatedContract = {
        id: 'contract-cancelled',
        ...contractData,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T11:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockCreatedContract,
        }),
      } as Response)

      const result = await createContract(contractData)

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('cancelled')
    })

    it('존재하지 않는 고객으로 계약 생성 시 에러를 반환해야 함', async () => {
      const contractData: ContractFormData = {
        title: '잘못된 계약',
        customer_id: 'non-existent-customer',
        type: 'sales',
        start_date: '2025-01-01',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: 'Customer not found',
        }),
      } as Response)

      const result = await createContract(contractData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Customer not found')
    })

    it('네트워크 오류 시 에러를 반환해야 함', async () => {
      const contractData: ContractFormData = {
        title: '네트워크 오류 테스트',
        customer_id: 'customer-1',
        type: 'sales',
        start_date: '2025-01-01',
      }

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await createContract(contractData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('계약 저장 중 오류가 발생했습니다.')
    })
  })

  describe('Integration tests', () => {
    it('전체 계약 관리 워크플로우가 올바르게 작동해야 함', async () => {
      // 1. 모든 계약 로드
      const mockAllContracts = [
        {
          id: 'contract-1',
          title: '기존 계약 1',
          customer_id: 'customer-1',
          type: 'sales',
          status: 'active',
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          total_amount: 1000000,
        },
        {
          id: 'contract-2',
          title: '기존 계약 2',
          customer_id: 'customer-2',
          type: 'purchase',
          status: 'active',
          start_date: '2025-02-01',
          end_date: '2025-11-30',
          total_amount: 500000,
        },
      ]

      // 2. 새 계약 생성
      const newContractData: ContractFormData = {
        title: '새 워크플로우 계약',
        customer_id: 'customer-3',
        type: 'sales',
        status: 'active',
        start_date: '2025-03-01',
        end_date: '2025-10-31',
        total_amount: 750000,
        payment_terms: 30,
        description: '워크플로우 테스트 계약입니다.',
        owner_id: 'user-1',
      }

      const mockNewContract = {
        id: 'contract-workflow',
        ...newContractData,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      }

      // 3. 활성 계약만 필터링
      const mockActiveContracts = mockAllContracts.filter(c => c.status === 'active')

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            success: true,
            data: mockAllContracts,
          }),
        } as Response)
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            success: true,
            data: mockNewContract,
          }),
        } as Response)
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            success: true,
            data: mockActiveContracts,
          }),
        } as Response)

      // 전체 계약 로드
      const allContractsResult = await loadContracts()
      expect(allContractsResult.success).toBe(true)
      expect(allContractsResult.data).toHaveLength(2)

      // 새 계약 생성
      const createResult = await createContract(newContractData)
      expect(createResult.success).toBe(true)
      expect(createResult.data?.title).toBe('새 워크플로우 계약')

      // 활성 계약만 필터링
      const activeContractsResult = await loadContracts({ status: 'active' })
      expect(activeContractsResult.success).toBe(true)
      expect(activeContractsResult.data).toHaveLength(2)
    })

    it('다양한 계약 타입과 상태를 올바르게 처리해야 함', async () => {
      const testCases = [
        {
          data: {
            title: '판매 계약 - 활성',
            customer_id: 'customer-1',
            type: 'sales' as const,
            status: 'active' as const,
            start_date: '2025-01-01',
            end_date: '2025-12-31',
            total_amount: 1000000,
          },
          expectedType: 'sales',
          expectedStatus: 'active',
        },
        {
          data: {
            title: '구매 계약 - 완료',
            customer_id: 'customer-2',
            type: 'purchase' as const,
            status: 'completed' as const,
            start_date: '2024-01-01',
            end_date: '2024-12-31',
            total_amount: 2000000,
            paid_amount: 2000000,
          },
          expectedType: 'purchase',
          expectedStatus: 'completed',
        },
        {
          data: {
            title: '판매 계약 - 취소',
            customer_id: 'customer-3',
            type: 'sales' as const,
            status: 'cancelled' as const,
            start_date: '2025-01-01',
            total_amount: 500000,
          },
          expectedType: 'sales',
          expectedStatus: 'cancelled',
        },
      ]

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i]
        const mockContract = {
          id: `contract-test-${i}`,
          ...testCase.data,
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
        }

        vi.mocked(fetch).mockResolvedValueOnce({
          json: () => Promise.resolve({
            success: true,
            data: mockContract,
          }),
        } as Response)

        const result = await createContract(testCase.data)

        expect(result.success).toBe(true)
        expect(result.data?.type).toBe(testCase.expectedType)
        expect(result.data?.status).toBe(testCase.expectedStatus)
      }
    })
  })
})
