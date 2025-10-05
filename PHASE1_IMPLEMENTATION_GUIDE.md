# Phase 1 구현 가이드: 핵심 필수 테스트

**목표**: 데이터베이스 연결, 인증 API, 페이지 접근 테스트 구현  
**예상 기간**: 5일  
**우선순위**: 🔴 최고

---

## 📋 구현 순서

### Day 1: 테스트 환경 설정

#### 1.1 테스트 데이터베이스 헬퍼 생성

**파일**: `tests/helpers/db-helper.ts`

```typescript
import { DatabaseService } from '$lib/database/connection'

/**
 * 테스트 데이터베이스 헬퍼
 */
export class TestDBHelper {
  private static db: DatabaseService | null = null

  /**
   * 테스트 DB 연결 설정
   */
  static async setup(): Promise<void> {
    this.db = DatabaseService.getInstance()
    await this.clear()
  }

  /**
   * 테스트 DB 정리
   */
  static async teardown(): Promise<void> {
    await this.clear()
    await this.db?.close()
    this.db = null
  }

  /**
   * 모든 테스트 데이터 제거
   */
  static async clear(): Promise<void> {
    if (!this.db) return

    const tables = ['salary_payslips', 'attendance_records', 'leave_requests', 'employees', 'users']

    for (const table of tables) {
      await this.db.query(`DELETE FROM ${table} WHERE email LIKE '%@test.com'`)
    }
  }

  /**
   * 테스트 사용자 생성
   */
  static async createTestUser(data: {
    email: string
    password: string
    name: string
    role?: string
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10)

    const result = await this.db!.query(
      `INSERT INTO users (email, password, name, role, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [data.email, hashedPassword, data.name, data.role || 'employee'],
    )

    return result.rows[0]
  }

  /**
   * 테스트 직원 생성
   */
  static async createTestEmployee(data: {
    first_name: string
    last_name: string
    email: string
    employee_id?: string
  }) {
    const result = await this.db!.query(
      `INSERT INTO employees (first_name, last_name, email, employee_id, hire_date, status)
       VALUES ($1, $2, $3, $4, CURRENT_DATE, 'active')
       RETURNING *`,
      [data.first_name, data.last_name, data.email, data.employee_id || `TEST${Date.now()}`],
    )

    return result.rows[0]
  }

  /**
   * DB 인스턴스 가져오기
   */
  static getDB(): DatabaseService {
    if (!this.db) {
      throw new Error('DB not initialized. Call setup() first.')
    }
    return this.db
  }
}
```

#### 1.2 테스트 유틸리티 함수

**파일**: `tests/helpers/test-utils.ts`

```typescript
import { faker } from '@faker-js/faker'

/**
 * 랜덤 테스트 이메일 생성
 */
export function generateTestEmail(): string {
  return `test.${Date.now()}.${Math.random().toString(36).substring(7)}@test.com`
}

/**
 * 랜덤 한글 이름 생성
 */
export function generateKoreanName(): { firstName: string; lastName: string } {
  const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임']
  const firstNames = ['민준', '서연', '지우', '하은', '도윤', '예은', '시우', '수아']

  return {
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
  }
}

/**
 * JWT 토큰 파싱
 */
export function parseJWT(token: string): any {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  )
  return JSON.parse(jsonPayload)
}

/**
 * 테스트용 쿠키 헤더 생성
 */
export function createAuthCookie(token: string): string {
  return `token=${token}; Path=/; HttpOnly; SameSite=Strict`
}
```

---

### Day 2: 데이터베이스 연결 테스트

**파일**: `tests/database/connection.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { DatabaseService } from '$lib/database/connection'
import { TestDBHelper } from '../helpers/db-helper'

