import { vi } from 'vitest'

/**
 * 데이터베이스 Mock 라이브러리
 * 실제 데이터베이스 연결 없이 테스트할 수 있는 Mock 구현
 */

// Mock query 함수
export const mockQuery = vi.fn()

// Mock transaction 함수
export const mockTransaction = vi.fn()

// Mock connection 객체
export const mockConnection = {
  query: mockQuery,
  transaction: mockTransaction,
  connect: vi.fn(),
  disconnect: vi.fn(),
  isConnected: vi.fn(() => true),
}

/**
 * 데이터베이스 Mock 설정
 */
export const setupDatabaseMock = () => {
  // 기본 성공 응답 설정
  mockQuery.mockResolvedValue({
    rows: [],
    rowCount: 0,
  })

  // Transaction mock 설정
  mockTransaction.mockImplementation(async (callback: Function) => {
    return await callback(mockQuery)
  })

  // Connection mock 설정
  mockConnection.connect.mockResolvedValue(undefined)
  mockConnection.disconnect.mockResolvedValue(undefined)
  mockConnection.isConnected.mockReturnValue(true)

  return {
    mockQuery,
    mockTransaction,
    mockConnection,
  }
}

/**
 * 특정 테이블에 대한 Mock 응답 설정
 */
export const setupTableMocks = {
  // CRM 테이블들
  crm_customers: (rows: any[] = []) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('crm_customers')) {
        return Promise.resolve({
          rows,
          rowCount: rows.length,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },

  crm_contracts: (rows: any[] = []) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('crm_contracts')) {
        return Promise.resolve({
          rows,
          rowCount: rows.length,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },

  crm_opportunities: (rows: any[] = []) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('crm_opportunities')) {
        return Promise.resolve({
          rows,
          rowCount: rows.length,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },

  crm_interactions: (rows: any[] = []) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('crm_interactions')) {
        return Promise.resolve({
          rows,
          rowCount: rows.length,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },

  crm_transactions: (rows: any[] = []) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('crm_transactions')) {
        return Promise.resolve({
          rows,
          rowCount: rows.length,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },

  // Finance 테이블들
  finance_accounts: (rows: any[] = []) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('finance_accounts')) {
        return Promise.resolve({
          rows,
          rowCount: rows.length,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },

  finance_transactions: (rows: any[] = []) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('finance_transactions')) {
        return Promise.resolve({
          rows,
          rowCount: rows.length,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },

  // HR 테이블들
  employees: (rows: any[] = []) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('employees')) {
        return Promise.resolve({
          rows,
          rowCount: rows.length,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },

  attendance: (rows: any[] = []) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('attendance')) {
        return Promise.resolve({
          rows,
          rowCount: rows.length,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },

  leaves: (rows: any[] = []) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('leaves')) {
        return Promise.resolve({
          rows,
          rowCount: rows.length,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },

  contracts: (rows: any[] = []) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('contracts')) {
        return Promise.resolve({
          rows,
          rowCount: rows.length,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },

  payslips: (rows: any[] = []) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('payslips')) {
        return Promise.resolve({
          rows,
          rowCount: rows.length,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },

  // R&D 테이블들
  rd_projects: (rows: any[] = []) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('rd_projects')) {
        return Promise.resolve({
          rows,
          rowCount: rows.length,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },

  rd_budgets: (rows: any[] = []) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('rd_budgets')) {
        return Promise.resolve({
          rows,
          rowCount: rows.length,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },

  rd_evidence: (rows: any[] = []) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('rd_evidence')) {
        return Promise.resolve({
          rows,
          rowCount: rows.length,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },

  rd_members: (rows: any[] = []) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('rd_members')) {
        return Promise.resolve({
          rows,
          rowCount: rows.length,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },

  // Users 테이블
  users: (rows: any[] = []) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('users')) {
        return Promise.resolve({
          rows,
          rowCount: rows.length,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },
}

/**
 * CRUD 작업별 Mock 설정
 */
export const setupCrudMocks = {
  // SELECT 작업
  select: (tableName: string, rows: any[] = []) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes(`SELECT`) && sql.includes(tableName)) {
        return Promise.resolve({
          rows,
          rowCount: rows.length,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },

  // INSERT 작업
  insert: (tableName: string, insertedRow: any) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes(`INSERT INTO ${tableName}`)) {
        return Promise.resolve({
          rows: [insertedRow],
          rowCount: 1,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },

  // UPDATE 작업
  update: (tableName: string, updatedRow: any) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes(`UPDATE ${tableName}`)) {
        return Promise.resolve({
          rows: [updatedRow],
          rowCount: 1,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },

  // DELETE 작업
  delete: (tableName: string, deletedCount: number = 1) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes(`DELETE FROM ${tableName}`)) {
        return Promise.resolve({
          rows: [],
          rowCount: deletedCount,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },
}

/**
 * 에러 시나리오 Mock 설정
 */
export const setupErrorMocks = {
  // 연결 오류
  connectionError: () => {
    mockConnection.connect.mockRejectedValue(new Error('Database connection failed'))
    mockConnection.isConnected.mockReturnValue(false)
  },

  // 쿼리 오류
  queryError: (error: Error = new Error('Query execution failed')) => {
    mockQuery.mockRejectedValue(error)
  },

  // 트랜잭션 오류
  transactionError: (error: Error = new Error('Transaction failed')) => {
    mockTransaction.mockRejectedValue(error)
  },

  // 타임아웃 오류
  timeoutError: () => {
    mockQuery.mockRejectedValue(new Error('Query timeout'))
  },

  // 권한 오류
  permissionError: () => {
    mockQuery.mockRejectedValue(new Error('Insufficient permissions'))
  },

  // 데이터 무결성 오류
  constraintError: (constraint: string = 'unique_constraint') => {
    mockQuery.mockRejectedValue(new Error(`Constraint violation: ${constraint}`))
  },
}

/**
 * 복잡한 쿼리 시나리오 Mock 설정
 */
export const setupComplexQueryMocks = {
  // JOIN 쿼리
  joinQuery: (table1: string, table2: string, result: any[]) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes(table1) && sql.includes(table2) && sql.includes('JOIN')) {
        return Promise.resolve({
          rows: result,
          rowCount: result.length,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },

  // 집계 쿼리 (COUNT, SUM, AVG 등)
  aggregateQuery: (tableName: string, aggregateResult: any) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes(tableName) && (sql.includes('COUNT') || sql.includes('SUM') || sql.includes('AVG'))) {
        return Promise.resolve({
          rows: [aggregateResult],
          rowCount: 1,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },

  // 페이징 쿼리
  paginatedQuery: (tableName: string, page: number, limit: number, totalRows: any[]) => {
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const pageRows = totalRows.slice(startIndex, endIndex)

    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes(tableName) && (sql.includes('LIMIT') || sql.includes('OFFSET'))) {
        return Promise.resolve({
          rows: pageRows,
          rowCount: pageRows.length,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },

  // 검색 쿼리
  searchQuery: (tableName: string, searchTerm: string, results: any[]) => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes(tableName) && (sql.includes('ILIKE') || sql.includes('LIKE'))) {
        return Promise.resolve({
          rows: results,
          rowCount: results.length,
        })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  },
}

/**
 * 데이터베이스 모듈 Mock
 */
export const mockDatabaseModule = () => {
  const mockQueryFn = vi.fn()
  const mockTransactionFn = vi.fn()

  // 기본 설정
  mockQueryFn.mockResolvedValue({ rows: [], rowCount: 0 })
  mockTransactionFn.mockImplementation(async (callback: Function) => {
    return await callback(mockQueryFn)
  })

  return {
    query: mockQueryFn,
    transaction: mockTransactionFn,
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(true),
  }
}

/**
 * 모든 Mock 초기화
 */
export const resetDatabaseMocks = () => {
  mockQuery.mockClear()
  mockTransaction.mockClear()
  mockConnection.connect.mockClear()
  mockConnection.disconnect.mockClear()
  mockConnection.isConnected.mockClear()
  
  // 기본값으로 리셋
  setupDatabaseMock()
}

/**
 * Mock 호출 검증 헬퍼
 */
export const verifyDatabaseMocks = {
  // 쿼리가 호출되었는지 확인
  wasQueryCalled: (expectedQuery: string | RegExp) => {
    const calls = mockQuery.mock.calls
    return calls.some((call) => {
      const sql = call[0]
      if (typeof expectedQuery === 'string') {
        return sql.includes(expectedQuery)
      } else {
        return expectedQuery.test(sql)
      }
    })
  },

  // 특정 테이블에 대한 쿼리가 호출되었는지 확인
  wasTableQueried: (tableName: string) => {
    return verifyDatabaseMocks.wasQueryCalled(tableName)
  },

  // INSERT 쿼리가 호출되었는지 확인
  wasInsertCalled: (tableName: string) => {
    return verifyDatabaseMocks.wasQueryCalled(new RegExp(`INSERT INTO ${tableName}`, 'i'))
  },

  // UPDATE 쿼리가 호출되었는지 확인
  wasUpdateCalled: (tableName: string) => {
    return verifyDatabaseMocks.wasQueryCalled(new RegExp(`UPDATE ${tableName}`, 'i'))
  },

  // DELETE 쿼리가 호출되었는지 확인
  wasDeleteCalled: (tableName: string) => {
    return verifyDatabaseMocks.wasQueryCalled(new RegExp(`DELETE FROM ${tableName}`, 'i'))
  },

  // 트랜잭션이 호출되었는지 확인
  wasTransactionCalled: () => {
    return mockTransaction.mock.calls.length > 0
  },

  // 호출 횟수 확인
  getCallCount: () => {
    return mockQuery.mock.calls.length
  },

  // 마지막 호출된 쿼리 확인
  getLastQuery: () => {
    const calls = mockQuery.mock.calls
    return calls.length > 0 ? calls[calls.length - 1][0] : null
  },
}

// 기본 설정 적용
setupDatabaseMock()
