import { ERROR_CATEGORY, ERROR_SEVERITY, recordError } from '$lib/utils/error-monitor'
import { logger } from '$lib/utils/logger'
import { config } from 'dotenv'
import type { PoolClient, QueryResult } from 'pg'
import { Pool } from 'pg'

// Load environment variables
config()

// Database connection pool
let pool: Pool | null = null

// =============================================
// DATE HANDLING UTILITIES
// =============================================

/**
 * DB에서 가져온 날짜가 올바른 문자열 형식인지 검증
 *
 * ✅ 허용 형식:
 * - "YYYY-MM-DD" (DATE)
 * - "YYYY-MM-DD HH:MM:SS.sss+09" (TIMESTAMPTZ::text)
 *
 * ❌ 에러 (::text 누락):
 * - Date 객체
 * - ISO 8601 (YYYY-MM-DDTHH:MM:SSZ)
 */
export function assertDbDateText(value: unknown): string {
  if (!value) return ''

  // ❌ Date 객체 - SELECT * 또는 RETURNING * 사용 중!
  if (value instanceof Date) {
    const stack = new Error().stack
    const callerLine = stack?.split('\n')[2]?.trim() || 'unknown location'

    logger.selectStar('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.selectStar('❌ [assertDbDateText] Date object detected - BAD QUERY PATTERN!')
    try {
      logger.selectStar('   Value:', value.toISOString())
    } catch {
      logger.selectStar('   Value:', String(value))
    }
    logger.selectStar('   Called from:', callerLine)
    logger.selectStar('')
    logger.selectStar('   Cause: Using SELECT * or RETURNING * or missing ::text')
    logger.selectStar('   Fix: Explicitly select columns with ::text')
    logger.selectStar('')
    logger.selectStar('   Example:')
    logger.selectStar('   ❌ SELECT * FROM table')
    logger.selectStar('   ❌ SELECT DATE(column) FROM table')
    logger.selectStar('   ✅ SELECT id, name, created_at::text FROM table')
    logger.selectStar('   ✅ SELECT DATE(column)::text FROM table')
    logger.selectStar('')
    logger.selectStar('   ❌ RETURNING *')
    logger.selectStar('   ✅ RETURNING id, name, created_at::text')
    logger.selectStar('')
    logger.selectStar('   Stack trace:')
    logger.selectStar(stack || 'Stack trace not available')
    logger.selectStar('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return String(value)
  }

  if (typeof value !== 'string') {
    const stack = new Error().stack
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.error('❌ [assertDbDateText] Non-string date from DB')
    logger.error('   Type:', typeof value)
    logger.error('   Value:', value)
    logger.error('')
    logger.error('   Cause: Missing ::text in SELECT query')
    logger.error('   Fix: Add ::text to date/timestamp columns')
    logger.error('')
    logger.error('   Stack trace:')
    logger.error(stack || 'Stack trace not available')
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return String(value ?? '')
  }

  // ✅ DATE 형식
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  // ✅ TIMESTAMPTZ::text 형식
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?[+-]\d{2}/.test(value)) return value

  // ❌ ISO 8601 (::text 누락)
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const stack = new Error().stack
    const callerLine = stack?.split('\n')[2]?.trim() || 'unknown location'

    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.error('❌ [assertDbDateText] ISO 8601 detected')
    logger.error('   Value:', value)
    logger.error('   Missing ::text in SQL query')
    logger.error('   Called from:', callerLine)
    logger.error('')
    logger.error('   Stack trace:')
    logger.error(stack || 'Stack trace not available')
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return value
  }

  // ❌ 기타 비표준 형식
  const stack = new Error().stack
  logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  logger.error('❌ [assertDbDateText] Unexpected format')
  logger.error('   Value:', value)
  logger.error('')
  logger.error('   Stack trace:')
  logger.error(stack || 'Stack trace not available')
  logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  return value
}

/**
 * 데이터베이스 쿼리 결과의 모든 날짜 필드를 처리
 */
/**
 * Type guard to check if an object is a valid database row
 */
function isDatabaseRow(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null
}

