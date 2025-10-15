import { AccountService } from '$lib/finance/services/account-service'
import type {
  Account,
  AccountFilter,
  AccountSummary,
  BankSummary,
  CreateAccountRequest,
  UpdateAccountRequest,
} from '$lib/finance/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

// Mock banks
const mockBank = {
  id: 'bank-1',
  name: '국민은행',
  code: '004',
  color: '#FF6B6B',
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
}

const mockBank2 = {
  id: 'bank-2',
  name: '신한은행',
  code: '088',
  color: '#4ECDC4',
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
}

describe('Finance Account Service', () => {
  let accountService: AccountService

  beforeEach(() => {
    vi.clearAllMocks()
    accountService = new AccountService()
  })

  describe('getAccounts', () => {
    it('모든 계좌를 성공적으로 조회해야 함', async () => {
      const mockAccounts: Account[] = [
        {
          id: 'account-1',
          bankId: 'bank-1',
          bank: mockBank,
          accountNumber: '123-456-789',
          name: '법인 통장',
          accountType: 'checking',
          balance: 1000000,
          status: 'active',
          isPrimary: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'account-2',
          bank: mockBank2,
          accountNumber: '987-654-321',
          name: '예금 통장',
          accountType: 'savings',
          balance: 2000000,
          status: 'active',
          isPrimary: false,
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockAccounts,
          }),
      } as Response)

      const result = await accountService.getAccounts()

      expect(result).toEqual(mockAccounts)
      expect(fetch).toHaveBeenCalledWith('/api/finance/accounts')
    })

    it('은행 ID 필터로 계좌를 조회해야 함', async () => {
      const mockAccounts: Account[] = [
        {
          id: 'account-1',
          bank: mockBank,
          accountNumber: '123-456-789',
          name: '법인 통장',
          accountType: 'checking',
          balance: 1000000,
          status: 'active',
          isPrimary: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ]

      const filter: AccountFilter = { bankId: 'bank-1' }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockAccounts,
          }),
      } as Response)

      const result = await accountService.getAccounts(filter)

      expect(result).toEqual(mockAccounts)
      expect(fetch).toHaveBeenCalledWith('/api/finance/accounts?bankId=bank-1')
    })

    it('계좌 타입 필터로 계좌를 조회해야 함', async () => {
      const mockAccounts: Account[] = [
        {
          id: 'account-2',
          bank: mockBank2,
          accountNumber: '987-654-321',
          name: '예금 통장',
          accountType: 'savings',
          balance: 2000000,
          status: 'active',
          isPrimary: false,
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      ]

      const filter: AccountFilter = { accountType: 'savings' }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockAccounts,
          }),
      } as Response)

      const result = await accountService.getAccounts(filter)

      expect(result).toEqual(mockAccounts)
      expect(fetch).toHaveBeenCalledWith('/api/finance/accounts?accountType=savings')
    })

    it('상태 필터로 계좌를 조회해야 함', async () => {
      const mockAccounts: Account[] = [
        {
          id: 'account-1',
          bank: mockBank,
          accountNumber: '123-456-789',
          name: '법인 통장',
          accountType: 'checking',
          balance: 1000000,
          status: 'active',
          isPrimary: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ]

      const filter: AccountFilter = { status: 'active' }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockAccounts,
          }),
      } as Response)

      const result = await accountService.getAccounts(filter)

      expect(result).toEqual(mockAccounts)
      expect(fetch).toHaveBeenCalledWith('/api/finance/accounts?status=active')
    })

    it('주계좌 필터로 계좌를 조회해야 함', async () => {
      const mockAccounts: Account[] = [
        {
          id: 'account-1',
          bank: mockBank,
          accountNumber: '123-456-789',
          name: '법인 통장',
          accountType: 'checking',
          balance: 1000000,
          status: 'active',
          isPrimary: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ]

      const filter: AccountFilter = { isPrimary: true }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockAccounts,
          }),
      } as Response)

      const result = await accountService.getAccounts(filter)

      expect(result).toEqual(mockAccounts)
      expect(fetch).toHaveBeenCalledWith('/api/finance/accounts?isPrimary=true')
    })

    it('검색어로 계좌를 조회해야 함', async () => {
      const mockAccounts: Account[] = [
        {
          id: 'account-1',
          bank: mockBank,
          accountNumber: '123-456-789',
          name: '법인 통장',
          accountType: 'checking',
          balance: 1000000,
          status: 'active',
          isPrimary: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ]

      const filter: AccountFilter = { search: '법인' }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockAccounts,
          }),
      } as Response)

      const result = await accountService.getAccounts(filter)

      expect(result).toEqual(mockAccounts)
      expect(fetch).toHaveBeenCalledWith('/api/finance/accounts?search=%EB%B2%95%EC%9D%B8')
    })

    it('복합 필터로 계좌를 조회해야 함', async () => {
      const mockAccounts: Account[] = [
        {
          id: 'account-1',
          bank: mockBank,
          accountNumber: '123-456-789',
          name: '법인 통장',
          accountType: 'checking',
          balance: 1000000,
          status: 'active',
          isPrimary: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ]

      const filter: AccountFilter = {
        bank: mockBank,
        accountType: 'checking',
        status: 'active',
        isPrimary: true,
        search: '법인',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockAccounts,
          }),
      } as Response)

      const result = await accountService.getAccounts(filter)

      expect(result).toEqual(mockAccounts)
      expect(fetch).toHaveBeenCalledWith(
        '/api/finance/accounts?bankId=bank-1&accountType=checking&status=active&isPrimary=true&search=%EB%B2%95%EC%9D%B8',
      )
    })

    it('API 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(accountService.getAccounts()).rejects.toThrow('Network error')
    })

    it('API 응답 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Database connection failed',
          }),
      } as Response)

      await expect(accountService.getAccounts()).rejects.toThrow('Database connection failed')
    })

    it('빈 계좌 목록을 올바르게 처리해야 함', async () => {
      const mockAccounts: Account[] = []

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockAccounts,
          }),
      } as Response)

      const result = await accountService.getAccounts()

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })
  })

  describe('getAccount', () => {
    it('특정 계좌를 성공적으로 조회해야 함', async () => {
      const mockAccount: Account = {
        id: 'account-1',
        bank: mockBank,
        accountNumber: '123-456-789',
        name: '법인 통장',
        accountType: 'checking',
        balance: 1000000,
        status: 'active',
        isPrimary: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockAccount,
          }),
      } as Response)

      const result = await accountService.getAccount('account-1')

      expect(result).toEqual(mockAccount)
      expect(fetch).toHaveBeenCalledWith('/api/finance/accounts/account-1')
    })

    it('존재하지 않는 계좌 조회 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Account not found',
          }),
      } as Response)

      await expect(accountService.getAccount('non-existent')).rejects.toThrow('Account not found')
    })

    it('네트워크 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(accountService.getAccount('account-1')).rejects.toThrow('Network error')
    })
  })

  describe('createAccount', () => {
    it('새 계좌를 성공적으로 생성해야 함', async () => {
      const accountData: CreateAccountRequest = {
        bank: mockBank,
        accountNumber: '123-456-789',
        name: '법인 통장',
        accountType: 'checking',
        balance: 1000000,
        isPrimary: true,
      }

      const mockCreatedAccount: Account = {
        id: 'account-new',
        ...accountData,
        status: 'active',
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockCreatedAccount,
          }),
      } as Response)

      const result = await accountService.createAccount(accountData)

      expect(result).toEqual(mockCreatedAccount)
      expect(fetch).toHaveBeenCalledWith('/api/finance/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      })
    })

    it('중복 계좌번호로 생성 시 에러를 던져야 함', async () => {
      const accountData: CreateAccountRequest = {
        bank: mockBank,
        accountNumber: '123-456-789',
        name: '법인 통장',
        accountType: 'checking',
        balance: 1000000,
        isPrimary: true,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Account number already exists',
          }),
      } as Response)

      await expect(accountService.createAccount(accountData)).rejects.toThrow(
        'Account number already exists',
      )
    })

    it('네트워크 오류 시 에러를 던져야 함', async () => {
      const accountData: CreateAccountRequest = {
        bank: mockBank,
        accountNumber: '123-456-789',
        name: '법인 통장',
        accountType: 'checking',
        balance: 1000000,
        isPrimary: true,
      }

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(accountService.createAccount(accountData)).rejects.toThrow('Network error')
    })
  })

  describe('updateAccount', () => {
    it('계좌를 성공적으로 수정해야 함', async () => {
      const updateData: UpdateAccountRequest = {
        name: '수정된 법인 통장',
        balance: 1500000,
        isPrimary: false,
      }

      const mockUpdatedAccount: Account = {
        id: 'account-1',
        bank: mockBank,
        accountNumber: '123-456-789',
        ...updateData,
        accountType: 'checking',
        status: 'active',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockUpdatedAccount,
          }),
      } as Response)

      const result = await accountService.updateAccount('account-1', updateData)

      expect(result).toEqual(mockUpdatedAccount)
      expect(fetch).toHaveBeenCalledWith('/api/finance/accounts/account-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
    })

    it('존재하지 않는 계좌 수정 시 에러를 던져야 함', async () => {
      const updateData: UpdateAccountRequest = {
        name: '수정된 법인 통장',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Account not found',
          }),
      } as Response)

      await expect(accountService.updateAccount('non-existent', updateData)).rejects.toThrow(
        'Account not found',
      )
    })

    it('네트워크 오류 시 에러를 던져야 함', async () => {
      const updateData: UpdateAccountRequest = {
        name: '수정된 법인 통장',
      }

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(accountService.updateAccount('account-1', updateData)).rejects.toThrow(
        'Network error',
      )
    })
  })

  describe('deleteAccount', () => {
    it('계좌를 성공적으로 삭제해야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            message: '계좌가 삭제되었습니다.',
            deletedTransactionCount: 15,
          }),
      } as Response)

      const result = await accountService.deleteAccount('account-1')

      expect(result).toEqual({
        message: '계좌가 삭제되었습니다.',
        deletedTransactionCount: 15,
      })
      expect(fetch).toHaveBeenCalledWith('/api/finance/accounts/account-1', {
        method: 'DELETE',
      })
    })

    it('존재하지 않는 계좌 삭제 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Account not found',
          }),
      } as Response)

      await expect(accountService.deleteAccount('non-existent')).rejects.toThrow(
        'Account not found',
      )
    })

    it('네트워크 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(accountService.deleteAccount('account-1')).rejects.toThrow('Network error')
    })
  })

  describe('getAccountSummary', () => {
    it('계좌 요약 정보를 성공적으로 조회해야 함', async () => {
      const mockSummary: AccountSummary = {
        account: mockAccount,
        totalTransactions: 50,
        totalIncome: 5000000,
        totalExpense: 3000000,
        netAmount: 2000000,
        averageDailyBalance: 1500000,
        lastTransactionDate: '2025-01-14T15:30:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockSummary,
          }),
      } as Response)

      const result = await accountService.getAccountSummary('account-1')

      expect(result).toEqual(mockSummary)
      expect(fetch).toHaveBeenCalledWith('/api/finance/accounts/account-1/summary')
    })

    it('날짜 범위로 계좌 요약 정보를 조회해야 함', async () => {
      const mockSummary: AccountSummary = {
        account: mockAccount,
        totalTransactions: 25,
        totalIncome: 2500000,
        totalExpense: 1500000,
        netAmount: 1000000,
        averageDailyBalance: 1200000,
        lastTransactionDate: '2025-01-14T15:30:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockSummary,
          }),
      } as Response)

      const result = await accountService.getAccountSummary('account-1', '2025-01-01', '2025-01-31')

      expect(result).toEqual(mockSummary)
      expect(fetch).toHaveBeenCalledWith(
        '/api/finance/accounts/account-1/summary?startDate=2025-01-01&endDate=2025-01-31',
      )
    })

    it('존재하지 않는 계좌 요약 조회 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Account not found',
          }),
      } as Response)

      await expect(accountService.getAccountSummary('non-existent')).rejects.toThrow(
        'Account not found',
      )
    })

    it('네트워크 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(accountService.getAccountSummary('account-1')).rejects.toThrow('Network error')
    })
  })

  describe('getBankSummaries', () => {
    it('은행별 요약 정보를 성공적으로 조회해야 함', async () => {
      const mockBankSummaries: BankSummary[] = [
        {
          bank: mockBank,
          bankName: '국민은행',
          accountCount: 3,
          totalBalance: 5000000,
          totalIncome: 2000000,
          totalExpense: 1000000,
        },
        {
          bank: mockBank2,
          bankName: '신한은행',
          accountCount: 2,
          totalBalance: 3000000,
          totalIncome: 1500000,
          totalExpense: 800000,
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockBankSummaries,
          }),
      } as Response)

      const result = await accountService.getBankSummaries()

      expect(result).toEqual(mockBankSummaries)
      expect(fetch).toHaveBeenCalledWith('/api/finance/accounts/bank-summaries')
    })

    it('빈 은행 요약 목록을 올바르게 처리해야 함', async () => {
      const mockBankSummaries: BankSummary[] = []

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockBankSummaries,
          }),
      } as Response)

      const result = await accountService.getBankSummaries()

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('API 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(accountService.getBankSummaries()).rejects.toThrow('Network error')
    })

    it('API 응답 오류 시 에러를 던져야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Database connection failed',
          }),
      } as Response)

      await expect(accountService.getBankSummaries()).rejects.toThrow('Database connection failed')
    })
  })

  describe('Integration tests', () => {
    it('전체 계좌 관리 워크플로우가 올바르게 작동해야 함', async () => {
      // 1. 모든 계좌 조회
      const mockAllAccounts: Account[] = [
        {
          id: 'account-1',
          bank: mockBank,
          accountNumber: '123-456-789',
          name: '법인 통장',
          accountType: 'checking',
          balance: 1000000,
          status: 'active',
          isPrimary: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'account-2',
          bank: mockBank2,
          accountNumber: '987-654-321',
          name: '예금 통장',
          accountType: 'savings',
          balance: 2000000,
          status: 'active',
          isPrimary: false,
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      ]

      // 2. 새 계좌 생성
      const newAccountData: CreateAccountRequest = {
        bankId: 'bank-3',
        accountNumber: '555-666-777',
        name: '투자 통장',
        accountType: 'investment',
        balance: 0,
        isPrimary: false,
      }

      const mockNewAccount: Account = {
        id: 'account-new',
        ...newAccountData,
        status: 'active',
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      }

      // 3. 활성 계좌만 필터링
      const mockActiveAccounts = mockAllAccounts.filter((a) => a.status === 'active')

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: mockAllAccounts,
            }),
        } as Response)
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: mockNewAccount,
            }),
        } as Response)
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: mockActiveAccounts,
            }),
        } as Response)

      // 전체 계좌 조회
      const allAccountsResult = await accountService.getAccounts()
      expect(allAccountsResult).toHaveLength(2)

      // 새 계좌 생성
      const createResult = await accountService.createAccount(newAccountData)
      expect(createResult.accountName).toBe('투자 통장')

      // 활성 계좌만 필터링
      const activeAccountsResult = await accountService.getAccounts({ status: 'active' })
      expect(activeAccountsResult).toHaveLength(2)
    })

    it('다양한 계좌 타입과 상태를 올바르게 처리해야 함', async () => {
      const testCases = [
        {
          data: {
            bank: mockBank,
            accountNumber: '111-222-333',
            accountName: '당좌 예금',
            accountType: 'checking' as const,
            balance: 1000000,
            isPrimary: true,
          },
          expectedType: 'checking',
          expectedBalance: 1000000,
        },
        {
          data: {
            bank: mockBank2,
            accountNumber: '444-555-666',
            accountName: '정기 예금',
            accountType: 'savings' as const,
            balance: 5000000,
            isPrimary: false,
          },
          expectedType: 'savings',
          expectedBalance: 5000000,
        },
        {
          data: {
            bankId: 'bank-3',
            accountNumber: '777-888-999',
            accountName: '투자 계좌',
            accountType: 'investment' as const,
            balance: 0,
            isPrimary: false,
          },
          expectedType: 'investment',
          expectedBalance: 0,
        },
      ]

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i]
        const mockAccount: Account = {
          id: `account-test-${i}`,
          ...testCase.data,
          status: 'active',
          createdAt: '2025-01-15T10:00:00Z',
          updatedAt: '2025-01-15T10:00:00Z',
        }

        vi.mocked(fetch).mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: mockAccount,
            }),
        } as Response)

        const result = await accountService.createAccount(testCase.data)

        expect(result.accountType).toBe(testCase.expectedType)
        expect(result.balance).toBe(testCase.expectedBalance)
      }
    })
  })
})
