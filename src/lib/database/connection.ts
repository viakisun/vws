import type { DatabaseCompany, DatabaseProject, DatabaseUser } from '$lib/types'
import { formatDateForDisplay, toUTC, type DateInputFormat } from '$lib/utils/date-handler'
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
 * 데이터베이스에서 가져온 날짜를 안전하게 처리
 * TIMESTAMP WITH TIME ZONE -> 표시용 문자열로 변환
 */
export function processDatabaseDate(dateValue: unknown): string {
  if (!dateValue) return ''

  try {
    // PostgreSQL TIMESTAMP WITH TIME ZONE는 이미 UTC로 저장됨
    if (dateValue instanceof Date) {
      return formatDateForDisplay(toUTC(dateValue))
    }

    if (typeof dateValue === 'string') {
      // ISO 문자열인 경우 그대로 사용
      if (dateValue.includes('T') || dateValue.includes('Z')) {
        return formatDateForDisplay(dateValue)
      }
      // DATE 형식인 경우 시간대 정보 추가
      return formatDateForDisplay(`${dateValue}T00:00:00Z`)
    }

    return String(dateValue)
  } catch (error) {
    logger.error('Date processing error:', error, 'for value:', dateValue)
    return ''
  }
}

/**
 * 사용자 입력 날짜를 데이터베이스 저장용으로 변환
 * 다양한 형식 -> UTC TIMESTAMP WITH TIME ZONE
 */
export function prepareDateForDatabase(dateValue: unknown): string {
  if (!dateValue) return ''

  try {
    const utcDate = toUTC(dateValue as DateInputFormat)
    return utcDate || ''
  } catch (error) {
    logger.error('Date preparation error:', error, 'for value:', dateValue)
    return ''
  }
}

/**
 * 데이터베이스 쿼리 결과의 모든 날짜 필드를 처리
 */
export function processQueryResultDates(result: QueryResult): QueryResult {
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
  ]

  const processedRows = result.rows.map((row) => {
    const processedRow: Record<string, unknown> = { ...(row as Record<string, unknown>) }

    dateFields.forEach((field) => {
      if (field in processedRow && processedRow[field]) {
        processedRow[field] = processDatabaseDate(processedRow[field])
      }
    })

    return processedRow
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
    connectionTimeoutMillis: 2000, // 2초
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
    pool = new Pool(dbConfig)

    // Handle pool errors
    pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err)
      process.exit(-1)
    })

    // Database connection pool initialized
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

// Execute a query with parameters
export async function query<T extends Record<string, unknown> = any>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  const client = await getConnection()
  try {
    const result = await client.query<T>(text, params)
    // 자동으로 날짜 필드 처리
    return processQueryResultDates(result) as QueryResult<T>
  } finally {
    client.release()
  }
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

// Database health check
export async function healthCheck(): Promise<boolean> {
  try {
    // Starting database health check
    const result = await query('SELECT 1 as health')
    const isHealthy = (result.rows[0] as Record<string, unknown>)?.health === 1

    return isHealthy
  } catch (error) {
    logger.error('Database health check failed:', error)
    logger.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as Record<string, unknown>)?.code,
      detail: (error as Record<string, unknown>)?.detail,
    })
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

// Utility functions for common database operations
export class DatabaseService {
  // 쿼리 메서드
  static async query(text: string, params?: unknown[]) {
    return await query(text, params)
  }

  // User operations
  static async createUser(userData: Partial<DatabaseUser>): Promise<DatabaseUser> {
    const result = await query<DatabaseUser>(
      `INSERT INTO users (email, password_hash, name, department, position, role)
			 VALUES ($1, $2, $3, $4, $5, $6)
			 RETURNING *`,
      [
        userData.email,
        (userData as Record<string, unknown>).password_hash,
        userData.name,
        userData.department,
        userData.position,
        userData.role,
      ],
    )
    if (!result.rows[0]) {
      throw new Error('사용자 생성에 실패했습니다.')
    }
    if (!result.rows[0]) {
      throw new Error('데이터 생성에 실패했습니다.')
    }
    return result.rows[0]
  }

