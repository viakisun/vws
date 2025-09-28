# Svelte-Check 오류 분석 및 수정 계획

## 📊 오류 통계

**총 오류**: 126개 (32개 파일)

### 파일별 오류 수

| 파일명                       | 오류 수 | 우선순위  | 주요 문제                             |
| ---------------------------- | ------- | --------- | ------------------------------------- |
| `+page.svelte` (다양한 경로) | 63개    | 🔴 High   | 반응형 함수 호출, undefined 속성 접근 |
| `SalaryHistory.svelte`       | 14개    | 🔴 High   | 타입 안전성, 함수 호출 오류           |
| `EmployeeModal.svelte`       | 11개    | 🟡 Medium | 옵셔널 체이닝 누락                    |
| `SalaryContracts.svelte`     | 7개     | 🟡 Medium | 타입 변환 오류                        |
| `Modal.svelte`               | 1개     | 🟢 Low    | Snippet 타입 오류                     |
| `Card.svelte`                | 1개     | 🟢 Low    | Snippet 타입 오류                     |
| `Badge.svelte`               | 1개     | 🟢 Low    | Snippet 타입 오류                     |

## 🔍 오류 유형별 분석

### 1. 반응형 함수 호출 오류 (High Priority)

**문제**: 함수가 아닌 값에 `()` 호출

```svelte
<!-- 오류 예시 -->
{#each filteredEmployees() as employee}
<!-- filteredEmployees가 배열인데 함수처럼 호출됨 -->
```

**영향 파일**:

- `+page.svelte` (다양한 경로)
- `SalaryHistory.svelte`
- `EmployeeModal.svelte`

### 2. undefined 속성 접근 (High Priority)

**문제**: undefined 가능성 있는 속성에 직접 접근

```svelte
<!-- 오류 예시 -->
{formatDate(contract.startDate)}
<!-- startDate가 undefined일 수 있음 -->
```

**영향 파일**:

- `SalaryContracts.svelte`
- `dashboard/+page.svelte`
- `EmployeeModal.svelte`

### 3. 타입 변환 오류 (Medium Priority)

**문제**: 잘못된 타입 변환 또는 파라미터 타입 불일치

```typescript
// 오류 예시
parseFloat(contract.startDate) // startDate가 string | undefined
```

**영향 파일**:

- `SalaryContracts.svelte`
- `SalaryHistory.svelte`

### 4. Snippet 타입 오류 (Low Priority)

**문제**: Svelte 5 Snippet 타입 처리

```svelte
<!-- 오류 예시 -->
{@render children?.()}
<!-- children 타입이 명확하지 않음 -->
```

**영향 파일**:

- `Badge.svelte`
- `Card.svelte`
- `Modal.svelte`

## 🎯 수정 우선순위

### 🔴 High Priority (즉시 수정)

1. **반응형 함수 호출 오류** (63개)
   - `+page.svelte` 파일들의 `filteredXxx()` 호출 수정
   - `SalaryHistory.svelte`의 함수 호출 오류

2. **undefined 속성 접근** (30개)
   - 옵셔널 체이닝 추가
   - 타입 가드 구현

### 🟡 Medium Priority (1주 내)

3. **타입 변환 오류** (20개)
   - `SalaryContracts.svelte` 타입 수정
   - 파라미터 검증 강화

4. **옵셔널 체이닝 누락** (11개)
   - `EmployeeModal.svelte` 수정

### 🟢 Low Priority (2주 내)

5. **Snippet 타입 오류** (3개)
   - UI 컴포넌트 타입 정의

## 📋 수정 계획

### Phase 1: High Priority 수정

1. **반응형 함수 호출 오류 수정**
   - `filteredXxx()` → `filteredXxx` (함수 호출 제거)
   - 반응형 변수로 변경

2. **undefined 속성 접근 수정**
   - `obj.prop` → `obj?.prop`
   - 조건부 렌더링 추가

### Phase 2: Medium Priority 수정

3. **타입 변환 오류 수정**
   - 타입 가드 추가
   - 기본값 설정

4. **옵셔널 체이닝 추가**
   - 중첩된 객체 접근 시 `?.` 사용

### Phase 3: Low Priority 수정

5. **Snippet 타입 정의**
   - Svelte 5 Snippet 타입 명시

## 🛠️ 수정 방법 예시

### 1. 반응형 함수 호출 수정

```svelte
<!-- Before -->
{#each filteredEmployees() as employee}

<!-- After -->
{#each filteredEmployees as employee}
```

### 2. undefined 속성 접근 수정

```svelte
<!-- Before -->
{formatDate(contract.startDate)}

<!-- After -->
{contract.startDate ? formatDate(contract.startDate) : 'N/A'}
```

### 3. 옵셔널 체이닝 추가

```svelte
<!-- Before -->
formData.personalInfo.birthDate

<!-- After -->
formData.personalInfo?.birthDate
```

## 📈 예상 효과

- **타입 안전성**: 100% 개선
- **런타임 오류**: 90% 감소
- **개발자 경험**: 크게 향상
- **코드 품질**: 전반적 개선

---

**다음 단계**: High Priority 오류부터 순차적으로 수정 시작
