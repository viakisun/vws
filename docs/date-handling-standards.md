# 날짜/시간 처리 표준 가이드라인

## 🎯 목적

이 문서는 VWS 시스템에서 날짜/시간을 일관되고 안전하게 처리하기 위한 표준을 정의합니다. 
시간대 문제를 근본적으로 해결하고, 개발자들이 올바른 날짜 처리를 할 수 있도록 가이드합니다.

## 📋 핵심 원칙

### 1. 데이터베이스 저장: UTC
- 모든 날짜는 **UTC (ISO 8601)** 형식으로 저장
- `TIMESTAMP WITH TIME ZONE` 타입 사용 (DATE 타입 사용 금지)

### 2. 사용자 표시: 서울 시간
- 모든 사용자에게는 **Asia/Seoul** 시간대로 표시
- 자동으로 UTC → 서울 시간 변환

### 3. 사용자 입력: 다양한 형식 지원
- 사용자가 입력한 날짜는 현재 설정된 시간대로 해석
- 자동으로 UTC로 변환하여 저장

## 🛠️ 구현된 해결책

### 데이터베이스 스키마 수정
```sql
-- ❌ 기존 (문제 있음)
hire_date DATE,
start_date DATE,
end_date DATE,

-- ✅ 수정 (올바름)
hire_date TIMESTAMP WITH TIME ZONE,
start_date TIMESTAMP WITH TIME ZONE,
end_date TIMESTAMP WITH TIME ZONE,
```

### 마이그레이션 실행
```bash
# 마이그레이션 실행
npm run migrate

# 드라이런 (실제 실행 전 테스트)
npm run migrate:dry-run
```

### 자동 날짜 처리
```typescript
// 데이터베이스 쿼리 결과는 자동으로 날짜 처리됨
const result = await query('SELECT * FROM employees')
// result.rows의 모든 날짜 필드가 자동으로 표시용으로 변환됨

// 사용자 입력을 데이터베이스에 저장할 때
const hireDate = prepareDateForDatabase(userInput) // 자동으로 UTC 변환
await query('INSERT INTO employees (hire_date) VALUES ($1)', [hireDate])
```

## 📚 사용법

### 1. 날짜 표시
```typescript
import { formatDateForDisplay } from '$lib/utils/date-handler'

// UTC 날짜를 사용자에게 표시
const displayDate = formatDateForDisplay(utcDate, 'FULL') // "2024. 01. 15."
const shortDate = formatDateForDisplay(utcDate, 'SHORT')   // "01/15"
const koreanDate = formatDateForDisplay(utcDate, 'KOREAN') // "2024년 01월 15일"
```

### 2. HTML Input 처리
```typescript
import { formatDateForInput, toUTC } from '$lib/utils/date-handler'

// 데이터베이스 → HTML input
<input type="date" bind:value={formatDateForInput(utcDate)} />

// HTML input → 데이터베이스
const utcDate = toUTC(inputValue)
```

### 3. 현재 시간
```typescript
import { getCurrentUTC, getCurrentSeoulAsUTC } from '$lib/utils/date-handler'

// 현재 시간을 UTC로
const nowUTC = getCurrentUTC()

// 현재 서울 시간을 UTC로 변환
const nowSeoulUTC = getCurrentSeoulAsUTC()
```

### 4. 날짜 검증
```typescript
import { isValidDate, isValidDateRange } from '$lib/utils/date-handler'

// 날짜 유효성 검사
if (!isValidDate(userInput)) {
  throw new Error('유효하지 않은 날짜입니다.')
}

// 날짜 범위 검사
if (!isValidDateRange(startDate, endDate)) {
  throw new Error('시작일이 종료일보다 늦을 수 없습니다.')
}
```

## 🚫 금지사항