export function processQueryResultDates<T = unknown>(result: QueryResult<T>): QueryResult<T> {
  if (!result.rows || result.rows.length === 0) {
    return result
  }

  // 날짜 필드 목록 (TIMESTAMP WITH TIME ZONE 칼럼들)
  const dateFields = [
    'created_at',
    'updated_at',
    'last_login',
    'date',
    'hire_date',
    'start_date',
    'end_date',
    'period_start',
    'period_end',
    'last_contact',
    'next_action_date',
    'renewal_date',
    'approved_at',
    'decided_at',
    'signed_at',
    'generated_at',
  ] as const

  const processedRows = result.rows.map((row: T) => {
    if (!isDatabaseRow(row)) {
      return row
    }

    const processedRow: Record<string, unknown> = { ...row }

    dateFields.forEach((field) => {
      if (field in processedRow && processedRow[field]) {
        processedRow[field] = assertDbDateText(processedRow[field])
      }
    })

    return processedRow as T
  })

  return {
    ...result,
    rows: processedRows,
  }
}

// Database configuration - AWS only
const getDbConfig = () => {
  return {
    host: process.env.AWS_DB_HOST || 'db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com',
    port: parseInt(process.env.AWS_DB_PORT || '5432'),
    database: process.env.AWS_DB_NAME || 'postgres',
    user: process.env.AWS_DB_USER || 'postgres',
    password: process.env.AWS_DB_PASSWORD || 'viahubdev',
    ssl: {
      rejectUnauthorized: false,
    },
    // 성능 최적화 설정
    max: 20, // 최대 연결 수
    min: 5, // 최소 연결 수
    idleTimeoutMillis: 30000, // 30초
    connectionTimeoutMillis: 10000, // 10초 (2초에서 증가)
    acquireTimeoutMillis: 60000, // 60초
    createTimeoutMillis: 30000, // 30초
    destroyTimeoutMillis: 5000, // 5초
    reapIntervalMillis: 1000, // 1초
    createRetryIntervalMillis: 200, // 200ms
  }
}

const dbConfig = getDbConfig()

// Initialize database connection pool
export function initializeDatabase(): Pool {
  if (!pool) {
    logger.info('🗄️  Initializing database connection pool...', {
      host: dbConfig.host,
      database: dbConfig.database,
      port: dbConfig.port,
      maxConnections: dbConfig.max,
      minConnections: dbConfig.min,
    })

    pool = new Pool(dbConfig)

    // Set timezone to Asia/Seoul for all connections
    // 한국 전용 서비스이므로 KST로 고정 (TIMESTAMPTZ는 안전망으로 유지)
    pool.on('connect', async (client) => {
      try {
        await client.query("SET TIME ZONE 'Asia/Seoul'")
        logger.debug('📅 Database session timezone set to Asia/Seoul (KST)')
      } catch (error) {
        logger.error('❌ Failed to set timezone:', error)
      }
    })

    // Connection acquired
    pool.on('acquire', (client) => {
      logger.db.connection('Database connection acquired', {
        totalCount: pool?.totalCount || 0,
        idleCount: pool?.idleCount || 0,
        waitingCount: pool?.waitingCount || 0,
      })
    })

    // Connection released back to pool
    pool.on('release', () => {
      logger.db.connection('Database connection released', {
        totalCount: pool?.totalCount || 0,
        idleCount: pool?.idleCount || 0,
        waitingCount: pool?.waitingCount || 0,
      })
    })

    // Handle pool errors
    pool.on('error', (err: Error) => {
      // 에러 모니터링에 기록
      recordError('CRITICAL', 'DATABASE', 'Database connection pool error', {
        stack: err.stack,
        error: err,
      })

      logger.error('💥 Unexpected error on idle client', {
        error: err.message,
        stack: err.stack,
        totalCount: pool?.totalCount || 0,
        idleCount: pool?.idleCount || 0,
        waitingCount: pool?.waitingCount || 0,
      })
      process.exit(-1)
    })

    logger.info('✅ Database connection pool initialized successfully', {
      timezone: 'Asia/Seoul (KST)',
      maxConnections: dbConfig.max,
      minConnections: dbConfig.min,
      idleTimeout: dbConfig.idleTimeoutMillis,
      connectionTimeout: dbConfig.connectionTimeoutMillis,
    })
  }

  return pool
}