  static async getUserById(id: string): Promise<DatabaseUser | null> {
    const result = await query<DatabaseUser>('SELECT * FROM users WHERE id = $1', [id])
    return result.rows[0] || null
  }

  static async getUserByEmail(email: string): Promise<DatabaseUser | null> {
    const result = await query<DatabaseUser>('SELECT * FROM users WHERE email = $1', [email])
    return result.rows[0] || null
  }

  static async getUsers(filters?: {
    department?: string
    role?: string
    is_active?: boolean
    limit?: number
    offset?: number
  }): Promise<DatabaseUser[]> {
    let queryText = 'SELECT * FROM users WHERE 1=1'
    const params: unknown[] = []
    let paramCount = 0

    if (filters?.department) {
      paramCount++
      queryText += ` AND department = $${paramCount}`
      params.push(filters.department)
    }

    if (filters?.role) {
      paramCount++
      queryText += ` AND role = $${paramCount}`
      params.push(filters.role)
    }

    if (filters?.is_active !== undefined) {
      paramCount++
      queryText += ` AND is_active = $${paramCount}`
      params.push(filters.is_active)
    }

    queryText += ' ORDER BY created_at DESC'

    if (filters?.limit) {
      paramCount++
      queryText += ` LIMIT $${paramCount}`
      params.push(filters.limit)
    }

    if (filters?.offset) {
      paramCount++
      queryText += ` OFFSET $${paramCount}`
      params.push(filters.offset)
    }

    const result = await query<DatabaseUser>(queryText, params)
    return result.rows
  }

  // Company operations
  static async createCompany(companyData: Partial<DatabaseCompany>): Promise<DatabaseCompany> {
    const result = await query<DatabaseCompany>(
      `INSERT INTO companies (name, type, industry, status, contact_person, email, phone, address, website, revenue, employees, notes, tags)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
			 RETURNING *`,
      [
        companyData.name,
        companyData.type,
        companyData.industry,
        companyData.status,
        companyData.contact_person,
        companyData.email,
        companyData.phone,
        companyData.address,
        companyData.website,
        companyData.revenue,
        companyData.employees,
        companyData.notes,
        JSON.stringify(companyData.tags || []),
      ],
    )
    if (!result.rows[0]) {
      throw new Error('데이터 생성에 실패했습니다.')
    }
    return result.rows[0]
  }

  static async getCompanyById(id: string): Promise<DatabaseCompany | null> {
    const result = await query<DatabaseCompany>('SELECT * FROM companies WHERE id = $1', [id])
    return result.rows[0] || null
  }

  static async getCompanies(filters?: {
    type?: string
    status?: string
    industry?: string
    limit?: number
    offset?: number
  }): Promise<DatabaseCompany[]> {
    let queryText = 'SELECT * FROM companies WHERE 1=1'
    const params: unknown[] = []
    let paramCount = 0

    if (filters?.type) {
      paramCount++
      queryText += ` AND type = $${paramCount}`
      params.push(filters.type)
    }

    if (filters?.status) {
      paramCount++
      queryText += ` AND status = $${paramCount}`
      params.push(filters.status)
    }

    if (filters?.industry) {
      paramCount++
      queryText += ` AND industry = $${paramCount}`
      params.push(filters.industry)
    }

    queryText += ' ORDER BY created_at DESC'

    if (filters?.limit) {
      paramCount++
      queryText += ` LIMIT $${paramCount}`
      params.push(filters.limit)
    }

    if (filters?.offset) {
      paramCount++
      queryText += ` OFFSET $${paramCount}`
      params.push(filters.offset)
    }

    const result = await query<DatabaseCompany>(queryText, params)
    return result.rows
  }

  // Project operations
  static async createProject(projectData: Partial<DatabaseProject>): Promise<DatabaseProject> {
    const result = await query<DatabaseProject>(
      `INSERT INTO projects (code, title, description, sponsor, sponsor_type, start_date, end_date, manager_id, status, budget_total)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			 RETURNING *`,
      [
        projectData.code,
        projectData.title,
        projectData.description,
        projectData.sponsor,
        projectData.sponsor_type,
        projectData.start_date,
        projectData.end_date,
        projectData.manager_id,
        projectData.status,
        projectData.budget_total,
      ],
    )
    if (!result.rows[0]) {
      throw new Error('데이터 생성에 실패했습니다.')
    }
    return result.rows[0]
  }

