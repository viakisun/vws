# Attendance Service + Hook 분리 완료 보고서

**날짜**: 2025-10-11  
**목표**: Clean Architecture 적용 - Service 레이어와 Hook 분리

---

## 📋 작업 요약

출퇴근 관리 기능을 Clean Architecture 원칙에 따라 Service, Hook, API 레이어로 분리했습니다.

### 변경 전 구조

```
Component → API (520줄) → Database
              ↑
        모든 로직 포함
```

### 변경 후 구조

```
Component → Hook (264줄) → API (81줄) → Service (614줄) → Database
          (상태)        (HTTP)      (비즈니스 로직)   (쿼리)
```

---

## 📁 생성된 파일

### 1. Service 레이어

**파일**: `src/lib/services/attendance/attendance-service.ts` (614줄)

**책임**:

- 데이터베이스 쿼리 실행
- 비즈니스 규칙 적용 (지각/조기퇴근 판정)
- IP 검증
- 날짜 계산

**주요 함수**:

```typescript
// 데이터 조회
export async function fetchAttendanceData(employeeId, date?)

// 출퇴근 기록
export async function recordCheckIn(employeeId, date, clientIp, notes?)
export async function recordCheckOut(employeeId, date, clientIp, notes?)

// 휴게 기록
export async function recordBreakStart(employeeId, date)
export async function recordBreakEnd(employeeId, date)
```

**특징**:

- 모든 함수는 `ServiceResult<T>` 반환 (success, data, message)
- 에러를 throw하지 않고 Result 객체로 반환
- 재사용 가능한 순수 비즈니스 로직

### 2. Hook 레이어

**파일**: `src/lib/hooks/attendance/useAttendance.svelte.ts` (264줄)

**책임**:

- API 호출 래핑
- 로딩/에러 상태 관리
- 자동 데이터 갱신
- Toast 알림 표시

**사용 예시**:

```typescript
const attendance = useAttendance()

onMount(async () => {
  await attendance.loadAttendanceData()
})

async function handleCheckIn() {
  const success = await attendance.checkIn('출근합니다')
  if (success) {
    // 성공 처리
  }
}
```

**제공 기능**:

```typescript
{
  // 상태 (읽기 전용)
  loading: boolean
  error: string | null
  data: AttendanceData | null

  // 액션
  loadAttendanceData(date?)
  checkIn(notes?)
  checkOut(notes?)
  startBreak()
  endBreak()
  navigateToDate(date)
  refresh()
}
```

### 3. API 레이어 (리팩토링)

**파일**: `src/routes/api/dashboard/attendance/+server.ts` (81줄, **84% 감소**)

**변경 전**: 520줄 (상수 + 쿼리 + 로직 + HTTP)  
**변경 후**: 81줄 (HTTP만)

**GET 핸들러** (11줄):

```typescript
export const GET: RequestHandler = async (event) => {
  const { user } = await requireAuth(event)
  const date = event.url.searchParams.get('date') || undefined

  const result = await attendanceService.fetchAttendanceData(user.id, date)

  if (!result.success) {
    return json({ success: false, message: result.message }, { status: 500 })
  }

  return json({ success: true, data: result.data })
}
```

**POST 핸들러** (42줄):

```typescript
export const POST: RequestHandler = async (event) => {
  const { user } = await requireAuth(event)
  const { action, notes } = await event.request.json()

  const employeeId = user.id
  const today = new Date().toISOString().split('T')[0]
  const clientIp = event.getClientAddress()

  let result

  switch (action) {
    case 'check_in':
      result = await attendanceService.recordCheckIn(employeeId, today, clientIp, notes)
      break
    case 'check_out':
      result = await attendanceService.recordCheckOut(employeeId, today, clientIp, notes)
      break
    case 'break_start':
      result = await attendanceService.recordBreakStart(employeeId, today)
      break
    case 'break_end':
      result = await attendanceService.recordBreakEnd(employeeId, today)
      break
    default:
      return json({ success: false, message: '알 수 없는 액션입니다.' }, { status: 400 })
  }

  if (!result.success) {
    const status = result.message?.includes('허용되지 않은 IP') ? 403 : 400
    return json({ success: false, message: result.message }, { status })
  }

  return json({
    success: true,
    message: result.message,
    data: result.data,
  })
}
```

---

## 🎯 아키텍처 이점

### 1. 관심사 분리 (Separation of Concerns)

- **API**: HTTP 요청/응답만 처리
- **Service**: 비즈니스 로직만 처리
- **Hook**: 상태 관리 + API 호출만 처리
- **Component**: UI만 렌더링

### 2. 재사용성 (Reusability)

- Service 함수는 API 외에 다른 곳에서도 사용 가능 (예: 백그라운드 작업, 스케줄러)
- Hook은 여러 컴포넌트에서 동일한 로직 공유 가능
- 중복 코드 제거

### 3. 테스트 용이성 (Testability)

