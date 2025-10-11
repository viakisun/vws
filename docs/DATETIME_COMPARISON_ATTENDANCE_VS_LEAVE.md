# Datetime 처리 비교: 출퇴근 vs 연차

## 📊 비교표

| 항목              | 출퇴근 (이미 완료)              | 연차 (계획)                    | 동일성               |
| ----------------- | ------------------------------- | ------------------------------ | -------------------- |
| **DB 세션**       | ✅ `SET TIME ZONE 'Asia/Seoul'` | ✅ 이미 적용됨 (connection.ts) | ✅ 동일              |
| **스키마 상태**   | TIMESTAMP → TIMESTAMPTZ 완료    | 일부 TIMESTAMP 남음            | ⚠️ 마이그레이션 필요 |
| **쿼리 패턴**     | `::text` 사용                   | `TO_CHAR(...AT TIME ZONE...)`  | ⚠️ 단순화 필요       |
| **INSERT/UPDATE** | `now()` 사용                    | `new Date()` 혼재              | ⚠️ 통일 필요         |
| **프론트엔드**    | `substring(11, 16)`             | 확인 필요                      | ❓ 조사 필요         |

---

## 🔍 상세 비교

### 1. 데이터베이스 스키마

#### 출퇴근 (`attendance` 테이블) ✅

```sql
-- migrations/017_fix_attendance_timezone.sql 완료
check_in_time    TIMESTAMPTZ  -- ✅
check_out_time   TIMESTAMPTZ  -- ✅
break_start_time TIMESTAMPTZ  -- ✅
break_end_time   TIMESTAMPTZ  -- ✅
created_at       TIMESTAMPTZ  -- ✅
updated_at       TIMESTAMPTZ  -- ✅
```

#### 연차 (`leave_requests` 테이블) ⚠️

```sql
-- 현재 상태
start_date    TIMESTAMPTZ  -- ✅ 이미 최적
end_date      TIMESTAMPTZ  -- ✅ 이미 최적
approved_at   TIMESTAMP    -- ⚠️ 마이그레이션 필요
created_at    TIMESTAMP    -- ⚠️ 마이그레이션 필요
updated_at    TIMESTAMP    -- ⚠️ 마이그레이션 필요
```

**결론**: 연차도 마이그레이션 필요 (3개 컬럼)

---

### 2. API 쿼리 패턴

#### 출퇴근 (완료) ✅

**Before**:

```sql
TO_CHAR(check_in_time AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') as check_in_time
```

**After**:

```sql
check_in_time::text as check_in_time
```

#### 연차 (계획) ⚠️

**Before**:

```sql
-- dashboard/leave/+server.ts (Line 53-54, 76-77)
TO_CHAR(lr.start_date AT TIME ZONE 'Asia/Seoul', 'HH24:MI') as start_time,
TO_CHAR(lr.end_date AT TIME ZONE 'Asia/Seoul', 'HH24:MI') as end_time

-- hr/leave/monthly-calendar/+server.ts (Line 46-47)
TO_CHAR(lr.start_date AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD') as start_date,
TO_CHAR(lr.end_date AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD') as end_date
```

**After** (계획):

```sql
start_date::text as start_date,
end_date::text as end_date,
approved_at::text as approved_at,
created_at::text as created_at
```

**결론**: 출퇴근과 **정확히 동일한 패턴** 적용 예정

---

### 3. INSERT/UPDATE 로직

#### 출퇴근 (완료) ✅

**Before**:

```typescript
// API에서 new Date() 사용
const result = await query(
  `INSERT INTO attendance (..., check_in_time) VALUES (..., $3)`,
  [..., new Date()]  // ❌
)
```

**After**:

```sql
-- SQL에서 직접 now() 사용
INSERT INTO attendance (..., check_in_time) VALUES (..., now())
UPDATE attendance SET check_out_time = now() WHERE ...
```

#### 연차 (계획) ⚠️

**Before**:

