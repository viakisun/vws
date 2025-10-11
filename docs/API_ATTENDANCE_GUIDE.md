# 출퇴근 API 가이드

**파일**: `src/routes/api/dashboard/attendance/+server.ts`  
**날짜**: 2024-10-11  
**상태**: ✅ 프로덕션

---

## 📋 개요

출퇴근 기록 및 조회를 위한 RESTful API입니다.

### 핵심 원칙

1. **단순함**: 복잡한 타임존 변환 없음
2. **명확함**: 상수와 헬퍼 함수로 로직 분리
3. **유지보수성**: 초급 개발자도 수정 가능한 구조

---

## 🏗️ 코드 구조

```
┌─────────────────────────────────────┐
│  상수 정의                           │
│  - ERROR_MESSAGES                   │
│  - SUCCESS_MESSAGES                 │
│  - QUERIES (SQL 템플릿)             │
├─────────────────────────────────────┤
│  타입 정의                           │
│  - AttendanceSettings               │
├─────────────────────────────────────┤
│  헬퍼 함수                           │
│  - getDateRange()                   │
│  - getWeekRange()                   │
│  - getMonthRange()                  │
│  - determineCheckInStatus()         │
│  - isEarlyLeave()                   │
│  - validateIpAddress()              │
│  - fetchAttendanceSettings()        │
├─────────────────────────────────────┤
│  API 핸들러                          │
│  - GET: 조회                        │
│  - POST: 기록                       │
├─────────────────────────────────────┤
│  액션 핸들러                         │
│  - handleCheckIn()                  │
│  - handleCheckOut()                 │
│  - handleBreakStart()               │
│  - handleBreakEnd()                 │
└─────────────────────────────────────┘
```

---

## 🔧 수정 가이드

### 1. 메시지 변경

**위치**: `ERROR_MESSAGES`, `SUCCESS_MESSAGES` 상수

```typescript
const ERROR_MESSAGES = {
  NO_CHECK_IN: '출근 기록이 없습니다.', // ← 여기 수정
  // ...
}
```

### 2. SQL 쿼리 변경

**위치**: `QUERIES` 상수

```typescript
const QUERIES = {
  GET_TODAY_ATTENDANCE: `
    SELECT
      check_in_time::text as check_in_time  -- ← ::text는 KST 문자열 변환
    FROM attendance
    WHERE employee_id = $1
  `,

  RECORD_CHECK_IN: `
    VALUES (now())  -- ← now()는 자동으로 KST
  `,
}
```

**중요**:

- 조회 시: `check_in_time::text` (문자열로 변환)
- 저장 시: `now()` (현재 KST 시간)

### 3. 지각/조퇴 기준 변경

**위치**: `determineCheckInStatus()`, `isEarlyLeave()` 함수

```typescript
function determineCheckInStatus(...) {
  // settings.late_threshold_minutes 사용
  return diffMinutes > settings.late_threshold_minutes ? 'late' : 'present'
}
```

**변경 방법**: DB의 `attendance_settings` 테이블에서 수정

### 4. 새로운 액션 추가

**단계**:

1. POST 핸들러에 case 추가:

```typescript
switch (action) {
  case 'new_action':  // ← 새 액션
    return await handleNewAction(...)
}
```

2. 쿼리 상수 추가:

```typescript
const QUERIES = {
  RECORD_NEW_ACTION: `...`,
}
```

3. 핸들러 함수 작성:

```typescript
async function handleNewAction(...) {
  const result = await query(QUERIES.RECORD_NEW_ACTION, [...])
  return json({ success: true, ... })
}
```

---

## 📊 API 엔드포인트

### GET `/api/dashboard/attendance`

**용도**: 출퇴근 데이터 조회

**쿼리 파라미터**:

- `date` (optional): 조회할 날짜 (YYYY-MM-DD), 기본값: 오늘

**응답**:

```json
{
  "success": true,
  "data": {
    "today": {
      "check_in_time": "2025-10-11 11:09:53+09",
      "check_out_time": null,
      ...
    },
    "week": [...],
    "month": [...],
    "stats": {
      "totalDays": 20,
      "workDays": 18,
      ...
    }
  }
}
```

### POST `/api/dashboard/attendance`

**용도**: 출퇴근 기록

**요청 바디**:

```json
{
  "action": "check_in", // check_in | check_out | break_start | break_end
  "notes": "메모 (optional)"
}
```

**응답**:

```json
{
  "success": true,
  "message": "출근이 기록되었습니다.",
  "data": { ... }
}
```

---