  static async getProjectById(id: string): Promise<DatabaseProject | null> {
    const result = await query<DatabaseProject>('SELECT * FROM projects WHERE id = $1', [id])
    return result.rows[0] || null
  }

  static async getProjects(filters?: {
    status?: string
    manager_id?: string
    limit?: number
    offset?: number
  }): Promise<DatabaseProject[]> {
    let queryText = 'SELECT * FROM projects WHERE 1=1'
    const params: unknown[] = []
    let paramCount = 0

    if (filters?.status) {
      paramCount++
      queryText += ` AND status = $${paramCount}`
      params.push(filters.status)
    }

    if (filters?.manager_id) {
      paramCount++
      queryText += ` AND manager_id = $${paramCount}`
      params.push(filters.manager_id)
    }

    queryText += ' ORDER BY created_at DESC'

    if (filters?.limit) {
      paramCount++
      queryText += ` LIMIT $${paramCount}`
      params.push(filters.limit)
    }

    if (filters?.offset) {
      paramCount++
      queryText += ` OFFSET $${paramCount}`
      params.push(filters.offset)
    }

    const result = await query<DatabaseProject>(queryText, params)
    return result.rows
  }

  // Expense operations
  static async createExpenseItem(
    expenseData: Partial<DatabaseExpenseItem>,
  ): Promise<DatabaseExpenseItem> {
    const result = await query<DatabaseExpenseItem>(
      `INSERT INTO expense_items (project_id, category_code, requester_id, amount, currency, description, status, dept_owner)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			 RETURNING *`,
      [
        expenseData.project_id,
        expenseData.category_code,
        expenseData.requester_id,
        expenseData.amount,
        expenseData.currency,
        expenseData.description,
        expenseData.status,
        expenseData.dept_owner,
      ],
    )
    if (!result.rows[0]) {
      throw new Error('데이터 생성에 실패했습니다.')
    }
    return result.rows[0]
  }

  static async getExpenseItemById(id: string): Promise<DatabaseExpenseItem | null> {
    const result = await query<DatabaseExpenseItem>('SELECT * FROM expense_items WHERE id = $1', [
      id,
    ])
    return result.rows[0] || null
  }

  static async getExpenseItems(filters?: {
    project_id?: string
    status?: string
    requester_id?: string
    limit?: number
    offset?: number
  }): Promise<DatabaseExpenseItem[]> {
    let queryText = 'SELECT * FROM expense_items WHERE 1=1'
    const params: unknown[] = []
    let paramCount = 0

    if (filters?.project_id) {
      paramCount++
      queryText += ` AND project_id = $${paramCount}`
      params.push(filters.project_id)
    }

    if (filters?.status) {
      paramCount++
      queryText += ` AND status = $${paramCount}`
      params.push(filters.status)
    }

    if (filters?.requester_id) {
      paramCount++
      queryText += ` AND requester_id = $${paramCount}`
      params.push(filters.requester_id)
    }

    queryText += ' ORDER BY created_at DESC'

    if (filters?.limit) {
      paramCount++
      queryText += ` LIMIT $${paramCount}`
      params.push(filters.limit)
    }

    if (filters?.offset) {
      paramCount++
      queryText += ` OFFSET $${paramCount}`
      params.push(filters.offset)
    }

    const result = await query<DatabaseExpenseItem>(queryText, params)
    return result.rows
  }

