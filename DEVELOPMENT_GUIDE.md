# VWS 개발 가이드

> VWS (Viahub Work System) 프로젝트의 개발 표준 및 가이드라인

## 📚 목차

1. [명명 규칙](#명명-규칙)
2. [코딩 표준](#코딩-표준)
3. [날짜 처리](#날짜-처리)
4. [이름 처리](#이름-처리)
5. [Svelte 5 Runes](#svelte-5-runes)

---

## 명명 규칙

### 데이터베이스 (PostgreSQL)

- **snake_case** 사용
- 모든 컬럼명은 소문자와 언더스코어(\_)로 구성

```sql
start_date, end_date, created_at, updated_at
manager_id, budget_total
```

### JavaScript/TypeScript

- **camelCase** 사용
- 첫 번째 단어는 소문자, 이후 단어의 첫 글자는 대문자

```typescript
;(startDate, endDate, createdAt, updatedAt)
;(managerId, budgetTotal)
```

### 변환 규칙

- DB → JS: `snake_case` → `camelCase`
- JS → DB: `camelCase` → `snake_case`
- 변환은 `src/lib/utils/api-data-transformer.ts` 사용

---

## 코딩 표준

### 🚨 중요: 중앙화된 유틸리티 함수 사용 필수

#### 1. 날짜 처리

**위치**: `src/lib/utils/date-calculator.ts`

허용되는 함수:

- `formatDateForAPI(date)` - API용 YYYY-MM-DD
- `formatDateForKorean(date)` - 한국어 YYYY년 MM월 DD일
- `calculateAnnualPeriod()` - 연차별 기간 계산
- `isValidDate()`, `isValidDateRange()` - 유효성 검증

❌ 금지:

```typescript
// 금지
new Date().toISOString().split('T')[0]
new Date().toLocaleDateString()

// 허용
formatDateForAPI(new Date())
```

#### 2. 급여 계산

**위치**: `src/lib/utils/salary-calculator.ts`

허용되는 함수:

- `calculateMonthlySalary()` - 월간 급여 계산
- `calculateMonthlyFromAnnual()` - 연봉 → 월급
- `calculateBudgetAllocation()` - 예산 배분
- `normalizeSalaryAmount()` - 금액 정규화

❌ 금지:

```typescript
// 금지 - 임의의 급여 계산
const monthly = annual / 12

// 허용
const monthly = calculateMonthlyFromAnnual(annual)
```

#### 3. 데이터 변환

**위치**: `src/lib/utils/api-data-transformer.ts`

- `transformForAPI()` - camelCase → snake_case
- `transformFromAPI()` - snake_case → camelCase

---

## 날짜 처리

### 표준 형식

#### 1. 데이터베이스

- **타입**: `DATE` (not TIMESTAMP)
- **형식**: `YYYY-MM-DD`
- **컬럼명**: `*_date` suffix

```sql
CREATE TABLE projects (
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. API 전송

- **형식**: `YYYY-MM-DD` (ISO 8601 날짜 부분만)
- **타임존**: UTC 기준 (한국 시간 변환 주의)

```typescript
// API 요청/응답
{
  "startDate": "2025-01-01",  // camelCase
  "endDate": "2025-12-31"
}
```

#### 3. 화면 표시

- **한국어**: `YYYY년 MM월 DD일`
- **함수**: `formatDateForKorean()`

```typescript
formatDateForKorean('2025-01-01') // "2025년 01월 01일"
```

### 날짜 계산 규칙

#### 기간 계산

```typescript
// ✅ 올바른 방법
const period = calculateAnnualPeriod(startDate, endDate, year)

// ❌ 잘못된 방법
const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24))
```

#### 유효성 검증

```typescript
// 날짜 유효성
if (!isValidDate(dateStr)) {
  throw new Error('Invalid date')
}

// 날짜 범위 유효성
if (!isValidDateRange(startDate, endDate)) {
  throw new Error('Invalid date range')
}
```

---

## 이름 처리

### 한국 이름 규칙

#### 1. 입력 검증

**위치**: `src/lib/utils/korean-name.ts`

```typescript
import { validateKoreanName } from '$lib/utils/korean-name'

// 이름 유효성 검증
if (!validateKoreanName(name)) {
  throw new Error('올바른 한국 이름을 입력하세요 (2-4자)')
}
```

#### 2. 저장 형식

- **DB**: `name` 컬럼 (VARCHAR)
- **형식**: 한글만, 공백 없음, 2-4자
- **예시**: `홍길동`, `김철수`

#### 3. 표시 형식

```typescript
// 이름 표시
<span>{employee.name}</span>  // "홍길동"

// 이름 + 직급
<span>{employee.name} {employee.position}</span>  // "홍길동 대리"
```

---

## Svelte 5 Runes

### 반응성 가이드

#### 1. 상태 관리

```typescript
// ✅ $state 사용
let count = $state(0)
let items = $state([])
let user = $state({ name: '', age: 0 })

// ❌ 일반 변수 (반응성 없음)
let count = 0
```

#### 2. 파생 상태

```typescript
// ✅ $derived 사용
let doubled = $derived(count * 2)
let total = $derived(items.reduce((sum, item) => sum + item.price, 0))

// ✅ 복잡한 계산은 $derived.by
let filteredItems = $derived.by(() => {
  return items.filter((item) => item.active)
})
```

#### 3. 효과 (Side Effects)

```typescript
// ✅ $effect 사용
$effect(() => {
  console.log(`Count changed to: ${count}`)
  document.title = `Count: ${count}`
})

// ✅ 정리 함수
$effect(() => {
  const interval = setInterval(() => tick(), 1000)
  return () => clearInterval(interval)
})
```

#### 4. Props

```svelte
<script lang="ts">
  // ✅ Props 선언
  interface Props {
    title: string
    items: Item[]
    onUpdate?: (item: Item) => void
  }

  let { title, items, onUpdate }: Props = $props()
</script>
```

### Store 패턴

#### Svelte 5 Store (Runes 기반)

```typescript
// ✅ 권장: Runes 기반 Store
export function createStore() {
  let data = $state([])
  let loading = $state(false)

  let filteredData = $derived.by(() => {
    return data.filter((item) => item.active)
  })

  return {
    get data() {
      return data
    },
    get loading() {
      return loading
    },
    get filtered() {
      return filteredData
    },

    setData(newData) {
      data = newData
    },

    setLoading(value) {
      loading = value
    },
  }
}
```

---

## TypeScript 규칙

### 타입 정의

```typescript
// ✅ Interface 사용 (확장 가능)
interface Employee {
  id: string
  name: string
  position: string
}

// ✅ Type alias (Union, 복잡한 타입)
type Status = 'active' | 'inactive' | 'pending'
type Result<T> = { success: true; data: T } | { success: false; error: string }
```

### any 사용 최소화

```typescript
// ❌ 피할 것
function process(data: any) {}

// ✅ 제네릭 사용
function process<T>(data: T): T {}

// ✅ unknown 사용 (타입 가드 필요)
function process(data: unknown) {
  if (typeof data === 'string') {
    // data는 여기서 string
  }
}
```

---

## 파일 구조

```
src/
├── lib/
│   ├── components/       # Svelte 컴포넌트
│   ├── types/           # TypeScript 타입 정의
│   ├── utils/           # 유틸리티 함수
│   ├── stores/          # 전역 상태 관리
│   ├── services/        # API 서비스
│   └── hooks/           # 커스텀 hooks (Svelte 5)
├── routes/              # SvelteKit 라우트
│   ├── api/            # API 엔드포인트
│   └── (app)/          # 페이지
└── tests/              # 테스트 파일
```

---

## 커밋 메시지 규칙

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `refactor`: 리팩토링
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `test`: 테스트 추가/수정
- `chore`: 빌드, 설정 등

### 예시

```
feat(finance): 자금일보 API 추가

- 일일 거래 요약 기능 구현
- 카테고리별 집계 추가

Closes #123
```

---

## 참고 문서

- [Svelte 5 Runes 공식 문서](https://svelte.dev/docs/svelte/$state)
- [SvelteKit 공식 문서](https://kit.svelte.dev/docs)
- [TypeScript 공식 문서](https://www.typescriptlang.org/docs/)

---

**마지막 업데이트**: 2025-10-08
**버전**: 1.0.0