```typescript
// dashboard/leave/+server.ts (Line 124, 139)
const result = await query(
  `INSERT INTO leave_requests (..., created_at) VALUES (..., $5)`,
  [..., new Date()]  // ❌
)
```

**After** (계획):

```sql
INSERT INTO leave_requests (..., created_at) VALUES (..., now())
UPDATE leave_requests SET approved_at = now() WHERE ...
```

**결론**: 출퇴근과 **정확히 동일한 패턴** 적용 예정

---

### 4. 프론트엔드 표시

#### 출퇴근 (완료) ✅

```typescript
// dashboard/attendance/+page.svelte (Line 102)
checkInTime = String(today.check_in_time).substring(11, 16) // HH:MM만 추출

// API에서 받은 KST 문자열 예시:
// "2025-10-11 11:09:00+09" → substring(11, 16) → "11:09"
```

#### 연차 (확인 필요) ❓

```typescript
// dashboard/leave/+page.svelte - 확인 필요
// hr/leave-management/+page.svelte - 확인 필요

// 현재 어떤 방식으로 표시하는지 확인 후 통일
```

**결론**: 프론트엔드도 출퇴근과 동일한 `substring` 패턴 사용할 것

---

## 🎯 핵심 차이점

| 항목            | 출퇴근                            | 연차                                        | 이유                              |
| --------------- | --------------------------------- | ------------------------------------------- | --------------------------------- |
| **데이터 타입** | TIMESTAMPTZ (시간 중요)           | TIMESTAMPTZ + DATE                          | 연차는 날짜 위주, 시간은 부가정보 |
| **주요 컬럼**   | `check_in_time`, `check_out_time` | `start_date`, `end_date`                    | 도메인 특성                       |
| **추가 컬럼**   | -                                 | `local_start_date`, `local_end_date` (DATE) | 연차는 날짜 검색이 많음           |
| **시간 중요도** | ⭐⭐⭐⭐⭐ 매우 중요 (분 단위)    | ⭐⭐⭐ 보통 (날짜가 더 중요)                | 업무 특성                         |

---

## ✅ 적용 계획 (출퇴근과 동일)

### 1단계: 마이그레이션

```sql
-- migrations/020_fix_leave_timestamp.sql
ALTER TABLE leave_requests
  ALTER COLUMN approved_at TYPE TIMESTAMPTZ USING approved_at AT TIME ZONE 'Asia/Seoul',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'Asia/Seoul',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'Asia/Seoul';
```

### 2단계: API 단순화

**출퇴근과 똑같이**:

- `TO_CHAR(...AT TIME ZONE...)` → `::text`
- `new Date()` → `now()`

### 3단계: 프론트엔드 통일

**출퇴근과 똑같이**:

- `substring(11, 16)` 또는 `substring(0, 10)` 사용
- `toLocaleString` 제거

---

## 📝 결론

### ✅ 출퇴근과 연차는 **동일한 패턴** 적용 가능!

**차이점**:

- 연차는 `start_date`, `end_date`가 이미 TIMESTAMPTZ ✅
- 하지만 `approved_at`, `created_at`, `updated_at`는 마이그레이션 필요 ⚠️

**공통점**:

- DB 세션: KST ✅
- 쿼리 패턴: `::text` ✅
- INSERT/UPDATE: `now()` ✅
- 프론트엔드: `substring` ✅

**작업량**:

- 출퇴근: 6개 컬럼 마이그레이션 + API 5개 파일 수정
- 연차: 3개 컬럼 마이그레이션 + API 5개 파일 수정
- **난이도는 비슷하거나 더 쉬움** (절반만 마이그레이션)

---

## 🚀 다음 단계

1. ✅ 출퇴근 완료 (참고용)
2. 🔄 연차 적용 (진행 예정)
   - 동일한 패턴으로 진행하면 빠르고 안전함
   - 이미 검증된 방식이므로 리스크 낮음

**예상 시간**: 1-2시간 (출퇴근 경험으로 더 빠를 수 있음)