describe('Database Connection', () => {
  let db: DatabaseService

  beforeAll(async () => {
    await TestDBHelper.setup()
    db = TestDBHelper.getDB()
  })

  afterAll(async () => {
    await TestDBHelper.teardown()
  })

  describe('Connection Pool', () => {
    it('should connect to database successfully', async () => {
      const result = await db.query('SELECT NOW()')
      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].now).toBeDefined()
    })

    it('should execute SELECT query', async () => {
      const result = await db.query('SELECT 1 as value')
      expect(result.rows[0].value).toBe(1)
    })

    it('should handle query errors gracefully', async () => {
      await expect(db.query('SELECT * FROM non_existent_table')).rejects.toThrow()
    })

    it('should support parameterized queries', async () => {
      const result = await db.query('SELECT $1::int as value', [42])
      expect(result.rows[0].value).toBe(42)
    })
  })

  describe('Transactions', () => {
    it('should commit transaction successfully', async () => {
      const email = generateTestEmail()

      await db.query('BEGIN')
      await db.query(`INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)`, [
        email,
        'test',
        'Test User',
        'employee',
      ])
      await db.query('COMMIT')

      const result = await db.query('SELECT * FROM users WHERE email = $1', [email])
      expect(result.rows).toHaveLength(1)
    })

    it('should rollback transaction on error', async () => {
      const email = generateTestEmail()

      try {
        await db.query('BEGIN')
        await db.query(`INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)`, [
          email,
          'test',
          'Test User',
          'employee',
        ])
        // 일부러 에러 발생
        await db.query('SELECT * FROM non_existent_table')
        await db.query('COMMIT')
      } catch (error) {
        await db.query('ROLLBACK')
      }

      const result = await db.query('SELECT * FROM users WHERE email = $1', [email])
      expect(result.rows).toHaveLength(0)
    })
  })

  describe('Connection Pool Management', () => {
    it('should reuse connections from pool', async () => {
      const queries = Array(10)
        .fill(null)
        .map(() => db.query('SELECT 1'))

      const results = await Promise.all(queries)
      expect(results).toHaveLength(10)
      results.forEach((result) => {
        expect(result.rows[0]['?column?']).toBe(1)
      })
    })
  })
})
```

---

### Day 3: 인증 API 테스트 (1/2)

**파일**: `tests/api/auth/login.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { TestDBHelper, generateTestEmail } from '../../helpers/db-helper'
import { POST as loginHandler } from '$routes/api/auth/login/+server'

describe('Login API', () => {
  const testUser = {
    email: '',
    password: 'Test1234!@',
    name: '테스트사용자',
    role: 'employee',
  }

  beforeAll(async () => {
    await TestDBHelper.setup()
  })

  afterAll(async () => {
    await TestDBHelper.teardown()
  })

  beforeEach(async () => {
    // 각 테스트마다 새로운 사용자 생성
    testUser.email = generateTestEmail()
    await TestDBHelper.createTestUser(testUser)
  })

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      })

      const response = await loginHandler({ request } as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe(testUser.email)
      expect(data.user.password).toBeUndefined() // 비밀번호는 노출되지 않아야 함
      expect(response.headers.get('Set-Cookie')).toContain('token=')
    })

    it('should fail with invalid password', async () => {
      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'WrongPassword123!',
        }),
      })

      const response = await loginHandler({ request } as any)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('비밀번호')
    })

    it('should fail with non-existent user', async () => {
      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@test.com',
          password: 'Test1234!@',
        }),
      })

      const response = await loginHandler({ request } as any)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })

    it('should fail with missing credentials', async () => {
      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await loginHandler({ request } as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should not login inactive user', async () => {
      // 사용자 비활성화
      const db = TestDBHelper.getDB()
      await db.query('UPDATE users SET is_active = false WHERE email = $1', [testUser.email])

      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      })

      const response = await loginHandler({ request } as any)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toContain('비활성')
    })
  })

  describe('JWT Token', () => {
    it('should generate valid JWT token', async () => {
      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      })

      const response = await loginHandler({ request } as any)
      const setCookie = response.headers.get('Set-Cookie')

      expect(setCookie).toBeTruthy()

      // 토큰 추출
      const tokenMatch = setCookie?.match(/token=([^;]+)/)
      expect(tokenMatch).toBeTruthy()

      const token = tokenMatch![1]
      const payload = parseJWT(token)

      expect(payload.email).toBe(testUser.email)
      expect(payload.role).toBe(testUser.role)
      expect(payload.exp).toBeGreaterThan(Date.now() / 1000)
    })
  })
})
```

---

### Day 4: 페이지 접근 테스트

**파일**: `tests/routes/page-access.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'