  // Employee operations
  static async createEmployee(employeeData: Partial<DatabaseEmployee>): Promise<DatabaseEmployee> {
    const result = await query<DatabaseEmployee>(
      `INSERT INTO employees (employee_id, user_id, first_name, last_name, email, phone, department, position, manager_id, employment_type, hire_date, salary, status, address, emergency_contact)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
			 RETURNING *`,
      [
        employeeData.employee_id,
        employeeData.user_id,
        employeeData.first_name,
        employeeData.last_name,
        employeeData.email,
        employeeData.phone,
        employeeData.department,
        employeeData.position,
        employeeData.manager_id,
        employeeData.employment_type,
        employeeData.hire_date,
        employeeData.salary,
        employeeData.status,
        employeeData.address,
        JSON.stringify(employeeData.emergency_contact || {}),
      ],
    )
    if (!result.rows[0]) {
      throw new Error('데이터 생성에 실패했습니다.')
    }
    return result.rows[0]
  }

  static async getEmployeeById(id: string): Promise<DatabaseEmployee | null> {
    const result = await query<DatabaseEmployee>('SELECT * FROM employees WHERE id = $1', [id])
    return result.rows[0] || null
  }

  static async getEmployees(filters?: {
    department?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<DatabaseEmployee[]> {
    let queryText = 'SELECT * FROM employees WHERE 1=1'
    const params: unknown[] = []
    let paramCount = 0

    if (filters?.department) {
      paramCount++
      queryText += ` AND department = $${paramCount}`
      params.push(filters.department)
    }

    if (filters?.status) {
      paramCount++
      queryText += ` AND status = $${paramCount}`
      params.push(filters.status)
    }

    queryText += ' ORDER BY created_at DESC'

    if (filters?.limit) {
      paramCount++
      queryText += ` LIMIT $${paramCount}`
      params.push(filters.limit)
    }

    if (filters?.offset) {
      paramCount++
      queryText += ` OFFSET $${paramCount}`
      params.push(filters.offset)
    }

    const result = await query<DatabaseEmployee>(queryText, params)
    return result.rows
  }

  // Transaction operations
  static async createTransaction(
    transactionData: Partial<DatabaseTransaction>,
  ): Promise<DatabaseTransaction> {
    const result = await query<DatabaseTransaction>(
      `INSERT INTO transactions (bank_account_id, category_id, amount, type, description, reference, date, created_by)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			 RETURNING *`,
      [
        transactionData.bank_account_id,
        transactionData.category_id,
        transactionData.amount,
        transactionData.type,
        transactionData.description,
        transactionData.reference,
        transactionData.date,
        transactionData.created_by,
      ],
    )
    if (!result.rows[0]) {
      throw new Error('데이터 생성에 실패했습니다.')
    }
    return result.rows[0]
  }

  static async getTransactionById(id: string): Promise<DatabaseTransaction | null> {
    const result = await query<DatabaseTransaction>('SELECT * FROM transactions WHERE id = $1', [
      id,
    ])
    return result.rows[0] || null
  }

  static async getTransactions(filters?: {
    bank_account_id?: string
    category_id?: string
    type?: string
    date_from?: Date
    date_to?: Date
    limit?: number
    offset?: number
  }): Promise<DatabaseTransaction[]> {
    let queryText = 'SELECT * FROM transactions WHERE 1=1'
    const params: unknown[] = []
    let paramCount = 0

    if (filters?.bank_account_id) {
      paramCount++
      queryText += ` AND bank_account_id = $${paramCount}`
      params.push(filters.bank_account_id)
    }

    if (filters?.category_id) {
      paramCount++
      queryText += ` AND category_id = $${paramCount}`
      params.push(filters.category_id)
    }

    if (filters?.type) {
      paramCount++
      queryText += ` AND type = $${paramCount}`
      params.push(filters.type)
    }

    if (filters?.date_from) {
      paramCount++
      queryText += ` AND date >= $${paramCount}`
      params.push(filters.date_from)
    }

    if (filters?.date_to) {
      paramCount++
      queryText += ` AND date <= $${paramCount}`
      params.push(filters.date_to)
    }

    queryText += ' ORDER BY date DESC, created_at DESC'

    if (filters?.limit) {
      paramCount++
      queryText += ` LIMIT $${paramCount}`
      params.push(filters.limit)
    }

    if (filters?.offset) {
      paramCount++
      queryText += ` OFFSET $${paramCount}`
      params.push(filters.offset)
    }

    const result = await query<DatabaseTransaction>(queryText, params)
    return result.rows
  }
}

// Database will be initialized on first connection
