# 🐛 Svelte/TypeScript 에러 분석 및 수정 계획

## 📊 에러 통계

- **총 에러 개수**: 139개
- **주요 에러 유형**: 5가지 카테고리

## 🎯 에러 분류 및 우선순위

### ⚠️ P0 (즉시 수정 필요 - 런타임 에러 가능성 높음)

#### 1. **Type narrowing 실패** (60+ 에러)

**문제**: `type 'unknown'`, `Property does not exist on type 'never'`
**원인**: API 응답 데이터의 타입이 제대로 정의되지 않음
**영향**: 런타임 에러 가능성 매우 높음

**주요 파일들**:

- `src/routes/dashboard/attendance/+page.svelte` (~20 에러)
- `src/routes/dashboard/leave/+page.svelte` (~15 에러)
- `src/routes/hr/+page.svelte` (~10 에러)
- `src/routes/crm/+page.svelte` (~8 에러)

**예시**:

```typescript
// ❌ 현재
{#each recentJobPostings as job}
  {job.title}  // Error: 'job' is of type 'unknown'
{/each}

// ✅ 수정
{#each recentJobPostings as job: JobPosting}
  {job.title}  // OK
{/each}
```

#### 2. **parseFloat에 number 전달** (8 에러)

**문제**: `Argument of type 'number' is not assignable to parameter of type 'string'`
**원인**: DB에서 이미 number로 온 값을 다시 parseFloat 시도
**영향**: 중간 - 동작은 하지만 불필요한 변환

**파일**:

- `src/routes/api/dashboard/leave/+server.ts` (4개)
- `src/routes/api/hr/leave-stats/+server.ts` (4개)

**예시**:

```typescript
// ❌ 현재
used: parseFloat(balance.used_annual_leave) // balance.used_annual_leave는 이미 number

// ✅ 수정 1: parseFloat 제거
used: balance.used_annual_leave

// ✅ 수정 2: 타입 확인 후 변환
used: typeof balance.used_annual_leave === 'string'
  ? parseFloat(balance.used_annual_leave)
  : balance.used_annual_leave
```

---

### ⚠️ P1 (높은 우선순위 - 타입 안정성)

#### 3. **Missing 컴포넌트/타입** (3 에러)

**문제**: `Cannot find name 'ThemeDropdown'`
**원인**: import 누락 또는 컴포넌트 미생성
**영향**: 컴파일 에러 (앱 실행 안 됨)

**파일**:

- `src/lib/components/layout/Header.svelte`

**수정**:

```typescript
// ✅ import 추가
import ThemeDropdown from '$lib/components/ui/ThemeDropdown.svelte'
```

#### 4. **SvelteComponent to HTMLElement 변환** (1 에러)

**문제**: `Type 'SvelteComponent' is not assignable to type 'HTMLElement'`
**원인**: Svelte 5 runes API 변경
**영향**: 낮음 - 동작은 하지만 타입 불일치

**파일**:

- `src/lib/components/layout/Header.svelte`

---

### ⚠️ P2 (낮은 우선순위 - 경미한 타입 이슈)

#### 5. **빈 객체 타입 이슈** (3 에러)

**문제**: `Type '{}' is not assignable to type 'string'`
**원인**: 초기값 설정 문제
**영향**: 매우 낮음

**파일**:

- `src/lib/components/ui/ThemeAvatar.svelte`

---

## 🔧 수정 계획 (우선순위별)

### Phase 1: Critical Fixes (P0) - 예상 시간: 30분

**Step 1: API 응답 타입 정의** (15분)

```typescript
// 1. types 파일 확인/생성
// src/lib/types/dashboard.ts
export interface AttendanceData {
  today: {
    total_work_hours: number
    overtime_hours: number
    status: string
  }
  week: AttendanceRecord[]
  stats: AttendanceStats
}

export interface LeaveData {
  balance: {
    total_annual_leave: number
    used_annual_leave: number
    remaining_annual_leave: number
  }
  requests: LeaveRequest[]
  monthlyStats: MonthlyStats
}

// 2. Svelte 파일에서 타입 적용
<script lang="ts">
  import type { AttendanceData } from '$lib/types/dashboard'

  let attendanceData = $state<AttendanceData>()
</script>
```

