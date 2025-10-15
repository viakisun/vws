import { json } from '@sveltejs/kit'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'
import { healthCheck as dbHealthCheck } from '$lib/database/connection'

export const GET: RequestHandler = async () => {
  const startTime = Date.now()
  
  try {
    logger.info('🏥 Health check requested', {
      timestamp: new Date().toISOString(),
      userAgent: 'health-check'
    })

    // package.json에서 버전 정보 읽기
    let version = '0.6.0' // 기본값
    let name = 'vws'
    
    try {
      const packageJsonPath = join(process.cwd(), 'package.json')
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
      version = packageJson.version
      name = packageJson.name
    } catch (error) {
      logger.warn('package.json 읽기 실패, 기본값 사용:', error)
    }

    // 데이터베이스 연결 상태 확인
    let dbStatus = 'disconnected'
    let dbResponseTime = 0
    
    try {
      const dbCheckStart = Date.now()
      const isDbHealthy = await dbHealthCheck()
      dbResponseTime = Date.now() - dbCheckStart
      dbStatus = isDbHealthy ? 'connected' : 'error'
    } catch (error) {
      logger.error('❌ Database health check failed:', error)
      dbStatus = 'error'
    }
    
    const healthInfo = {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version,
      name,
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        external: Math.round((process.memoryUsage().external / 1024 / 1024) * 100) / 100,
        rss: Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100,
      },
      database: {
        status: dbStatus,
        responseTime: dbResponseTime
      },
      responseTime: Date.now() - startTime,
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    }

    logger.info('✅ Health check completed', {
      status: healthInfo.status,
      version: healthInfo.version,
      uptime: healthInfo.uptime,
      dbStatus: dbStatus,
      dbResponseTime: dbResponseTime,
      totalResponseTime: healthInfo.responseTime
    })

    const statusCode = healthInfo.status === 'ok' ? 200 : 503
    return json(healthInfo, { status: statusCode })
  } catch (error) {
    const errorResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      responseTime: Date.now() - startTime
    }

    logger.error('❌ Health check failed:', {
      error,
      duration: errorResponse.responseTime
    })

    return json(errorResponse, { status: 500 })
  }
}
