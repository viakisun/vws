# 날짜 처리 표준 가이드라인

## 🎯 목적

모든 날짜 처리를 일관된 방식으로 표준화하여 UTC와 서울 시간을 정확하게 처리하고, 사용자 경험을
향상시킵니다.

## 📋 표준 형식

### 저장 형식 (데이터베이스)

- **형식**: UTC (ISO 8601)
- **예시**: `2025-01-15T09:30:00.000Z`
- **용도**: 데이터베이스 저장, API 통신

### 표시 형식 (사용자)

- **형식**: 서울 시간 (Asia/Seoul)
- **예시**: `2025. 01. 15.`, `2025년 01월 15일`
- **용도**: UI 표시, 사용자 입력

## 🛠️ 권장 함수 사용법

### 1. 사용자 입력을 UTC로 변환

```typescript
import { toUTC } from '$lib/utils/date-handler'

// ✅ 올바른 사용법
const utcDate = toUTC(userInput)
const utcDate = toUTC('2025-01-15')
const utcDate = toUTC(new Date())
const utcDate = toUTC(excelDateNumber)

// ❌ 잘못된 사용법
const utcDate = new Date(userInput).toISOString()
const utcDate = new Date(userInput)
```

### 2. UTC를 표시용으로 변환

```typescript
import { formatDateForDisplay } from '$lib/utils/date-handler'

// ✅ 올바른 사용법
const displayDate = formatDateForDisplay(utcDate, 'FULL') // "2025. 01. 15."
const displayDate = formatDateForDisplay(utcDate, 'KOREAN') // "2025년 01월 15일"
const displayDate = formatDateForDisplay(utcDate, 'RELATIVE') // "1일 전"

// ❌ 잘못된 사용법
const displayDate = new Date(utcDate).toLocaleDateString('ko-KR')
const displayDate = new Date(utcDate).toLocaleString()
```

### 3. HTML Input용 날짜 형식

```typescript
import { formatDateForInput, formatDateTimeForInput } from '$lib/utils/date-handler'

// ✅ 올바른 사용법
const inputDate = formatDateForInput(utcDate) // "2025-01-15"
const inputDateTime = formatDateTimeForInput(utcDate) // "2025-01-15T14:30"

// ❌ 잘못된 사용법
const inputDate = utcDate.split('T')[0]
const inputDate = new Date(utcDate).toISOString().split('T')[0]
```

### 4. 현재 시간 처리

```typescript
import { getCurrentUTC, getCurrentSeoulAsUTC } from '$lib/utils/date-handler'

// ✅ 올바른 사용법
const nowUTC = getCurrentUTC() // 현재 시간을 UTC로
const nowSeoul = getCurrentSeoulAsUTC() // 현재 서울 시간을 UTC로

// ❌ 잘못된 사용법
const now = new Date().toISOString()
const now = Date.now()
```

## 🔍 검증 도구

### ESLint 규칙

- 금지된 날짜 처리 패턴 자동 검출
- `toLocaleDateString()`, `toLocaleString()` 직접 사용 금지
- `new Date()` 직접 사용 금지

### Pre-commit Hook

- 커밋 전 자동 검증
- 표준 위반 시 커밋 차단

### 런타임 검증

```typescript
import { enforceStandardDate, isValidDate } from '$lib/utils/date-handler'

// 개발 모드에서 자동 검증
const date = enforceStandardDate(userInput, '사용자 입력')

// 날짜 유효성 검증
const isValid = isValidDate(userInput)
```

## 📝 API 개발 가이드라인

### 데이터베이스 쿼리

```sql
-- ✅ 올바른 쿼리 (UTC 저장)
INSERT INTO projects (start_date, end_date)
VALUES ('2025-01-15T00:00:00.000Z', '2025-12-31T23:59:59.999Z')

-- ❌ 잘못된 쿼리 (로컬 시간 저장)
INSERT INTO projects (start_date, end_date)
VALUES ('2025-01-15', '2025-12-31')
```