// Get database connection
export async function getConnection(): Promise<PoolClient> {
  if (!pool) {
    try {
      initializeDatabase()
    } catch (error) {
      logger.error('Failed to initialize database connection:', error)
      throw error
    }
  }

  return await pool!.connect()
}

// Execute a query with parameters and retry logic
export async function query<T = unknown>(
  text: string,
  params?: unknown[],
  retries: number = 3,
): Promise<QueryResult<T>> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await getConnection()
      try {
        const result = await client.query<T>(text, params)
        // 자동으로 날짜 필드 처리
        return processQueryResultDates(result) as QueryResult<T>
      } finally {
        client.release()
      }
    } catch (error) {
      lastError = error as Error

      // 타임아웃이나 연결 오류인 경우에만 재시도
      const shouldRetry =
        error instanceof Error &&
        (error.message.includes('ETIMEDOUT') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('timeout') ||
          error.message.includes('connection'))

      if (shouldRetry && attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000) // Exponential backoff, max 5초
        logger.warn(
          `Database query failed (attempt ${attempt}/${retries}), retrying in ${delay}ms:`,
          {
            error: error.message,
            query: text.substring(0, 100) + '...',
          },
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      throw error
    }
  }

  throw lastError || new Error('Query failed after all retries')
}

// Execute a transaction
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getConnection()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Close database connection pool
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    // Database connection pool closed
  }
}

interface HealthCheckResult {
  health: number
}

interface PostgresError extends Error {
  code?: string
  detail?: string
}

function isPostgresError(error: unknown): error is PostgresError {
  return error instanceof Error && ('code' in error || 'detail' in error)
}

// Database health check
export async function healthCheck(): Promise<boolean> {
  try {
    // Starting database health check
    const result = await query<HealthCheckResult>('SELECT 1 as health')
    const isHealthy = result.rows[0]?.health === 1

    return isHealthy
  } catch (error) {
    logger.error('Database health check failed:', error)
    if (isPostgresError(error)) {
      logger.error('Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
      })
    }
    return false
  }
}

// Database types are now imported from $lib/types

export interface DatabaseExpenseItem {
  id: string
  project_id: string
  category_code: string
  requester_id: string
  amount: number
  currency: string
  description?: string
  status: string
  dept_owner?: string
  created_at: Date
  updated_at: Date
  [key: string]: unknown
}

export interface DatabaseEmployee {
  id: string
  employee_id: string
  user_id?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  department?: string
  position?: string
  manager_id?: string
  employment_type?: string
  hire_date?: Date
  salary?: number
  status: string
  address?: string
  emergency_contact?: {
    name?: string
    phone?: string
    relationship?: string
  }
  created_at: Date
  updated_at: Date
  [key: string]: unknown
}

export interface DatabaseTransaction {
  id: string
  bank_account_id: string
  category_id: string
  amount: number
  type: string
  description?: string
  reference?: string
  date: Date
  created_by: string
  created_at: Date
  updated_at: Date
  [key: string]: unknown
}

/**
 * @deprecated DatabaseService가 제거되었습니다.
 * 각 도메인별 서비스를 사용하세요:
 *
 * - Company: import { companyService } from '$lib/services/company/company-service'
 * - Project: import { projectService } from '$lib/services/project/project-service'
 * - Employee: import { employeeService } from '$lib/services/employee/employee-service'
 * - Transaction: import { transactionService } from '$lib/services/transaction/transaction-service'
 *
 * 마이그레이션 가이드: docs/ARCHITECTURE.md 참고
 */
export class DatabaseService {
  /**
   * @deprecated 각 서비스의 create() 메서드 사용
   */
  static async query(text: string, params?: unknown[]) {
    return await query(text, params)
  }
}

// Database will be initialized on first connection
