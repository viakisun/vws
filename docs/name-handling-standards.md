# 이름 처리 표준 가이드라인

## 🎯 목적

모든 이름 처리를 일관된 방식으로 표준화하여 사용자 경험을 향상시키고 개발 효율성을 높입니다.

## 📋 표준 형식

### 한국 이름

- **형식**: `(성)(이름)` - 공백 없음
- **예시**: `차지은`, `이지후`, `김성호`
- **금지**: `지은 차`, `차 지은` (공백 포함)

### 영문 이름

- **형식**: `(First) (Last)` - 공백 있음
- **예시**: `John Doe`, `Jane Smith`

## 🛠️ 권장 함수 사용법

### 1. 직원 객체에서 이름 표시

```typescript
import { formatEmployeeName } from '$lib/utils/format'

// ✅ 올바른 사용법
const displayName = formatEmployeeName(employee)

// ❌ 잘못된 사용법
const displayName = `${employee.first_name} ${employee.last_name}`
const displayName = employee.first_name + ' ' + employee.last_name
```

### 2. 전체 이름 표준화

```typescript
import { formatKoreanNameStandard } from '$lib/utils/korean-name'

// ✅ 올바른 사용법
const standardName = formatKoreanNameStandard(fullName)

// ❌ 잘못된 사용법
const standardName = fullName.replace(' ', '')
```

### 3. 타입 안전한 이름 생성

```typescript
import { createStandardEmployeeName, createStandardFullName } from '$lib/utils/name-validation'

// ✅ 타입 안전한 사용법
const employeeName = createStandardEmployeeName(employee)
const fullName = createStandardFullName('지은 차')
```

## 🔍 검증 도구

### ESLint 규칙

- 금지된 이름 조합 패턴 자동 검출
- 공백을 포함한 한국 이름 패턴 검출

### Pre-commit Hook

- 커밋 전 자동 검증
- 표준 위반 시 커밋 차단

### 런타임 검증

```typescript
import { enforceStandardName } from '$lib/utils/name-validation'

// 개발 모드에서 자동 검증
const name = enforceStandardName(userInput, '사용자 입력')
```

## 📝 API 개발 가이드라인

### 데이터베이스 쿼리

```sql
-- ✅ 올바른 쿼리
SELECT CONCAT(e.last_name, e.first_name) as employee_name

-- ❌ 잘못된 쿼리
SELECT e.first_name || ' ' || e.last_name as employee_name
```

### API 응답

```typescript
// ✅ 올바른 응답
return {
  employeeName: formatEmployeeName(employee),
  assigneeName: formatKoreanNameStandard(assignee.full_name)
}

// ❌ 잘못된 응답
return {
  employeeName: `${employee.first_name} ${employee.last_name}`,
  assigneeName: assignee.full_name
}
```

## 🚨 금지 패턴

### 1. 직접 문자열 결합

```typescript
// ❌ 금지
const name = first_name + ' ' + last_name
const name = `${first_name} ${last_name}`
const name = first_name.concat(' ', last_name)
```

### 2. 원시 필드 직접 사용

```typescript
// ❌ 금지
const name = employee.first_name
const name = employee.name // DB에서 온 원시 데이터
```

### 3. 공백을 포함한 한국 이름

```typescript
// ❌ 금지
const name = '지은 차'
const name = '차 지은'

// ✅ 권장
const name = '차지은'
```

## 🔧 마이그레이션 가이드

### 기존 코드 수정

1. **직접 문자열 결합 제거**

   ```typescript
   // Before
   const name = `${member.first_name} ${member.last_name}`

   // After
   const name = formatEmployeeName(member)
   ```

2. **데이터베이스 쿼리 수정**

   ```sql
   -- Before
   SELECT first_name || ' ' || last_name as name

   -- After
   SELECT CONCAT(last_name, first_name) as name
   ```

3. **API 응답 수정**

   ```typescript
   // Before
   return { name: `${employee.first_name} ${employee.last_name}` }

   // After
   return { name: formatEmployeeName(employee) }
   ```

## 🎯 검증 체크리스트

- [ ] ESLint 규칙 통과
- [ ] Pre-commit hook 통과
- [ ] 모든 이름 표시가 표준 함수 사용
- [ ] 데이터베이스 쿼리가 표준 형식
- [ ] API 응답이 표준 형식
- [ ] 한국 이름에 공백 없음
- [ ] 영문 이름에 공백 있음

## 📞 지원

표준 관련 문의나 문제가 있을 경우:

1. ESLint 에러 메시지 확인
2. Pre-commit hook 메시지 확인
3. `src/lib/utils/name-validation.ts` 참조
4. 개발팀에 문의