### API 응답

```typescript
// ✅ 올바른 응답 (UTC → 표시 형식 변환)
return {
  startDate: formatDateForDisplay(project.start_date, 'FULL'),
  endDate: formatDateForDisplay(project.end_date, 'FULL'),
  createdAt: formatDateForDisplay(project.created_at, 'RELATIVE')
}

// ❌ 잘못된 응답 (원시 UTC 데이터)
return {
  startDate: project.start_date, // "2025-01-15T00:00:00.000Z"
  endDate: project.end_date // "2025-12-31T23:59:59.999Z"
}
```

## 🚨 금지 패턴

### 1. 직접 Date 메서드 사용

```typescript
// ❌ 금지
const date = new Date().toLocaleDateString('ko-KR')
const date = new Date().toLocaleString()
const date = new Date().toISOString()
```

### 2. 직접 Date 생성자 사용

```typescript
// ❌ 금지
const date = new Date(userInput)
const date = new Date(dateString)
const date = new Date()
```

### 3. 타임존 변환 없이 직접 사용

```typescript
// ❌ 금지
const date = utcDate.split('T')[0]
const date = utcDate.replace('Z', '')
const date = new Date(utcDate).getFullYear()
```

## 🔧 마이그레이션 가이드

### 기존 코드 수정

1. **직접 Date 메서드 제거**

   ```typescript
   // Before
   const date = new Date(dateString).toLocaleDateString('ko-KR')

   // After
   const date = formatDateForDisplay(toUTC(dateString), 'FULL')
   ```

2. **API 응답 수정**

   ```typescript
   // Before
   return { startDate: project.start_date }

   // After
   return { startDate: formatDateForDisplay(project.start_date, 'FULL') }
   ```

3. **사용자 입력 처리 수정**

   ```typescript
   // Before
   const utcDate = new Date(userInput).toISOString()

   // After
   const utcDate = toUTC(userInput)
   ```

## 📊 지원하는 입력 형식

### 문자열 형식

- `2025-01-15` (YYYY-MM-DD)
- `2025.01.15` (YYYY.MM.DD)
- `2025/01/15` (YYYY/MM/DD)
- `2025-01-15T14:30:00.000Z` (ISO 8601)
- `2025-01-15 14:30:00` (공백 구분)

### 숫자 형식

- Unix timestamp: `1705334400`
- Excel 날짜: `45285` (1900-01-01 기준)

### Date 객체

- JavaScript Date 객체 직접 전달

## 🎯 검증 체크리스트

- [ ] ESLint 규칙 통과
- [ ] Pre-commit hook 통과
- [ ] 모든 날짜 표시가 표준 함수 사용
- [ ] 데이터베이스에 UTC 저장
- [ ] API 응답이 표시 형식으로 변환
- [ ] 사용자 입력이 UTC로 변환
- [ ] 타임존 변환이 올바르게 처리

## 📞 지원

표준 관련 문의나 문제가 있을 경우:

1. ESLint 에러 메시지 확인
2. Pre-commit hook 메시지 확인
3. `src/lib/utils/date-handler.ts` 참조
4. 개발팀에 문의

## 🔄 시간대 처리 예시

### UTC → 서울 시간 변환

```typescript
// UTC: 2025-01-15T00:00:00.000Z (자정)
// 서울: 2025-01-15T09:00:00 (오전 9시)
const displayDate = formatDateForDisplay('2025-01-15T00:00:00.000Z', 'FULL')
// 결과: "2025. 01. 15."
```

### 서울 시간 → UTC 변환

```typescript
// 사용자 입력: "2025-01-15" (서울 시간 자정)
// UTC 저장: "2025-01-14T15:00:00.000Z" (전날 오후 3시)
const utcDate = toUTC('2025-01-15')
// 결과: "2025-01-14T15:00:00.000Z"
```