**Step 2: parseFloat 수정** (5분)

```typescript
// src/routes/api/dashboard/leave/+server.ts
// parseFloat 제거 또는 조건부 변환
used: balance.used_annual_leave // 이미 number이면 그대로 사용
```

**Step 3: 컴포넌트 array 타입 지정** (10분)

```svelte
<!-- 모든 {#each} 블록에 타입 추가 -->
{#each recentJobPostings as job: JobPosting}
{#each filteredCustomers as customer: Customer}
{#each attendanceData.week as record: AttendanceRecord}
```

### Phase 2: High Priority (P1) - 예상 시간: 15분

**Step 4: ThemeDropdown import** (5분)

```typescript
// src/lib/components/layout/Header.svelte
import ThemeDropdown from '$lib/components/ui/ThemeDropdown.svelte'
```

**Step 5: SvelteComponent 타입 수정** (10분)

```typescript
// @ts-ignore 추가 또는 타입 단언 사용
```

### Phase 3: Low Priority (P2) - 예상 시간: 5분

**Step 6: 빈 객체 초기값** (5분)

```typescript
let src = $state<string>('') // {} 대신 '' 사용
```

---

## 📋 수정 순서 (파일별)

### 1순위: API 타입 정의 (한 번에 해결)

```bash
src/lib/types/
  ├── dashboard.ts (신규 생성)
  ├── hr.ts (업데이트)
  └── crm.ts (신규 생성)
```

### 2순위: Dashboard 페이지들 (가장 많은 에러)

```bash
src/routes/dashboard/
  ├── attendance/+page.svelte (20 에러)
  ├── leave/+page.svelte (15 에러)
  └── +page.svelte (10 에러)
```

### 3순위: API 엔드포인트

```bash
src/routes/api/
  ├── dashboard/leave/+server.ts (4 에러)
  └── hr/leave-stats/+server.ts (4 에러)
```

### 4순위: HR & CRM 페이지

```bash
src/routes/
  ├── hr/+page.svelte (10 에러)
  └── crm/+page.svelte (8 에러)
```

### 5순위: 컴포넌트

```bash
src/lib/components/
  ├── layout/Header.svelte (3 에러)
  └── ui/ThemeAvatar.svelte (1 에러)
```

---

## 🚀 실행 계획

### Option A: 전체 일괄 수정 (권장)

```bash
# 예상 시간: 1시간
1. 타입 정의 생성 (15분)
2. Dashboard 페이지 수정 (20분)
3. API 엔드포인트 수정 (10분)
4. HR/CRM 페이지 수정 (10분)
5. 컴포넌트 수정 (5분)
6. 테스트 및 검증 (10분)
```

### Option B: 단계별 수정

```bash
# Day 1: P0 (Critical)
- 타입 정의
- Dashboard 페이지
- API 엔드포인트
→ 80% 에러 해결

# Day 2: P1 + P2
- 나머지 페이지
- 컴포넌트
→ 100% 완료
```

---

## ✅ 수정 후 검증

```bash
# 1. TypeScript 체크
pnpm check:svelte

# 2. 빌드 테스트
pnpm build

# 3. 로컬 실행 테스트
pnpm dev
# - /dashboard/attendance 접속
# - /dashboard/leave 접속
# - /hr 접속
# - /crm 접속

# 4. CI 테스트
git add -A
git commit -m "fix: resolve 139 TypeScript errors"
git push
```

---

## 📌 다음 단계

1. **즉시 수정 시작**: Option A (1시간 집중)
2. **단계별 수정**: Option B (2일)
3. **현재 상태 유지 후 점진적**: 신규 코드부터 타입 엄격화

**추천**: Option A (1시간이면 모든 에러 해결 가능)

지금 바로 수정 시작할까요?