```typescript
// Service 함수는 순수 함수로 단위 테스트 가능
describe('attendanceService', () => {
  it('should record check-in with late status', async () => {
    const result = await recordCheckIn('employee-1', '2025-10-11', '127.0.0.1')
    expect(result.success).toBe(true)
    expect(result.message).toContain('지각')
  })
})

// Hook은 API 모킹으로 테스트 가능
describe('useAttendance', () => {
  it('should set loading state during check-in', async () => {
    const attendance = useAttendance()
    const promise = attendance.checkIn()
    expect(attendance.loading).toBe(true)
    await promise
    expect(attendance.loading).toBe(false)
  })
})
```

### 4. 유지보수성 (Maintainability)

- 각 레이어가 독립적
- 변경의 영향 범위 최소화
- 코드 가독성 향상
- 초급 개발자도 쉽게 이해 가능

### 5. 확장성 (Scalability)

- 새로운 기능 추가 시 적절한 레이어에만 변경
- 예: 새로운 출퇴근 규칙 → Service만 수정
- 예: 새로운 UI 상태 → Hook만 수정
- 예: 새로운 API 엔드포인트 → API만 추가

---

## 📊 코드 메트릭

| 항목          | 변경 전 | 변경 후 | 개선율   |
| ------------- | ------- | ------- | -------- |
| API 핸들러    | 520줄   | 81줄    | **-84%** |
| 코드 복잡도   | 높음    | 낮음    | -        |
| 재사용성      | 낮음    | 높음    | -        |
| 테스트 가능성 | 어려움  | 쉬움    | -        |
| 유지보수성    | 어려움  | 쉬움    | -        |

**총 코드량**: 959줄

- Service: 614줄
- Hook: 264줄
- API: 81줄

**장점**:

- API 핸들러가 84% 감소하여 가독성 대폭 향상
- Service와 Hook이 독립적이므로 각각 재사용 가능
- 변경의 영향 범위가 명확하게 분리됨

---

## 🔄 기존 코드와의 호환성

### API 엔드포인트

**변경 없음**: `/api/dashboard/attendance` (GET, POST)

기존 프론트엔드 코드는 수정 없이 그대로 동작합니다.

### 점진적 마이그레이션

기존 컴포넌트는 점진적으로 Hook을 사용하도록 전환 가능:

**Before** (직접 API 호출):

```typescript
async function handleCheckIn() {
  const response = await fetch('/api/dashboard/attendance', {
    method: 'POST',
    body: JSON.stringify({ action: 'check_in' }),
  })
  // ...
}
```

**After** (Hook 사용):

```typescript
const attendance = useAttendance()

async function handleCheckIn() {
  await attendance.checkIn()
  // 상태 관리, 에러 처리, Toast 자동 처리
}
```

---

## ✅ 빌드 및 검증

### 빌드 결과

```bash
npm run build
# ✓ built in 25.23s
# 모든 파일 정상 빌드
```

### Lint 결과

- Service: 문제 없음
- Hook: 문제 없음
- API: 문제 없음

### Type Check

- TypeScript 타입 검증 통과
- 모든 인터페이스 정의 완료

---

## 📝 다음 단계 (선택사항)

### 1. Hook 적용

기존 컴포넌트를 Hook을 사용하도록 점진적 전환:

- `src/routes/dashboard/attendance/+page.svelte`
- `src/routes/hr/attendance/+page.svelte`

### 2. 단위 테스트 작성

```bash
tests/
  services/
    attendance-service.test.ts
  hooks/
    useAttendance.test.ts
```

### 3. 다른 도메인 적용

동일한 패턴을 다른 기능에도 적용:

- Leave Management (휴가 관리)
- Payroll (급여)
- Projects (프로젝트)

---

## 🎓 학습 포인트

### Clean Architecture의 핵심

1. **의존성 방향**: 외부(API) → 내부(Service)
2. **단일 책임**: 각 레이어는 하나의 책임만
3. **추상화**: 인터페이스를 통한 결합도 감소

### Svelte 5 Runes 활용

- `$state`: 반응형 상태 관리
- `$derived`: 계산된 값
- `get`: 읽기 전용 getter

### TypeScript 타입 안전성

- `ServiceResult<T>`: 일관된 응답 형식
- 명시적 인터페이스: 타입 안전성 보장

---

## 📚 참고 파일

- **Service**: `src/lib/services/attendance/attendance-service.ts`
- **Hook**: `src/lib/hooks/attendance/useAttendance.svelte.ts`
- **API**: `src/routes/api/dashboard/attendance/+server.ts`
- **Documentation**:
  - `docs/API_ATTENDANCE_GUIDE.md` (API 가이드)
  - `docs/REFACTORING_SUMMARY.md` (리팩토링 요약)
  - `docs/DATETIME_KST_SIMPLIFIED.md` (Datetime 아키텍처)

---

## ✨ 결론

**성공적으로 Service + Hook 분리 완료!**

- API 핸들러: 520줄 → 81줄 (84% 감소)
- Clean Architecture 적용으로 유지보수성 대폭 향상
- 재사용 가능한 Service와 Hook 생성
- 기존 코드와 100% 호환
- 빌드 및 타입 검증 통과

**전문가 수준의 코드 구조로 업그레이드 완료!** 🎉
