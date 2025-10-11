# VWS Architecture Guide

## 디렉토리 구조

```
src/lib/
├── database/
│   ├── connection.ts          # 순수 DB 연결 관리 (쿼리 실행, 트랜잭션)
│   └── migrations/            # DB 마이그레이션 스크립트
│
├── services/                  # 비즈니스 로직 레이어
│   ├── company/
│   │   └── company-service.ts # Company CRUD 및 비즈니스 로직
│   ├── employee/
│   │   └── employee-service.ts # Employee CRUD
│   ├── project/
│   │   └── project-service.ts # Project CRUD
│   ├── transaction/
│   │   └── transaction-service.ts # Transaction CRUD
│   ├── attendance/
│   │   └── attendance-service.ts
│   ├── hr/
│   │   └── hr-service.ts
│   └── [domain]/
│       └── [domain]-service.ts
│
├── stores/                    # 상태 관리 (Svelte 5 runes)
│   ├── [domain]/
│   │   └── [domain]-store.ts  # 도메인별 상태 관리
│   └── common/
│       ├── auth.ts
│       ├── toast.svelte.ts
│       └── ui.ts
│
├── hooks/                     # Composable 로직 (Svelte 5 runes)
│   └── [domain]/
│       └── use[Domain].svelte.ts # UI 로직 + 서비스 호출
│
├── components/               # UI 컴포넌트
│   └── [domain]/
│       └── [Component].svelte
│
├── types/                    # TypeScript 타입 정의
│   ├── database.ts          # DB 관련 타입
│   ├── [domain].ts          # 도메인별 타입
│   └── common.ts            # 공통 타입
│
└── utils/                   # 유틸리티 함수
    ├── date-handler.ts      # 날짜 처리
    ├── format.ts           # 포맷팅
    └── validation.ts       # 검증
```

## 레이어별 역할

### 1. Database Layer (`database/`)
**책임**: 순수 DB 연결 관리
- 연결 풀 관리
- 쿼리 실행 (`query`, `transaction`)
- 날짜 검증 (`assertDbDateText`)
- 타임존 설정

**규칙**:
- ❌ 비즈니스 로직 금지
- ❌ 도메인 특화 CRUD 금지
- ✅ 순수 DB 유틸리티만

```typescript
// ✅ Good
export async function query<T>(text: string, params?: unknown[]): Promise<QueryResult<T>>
export async function transaction<T>(callback: (client) => Promise<T>): Promise<T>

// ❌ Bad
export class DatabaseService {
  static async createCompany() { ... }  // 비즈니스 로직
}
```

### 2. Service Layer (`services/`)
**책임**: 비즈니스 로직 및 데이터 처리
- CRUD 작업
- 비즈니스 규칙 적용
- 데이터 검증
- 트랜잭션 관리

**명명 규칙**: `[domain]-service.ts`

**구조**:
```typescript
// services/company/company-service.ts
import { query, transaction } from '$lib/database/connection'
import type { DatabaseCompany } from '$lib/types/database'

export class CompanyService {
  async create(data: Partial<DatabaseCompany>): Promise<DatabaseCompany> {
    // 비즈니스 로직
    // DB 쿼리 실행
  }

  async getById(id: string): Promise<DatabaseCompany | null> {
    // DB 조회
  }

  async list(filters?: CompanyFilters): Promise<DatabaseCompany[]> {
    // 필터링 로직
    // DB 쿼리
  }

  async update(id: string, data: Partial<DatabaseCompany>): Promise<DatabaseCompany> {
    // 업데이트 로직
  }

  async delete(id: string): Promise<void> {
    // 삭제 로직 (soft delete)
  }
}

// 싱글톤 인스턴스 export
export const companyService = new CompanyService()
```

### 3. Store Layer (`stores/`)
**책임**: 클라이언트 상태 관리 (Svelte 5 runes)
- 리액티브 상태
- 상태 변경 메서드
- 로컬 캐싱

**명명 규칙**: `[domain]-store.ts`

**구조**:
```typescript
// stores/company/company-store.ts
import { companyService } from '$lib/services/company/company-service'

function createCompanyStore() {
  let companies = $state<DatabaseCompany[]>([])
  let loading = $state(false)
  let error = $state<string | null>(null)

  return {
    get companies() { return companies },
    get loading() { return loading },
    get error() { return error },

    async loadCompanies() {
      loading = true
      try {
        companies = await companyService.list()
      } catch (err) {
        error = err.message
      } finally {
        loading = false
      }
    }
  }
}

export const companyStore = createCompanyStore()
```

### 4. Hook Layer (`hooks/`)
**책임**: UI 로직 + 서비스 통합 (Svelte 5 runes)
- 폼 상태 관리
- API 호출
- 에러 핸들링
- UI 상태 관리

