# 중앙화된 라우트 관리 시스템 사용 가이드

## 📋 개요

모든 라우트와 권한 설정을 `src/lib/config/routes.ts`에서 중앙 관리합니다.

## 🎯 주요 기능

### 1. Routes Enum
```typescript
import { Routes } from '$lib/config/routes'

// ✅ 타입 안전한 라우트 사용
<a href={Routes.PLANNER}>Planner</a>
<a href={Routes.SALARY}>급여관리</a>

// ❌ 하드코딩된 문자열 (권장하지 않음)
<a href="/planner">Planner</a>
```

### 2. buildRoute - 동적 파라미터 바인딩
```typescript
import { Routes, buildRoute } from '$lib/config/routes'

// 프로젝트 상세 페이지로 이동
const projectId = 123
const url = buildRoute(Routes.PROJECT_DETAIL, { id: projectId })
// → '/project-management/projects/123'

// Planner 제품 상세
const productUrl = buildRoute(Routes.PLANNER_PRODUCT_DETAIL, { id: 'PROD-001' })
// → '/planner/products/PROD-001'
```

### 3. 권한 자동 체크

권한은 `ROUTE_PERMISSIONS`에 정의하면 자동으로 적용됩니다.

```typescript
// routes.ts에서 정의
export const ROUTE_PERMISSIONS: Record<string, RoutePermission> = {
  [Routes.SALARY]: {
    resource: Resource.SALARY_MANAGEMENT,
    action: 'read',
    fallback: Routes.UNAUTHORIZED,
  },
}
```

사이드바에서 자동으로 권한 체크되어 메뉴가 표시/숨김 처리됩니다.

## 📝 사용 예제

### 컴포넌트에서 라우트 사용

```svelte
<script lang="ts">
  import { Routes, buildRoute } from '$lib/config/routes'
  
  let productId = $state('PROD-001')
</script>

<!-- 정적 라우트 -->
<a href={Routes.PLANNER_PRODUCTS}>제품 목록</a>

<!-- 동적 라우트 -->
<a href={buildRoute(Routes.PLANNER_PRODUCT_DETAIL, { id: productId })}>
  제품 상세
</a>

<!-- 버튼 클릭 시 이동 -->
<button onclick={() => goto(Routes.DASHBOARD)}>
  대시보드로 이동
</button>
```

### 프로그래밍 방식으로 이동

```typescript
import { goto } from '$app/navigation'
import { Routes, buildRoute } from '$lib/config/routes'

// 정적 페이지로 이동
async function goToDashboard() {
  await goto(Routes.DASHBOARD)
}

// 동적 페이지로 이동
async function goToProject(projectId: number) {
  await goto(buildRoute(Routes.PROJECT_DETAIL, { id: projectId }))
}

// 조건부 이동
async function handleSuccess() {
  if (hasPermission) {
    await goto(Routes.ADMIN_PERMISSIONS)
  } else {
    await goto(Routes.UNAUTHORIZED)
  }
}
```

### 현재 페이지 체크

```typescript
import { page } from '$app/stores'
import { Routes, matchRoute, isInSection } from '$lib/config/routes'

// 정확히 일치하는지 체크
const isProjectDetail = $derived(
  matchRoute($page.url.pathname, Routes.PROJECT_DETAIL)
)

// 섹션에 속하는지 체크
const isInPlanner = $derived(
  isInSection($page.url.pathname, Routes.PLANNER)
)

// 사용 예
{#if isInPlanner}
  <PlannerToolbar />
{/if}
```

## 🔧 새로운 라우트 추가하기

### Step 1: Routes Enum에 추가

```typescript
// src/lib/config/routes.ts
export enum Routes {
  // ... 기존 라우트들
  
  // 새로운 라우트 추가
  ATTENDANCE = '/attendance',
  ATTENDANCE_DETAIL = '/attendance/:employeeId',
}
```

### Step 2: 권한 설정 (필요한 경우)

```typescript
export const ROUTE_PERMISSIONS: Record<string, RoutePermission> = {
  // ... 기존 권한들
  
  [Routes.ATTENDANCE]: {
    resource: Resource.HR_ATTENDANCE,
    action: 'read',
    fallback: Routes.UNAUTHORIZED,
  },
}
```

