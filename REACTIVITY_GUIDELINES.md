# 반응성 패턴 가이드라인 (Svelte 5)

## 📋 케이스별 패턴 가이드

### 1️⃣ 사용자 입력 및 필터링

#### ❌ 피해야 할 패턴

```typescript
// 다중 의존성을 가진 복잡한 $effect (성능 및 디버깅 문제)
$effect(() => {
  ;(transactions, searchTerm, selectedAccount, selectedCategory, selectedType, dateFrom, dateTo)
  updateFilteredData()
})
```

#### ✅ 권장 패턴

```typescript
// 이벤트 기반 명시적 업데이트
function handleFilterChange() {
  updateFilteredData()
}

// 또는 단순한 $derived (계산만 하는 경우)
let filteredData = $derived.by(() => {
  return transactions.filter((t) => t.description.includes(searchTerm))
})
```

**이유**: 사용자 액션은 이벤트가 명확하므로 이벤트 핸들러 사용이 적절

---

### 2️⃣ Props → State 동기화 (컴포넌트 초기화)

#### ✅ 권장 패턴

```typescript
// Props가 변경될 때 내부 상태 초기화
let initialized = $state(false)

$effect(() => {
  if (propsData && !initialized) {
    internalState = transformPropsToState(propsData)
    initialized = true
  }
})
```

**이유**: Props 변경은 외부에서 제어되므로 이벤트로 처리 불가. `$effect` 사용이 적절

#### ⚠️ 주의사항

- 무한 루프 방지를 위해 `initialized` 플래그 사용
- 의존성을 명확히 하고 조건을 단순하게 유지

---

### 3️⃣ 복잡한 계산 (Derived State)

#### ❌ 피해야 할 패턴

```typescript
// 템플릿에서 함수 호출 (매 렌더링마다 실행)
{#each filteredTransactions() as transaction}

// 너무 복잡한 계산
let result = $derived(() => {
  return data.filter(...).map(...).reduce(...).sort(...).slice(...)
})
```

#### ✅ 권장 패턴

```typescript
// 단순한 $derived.by (한 단계 변환)
let filtered = $derived.by(() => data.filter((d) => d.active))

// 또는 여러 단계로 분리
let activeItems = $derived.by(() => items.filter((i) => i.active))
let sortedItems = $derived.by(() => [...activeItems].sort((a, b) => a.name.localeCompare(b.name)))
```

**이유**: 복잡한 계산은 디버깅이 어렵고 성능 문제 발생 가능

---

### 4️⃣ 템플릿 렌더링

#### ❌ 피해야 할 패턴

```typescript
// 함수 호출 (매번 재계산)
{#each getFilteredData() as item}
```

#### ✅ 권장 패턴

```typescript
// 변수 직접 사용 (자동 반응성)
let filteredData = $state([])
{#each filteredData as item}
```

**이유**: Svelte가 변수 변경을 자동 추적하므로 함수 호출 불필요

---

### 5️⃣ API 데이터 로딩

#### ✅ 권장 패턴

```typescript
// onMount에서 초기 로딩
onMount(async () => {
  await loadData()
})

// 또는 특정 이벤트에서 로딩
function handleRefresh() {
  loadData()
}
```

**이유**: 데이터 로딩은 명시적인 트리거가 있어야 예측 가능

---

## 🎯 패턴 선택 가이드

### $effect 사용이 적절한 경우

- ✅ Props → State 동기화 (초기화)
- ✅ 외부 라이브러리와의 통합
- ✅ DOM 조작이 필요한 경우
- ✅ 브라우저 API 사용 (localStorage, WebSocket 등)

### $effect를 피해야 하는 경우

- ❌ 사용자 입력 처리 → 이벤트 핸들러 사용
- ❌ 단순 계산 → `$derived` 사용
- ❌ 여러 state 변수 추적 → 각각 개별 처리

### 의사결정 플로우차트

```
데이터가 변경되었을 때 처리가 필요한가?
  ↓
사용자 액션에 의한 것인가?
  → YES: 이벤트 핸들러 사용 ✅
  → NO: ↓

Props 변경에 의한 것인가?
  → YES: $effect 사용 (초기화 플래그 필요) ✅
  → NO: ↓

단순 계산/변환인가?
  → YES: $derived 사용 ✅
  → NO: 상황 재검토 필요
```

---

## 🔧 자동 수정 도구 사용 시 주의사항

### ESLint auto-fix

- 반응성 관련 에러는 **위 가이드를 먼저 확인** 후 수동 수정
- 자동 제안을 맹목적으로 따르지 말 것

### svelte-check

- 경고 메시지보다 **실제 사용 케이스**를 우선 고려
- 복잡한 의존성 제안 시 단순화 검토

---

## 📌 핵심 원칙

1. **명확성**: 코드를 읽는 사람이 데이터 흐름을 쉽게 이해할 수 있어야 함
2. **단순성**: 한 가지 일만 하는 작은 단위로 분리
3. **예측 가능성**: 언제 업데이트되는지 명확해야 함
4. **성능**: 불필요한 재계산 방지

**상황에 맞는 적절한 도구를 선택하되, 복잡성은 최소화할 것**