## 🔍 디버깅 가이드

### 문제: 시간이 이상하게 나와요

**확인 사항**:

1. DB 세션 타임존 확인:

   ```sql
   SHOW TIME ZONE;  -- 'Asia/Seoul'이어야 함
   ```

2. SQL에 `::text` 사용 확인:

   ```sql
   SELECT check_in_time::text  -- ✅ GOOD
   SELECT check_in_time         -- ❌ BAD (Date 객체로 변환됨)
   ```

3. 저장 시 `now()` 사용 확인:
   ```sql
   VALUES (now())  -- ✅ GOOD
   ```

### 문제: IP 검증 오류

**확인 사항**:

1. `attendance_settings.require_ip_check` 설정
2. `attendance_settings.allowed_ips` 배열에 IP 추가

**디버그 방법**:

```typescript
console.log('Client IP:', clientIp)
console.log('Allowed IPs:', settings?.allowed_ips)
```

### 문제: 출근은 되는데 퇴근이 안돼요

**확인 사항**:

1. 출근 기록이 있는지 확인:

   ```sql
   SELECT * FROM attendance
   WHERE employee_id = '...' AND date = '2025-10-11'
   ```

2. 에러 메시지 확인:
   - "출근 기록이 없습니다" → 먼저 출근 필요

---

## ⚠️ 주의사항

### DO ✅

```typescript
// 1. 쿼리는 QUERIES 상수 사용
const result = await query(QUERIES.GET_TODAY_ATTENDANCE, [...])

// 2. 메시지는 상수 사용
return json({ message: ERROR_MESSAGES.NO_CHECK_IN })

// 3. 헬퍼 함수 활용
const status = determineCheckInStatus(...)

// 4. 명확한 변수명
const employeeId = user.id  // ✅
const id = user.id          // ❌
```

### DON'T ❌

```typescript
// 1. 인라인 쿼리 금지
await query(`SELECT * FROM ...`) // ❌

// 2. 하드코딩 금지
return json({ message: '출근 기록이 없습니다.' }) // ❌

// 3. 복잡한 로직을 핸들러에 직접 작성 금지
export const POST = async (event) => {
  // 100줄 이상의 로직... ❌
}

// 4. CURRENT_TIMESTAMP 대신 now() 사용
VALUES(CURRENT_TIMESTAMP) // ❌
VALUES(now()) // ✅
```

---

## 🧪 테스트 방법

### 1. API 테스트 (curl)

```bash
# 출근
curl -X POST http://localhost:5173/api/dashboard/attendance \
  -H "Content-Type: application/json" \
  -d '{"action":"check_in","notes":"테스트"}'

# 조회
curl http://localhost:5173/api/dashboard/attendance?date=2025-10-11
```

### 2. DB 직접 확인

```sql
-- 오늘 출퇴근 기록
SELECT
  check_in_time::text,
  check_out_time::text,
  status
FROM attendance
WHERE date = CURRENT_DATE
ORDER BY check_in_time DESC;

-- 타임존 확인
SHOW TIME ZONE;  -- Asia/Seoul이어야 함
```

---

## 📚 관련 문서

- **아키텍처**: `docs/DATETIME_KST_SIMPLIFIED.md`
- **마이그레이션**: `migrations/017_fix_attendance_timezone.sql`
- **컴포넌트**: `src/lib/components/attendance/AttendanceCalendar.svelte`

---

## 🎓 학습 자료

### 초급 개발자를 위한 팁

1. **상수부터 보기**: 파일 상단의 `ERROR_MESSAGES`, `QUERIES` 상수를 먼저 읽으세요.

2. **헬퍼 함수 이해**: 각 함수는 하나의 역할만 합니다. JSDoc 주석을 읽으세요.

3. **흐름 따라가기**:

   ```
   API 요청 → 핸들러(GET/POST) → 헬퍼 함수 → DB 쿼리 → 응답
   ```

4. **타입 확인**: TypeScript 타입을 보면 어떤 데이터가 오가는지 알 수 있습니다.

### 코드 읽는 순서

```
1. 상수 정의 (무엇을 하는 코드인지 파악)
   ↓
2. 타입 정의 (어떤 데이터를 다루는지 파악)
   ↓
3. 헬퍼 함수 (어떻게 처리하는지 파악)
   ↓
4. API 핸들러 (전체 흐름 파악)
   ↓
5. 액션 핸들러 (세부 동작 파악)
```

---

**작성일**: 2024-10-11  
**작성자**: AI Assistant  
**버전**: 2.0 (KST Simplified)
