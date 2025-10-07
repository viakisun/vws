import type { FinanceDashboard, DailyFinanceReport, FinanceAlert } from '$lib/finance/types'
import { logger } from '$lib/utils/logger'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface FinancePrediction {
  date: string
  predictedBalance: number
  confidence: number
  [key: string]: unknown
}

interface CashFlowAnalysis {
  totalInflow: number
  totalOutflow: number
  netCashFlow: number
  [key: string]: unknown
}

export class DashboardService {
  private baseUrl = '/api/finance'

  // 자금일보 대시보드 데이터 조회
  async getDashboardData(date?: string): Promise<FinanceDashboard> {
    try {
      const params = new URLSearchParams()
      if (date) params.append('date', date)

      const response = await fetch(`${this.baseUrl}/dashboard?${params}`)
      const result = (await response.json()) as ApiResponse<FinanceDashboard>

      if (!result.success || !result.data) {
        throw new Error(result.error || '대시보드 데이터를 조회할 수 없습니다.')
      }

      return result.data
    } catch (error) {
      logger.error('대시보드 데이터 조회 실패:', error)
      throw error
    }
  }

  // 자금일보 생성
  async generateDailyReport(date: string): Promise<DailyFinanceReport> {
    try {
      const response = await fetch(`${this.baseUrl}/reports/daily`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date }),
      })

      const result = (await response.json()) as ApiResponse<DailyFinanceReport>

      if (!result.success || !result.data) {
        throw new Error(result.error || '자금일보 생성에 실패했습니다.')
      }

      return result.data
    } catch (error) {
      logger.error('자금일보 생성 실패:', error)
      throw error
    }
  }

  // 자금일보 조회
  async getDailyReport(date: string): Promise<DailyFinanceReport | null> {
    try {
      const response = await fetch(`${this.baseUrl}/reports/daily?date=${date}`)
      const result = (await response.json()) as ApiResponse<DailyFinanceReport>

      if (!result.success) {
        if (response.status === 404) {
          return null // 자금일보가 없는 경우
        }
        throw new Error(result.error || '자금일보를 조회할 수 없습니다.')
      }

      return result.data ?? null
    } catch (error) {
      logger.error('자금일보 조회 실패:', error)
      throw error
    }
  }

  // 자금일보 목록 조회
  async getDailyReports(startDate: string, endDate: string): Promise<DailyFinanceReport[]> {
    try {
      const params = new URLSearchParams()
      params.append('startDate', startDate)
      params.append('endDate', endDate)

      const response = await fetch(`${this.baseUrl}/reports/daily?${params}`)
      const result = (await response.json()) as ApiResponse<DailyFinanceReport[]>

      if (!result.success || !result.data) {
        throw new Error(result.error || '자금일보 목록을 조회할 수 없습니다.')
      }

      return result.data
    } catch (error) {
      logger.error('자금일보 목록 조회 실패:', error)
      throw error
    }
  }

  // 자금 알림 조회
  async getAlerts(isRead?: boolean): Promise<FinanceAlert[]> {
    try {
      const params = new URLSearchParams()
      if (isRead !== undefined) params.append('isRead', isRead.toString())

      const response = await fetch(`${this.baseUrl}/alerts?${params}`)
      const result = (await response.json()) as ApiResponse<FinanceAlert[]>

      if (!result.success || !result.data) {
        throw new Error(result.error || '자금 알림을 조회할 수 없습니다.')
      }

      return result.data
    } catch (error) {
      logger.error('자금 알림 조회 실패:', error)
      throw error
    }
  }

  // 알림 읽음 처리
  async markAlertAsRead(alertId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/alerts/${alertId}/read`, {
        method: 'PUT',
      })

      const result = (await response.json()) as ApiResponse<void>

      if (!result.success) {
        throw new Error(result.error || '알림 읽음 처리에 실패했습니다.')
      }
    } catch (error) {
      logger.error('알림 읽음 처리 실패:', error)
      throw error
    }
  }

  // 알림 해결 처리
  async resolveAlert(alertId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/alerts/${alertId}/resolve`, {
        method: 'PUT',
      })

      const result = (await response.json()) as ApiResponse<void>

      if (!result.success) {
        throw new Error(result.error || '알림 해결 처리에 실패했습니다.')
      }
    } catch (error) {
      logger.error('알림 해결 처리 실패:', error)
      throw error
    }
  }

  // 자금 예측 조회
  async getFinancePredictions(days: number = 30): Promise<FinancePrediction[]> {
    try {
      const response = await fetch(`${this.baseUrl}/predictions?days=${days}`)
      const result = (await response.json()) as ApiResponse<FinancePrediction[]>

      if (!result.success || !result.data) {
        throw new Error(result.error || '자금 예측을 조회할 수 없습니다.')
      }

      return result.data
    } catch (error) {
      logger.error('자금 예측 조회 실패:', error)
      throw error
    }
  }

  // 현금흐름 분석
  async getCashFlowAnalysis(startDate: string, endDate: string): Promise<CashFlowAnalysis> {
    try {
      const params = new URLSearchParams()
      params.append('startDate', startDate)
      params.append('endDate', endDate)

      const response = await fetch(`${this.baseUrl}/analysis/cash-flow?${params}`)
      const result = (await response.json()) as ApiResponse<CashFlowAnalysis>

      if (!result.success || !result.data) {
        throw new Error(result.error || '현금흐름 분석을 조회할 수 없습니다.')
      }

      return result.data
    } catch (error) {
      logger.error('현금흐름 분석 조회 실패:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스
export const dashboardService = new DashboardService()
