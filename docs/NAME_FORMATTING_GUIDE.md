# 이름 포맷팅 가이드 (Name Formatting Guide)

## 🎯 목적

한국 이름과 영문 이름을 일관되게 포맷팅하여 "기선 박" 같은 잘못된 표시를 방지합니다.

## ✅ 올바른 사용법

### Frontend (TypeScript/Svelte)

```typescript
import { formatKoreanName } from '$lib/utils/korean-name'

// ✅ GOOD
const name = formatKoreanName(employee.last_name, employee.first_name)
// "박" + "기선" → "박기선"

// ❌ BAD - 절대 사용 금지
const name = `${employee.first_name} ${employee.last_name}` // "기선 박"
const name = employee.first_name + ' ' + employee.last_name // "기선 박"
```

### Backend (SQL)

```sql
-- ✅ GOOD: CASE 문으로 한국 이름 판별
SELECT
  CASE
    WHEN e.first_name ~ '^[가-힣]+$' AND e.last_name ~ '^[가-힣]+$' THEN
      e.last_name || e.first_name  -- "박기선"
    ELSE
      e.first_name || ' ' || e.last_name  -- "John Doe"
  END as employee_name
FROM employees e;

-- 🚀 BEST: PostgreSQL 함수 사용 (마이그레이션 030 필요)
SELECT
  format_korean_name(e.last_name, e.first_name) as employee_name
FROM employees e;

-- ❌ BAD - 절대 사용 금지
SELECT e.first_name || ' ' || e.last_name as employee_name  -- "기선 박"
```

## 🛡️ 다층 방어 시스템

### 1단계: PostgreSQL 함수 (가장 강력)

```sql
-- migrations/030_create_korean_name_function.sql
CREATE FUNCTION format_korean_name(p_last_name TEXT, p_first_name TEXT)
RETURNS TEXT;
```

**장점**:

- 모든 SQL 쿼리에서 일관성 보장
- DB 레벨에서 강제
- 성능 최적화 가능

**사용법**:

```sql
SELECT format_korean_name(last_name, first_name) as name FROM employees;
```

### 2단계: TypeScript Type Guard (컴파일 타임)

```typescript
import { FormattedName, assertFormattedName } from '$lib/types/formatted-name'

// Branded Type으로 강제
function displayName(name: FormattedName) {
  console.log(name)
}

// ✅ OK
displayName(formatKoreanName('박', '기선'))

// ❌ Type Error
displayName('기선 박')
```

### 3단계: Runtime Validator (개발 환경)

```typescript
import { validateEmployeeList } from '$lib/types/formatted-name'

// 개발 환경에서 자동으로 콘솔에 경고 출력
validateEmployeeList(employees, 'ComponentName')
```

**출력 예시**:

```
[Name Format Warning] ComponentName
2명의 직원 이름이 잘못된 포맷입니다:
1. "기선 박"
2. "영희 김"
formatKoreanName(last_name, first_name)을 사용하세요.
```

### 4단계: ESLint Rule (코드 작성 시)

```javascript
// eslint-rules/no-direct-name-concatenation.js
// 잘못된 패턴을 작성 시점에 감지

// ❌ ESLint Error
const name = first_name + ' ' + last_name
const name = `${first_name} ${last_name}`
```

## 🔍 잘못된 패턴 찾기

### 방법 1: SQL View 사용

```sql
-- 잘못 포맷된 이름 자동 감지
SELECT * FROM v_invalid_korean_names;
```

### 방법 2: grep으로 검색

```bash
# JavaScript/TypeScript에서 잘못된 패턴 찾기
grep -r "first_name.*\+.*last_name" src/
grep -r "\${.*first_name.*}.*\${.*last_name.*}" src/

# SQL에서 잘못된 패턴 찾기
grep -r "first_name || ' ' || last_name" src/routes/api/
```

### 방법 3: 개발 환경 콘솔 모니터링

브라우저 콘솔에서 `[Name Format Warning]` 또는 `[Name Format Error]` 검색

## 📋 체크리스트

새로운 코드를 작성할 때:

- [ ] 직원 이름을 표시하는가?
- [ ] `formatKoreanName(last_name, first_name)` 사용
- [ ] SQL에서는 `CASE` 문 또는 `format_korean_name()` 함수 사용
- [ ] `first_name + last_name` 패턴 절대 사용 금지
- [ ] 개발 환경에서 콘솔 경고 확인

## 🤖 AI 프롬프트에 포함할 지침

AI에게 코드 생성을 요청할 때 다음을 포함하세요:

```
**중요**: 직원 이름을 표시할 때 반드시:
1. TypeScript: `formatKoreanName(last_name, first_name)` 사용
2. SQL: CASE 문으로 한국 이름 판별하여 `last_name || first_name` 또는 `format_korean_name()` 함수 사용
3. `first_name + ' ' + last_name` 패턴 절대 사용 금지
4. 한국 이름은 "성+이름" (띄어쓰기 없음), 영문은 "이름 성" (띄어쓰기)
```

## 🚨 일반적인 실수

### ❌ 실수 1: 직접 결합

```typescript
const name = `${employee.first_name} ${employee.last_name}` // "기선 박"
```

### ✅ 수정

```typescript
const name = formatKoreanName(employee.last_name, employee.first_name) // "박기선"
```

### ❌ 실수 2: SQL에서 무조건 띄어쓰기

```sql
SELECT first_name || ' ' || last_name as name  -- "기선 박"
```

### ✅ 수정

```sql
SELECT
  CASE
    WHEN first_name ~ '^[가-힣]+$' AND last_name ~ '^[가-힣]+$'
    THEN last_name || first_name
    ELSE first_name || ' ' || last_name
  END as name
```

### ❌ 실수 3: API에서 포맷 없이 반환

```typescript
// API Response
{
  first_name: "기선",
  last_name: "박"
  // formatted_name 없음!
}
```

### ✅ 수정

```typescript
// API Response
{
  first_name: "기선",
  last_name: "박",
  formatted_name: "박기선"  // 항상 포함
}
```

## 📚 참고

- `src/lib/utils/korean-name.ts` - 이름 포맷팅 유틸리티
- `src/lib/types/formatted-name.ts` - 타입 시스템
- `src/lib/hooks/employee/useActiveEmployees.svelte.ts` - 자동 포맷팅 + 검증
- `migrations/030_create_korean_name_function.sql` - PostgreSQL 함수

## 🔄 마이그레이션

기존 코드를 수정할 때:

1. **검색**: `grep -r "first_name.*last_name" .`
2. **확인**: 각 사용처가 올바른 포맷을 사용하는지 점검
3. **수정**: `formatKoreanName()` 또는 SQL `CASE` 문으로 변경
4. **테스트**: 개발 환경에서 콘솔 경고 확인
5. **커밋**: 변경 사항 커밋 및 PR

## 💡 팁

- **개발 중**: 콘솔을 열어두고 `[Name Format]` 경고 모니터링
- **코드 리뷰**: "이름 포맷팅" 체크리스트 확인
- **CI/CD**: (향후) ESLint 규칙을 CI에 추가하여 자동 검증
- **AI 작업**: 프롬프트에 위 지침 포함
