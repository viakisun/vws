import type {
    Account,
    AccountFilter,
    AccountSummary,
    BankSummary,
    CreateAccountRequest,
    UpdateAccountRequest,
} from '$lib/finance/types'

export class AccountService {
  private baseUrl = '/api/finance'

  // 계좌 목록 조회
  async getAccounts(filter?: AccountFilter): Promise<Account[]> {
    try {
      const params = new URLSearchParams()

      if (filter?.bankId) params.append('bankId', filter.bankId)
      if (filter?.accountType) params.append('accountType', filter.accountType)
      if (filter?.status) params.append('status', filter.status)
      if (filter?.isPrimary !== undefined) params.append('isPrimary', filter.isPrimary.toString())
      if (filter?.search) params.append('search', filter.search)

      const response = await fetch(`${this.baseUrl}/accounts?${params}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '계좌 목록을 조회할 수 없습니다.')
      }

      return result.data
    } catch (error) {
      console.error('계좌 목록 조회 실패:', error)
      throw error
    }
  }

  // 특정 계좌 조회
  async getAccount(id: string): Promise<Account> {
    try {
      const response = await fetch(`${this.baseUrl}/accounts/${id}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '계좌를 조회할 수 없습니다.')
      }

      return result.data
    } catch (error) {
      console.error('계좌 조회 실패:', error)
      throw error
    }
  }

  // 계좌 생성
  async createAccount(data: CreateAccountRequest): Promise<Account> {
    try {
      const response = await fetch(`${this.baseUrl}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '계좌 생성에 실패했습니다.')
      }

      return result.data
    } catch (error) {
      console.error('계좌 생성 실패:', error)
      throw error
    }
  }

  // 계좌 수정
  async updateAccount(id: string, data: UpdateAccountRequest): Promise<Account> {
    try {
      const response = await fetch(`${this.baseUrl}/accounts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '계좌 수정에 실패했습니다.')
      }

      return result.data
    } catch (error) {
      console.error('계좌 수정 실패:', error)
      throw error
    }
  }

  // 계좌 완전 삭제 (거래 내역 포함)
  async deleteAccount(id: string): Promise<{ message: string; deletedTransactionCount?: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/accounts/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '계좌 삭제에 실패했습니다.')
      }

      return {
        message: result.message,
        deletedTransactionCount: result.deletedTransactionCount,
      }
    } catch (error) {
      console.error('계좌 삭제 실패:', error)
      throw error
    }
  }

  // 계좌 요약 정보 조회
  async getAccountSummary(
    accountId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AccountSummary> {
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`${this.baseUrl}/accounts/${accountId}/summary?${params}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '계좌 요약 정보를 조회할 수 없습니다.')
      }

      return result.data
    } catch (error) {
      console.error('계좌 요약 정보 조회 실패:', error)
      throw error
    }
  }

  // 은행별 계좌 요약
  async getBankSummaries(): Promise<BankSummary[]> {
    try {
      const response = await fetch(`${this.baseUrl}/accounts/bank-summaries`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '은행별 요약 정보를 조회할 수 없습니다.')
      }

      return result.data
    } catch (error) {
      console.error('은행별 요약 정보 조회 실패:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스
export const accountService = new AccountService()
