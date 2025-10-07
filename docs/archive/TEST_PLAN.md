# VWS 종합 테스트 계획 (Comprehensive Test Plan)

**작성일**: 2025년 10월 6일  
**프로젝트**: VWS (VIA Work System)  
**목표**: 필수 페이지 접근, 데이터베이스, 유닛 테스트 등 핵심 기능 검증

---

## 📋 목차

1. [현재 테스트 현황](#1-현재-테스트-현황)
2. [테스트 전략](#2-테스트-전략)
3. [우선순위별 테스트 계획](#3-우선순위별-테스트-계획)
4. [구현 단계](#4-구현-단계)
5. [필요한 도구 및 설정](#5-필요한-도구-및-설정)

---

## 1. 현재 테스트 현황

### ✅ 이미 구현된 테스트 (67개)

```
tests/
├── api/
│   └── salary/payslips.test.ts (3 tests)     ✅ API 테스트
├── security/
│   └── excel-security.test.ts (23 tests)      ✅ 보안 테스트
├── stores/
│   └── salary-store.test.ts (7 tests)         ✅ Store 테스트
└── utils/
    ├── bank-detector.test.ts (7 tests)        ✅ 유틸리티 테스트
    ├── bank-parser-factory.test.ts (6 tests)
    ├── excel-reader.test.ts (5 tests)
    ├── format.test.ts (11 tests)
    └── simple-bank-parser.test.ts (5 tests)
```

### ❌ 미구현 영역

- 🔴 **페이지 렌더링 테스트** (0%)
- 🔴 **데이터베이스 통합 테스트** (0%)
- 🔴 **인증/인가 테스트** (0%)
- 🔴 **라우트 보호 테스트** (0%)
- 🔴 **컴포넌트 테스트** (0%)
- 🔴 **E2E 테스트** (0%)

---

## 2. 테스트 전략

### 2.1 테스트 피라미드

```
        /\
       /  \  E2E Tests (적음)
      /----\
     / 통합  \  Integration Tests (중간)
    /--------\
   /  단위 테스트 \  Unit Tests (많음)
  /--------------\
```

### 2.2 테스트 범위

| 레벨            | 타입             | 목표 커버리지 | 우선순위 |
| --------------- | ---------------- | ------------- | -------- |
| **Unit**        | 유틸리티, 서비스 | 80%+          | 🔴 높음  |
| **Integration** | API, Database    | 70%+          | 🟡 중간  |
| **Component**   | Svelte 컴포넌트  | 60%+          | 🟡 중간  |
| **E2E**         | 사용자 플로우    | 핵심 경로만   | 🟢 낮음  |

---

## 3. 우선순위별 테스트 계획

## 🔴 Phase 1: 핵심 필수 테스트 (1주차)

### 3.1 데이터베이스 연결 및 기본 쿼리 테스트

**파일**: `tests/database/connection.test.ts`

```typescript
테스트 항목:
- ✅ 데이터베이스 연결 성공
- ✅ 연결 풀 생성 및 재사용
- ✅ 쿼리 실행 (SELECT, INSERT, UPDATE, DELETE)
- ✅ 트랜잭션 처리
- ✅ 에러 핸들링
- ✅ 연결 종료
```

### 3.2 인증 API 테스트

**파일**: `tests/api/auth/login.test.ts`

```typescript
테스트 항목:
- ✅ 로그인 성공 (유효한 자격증명)
- ✅ 로그인 실패 (잘못된 비밀번호)
- ✅ 로그인 실패 (존재하지 않는 사용자)
- ✅ JWT 토큰 생성 및 검증
- ✅ 토큰 만료 처리
- ✅ 비활성 사용자 접근 차단
```

**파일**: `tests/api/auth/logout.test.ts`

```typescript
테스트 항목:
- ✅ 로그아웃 성공
- ✅ 세션 정리
```

### 3.3 필수 페이지 접근 테스트

**파일**: `tests/routes/page-access.test.ts`

```typescript
테스트 항목:
✅ 공개 페이지:
  - / (홈)
  - /login
  - /unauthorized

✅ 인증 필요 페이지:
  - /dashboard
  - /dashboard/payslip
  - /dashboard/attendance
  - /dashboard/certificate

✅ 관리자 전용 페이지:
  - /hr
  - /salary
  - /finance
  - /personnel

✅ 리다이렉션:
  - 미인증 사용자 → /login
  - 권한 없는 사용자 → /unauthorized
```

### 3.4 서버 로드 함수 테스트

**파일**: `tests/routes/server-load.test.ts`

```typescript
테스트 항목:
- ✅ +page.server.ts 로드 함수
- ✅ locals.user 전달
- ✅ 데이터베이스 쿼리 실행
- ✅ 에러 처리
```

---

## 🟡 Phase 2: 데이터베이스 통합 테스트 (2주차)

### 3.5 직원(Employees) CRUD 테스트

**파일**: `tests/database/employees.test.ts`

```typescript
테스트 항목:
- ✅ 직원 목록 조회
- ✅ 직원 상세 조회 (ID로)
- ✅ 직원 생성
- ✅ 직원 정보 수정
- ✅ 직원 삭제 (소프트 삭제)
- ✅ 이메일 중복 검증
- ✅ 한글 이름 처리
```

### 3.6 급여(Salary) 테스트

**파일**: `tests/database/salary.test.ts`

```typescript
테스트 항목:
- ✅ 급여 명세서 조회
- ✅ 특정 월 급여 조회
- ✅ 급여 히스토리 조회
- ✅ 급여 통계 계산
```

### 3.7 근태(Attendance) 테스트

**파일**: `tests/database/attendance.test.ts`

```typescript
테스트 항목:
- ✅ 출퇴근 기록 생성
- ✅ 근태 현황 조회
- ✅ 월별 근태 집계
- ✅ 휴가 신청/승인
```

### 3.8 데이터베이스 트랜잭션 테스트

**파일**: `tests/database/transactions.test.ts`

```typescript
테스트 항목:
- ✅ 트랜잭션 커밋
- ✅ 트랜잭션 롤백
- ✅ 중첩 트랜잭션
- ✅ 동시성 제어
```

---

## 🟡 Phase 3: 컴포넌트 및 UI 테스트 (3주차)

### 3.9 공통 컴포넌트 테스트

**파일**: `tests/components/common/*.test.ts`

```typescript
테스트 대상:
- ✅ ThemeButton.svelte
- ✅ ThemeModal.svelte
- ✅ DataTable.svelte (있는 경우)
- ✅ Form Input 컴포넌트들
```

### 3.10 페이지 컴포넌트 테스트

**파일**: `tests/components/pages/*.test.ts`

```typescript
테스트 대상:
- ✅ Login 페이지 렌더링
- ✅ Dashboard 페이지 렌더링
- ✅ 데이터 바인딩
- ✅ 사용자 인터랙션 (클릭, 입력)
```

---

## 🟢 Phase 4: E2E 및 통합 시나리오 테스트 (4주차)

### 3.11 사용자 플로우 E2E 테스트

**도구**: Playwright 또는 Cypress

```typescript
시나리오:
1. ✅ 로그인 → 대시보드 → 급여명세서 조회
2. ✅ 로그인 → 근태 기록 → 휴가 신청
3. ✅ 관리자 로그인 → 직원 관리 → 급여 처리
4. ✅ 권한 없는 페이지 접근 차단
```

---

## 4. 구현 단계

### Step 1: 환경 설정 (1일)

```bash
# 테스트 데이터베이스 설정
- PostgreSQL 테스트 DB 생성
- 테스트용 환경 변수 설정
- 시드 데이터 준비
```

### Step 2: 데이터베이스 테스트 유틸리티 작성 (1일)

```typescript
// tests/helpers/db-helper.ts
;-setupTestDB() - // 테스트 DB 초기화
  teardownTestDB() - // 테스트 DB 정리
  seedTestData() - // 테스트 데이터 삽입
  clearTestData() // 테스트 데이터 제거
```

### Step 3: Phase 1 구현 (3일)

- 데이터베이스 연결 테스트
- 인증 API 테스트
- 페이지 접근 테스트

### Step 4: Phase 2 구현 (5일)

- CRUD 테스트
- 트랜잭션 테스트

### Step 5: Phase 3 구현 (5일)

- 컴포넌트 테스트
- UI 인터랙션 테스트

### Step 6: Phase 4 구현 (5일)

- E2E 테스트 설정
- 주요 플로우 테스트

---

## 5. 필요한 도구 및 설정

### 5.1 이미 설치된 도구 ✅

```json
{
  "vitest": "^3.2.4", // 유닛 테스트 러너
  "@vitest/coverage-v8": "^3.2.4", // 커버리지
  "@testing-library/svelte": "^5.2.8", // Svelte 컴포넌트 테스트
  "@testing-library/jest-dom": "^6.8.0", // DOM 매처
  "@testing-library/user-event": "^14.6.1", // 사용자 이벤트
  "jsdom": "^27.0.0" // DOM 환경
}
```

### 5.2 추가 설치 필요 🔴

```bash
# E2E 테스트 (선택사항)
pnpm add -D @playwright/test

# 데이터베이스 목 (Mock)
pnpm add -D pg-mem

# 또는 실제 테스트 DB 사용
# .env.test 파일 생성
```

### 5.3 테스트 환경 설정

**파일**: `.env.test`

```bash
DATABASE_URL=postgresql://testuser:testpass@localhost:5432/vws_test
JWT_SECRET=test_secret_key_do_not_use_in_production
NODE_ENV=test
```

**파일**: `vitest.config.ts` (수정)

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    env: {
      // 테스트 환경 변수 로드
    },
    coverage: {
      // ... 기존 설정
    },
    // 데이터베이스 테스트를 위한 격리
    isolate: true,
    pool: 'forks',
  },
})
```

---

## 6. 테스트 작성 가이드라인

### 6.1 네이밍 컨벤션

```typescript
// 좋은 예
describe('DatabaseService', () => {
  describe('connect', () => {
    it('should connect to database successfully', async () => {
      // ...
    })

    it('should throw error when credentials are invalid', async () => {
      // ...
    })
  })
})
```

### 6.2 AAA 패턴 (Arrange-Act-Assert)

```typescript
it('should create new employee', async () => {
  // Arrange (준비)
  const employeeData = {
    email: 'test@example.com',
    name: '홍길동',
    // ...
  }

  // Act (실행)
  const result = await createEmployee(employeeData)

  // Assert (검증)
  expect(result).toBeDefined()
  expect(result.email).toBe('test@example.com')
})
```

### 6.3 테스트 격리

```typescript
describe('Employee CRUD', () => {
  beforeEach(async () => {
    // 각 테스트 전에 DB 초기화
    await clearTestData()
    await seedTestData()
  })

  afterEach(async () => {
    // 각 테스트 후에 정리
    await clearTestData()
  })
})
```

---

## 7. 예상 일정 및 리소스

### 7.1 일정

| Phase    | 기간    | 예상 공수 |
| -------- | ------- | --------- |
| Phase 1  | 1주     | 5일       |
| Phase 2  | 1주     | 5일       |
| Phase 3  | 1주     | 5일       |
| Phase 4  | 1주     | 5일       |
| **총계** | **4주** | **20일**  |

### 7.2 우선순위 조정 가능

- **최소 구현**: Phase 1만 (1주)
- **기본 구현**: Phase 1 + Phase 2 (2주)
- **완전 구현**: 모든 Phase (4주)

---

## 8. 성공 지표 (KPI)

### 8.1 커버리지 목표

- ✅ 유닛 테스트: **80%+**
- ✅ 통합 테스트: **70%+**
- ✅ 전체 코드: **75%+**

### 8.2 품질 지표

- ✅ 모든 테스트 통과율: **100%**
- ✅ CI 통과율: **95%+**
- ✅ 테스트 실행 시간: **< 30초** (유닛)
- ✅ E2E 테스트 시간: **< 5분**

---

## 9. 다음 단계

### 즉시 시작 가능한 작업

1. **데이터베이스 헬퍼 유틸리티 작성**
2. **데이터베이스 연결 테스트 작성**
3. **인증 API 테스트 작성**
4. **페이지 접근 테스트 작성**

### 승인 필요 사항

- [ ] 테스트 데이터베이스 환경 설정 방법 결정
- [ ] E2E 테스트 도구 선택 (Playwright vs Cypress)
- [ ] 테스트 우선순위 최종 확인

---

## 10. 참고 자료

- [Vitest 공식 문서](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/svelte-testing-library/intro/)
- [SvelteKit Testing](https://kit.svelte.dev/docs/testing)
- [PostgreSQL Testing Best Practices](https://www.postgresql.org/docs/current/regress.html)

---

## 📝 결론

이 테스트 계획은 VWS 프로젝트의 안정성과 신뢰성을 크게 향상시킬 것입니다.
Phase별로 단계적으로 구현하여 점진적으로 테스트 커버리지를 높이는 것을 권장합니다.

**다음 단계**: Phase 1 구현 시작 여부 확인
