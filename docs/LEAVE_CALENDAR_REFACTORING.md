# 연차 캘린더 Clean Architecture 리팩토링

## 📋 개요

HR 관리자용 연차 캘린더를 Clean Architecture 패턴으로 전문적으로 리팩토링했습니다.

**원칙**:

- ✅ 로직 변화 없음
- ✅ 디자인 변화 없음
- ✅ 기능 동일
- ✅ 코드 품질 향상

---

## 🏗️ Architecture

### Before (단일 컴포넌트)

```
LeaveTab.svelte (448 lines)
├── State management
├── API calls
├── Business logic
├── Data transformation
├── UI utilities
└── UI rendering
```

### After (Clean Architecture)

```
┌─────────────────────────────────────────────┐
│ LeaveTab.svelte (Component Layer)          │
│ - UI 렌더링만                               │
│ - 257 lines                                 │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ useLeaveCalendar.svelte.ts (Hook Layer)   │
│ - 상태 관리                                 │
│ - UI 로직                                   │
│ - 164 lines                                 │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ leave-calendar-service.ts (Service Layer)  │
│ - API 호출                                  │
│ - 데이터 변환                               │
│ - 유틸리티 함수                             │
│ - 281 lines                                 │
└─────────────────────────────────────────────┘
```

---

## 📁 파일 구조

### 생성된 파일

**1. Service Layer**

- `src/lib/services/leave/leave-calendar-service.ts` (281 lines)
  - API 호출
  - 데이터 변환
  - 날짜 유틸리티
  - UI 헬퍼

**2. Hook Layer**

- `src/lib/hooks/leave/useLeaveCalendar.svelte.ts` (164 lines)
  - 상태 관리 (Svelte 5 runes)
  - 데이터 로드
  - 네비게이션
  - 모달 관리

**3. Component Layer**

- `src/lib/components/hr/dashboard/LeaveTab.svelte` (257 lines)
  - UI 렌더링만
  - 이벤트 바인딩
  - 템플릿

---

## ✨ 개선 사항

### 1. 관심사의 분리 (Separation of Concerns)

**Before**:

```typescript
// 모든 것이 하나의 파일에
let loading = $state(false)
let calendarData = $state<any>(null)

async function loadMonthlyCalendar() {
  loading = true
  try {
    const response = await fetch(...)
    calendarData = await response.json()
  } finally {
    loading = false
  }
}

function getLeaveTypeColor(type: string): string {
  switch (type) {
    case '연차': return 'bg-blue-500'
    // ...
  }
}
```

**After**:

```typescript
// Service: API 호출
export async function fetchMonthlyCalendar(
  year: number,
  month: number,
): Promise<ServiceResult<LeaveCalendarData>>

// Service: UI 유틸리티
export function getLeaveTypeColor(type: string): string

// Hook: 상태 관리
const calendar = useLeaveCalendar()

// Component: UI만
<button onclick={calendar.goToToday}>오늘</button>
```

### 2. 타입 안정성 (Type Safety)

**Before**:

```typescript
let calendarData = $state<any>(null)
let selectedLeaves = $state<any[]>([])
```

**After**:

```typescript
// 명확한 타입 정의
export interface LeaveEmployee {
  id: string
  employee_name: string
  department: string
  type: string
  start_date: string
  end_date: string
  total_days: number
  reason: string
}

export interface LeaveCalendarData {
  daily_leaves: DailyLeave[]
  summary: {
    /* ... */
  }
  promotion_targets: PromotionTarget[]
}
```

### 3. 재사용성 (Reusability)

**Before**:

- 모든 로직이 컴포넌트 내부
- 다른 곳에서 재사용 불가능

**After**:

```typescript
// Service 함수들은 어디서든 재사용 가능
import * as leaveService from '$lib/services/leave/leave-calendar-service'

const dateStr = leaveService.formatDateString(2025, 10, 11)
const color = leaveService.getLeaveTypeColor('연차')
const holiday = leaveService.getHolidayName(2025, 10, 11)
```

### 4. 테스트 가능성 (Testability)

**Before**:

- UI와 로직이 강하게 결합
- 테스트 작성 어려움

**After**:

```typescript
// Service 함수는 순수 함수 → 쉽게 테스트 가능
describe('leave-calendar-service', () => {
  it('should format date correctly', () => {
    expect(formatDateString(2025, 1, 5)).toBe('2025-01-05')
  })

  it('should get correct leave type color', () => {
    expect(getLeaveTypeColor('연차')).toBe('bg-blue-500')
  })
})
```

### 5. 가독성 (Readability)

**Before**: 448 lines in one file

- 찾기 어려움
- 이해하기 어려움
- 수정하기 어려움

**After**:

- Service: 281 lines (유틸리티 함수)
- Hook: 164 lines (상태 관리)
- Component: 257 lines (UI만)

**각 파일이 단일 책임을 가짐**

### 6. 유지보수성 (Maintainability)

**Before**:

```typescript
// 448 줄 중에서 특정 로직 찾기
function getDataForDay(day: number) {
  if (!calendarData?.daily_leaves) return null
  const dateStr = getDateString(day)
  return calendarData.daily_leaves.find((d: any) => {
    const normalizedDate = d.date.replace(/\.\s*/g, '-').replace(/-$/, '')
    return normalizedDate === dateStr
  })
}
```

