import { json } from '@sveltejs/kit'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

export const GET: RequestHandler = async () => {
  const startTime = Date.now()
  
  try {
    logger.info('📋 Version info requested', {
      timestamp: new Date().toISOString()
    })

    // package.json에서 버전 정보 읽기
    const packageJsonPath = join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

    const versionInfo = {
      version: packageJson.version,
      name: packageJson.name,
      description: packageJson.description || 'VIA Workstream',
      buildDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식
      buildTime: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        external: Math.round((process.memoryUsage().external / 1024 / 1024) * 100) / 100,
      },
      responseTime: Date.now() - startTime
    }

    logger.info('✅ Version info provided', {
      version: versionInfo.version,
      environment: versionInfo.environment,
      responseTime: versionInfo.responseTime,
      uptime: versionInfo.uptime
    })

    return json(versionInfo)
  } catch (error) {
    logger.error('❌ Version info fetch failed:', error)
    
    // 폴백 값
    const fallbackInfo = {
      version: '0.6.0',
      name: 'vws',
      description: 'VIA Workstream',
      buildDate: new Date().toISOString().split('T')[0],
      buildTime: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      uptime: process.uptime(),
      error: 'Failed to read package.json, using fallback values',
      responseTime: Date.now() - startTime
    }

    logger.warn('Using fallback version info:', fallbackInfo)

    return json(fallbackInfo, { status: 200 })
  }
}
