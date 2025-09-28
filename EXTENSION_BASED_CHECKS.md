# 확장자별 검사 분리 전략

## 📊 현재 svelte-check 결과 분석

### 파일 확장자별 오류 분포

- **`.svelte` 파일**: 74개 오류
- **`.ts` 파일**: 28개 오류
- **총합**: 102개 오류

## 🎯 확장자별 검사 분리의 장점

### 1. 명확한 책임 분리

```bash
# Svelte 컴포넌트만 검사
npx svelte-check --tsconfig ./tsconfig.json | grep "\.svelte:"

# TypeScript 파일만 검사
npx tsc --noEmit
```

### 2. 검사 도구 최적화

- **`.svelte` 파일**: svelte-check (Svelte 컴포넌트 특화)
- **`.ts` 파일**: tsc (TypeScript 컴파일러)

### 3. 수정 우선순위 명확화

- **Svelte 오류**: UI/UX 관련 즉시 수정 필요
- **TypeScript 오류**: 타입 안전성 관련 점진적 수정

## 🔍 확장자별 오류 유형 분석

### .svelte 파일 오류 (74개)

**주요 문제**:

1. 반응형 함수 호출 오류
2. undefined 속성 접근
3. Snippet 타입 오류
4. 바인딩 표현식 오류

**수정 방법**:

```svelte
<!-- Before -->
{#each filteredData() as item}

<!-- After -->
{#each filteredData as item}
```

### .ts 파일 오류 (28개)

**주요 문제**:

1. any 타입 남용
2. null/undefined 불일치
3. 타입 변환 오류
4. 인터페이스 호환성

**수정 방법**:

```typescript
// Before
const data = response.data as any

// After
interface ApiResponse<T> {
  data: T
  success: boolean
}
const data = response.data as ApiResponse<User>
```

## 🛠️ 확장자별 검사 실행 방법

### 1. Svelte 파일만 검사

```bash
# svelte-check에서 .svelte 파일 오류만 추출
npx svelte-check --tsconfig ./tsconfig.json 2>&1 | grep "\.svelte:"
```

### 2. TypeScript 파일만 검사

```bash
# 순수 TypeScript 컴파일러 사용
npx tsc --noEmit
```

### 3. 결과 비교 및 분석

```bash
# Svelte 오류 수
SVELTE_ERRORS=$(npx svelte-check --tsconfig ./tsconfig.json 2>&1 | grep "\.svelte:" | wc -l)

# TypeScript 오류 수
TS_ERRORS=$(npx tsc --noEmit 2>&1 | grep "error TS" | wc -l)

echo "Svelte 오류: $SVELTE_ERRORS개"
echo "TypeScript 오류: $TS_ERRORS개"
```

## 📋 확장자별 수정 계획

### Phase 1: .svelte 파일 수정 (74개 오류)

**목표**: Svelte 컴포넌트 동작 안정화

**우선순위**:

1. **+page.svelte 파일들** (약 50개)
   - 반응형 함수 호출 수정
   - undefined 속성 접근 수정

2. **컴포넌트 파일들** (약 24개)
   - EmployeeModal.svelte
   - SalaryContracts.svelte
   - UI 컴포넌트들

### Phase 2: .ts 파일 수정 (28개 오류)

**목표**: 타입 안전성 및 코드 품질 개선

**우선순위**:

1. **타입 정의 파일들** (15개)
2. **유틸리티 함수들** (8개)
3. **스토어 파일들** (5개)

## 🔄 수정 순서 최적화

### 1. .svelte 파일 우선 수정 이유

- **즉시 효과**: UI 컴포넌트 동작 개선
- **사용자 경험**: 런타임 오류 방지
- **개발 효율**: 컴포넌트 개발 시 즉시 피드백

### 2. .ts 파일 후속 수정 이유

- **타입 안전성**: 장기적 코드 품질
- **리팩토링**: 기존 코드 개선
- **유지보수성**: 향후 개발 효율성

## 📈 예상 효과

### 단기 효과 (.svelte 수정 후)

- UI 컴포넌트 오류 90% 감소
- 개발자 경험 개선
- 런타임 오류 방지

### 장기 효과 (.ts 수정 후)

- 타입 안전성 100% 달성
- 코드 품질 전반적 개선
- 유지보수성 향상

## 🎯 구체적 실행 계획

### 1. .svelte 파일 오류 수정

```bash
# 현재 .svelte 파일 오류 확인
npx svelte-check --tsconfig ./tsconfig.json 2>&1 | grep "\.svelte:" | head -10

# 파일별 오류 수 집계
npx svelte-check --tsconfig ./tsconfig.json 2>&1 | grep "\.svelte:" | sed 's|.*/||' | cut -d: -f1 | sort | uniq -c | sort -nr
```

### 2. .ts 파일 오류 수정

```bash
# TypeScript 오류 확인
npx tsc --noEmit 2>&1 | head -10

# 파일별 오류 수 집계
npx tsc --noEmit 2>&1 | grep "error TS" | sed 's|.*/||' | cut -d: -f1 | sort | uniq -c | sort -nr
```

## 🎯 결론

**확장자별 검사 분리는 매우 효과적입니다:**

1. **명확한 책임 분리**: 각 파일 타입의 고유 문제만 집중
2. **검사 도구 최적화**: svelte-check vs tsc의 장점 활용
3. **수정 효율성**: 중복 작업 제거 및 우선순위 명확화
4. **점진적 개선**: 단계별로 안정적인 코드 품질 향상

---

**다음 단계**: .svelte 파일 오류부터 순차적으로 수정 시작