**명명 규칙**: `use[Domain].svelte.ts`

**구조**:
```typescript
// hooks/company/useCompany.svelte.ts
import { companyService } from '$lib/services/company/company-service'
import { toast } from '$lib/stores/toast.svelte'

export function useCompany() {
  let companies = $state<DatabaseCompany[]>([])
  let loading = $state(false)

  async function createCompany(data: Partial<DatabaseCompany>) {
    loading = true
    try {
      const company = await companyService.create(data)
      companies = [...companies, company]
      toast.success('회사가 생성되었습니다')
      return company
    } catch (error) {
      toast.error(error.message)
      throw error
    } finally {
      loading = false
    }
  }

  return {
    get companies() { return companies },
    get loading() { return loading },
    createCompany,
    // ... other methods
  }
}
```

### 5. Component Layer (`components/`)
**책임**: UI 렌더링
- 훅 사용
- 이벤트 핸들링
- 사용자 인터페이션

```svelte
<!-- components/company/CompanyList.svelte -->
<script lang="ts">
  import { useCompany } from '$lib/hooks/company/useCompany.svelte'
  
  const { companies, loading, createCompany } = useCompany()
</script>

{#if loading}
  <Spinner />
{:else}
  {#each companies as company}
    <CompanyCard {company} />
  {/each}
{/if}
```

## 데이터 흐름

```
Component → Hook → Service → Database → Service → Hook → Component
   ↓                 ↓                                ↑
  Store ←────────────┴────────────────────────────────┘
```

1. **Component**: 사용자 액션
2. **Hook**: 액션 처리, 서비스 호출
3. **Service**: 비즈니스 로직, DB 쿼리
4. **Database**: 쿼리 실행
5. **Service**: 데이터 반환
6. **Hook**: 상태 업데이트, 스토어 동기화
7. **Component**: UI 재렌더링

## 모범 사례

### Service 작성
```typescript
// ✅ Good: 명확한 책임
export class CompanyService {
  async create(data: CreateCompanyDto): Promise<Company> {
    // 1. 검증
    this.validateCompanyData(data)
    
    // 2. DB 쿼리
    const result = await query(`
      INSERT INTO companies (name, ...) 
      VALUES ($1, ...) 
      RETURNING id, name, created_at::text as created_at
    `, [data.name, ...])
    
    // 3. 반환
    return result.rows[0]
  }
}

// ❌ Bad: UI 로직 포함
export class CompanyService {
  async create(data: any) {
    if (!data.name) {
      toast.error('이름을 입력하세요')  // ❌ UI 로직
      return
    }
  }
}
```

### Hook 작성
```typescript
// ✅ Good: UI 로직 + 서비스 호출
export function useCompany() {
  let formData = $state({ name: '', email: '' })
  let errors = $state<Record<string, string>>({})

  async function handleSubmit() {
    // UI 검증
    if (!formData.name) {
      errors.name = '이름을 입력하세요'
      return
    }

    // 서비스 호출
    await companyService.create(formData)
  }

  return { formData, errors, handleSubmit }
}
```

### Store 작성
```typescript
// ✅ Good: 글로벌 상태만
function createAuthStore() {
  let user = $state<User | null>(null)
  let isAuthenticated = $derived(user !== null)

  return {
    get user() { return user },
    get isAuthenticated() { return isAuthenticated },
    setUser: (u: User | null) => user = u
  }
}

// ❌ Bad: 로컬 UI 상태
function createAuthStore() {
  let user = $state<User | null>(null)
  let formData = $state({ email: '', password: '' })  // ❌ 컴포넌트 로컬 상태
  let showModal = $state(false)  // ❌ UI 상태
}
```

## 마이그레이션 가이드

기존 `DatabaseService` → 새 아키텍처:

1. **서비스 파일 생성**
```bash
src/lib/services/company/company-service.ts
```

2. **DatabaseService 메서드 이동**
```typescript
// Before: connection.ts
export class DatabaseService {
  static async createCompany(data) { ... }
}

// After: services/company/company-service.ts
export class CompanyService {
  async create(data) { ... }
}
export const companyService = new CompanyService()
```

3. **임포트 업데이트**
```typescript
// Before
import { DatabaseService } from '$lib/database/connection'
await DatabaseService.createCompany(data)

// After
import { companyService } from '$lib/services/company/company-service'
await companyService.create(data)
```

## 체크리스트

새 기능 추가 시:
- [ ] 적절한 레이어에 코드 작성
- [ ] Service: 비즈니스 로직
- [ ] Hook: UI 로직
- [ ] Store: 글로벌 상태 (필요시)
- [ ] Component: UI 렌더링만
- [ ] 타입 정의 (`types/`)
- [ ] 날짜 필드는 `::text` 캐스팅
- [ ] 에러 핸들링 및 로깅

