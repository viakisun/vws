/**
 * 핵심 에러 모니터링 시스템
 * 중요한 에러만 추적하고 알림을 제공합니다.
 */

import { logger } from './logger'

// 에러 심각도 레벨
export const ERROR_SEVERITY = {
  CRITICAL: 'critical', // 시스템 다운, 데이터 손실
  HIGH: 'high', // 보안 문제, 결제 실패
  MEDIUM: 'medium', // API 오류, 권한 문제
  LOW: 'low', // 일반적인 오류
} as const

// 에러 카테고리
export const ERROR_CATEGORY = {
  AUTH: 'authentication',
  DATABASE: 'database',
  PAYMENT: 'payment',
  SECURITY: 'security',
  API: 'api',
  SYSTEM: 'system',
} as const

// 에러 메트릭스 저장소
interface ErrorMetric {
  id: string
  timestamp: Date
  severity: keyof typeof ERROR_SEVERITY
  category: keyof typeof ERROR_CATEGORY
  message: string
  stack?: string
  userId?: string
  requestPath?: string
  count: number
}

class ErrorMonitor {
  private errorMetrics: ErrorMetric[] = []
  private readonly maxMetrics = 1000 // 최대 저장 개수

  /**
   * 에러 기록
   */
  recordError(
    severity: keyof typeof ERROR_SEVERITY,
    category: keyof typeof ERROR_CATEGORY,
    message: string,
    context?: {
      stack?: string
      userId?: string
      requestPath?: string
      error?: Error
    },
  ): void {
    const errorId = this.generateErrorId(category, message)
    const existing = this.errorMetrics.find((e) => e.id === errorId)

    if (existing) {
      // 기존 에러 카운트 증가
      existing.count++
      existing.timestamp = new Date()
    } else {
      // 새 에러 추가
      const errorMetric: ErrorMetric = {
        id: errorId,
        timestamp: new Date(),
        severity,
        category,
        message,
        stack: context?.stack || context?.error?.stack,
        userId: context?.userId,
        requestPath: context?.requestPath,
        count: 1,
      }

      this.errorMetrics.push(errorMetric)

      // 메트릭스 개수 제한
      if (this.errorMetrics.length > this.maxMetrics) {
        this.errorMetrics = this.errorMetrics.slice(-this.maxMetrics)
      }
    }

    // 심각한 에러는 즉시 로그
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      const errorMetric = this.errorMetrics[this.errorMetrics.length - 1]
      this.logCriticalError(errorMetric)
    }

    // 에러 통계 로그 (1분마다)
    this.logErrorStats()
  }

  /**
   * 에러 ID 생성
   */
  private generateErrorId(category: string, message: string): string {
    const hash = this.simpleHash(`${category}:${message}`)
    return `${category}_${hash}`
  }

  /**
   * 간단한 해시 함수
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // 32bit 정수로 변환
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * 심각한 에러 로깅
   */
  private logCriticalError(error: ErrorMetric): void {
    const emoji = error.severity === 'CRITICAL' ? '🚨' : '⚠️'

    logger.error(`${emoji} ${error.severity} ERROR - ${error.category.toUpperCase()}`, {
      message: error.message,
      userId: error.userId,
      requestPath: error.requestPath,
      count: error.count,
      timestamp: error.timestamp.toISOString(),
    })

    if (error.stack) {
      logger.error('Stack trace:', error.stack)
    }
  }

  /**
   * 에러 통계 로깅 (1분마다)
   */
  private lastStatsLog = 0
  private logErrorStats(): void {
    const now = Date.now()
    const oneMinute = 60 * 1000

    if (now - this.lastStatsLog < oneMinute) {
      return
    }

    this.lastStatsLog = now

    const recentErrors = this.errorMetrics.filter((e) => now - e.timestamp.getTime() < oneMinute)

    if (recentErrors.length > 0) {
      const stats = this.calculateErrorStats(recentErrors)

      if (stats.totalErrors > 0) {
        logger.warn('📊 Error Statistics (Last 1 minute)', {
          totalErrors: stats.totalErrors,
          criticalErrors: stats.criticalErrors,
          highErrors: stats.highErrors,
          topCategories: stats.topCategories,
          topErrors: stats.topErrors,
        })
      }
    }
  }

  /**
   * 에러 통계 계산
   */
  private calculateErrorStats(errors: ErrorMetric[]) {
    const stats = {
      totalErrors: errors.reduce((sum, e) => sum + e.count, 0),
      criticalErrors: errors
        .filter((e) => e.severity === 'CRITICAL')
        .reduce((sum, e) => sum + e.count, 0),
      highErrors: errors.filter((e) => e.severity === 'HIGH').reduce((sum, e) => sum + e.count, 0),
      topCategories: {} as Record<string, number>,
      topErrors: [] as Array<{ message: string; count: number }>,
    }

    // 카테고리별 통계
    errors.forEach((error) => {
      stats.topCategories[error.category] = (stats.topCategories[error.category] || 0) + error.count
    })

    // 상위 에러 메시지
    stats.topErrors = errors
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((e) => ({ message: e.message, count: e.count }))

    return stats
  }

  /**
   * 최근 에러 조회
   */
  getRecentErrors(minutes: number = 10): ErrorMetric[] {
    const cutoff = Date.now() - minutes * 60 * 1000
    return this.errorMetrics
      .filter((e) => e.timestamp.getTime() > cutoff)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * 에러 메트릭스 초기화
   */
  clearMetrics(): void {
    this.errorMetrics = []
  }
}

// 싱글톤 인스턴스
export const errorMonitor = new ErrorMonitor()

// 편의 함수들
export const recordError = (
  severity: keyof typeof ERROR_SEVERITY,
  category: keyof typeof ERROR_CATEGORY,
  message: string,
  context?: {
    stack?: string
    userId?: string
    requestPath?: string
    error?: Error
  },
) => errorMonitor.recordError(severity, category, message, context)

export const recordCriticalError = (
  category: keyof typeof ERROR_CATEGORY,
  message: string,
  context?: {
    stack?: string
    userId?: string
    requestPath?: string
    error?: Error
  },
) => errorMonitor.recordError('CRITICAL', category, message, context)

export const recordHighError = (
  category: keyof typeof ERROR_CATEGORY,
  message: string,
  context?: {
    stack?: string
    userId?: string
    requestPath?: string
    error?: Error
  },
) => errorMonitor.recordError('HIGH', category, message, context)

export default errorMonitor