**After**:

```typescript
// Service에서 명확하게 정의됨
/**
 * 특정 날짜의 데이터 찾기
 */
function findDayData(calendarData: LeaveCalendarData | null, dateStr: string): DailyLeave | null
```

### 7. 문서화 (Documentation)

**Before**: 주석 거의 없음

**After**:

```typescript
/**
 * Leave Calendar Service
 *
 * 연차 캘린더 관련 비즈니스 로직 및 API 호출
 * - 월간 캘린더 데이터 조회
 * - 데이터 변환 및 정규화
 * - 날짜 관련 유틸리티
 */

/**
 * 월간 연차 캘린더 데이터 조회
 */
export async function fetchMonthlyCalendar(...)
```

---

## 📊 코드 통계

| 항목                 | Before | After         | 변화 |
| -------------------- | ------ | ------------- | ---- |
| **총 Lines**         | 448    | 702 (3 files) | +254 |
| **Component**        | 448    | 257           | -191 |
| **Service**          | 0      | 281           | +281 |
| **Hook**             | 0      | 164           | +164 |
| **타입 정의**        | ~10    | 50+           | +40  |
| **주석**             | <10    | 80+           | +70  |
| **함수 수**          | ~15    | 25+           | +10  |
| **재사용 가능 함수** | 0      | 15+           | +15  |

---

## 🎯 Clean Architecture 원칙

### 1. Dependency Rule ✅

- Component → Hook → Service
- Service는 Hook에 의존하지 않음
- Hook은 Component에 의존하지 않음

### 2. Single Responsibility ✅

- **Service**: API와 데이터 처리만
- **Hook**: 상태 관리만
- **Component**: UI 렌더링만

### 3. Open/Closed Principle ✅

- 새로운 연차 타입 추가 시 `getLeaveTypeColor`만 수정
- 새로운 기능 추가 시 Service에 함수 추가

### 4. Interface Segregation ✅

- 명확한 타입 정의
- 각 계층의 인터페이스 분리

### 5. Dependency Inversion ✅

- 상위 계층이 하위 계층의 인터페이스에 의존
- 구체적인 구현이 아닌 추상화에 의존

---

## 🚀 사용 예시

### Component에서 Hook 사용

```svelte
<script lang="ts">
  import { useLeaveCalendar } from '$lib/hooks/leave/useLeaveCalendar.svelte'

  const calendar = useLeaveCalendar()

  onMount(() => {
    calendar.initialize()
  })
</script>

<button onclick={calendar.goToToday}>오늘</button>
<button onclick={() => calendar.changeMonth(5)}>5월</button>

{#if calendar.loading}
  Loading...
{:else}
  {#each calendar.calendarDays as day}
    <CalendarDay {day} />
  {/each}
{/if}
```

### Service 함수 직접 사용

```typescript
import * as leaveService from '$lib/services/leave/leave-calendar-service'

// 날짜 포맷팅
const dateStr = leaveService.formatDateString(2025, 10, 11)
// "2025-10-11"

// 휴일 확인
const holiday = leaveService.getHolidayName(2025, 10, 3)
// "개천절"

// 색상 가져오기
const color = leaveService.getLeaveTypeColor('연차')
// "bg-blue-500"
```

---

## ✅ 체크리스트

- [x] Service Layer 생성
- [x] Hook Layer 생성
- [x] Component Layer 리팩토링
- [x] 타입 정의 완료
- [x] JSDoc 주석 추가
- [x] 타입 체크 통과
- [x] 린트 통과
- [x] 기능 동일 (로직 변화 없음)
- [x] 디자인 동일 (UI 변화 없음)

---

## 📝 다음 단계 제안

### 1. 테스트 작성

```typescript
// tests/services/leave-calendar-service.test.ts
describe('leave-calendar-service', () => {
  it('should format date correctly', () => {
    expect(formatDateString(2025, 1, 5)).toBe('2025-01-05')
  })
})
```

### 2. 추가 기능 구현

- Export 기능 (Excel, PDF)
- 필터 기능 (부서별, 타입별)
- 검색 기능

### 3. 다른 페이지 리팩토링

- 직원용 연차 신청 페이지
- 출퇴근 관리 페이지 (이미 완료 ✅)
- 급여 관리 페이지

---

## 🎉 결론

**Before**: 448 줄의 스파게티 코드
**After**: Clean Architecture로 분리된 전문적인 코드

### 핵심 개선점

1. ✅ **가독성**: 각 파일의 역할이 명확함
2. ✅ **유지보수성**: 수정이 필요한 부분을 쉽게 찾을 수 있음
3. ✅ **재사용성**: Service 함수들을 다른 곳에서도 사용 가능
4. ✅ **테스트 가능성**: 순수 함수로 분리되어 테스트 작성 용이
5. ✅ **확장성**: 새로운 기능 추가 시 해당 계층만 수정

**이제 초급 개발자도 코드를 쉽게 이해하고 수정할 수 있습니다!** 🚀
