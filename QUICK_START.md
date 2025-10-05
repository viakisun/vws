# 🚀 VWS 테스트 프레임워크 - 빠른 시작

## ⚡ 5분 안에 시작하기

### 1️⃣ PostgreSQL 설치 & 테스트 DB 설정

```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# 테스트 데이터베이스 자동 설정
./scripts/setup-test-db.sh
```

**예상 출력**:

```
═══════════════════════════════════════════
  VWS Test Database Setup
═══════════════════════════════════════════
✓ PostgreSQL client found
✓ User 'testuser' created successfully
✓ Database 'vws_test' created successfully
✓ Schema imported successfully
✓ Connection test successful
✓ Found 45 tables in database
✓ Created .env.test

✅ Test database is ready!
```

### 2️⃣ Playwright 브라우저 설치

```bash
pnpm exec playwright install chromium
```

### 3️⃣ 테스트 실행

```bash
# Unit Tests (빠름 - 1-2분)
pnpm test:unit

# Integration Tests (DB 필요 - 3-5분)
pnpm test:integration

# E2E Tests (브라우저 필요 - 5-10분)
pnpm test:e2e

# 모든 테스트 + Coverage
pnpm test:coverage
```

---

## 🎯 개발 중 사용법

### Watch 모드 (자동 재실행)

```bash
# 코드 변경 시 자동으로 테스트 재실행
pnpm test:watch
```

### UI 모드 (대화형)

```bash
# Vitest UI (unit/integration/component)
pnpm test:ui

# Playwright UI (E2E)
pnpm exec playwright test --ui
```

### 디버깅

```bash
# E2E 디버그 모드
pnpm exec playwright test --debug

# 특정 파일만 테스트
pnpm test path/to/file.test.ts

# 실패한 테스트만 재실행
pnpm test --reporter=verbose --reporter=json --outputFile=test-results.json
pnpm test --rerun-failures
```

---

## 📊 Coverage 확인

```bash
# Coverage 생성
pnpm test:coverage

# Coverage 임계값 체크 (75%)
pnpm test:coverage:check

# HTML 리포트
pnpm test:report
open coverage/index.html
```

---

## 🔒 보안 검사

```bash
pnpm security:audit
```

---

## 📝 CI/CD 테스트

### GitHub Actions

```bash
# 1. 커밋 & 푸시
git add .
git commit -m "feat: your changes"
git push origin main

# 2. GitHub에서 확인
# https://github.com/YOUR_USERNAME/vws/actions
```

### 로컬에서 CI 테스트 (act)

```bash
# act 설치
brew install act

# 특정 job 실행
act -j quality
act -j unit-tests
act -j integration-tests
```

---

## 🆘 문제 해결

### PostgreSQL 연결 오류

```bash
# PostgreSQL 상태 확인
brew services list | grep postgresql

# 재시작
brew services restart postgresql@15

# 연결 테스트
psql -U testuser -d vws_test
```

### Playwright 오류

```bash
# 브라우저 재설치
pnpm exec playwright install --force

# 시스템 의존성 설치
pnpm exec playwright install-deps
```

### CI 실패

1. **Quality 실패**:

   ```bash
   pnpm format:check
   pnpm format  # 자동 수정
   ```

2. **Unit Tests 실패**:

   ```bash
   pnpm test:unit
   # 로그 확인 후 수정
   ```

3. **Integration Tests 실패**:

   ```bash
   ./scripts/setup-test-db.sh
   pnpm test:integration
   ```

4. **E2E Tests 실패**:
   ```bash
   pnpm exec playwright test --ui  # UI 모드로 디버깅
   ```

---

## 📚 상세 문서

- `TEST_PLAN.md` - 전체 테스트 계획 (4 phases, 20 days)
- `PHASE1_IMPLEMENTATION_GUIDE.md` - Phase 1 상세 구현 가이드
- `TEST_STRATEGY_SUMMARY.md` - 테스트 전략 요약
- `CI_TEST_INTEGRATION_GUIDE.md` - CI 통합 가이드
- `COMPREHENSIVE_CI_IMPLEMENTATION.md` - 완전한 구현 문서
- `CI_VALIDATION_REPORT.md` - 검증 리포트

---

## 🎯 Phase 1 구현 (Week 1)

### Day 1-2: Database Tests (10 tests)

```typescript
// tests/integration/database/connection.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import pg from 'pg'

describe('Database Connection', () => {
  let pool: pg.Pool

  beforeAll(() => {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    })
  })

  afterAll(async () => {
    await pool.end()
  })

  it('should connect to test database', async () => {
    const result = await pool.query('SELECT 1 as value')
    expect(result.rows[0].value).toBe(1)
  })

  it('should have required tables', async () => {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    expect(result.rows.length).toBeGreaterThan(0)
  })

  // ... 8 more tests
})
```

### Day 3-4: Auth Tests (15 tests)

```typescript
// tests/integration/auth/login.test.ts
import { describe, it, expect } from 'vitest'
import { testClient } from '$lib/test-utils/api-client'

describe('Authentication API', () => {
  it('should login with valid credentials', async () => {
    const response = await testClient.post('/api/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    })

    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty('token')
  })

  // ... 14 more tests
})
```

### Day 5: Route Protection Tests (15 tests)

```typescript
// tests/e2e/routes/protected.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Protected Routes', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*login/)
  })

  // ... 14 more tests
})
```

---

## 🎉 시작!

```bash
# 1. DB 설정
./scripts/setup-test-db.sh

# 2. Playwright 설치
pnpm exec playwright install chromium

# 3. 테스트 실행
pnpm test:unit

# 4. Watch 모드로 개발
pnpm test:watch
```

**준비 완료! Happy Testing! 🚀**

---

_Version: 1.0.0_
