# 반응성 패턴 가이드라인

## 🚫 절대 사용하지 말 것

### 금지된 패턴들

```typescript
// ❌ 복잡한 $effect
$effect(() => {
  ;(transactions, searchTerm, selectedAccount, selectedCategory, selectedType, dateFrom, dateTo)
  updateFilteredData()
})

// ❌ 템플릿에서 함수 호출
{#each filteredTransactions() as transaction}

// ❌ 복잡한 $derived
let filteredData = $derived(() => {
  return data.filter(...).map(...).reduce(...)
})
```

## ✅ 반드시 사용할 것

### 권장 패턴들

```typescript
// ✅ 이벤트 기반 업데이트
function handleFilterChange() {
  updateFilteredData()
}

// ✅ 명시적 상태 관리
let filteredData = $state([])
let totalAmount = $state(0)

// ✅ 템플릿에서 변수 직접 접근
{#each filteredData as item}
```

## 🔧 자동 수정 도구 사용 시 주의사항

### ESLint auto-fix 사용 금지

- 반응성 관련 에러는 수동으로 수정
- `$effect` 제안 시 무시하고 이벤트 기반으로 변경

### svelte-check 제안 무시

- "반응성" 키워드가 나오면 이벤트 기반 검토
- 복잡한 의존성 제안 시 단순화

### Prettier 설정

- 반응성 코드는 수동 포맷팅
- 자동 정렬로 의도와 다른 구조 생성 방지
