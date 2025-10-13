import { vi } from 'vitest'

/**
 * 데이터베이스 테스트 헬퍼
 * 실제 DB 연결 없이 Mock을 사용한 테스트 지원
 */
export class DBHelper {
  private static mockQuery = vi.fn()
  private static mockTransaction = vi.fn()

  /**
   * Mock query 함수 설정
   */
  static setupMockQuery() {
    // 기본 성공 응답
    this.mockQuery.mockResolvedValue({
      rows: [],
      rowCount: 0,
    })

    return this.mockQuery
  }

  /**
   * Mock query 함수 반환
   */
  static getMockQuery() {
    return this.mockQuery
  }

  /**
   * Mock transaction 함수 설정
   */
  static setupMockTransaction() {
    this.mockTransaction.mockImplementation(async (callback: Function) => {
      return await callback(this.mockQuery)
    })

    return this.mockTransaction
  }

  /**
   * Mock transaction 함수 반환
   */
  static getMockTransaction() {
    return this.mockTransaction
  }

  /**
   * 특정 쿼리에 대한 응답 설정
   */
  static mockQueryResponse(queryPattern: string | RegExp, response: any) {
    this.mockQuery.mockImplementation((sql: string) => {
      if (typeof queryPattern === 'string') {
        if (sql.includes(queryPattern)) {
          return Promise.resolve(response)
        }
      } else {
        if (queryPattern.test(sql)) {
          return Promise.resolve(response)
        }
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    })
  }

  /**
   * INSERT 쿼리에 대한 응답 설정
   */
  static mockInsertResponse(tableName: string, insertedRow: any) {
    this.mockQueryResponse(
      new RegExp(`INSERT INTO ${tableName}`, 'i'),
      {
        rows: [insertedRow],
        rowCount: 1,
      }
    )
  }

  /**
   * SELECT 쿼리에 대한 응답 설정
   */
  static mockSelectResponse(tableName: string, rows: any[]) {
    this.mockQueryResponse(
      new RegExp(`SELECT.*FROM ${tableName}`, 'i'),
      {
        rows,
        rowCount: rows.length,
      }
    )
  }

  /**
   * UPDATE 쿼리에 대한 응답 설정
   */
  static mockUpdateResponse(tableName: string, updatedRow: any) {
    this.mockQueryResponse(
      new RegExp(`UPDATE ${tableName}`, 'i'),
      {
        rows: [updatedRow],
        rowCount: 1,
      }
    )
  }

  /**
   * DELETE 쿼리에 대한 응답 설정
   */
  static mockDeleteResponse(tableName: string, deletedCount: number = 1) {
    this.mockQueryResponse(
      new RegExp(`DELETE FROM ${tableName}`, 'i'),
      {
        rows: [],
        rowCount: deletedCount,
      }
    )
  }

  /**
   * 에러 응답 설정
   */
  static mockError(error: Error) {
    this.mockQuery.mockRejectedValue(error)
  }

  /**
   * 모든 Mock 초기화
   */
  static reset() {
    this.mockQuery.mockClear()
    this.mockTransaction.mockClear()
    this.mockQuery.mockResolvedValue({
      rows: [],
      rowCount: 0,
    })
  }

  /**
   * Mock이 호출된 횟수 확인
   */
  static getCallCount() {
    return this.mockQuery.mock.calls.length
  }

  /**
   * 마지막 호출된 쿼리 확인
   */
  static getLastQuery() {
    const calls = this.mockQuery.mock.calls
    return calls.length > 0 ? calls[calls.length - 1][0] : null
  }

  /**
   * 특정 쿼리 호출 여부 확인
   */
  static wasQueryCalled(queryPattern: string | RegExp): boolean {
    const calls = this.mockQuery.mock.calls
    return calls.some((call) => {
      const sql = call[0]
      if (typeof queryPattern === 'string') {
        return sql.includes(queryPattern)
      } else {
        return queryPattern.test(sql)
      }
    })
  }
}

/**
 * 테스트용 데이터 생성 헬퍼
 */
export class TestDataGenerator {
  /**
   * UUID 생성 (테스트용)
   */
  static generateId(): string {
    return 'test-' + Math.random().toString(36).substr(2, 9)
  }

  /**
   * 날짜 생성 (테스트용)
   */
  static generateDate(daysOffset: number = 0): string {
    const date = new Date()
    date.setDate(date.getDate() + daysOffset)
    return date.toISOString().split('T')[0]
  }

  /**
   * 고객 테스트 데이터 생성
   */
  static createCustomer(overrides: Partial<any> = {}) {
    return {
      id: this.generateId(),
      name: '테스트 고객',
      business_number: '123-45-67890',
      representative_name: '홍길동',
      email: 'test@example.com',
      phone: '010-1234-5678',
      address: '서울시 강남구',
      type: 'customer',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    }
  }

  /**
   * 직원 테스트 데이터 생성
   */
  static createEmployee(overrides: Partial<any> = {}) {
    return {
      id: this.generateId(),
      employee_id: 'EMP001',
      first_name: '홍',
      last_name: '길동',
      email: 'hong@company.com',
      phone: '010-1234-5678',
      department: '개발팀',
      position: '개발자',
      hire_date: this.generateDate(-365),
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    }
  }

  /**
   * 계약 테스트 데이터 생성
   */
  static createContract(overrides: Partial<any> = {}) {
    return {
      id: this.generateId(),
      customer_id: this.generateId(),
      contract_number: 'CON-2025-001',
      title: '테스트 계약',
      type: 'sales',
      total_amount: 1000000,
      start_date: this.generateDate(),
      end_date: this.generateDate(365),
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    }
  }

  /**
   * 거래 테스트 데이터 생성
   */
  static createTransaction(overrides: Partial<any> = {}) {
    return {
      id: this.generateId(),
      account_id: this.generateId(),
      amount: 100000,
      description: '테스트 거래',
      category: '기타',
      transaction_date: this.generateDate(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    }
  }
}