### Step 3: 사이드바 메뉴 추가 (필요한 경우)

```typescript
export const NAVIGATION_MENU: NavItem[] = [
  // ... 기존 메뉴들
  
  {
    key: 'attendance',
    name: '출퇴근 관리',
    route: Routes.ATTENDANCE,
    permission: ROUTE_PERMISSIONS[Routes.ATTENDANCE],
  },
]
```

### Step 4: Sidebar에 아이콘 추가

```typescript
// src/lib/components/layout/Sidebar.svelte
import { ClockIcon } from '@lucide/svelte'

const iconMap: Record<string, any> = {
  // ... 기존 아이콘들
  attendance: ClockIcon,
}
```

완료! 이제 자동으로:
- ✅ 사이드바에 메뉴 표시
- ✅ 권한에 따라 자동 필터링
- ✅ 타입 안전한 라우트 사용 가능

## 🎨 고급 사용법

### 하위 메뉴 (서브 네비게이션)

```typescript
export const NAVIGATION_MENU: NavItem[] = [
  {
    key: 'hr',
    name: '인사관리',
    route: Routes.HR,
    permission: ROUTE_PERMISSIONS[Routes.HR],
    children: [
      {
        key: 'hr-employees',
        name: '직원 관리',
        route: Routes.HR_EMPLOYEES,
        permission: ROUTE_PERMISSIONS[Routes.HR_EMPLOYEES],
      },
      {
        key: 'hr-attendance',
        name: '출퇴근 관리',
        route: Routes.HR_ATTENDANCE,
        permission: ROUTE_PERMISSIONS[Routes.HR_ATTENDANCE],
      },
    ],
  },
]
```

### 배지 표시 (알림 수 등)

```typescript
{
  key: 'messages',
  name: '메시지',
  route: Routes.MESSAGES,
  badge: () => unreadMessageCount, // 함수로 동적 값 반환
}
```

### 복합 권한 (리소스 + 역할)

```typescript
[Routes.SALARY]: {
  resource: Resource.SALARY_MANAGEMENT,
  roles: [RoleCode.HR_MANAGER, RoleCode.ADMIN],
  requireAll: false, // 하나라도 만족하면 OK
  fallback: Routes.UNAUTHORIZED,
}
```

## 🚀 마이그레이션 가이드

### 기존 코드 변환

#### Before (하드코딩)
```svelte
<a href="/planner/products">제품 목록</a>
<a href="/planner/products/{productId}">제품 상세</a>
```

#### After (중앙화)
```svelte
<script>
  import { Routes, buildRoute } from '$lib/config/routes'
</script>

<a href={Routes.PLANNER_PRODUCTS}>제품 목록</a>
<a href={buildRoute(Routes.PLANNER_PRODUCT_DETAIL, { id: productId })}>
  제품 상세
</a>
```

## 💡 베스트 프랙티스

1. **항상 Routes Enum 사용**: 하드코딩된 문자열 대신 enum 사용
2. **권한은 routes.ts에서 정의**: 중복 없이 한 곳에서 관리
3. **동적 라우트는 buildRoute 사용**: 타입 안전성 보장
4. **메뉴 순서는 NAVIGATION_MENU에서 제어**: 한 곳에서 순서 관리

## 🔍 트러블슈팅

### Q: 새 메뉴가 표시되지 않아요
A: 권한 설정을 확인하세요. `permission` 속성이 있으면 해당 권한이 필요합니다.

### Q: 타입 에러가 발생해요
A: Routes enum에 해당 경로가 정의되어 있는지 확인하세요.

### Q: 동적 라우트에서 파라미터가 안 들어가요
A: `buildRoute()`를 사용하고, enum에 `:paramName` 형태로 정의되어 있는지 확인하세요.

## 📚 관련 파일

- `src/lib/config/routes.ts` - 라우트 정의 및 권한 설정
- `src/lib/components/layout/Sidebar.svelte` - 사이드바 메뉴 렌더링
- `src/lib/stores/permissions.ts` - 권한 체크 로직
- `src/hooks.server.ts` - 서버사이드 권한 체크