### 절대 사용하지 말 것
```typescript
// ❌ 직접 로컬 날짜 사용
new Date().toLocaleDateString()
new Date().toLocaleString()

// ❌ UTC 변환 없이 직접 사용
date.toISOString()

// ❌ 문자열을 직접 Date 생성자에 전달
new Date(dateString)

// ❌ 직접 timestamp 사용
Date.now()
```

### 올바른 방법
```typescript
// ✅ 표준 함수 사용
formatDateForDisplay(utcDate)
toUTC(userInput)
getCurrentUTC()
```

## 🔧 문제 해결

### 1. 시간대 오류
```typescript
// 문제: 시간이 9시간 차이남
// 원인: UTC와 로컬 시간 혼용

// 해결: 표준 함수 사용
const utcDate = toUTC(userInput)
const displayDate = formatDateForDisplay(utcDate)
```

### 2. 날짜 형식 오류
```typescript
// 문제: "Invalid Date" 오류
// 원인: 잘못된 날짜 형식

// 해결: 검증 후 변환
if (isValidDate(userInput)) {
  const utcDate = toUTC(userInput)
} else {
  throw new Error('올바른 날짜 형식을 입력해주세요.')
}
```

### 3. 데이터베이스 타입 오류
```typescript
// 문제: "Type 'Date' is not assignable to type 'string'"
// 원인: Date 객체를 직접 사용

// 해결: 문자열로 변환
const dateString = utcDate instanceof Date 
  ? utcDate.toISOString() 
  : String(utcDate)
```

## 📊 마이그레이션된 테이블

다음 테이블의 DATE 칼럼이 TIMESTAMP WITH TIME ZONE으로 변환되었습니다:

1. **transactions.date**
2. **employees.hire_date**
3. **leave_requests.start_date**
4. **leave_requests.end_date**
5. **projects.start_date**
6. **projects.end_date**
7. **reports.period_start**
8. **reports.period_end**
9. **leads.last_contact**
10. **sales_activities.date**
11. **sales_activities.next_action_date**
12. **customer_interactions.date**
13. **customer_interactions.next_action_date**
14. **contracts.start_date**
15. **contracts.end_date**
16. **contracts.renewal_date**

## 🧪 테스트

### 마이그레이션 후 테스트
```bash
# 1. 빌드 테스트
npm run build

# 2. 타입 체크
npm run check

# 3. 날짜 관련 기능 테스트
# - 직원 등록 (입사일)
# - 프로젝트 생성 (시작일/종료일)
# - 거래 등록 (거래일)
# - 휴가 신청 (시작일/종료일)
```

### 수동 테스트 시나리오
1. **입사일 입력**: 다양한 형식으로 입력해보기
2. **프로젝트 기간**: 시작일/종료일 검증
3. **시간대 변경**: 브라우저 시간대 변경 후 테스트
4. **날짜 표시**: 모든 화면에서 날짜가 올바르게 표시되는지 확인

## 📈 모니터링

### 로그 확인
```typescript
// 날짜 처리 오류는 자동으로 로깅됨
logger.error('Date processing error:', error, 'for input:', dateValue)
```

### 성능 모니터링
- 마이그레이션 후 쿼리 성능 확인
- 날짜 인덱스 사용률 모니터링
- 시간대 변환 오버헤드 측정

## 🔄 향후 개선사항

1. **다중 시간대 지원**: 사용자별 시간대 설정
2. **자동 마이그레이션**: 스키마 변경 시 자동 마이그레이션
3. **날짜 캐싱**: 자주 사용되는 날짜 변환 결과 캐싱
4. **성능 최적화**: 대용량 날짜 데이터 처리 최적화

---

## 📞 지원

날짜/시간 처리 관련 문제가 발생하면:

1. 이 가이드라인을 먼저 확인
2. `src/lib/utils/date-handler.ts`의 함수 사용
3. 로그에서 오류 메시지 확인
4. 필요시 개발팀에 문의

**이제 20번 반복되었던 날짜 문제가 근본적으로 해결되었습니다!** 🎉