describe('Page Access Control', () => {
  describe('Public Pages', () => {
    it('should render login page without authentication', async () => {
      // 로그인 페이지는 인증 없이 접근 가능
      const { container } = render(LoginPage, {
        props: {},
      })

      expect(container.querySelector('form')).toBeTruthy()
      expect(screen.getByLabelText(/이메일|email/i)).toBeTruthy()
      expect(screen.getByLabelText(/비밀번호|password/i)).toBeTruthy()
    })

    it('should render unauthorized page', async () => {
      const { container } = render(UnauthorizedPage)
      expect(container.textContent).toContain('접근')
    })
  })

  describe('Protected Pages', () => {
    it('should redirect to login when not authenticated', async () => {
      // SvelteKit의 load 함수를 테스트
      const load = dashboardLoad as PageServerLoad

      const result = await load({
        locals: { user: null },
      } as any)

      // 리다이렉트 응답 확인
      expect(result).toHaveProperty('redirect')
    })

    it('should load dashboard when authenticated', async () => {
      const load = dashboardLoad as PageServerLoad

      const result = await load({
        locals: {
          user: {
            id: '1',
            email: 'test@test.com',
            role: 'employee',
          },
        },
      } as any)

      expect(result).toHaveProperty('user')
      expect(result.user.email).toBe('test@test.com')
    })
  })

  describe('Admin-Only Pages', () => {
    it('should redirect non-admin to unauthorized', async () => {
      // HR 페이지 같은 관리자 전용 페이지
      const load = hrLoad as PageServerLoad

      const result = await load({
        locals: {
          user: {
            id: '1',
            email: 'test@test.com',
            role: 'employee', // 일반 직원
          },
        },
      } as any)

      expect(result).toHaveProperty('redirect')
      expect(result.redirect).toContain('unauthorized')
    })

    it('should allow admin access', async () => {
      const load = hrLoad as PageServerLoad

      const result = await load({
        locals: {
          user: {
            id: '1',
            email: 'admin@test.com',
            role: 'admin',
          },
        },
      } as any)

      expect(result).not.toHaveProperty('redirect')
    })
  })
})
```

---

### Day 5: 서버 로드 함수 및 통합 테스트

**파일**: `tests/routes/server-load.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { TestDBHelper } from '../helpers/db-helper'

describe('Server Load Functions', () => {
  beforeAll(async () => {
    await TestDBHelper.setup()
  })

  afterAll(async () => {
    await TestDBHelper.teardown()
  })

  describe('Dashboard Load', () => {
    it('should load user data', async () => {
      const testUser = await TestDBHelper.createTestUser({
        email: generateTestEmail(),
        password: 'Test1234!',
        name: '홍길동',
        role: 'employee',
      })

      const load = dashboardLoad as PageServerLoad

      const result = await load({
        locals: { user: testUser },
      } as any)

      expect(result.user).toBeDefined()
      expect(result.user.email).toBe(testUser.email)
    })
  })

  describe('Payslip Load', () => {
    it('should load payslip data for authenticated user', async () => {
      const testUser = await TestDBHelper.createTestUser({
        email: generateTestEmail(),
        password: 'Test1234!',
        name: '홍길동',
        role: 'employee',
      })

      const testEmployee = await TestDBHelper.createTestEmployee({
        first_name: '길동',
        last_name: '홍',
        email: testUser.email,
      })

      // 급여 데이터 생성 (필요 시)

      const load = payslipLoad as PageServerLoad

      const result = await load({
        locals: { user: { ...testUser, employee: testEmployee } },
      } as any)

      expect(result).toBeDefined()
    })
  })
})
```

---

## 🎯 체크리스트

### Day 1

- [ ] `tests/helpers/db-helper.ts` 생성
- [ ] `tests/helpers/test-utils.ts` 생성
- [ ] 테스트 환경 변수 설정 (`.env.test`)
- [ ] 기본 설정 테스트 실행

### Day 2

- [ ] `tests/database/connection.test.ts` 작성
- [ ] 데이터베이스 연결 테스트 통과
- [ ] 트랜잭션 테스트 통과
- [ ] 풀 관리 테스트 통과

### Day 3

- [ ] `tests/api/auth/login.test.ts` 작성
- [ ] 로그인 성공 테스트
- [ ] 로그인 실패 시나리오 테스트
- [ ] JWT 토큰 생성 테스트

### Day 4

- [ ] `tests/routes/page-access.test.ts` 작성
- [ ] 공개 페이지 테스트
- [ ] 보호 페이지 리다이렉션 테스트
- [ ] 관리자 권한 테스트

### Day 5

- [ ] `tests/routes/server-load.test.ts` 작성
- [ ] 서버 로드 함수 테스트
- [ ] 전체 테스트 실행 및 검증
- [ ] CI 통합 확인

---

## 🚀 실행 방법

```bash
# 전체 Phase 1 테스트 실행
pnpm test tests/database tests/api/auth tests/routes

# 개별 테스트 실행
pnpm test tests/database/connection.test.ts
pnpm test tests/api/auth/login.test.ts
pnpm test tests/routes/page-access.test.ts

# 커버리지 포함
pnpm test:coverage
```

---

## 📊 예상 결과

Phase 1 완료 시:

- ✅ 데이터베이스 연결 및 쿼리 테스트: ~10개
- ✅ 인증 API 테스트: ~8개
- ✅ 페이지 접근 테스트: ~6개
- ✅ 서버 로드 테스트: ~4개
- **총 ~28개의 새로운 테스트 추가**

현재 67개 + 28개 = **95개 테스트**

---

## 다음 단계

Phase 1 완료 후 즉시 시작 가능:

- Phase 2: 데이터베이스 CRUD 테스트
- 커버리지 목표 달성 확인
- CI/CD 파이프라인 통합
