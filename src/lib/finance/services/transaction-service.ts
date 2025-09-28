import type {
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionFilter,
  TransactionStats,
  DailyTransactionSummary,
} from '$lib/finance/types'

export class TransactionService {
  private baseUrl = '/api/finance'

  // 거래 내역 조회
  async getTransactions(filter?: TransactionFilter & { page?: number; limit?: number }): Promise<{
    transactions: Transaction[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }> {
    try {
      const params = new URLSearchParams()

      if (filter?.accountId) params.append('accountId', filter.accountId)
      if (filter?.categoryId) params.append('categoryId', filter.categoryId)
      if (filter?.type) params.append('type', filter.type)
      if (filter?.status) params.append('status', filter.status)
      if (filter?.dateFrom) params.append('dateFrom', filter.dateFrom)
      if (filter?.dateTo) params.append('dateTo', filter.dateTo)
      if (filter?.amountMin) params.append('amountMin', filter.amountMin.toString())
      if (filter?.amountMax) params.append('amountMax', filter.amountMax.toString())
      if (filter?.search) params.append('search', filter.search)
      if (filter?.tags?.length) params.append('tags', filter.tags.join(','))
      if (filter?.page) params.append('page', filter.page.toString())
      if (filter?.limit) params.append('limit', filter.limit.toString())

      const response = await fetch(`${this.baseUrl}/transactions?${params}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '거래 내역을 조회할 수 없습니다.')
      }

      return {
        transactions: result.data,
        pagination: result.pagination,
      }
    } catch (error) {
      console.error('거래 내역 조회 실패:', error)
      throw error
    }
  }

  // 특정 거래 조회
  async getTransaction(id: string): Promise<Transaction> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/${id}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '거래를 조회할 수 없습니다.')
      }

      return result.data
    } catch (error) {
      console.error('거래 조회 실패:', error)
      throw error
    }
  }

  // 거래 생성
  async createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '거래 생성에 실패했습니다.')
      }

      return result.data
    } catch (error) {
      console.error('거래 생성 실패:', error)
      throw error
    }
  }

  // 거래 수정
  async updateTransaction(id: string, data: UpdateTransactionRequest): Promise<Transaction> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '거래 수정에 실패했습니다.')
      }

      return result.data
    } catch (error) {
      console.error('거래 수정 실패:', error)
      throw error
    }
  }

  // 거래 삭제
  async deleteTransaction(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '거래 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('거래 삭제 실패:', error)
      throw error
    }
  }

  // 거래 통계 조회
  async getTransactionStats(filter?: TransactionFilter): Promise<TransactionStats> {
    try {
      const params = new URLSearchParams()

      if (filter?.accountId) params.append('accountId', filter.accountId)
      if (filter?.categoryId) params.append('categoryId', filter.categoryId)
      if (filter?.type) params.append('type', filter.type)
      if (filter?.dateFrom) params.append('dateFrom', filter.dateFrom)
      if (filter?.dateTo) params.append('dateTo', filter.dateTo)

      const response = await fetch(`${this.baseUrl}/transactions/stats?${params}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '거래 통계를 조회할 수 없습니다.')
      }

      return result.data
    } catch (error) {
      console.error('거래 통계 조회 실패:', error)
      throw error
    }
  }

  // 일별 거래 요약
  async getDailyTransactionSummary(date: string): Promise<DailyTransactionSummary> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/daily-summary?date=${date}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '일별 거래 요약을 조회할 수 없습니다.')
      }

      return result.data
    } catch (error) {
      console.error('일별 거래 요약 조회 실패:', error)
      throw error
    }
  }

  // 월별 거래 요약
  async getMonthlyTransactionSummary(year: number, month: number): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/transactions/monthly-summary?year=${year}&month=${month}`,
      )
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '월별 거래 요약을 조회할 수 없습니다.')
      }

      return result.data
    } catch (error) {
      console.error('월별 거래 요약 조회 실패:', error)
      throw error
    }
  }

  // 거래 내역 일괄 업로드 (엑셀)
  async uploadTransactions(
    file: File,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${this.baseUrl}/transactions/upload`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '거래 내역 업로드에 실패했습니다.')
      }

      return result.data
    } catch (error) {
      console.error('거래 내역 업로드 실패:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스
export const transactionService = new TransactionService()
