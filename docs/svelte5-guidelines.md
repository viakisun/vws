# Svelte 5 개발 가이드라인

## 버전 정보
- **Svelte**: 5.25.0
- **SvelteKit**: 2.22.0
- **TypeScript**: 5.0.0

## Svelte 5 주요 변경사항

### 1. Runes 시스템
Svelte 5에서는 새로운 runes 시스템을 사용합니다:

```svelte
<script>
  // ❌ Svelte 4 방식 (사용하지 말 것)
  let count = 0;
  $: doubled = count * 2;
  
  // ✅ Svelte 5 방식
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>
```

### 2. 주요 Runes
- `$state()`: 반응형 상태
- `$derived()`: 파생된 값
- `$effect()`: 사이드 이펙트
- `$props()`: 컴포넌트 props
- `$bindable()`: 양방향 바인딩

### 3. 생명주기 변경
```svelte
<script>
  // ❌ Svelte 4 방식
  import { onMount } from 'svelte';
  onMount(() => {
    // 초기화 로직
  });
  
  // ✅ Svelte 5 방식
  $effect(() => {
    // 초기화 로직
  });
</script>
```

### 4. 이벤트 핸들러
```svelte
<!-- ❌ Svelte 4 방식 -->
<button onclick={handleClick}>Click me</button>

<!-- ✅ Svelte 5 방식 -->
<button onclick={handleClick}>Click me</button>
<!-- 또는 -->
<button onclick={() => handleClick()}>Click me</button>
```

## 개발 규칙

### 1. 타입 안전성
- 모든 변수에 명시적 타입 지정
- `any` 타입 사용 금지
- `unknown` 타입 사용 시 타입 가드 필수

### 2. 컴포넌트 구조
```svelte
<script lang="ts">
  // 1. 타입 정의
  interface Props {
    title: string;
    count?: number;
  }
  
  // 2. Props 정의
  let { title, count = 0 }: Props = $props();
  
  // 3. 상태 정의
  let isVisible = $state(true);
  
  // 4. 파생된 값
  let displayCount = $derived(count * 2);
  
  // 5. 사이드 이펙트
  $effect(() => {
    console.log('Count changed:', count);
  });
</script>

<!-- 6. 템플릿 -->
<div class="component">
  <h1>{title}</h1>
  <p>Count: {displayCount}</p>
</div>
```

### 3. 스토어 사용
```svelte
<script>
  // ❌ Svelte 4 방식
  import { writable } from 'svelte/store';
  const count = writable(0);
  
  // ✅ Svelte 5 방식 (가능한 경우)
  let count = $state(0);
  
  // 또는 전역 상태가 필요한 경우에만 스토어 사용
  import { countStore } from '$lib/stores';
</script>
```

### 4. 조건부 렌더링
```svelte
<!-- ✅ Svelte 5 방식 -->
{#if isVisible}
  <div>Visible content</div>
{/if}

<!-- 또는 -->
{@const shouldShow = count > 0}
{#if shouldShow}
  <div>Conditional content</div>
{/if}
```

### 5. 반복 렌더링
```svelte
<!-- ✅ Svelte 5 방식 -->
{#each items as item (item.id)}
  <div>{item.name}</div>
{/each}
```

## 디버깅 팁

### 1. 상태 디버깅
```svelte
<script>
  let count = $state(0);
  
  // 디버깅용
  $effect(() => {
    console.log('Count:', count);
  });
</script>
```

### 2. 타입 체크
```bash
# TypeScript 오류 확인
npm run check

# 실시간 타입 체크
npm run check:watch
```

### 3. 린트 검사
```bash
# ESLint 검사
npm run lint

# 자동 수정
npm run lint:fix
```

## 주의사항

1. **Svelte 4 문법 사용 금지**: `$:` 문법은 사용하지 말 것
2. **onMount 사용 금지**: `$effect` 사용
3. **스토어 남용 금지**: 로컬 상태는 `$state` 사용
4. **타입 안전성**: 모든 변수에 타입 지정
5. **성능 최적화**: 불필요한 반응성 방지

## 마이그레이션 체크리스트

- [ ] `let` 변수를 `$state()`로 변경
- [ ] `$:` 문법을 `$derived()`로 변경
- [ ] `onMount`를 `$effect()`로 변경
- [ ] props를 `$props()`로 변경
- [ ] 타입 정의 추가
- [ ] ESLint 오류 수정
- [ ] TypeScript 오류 수정

