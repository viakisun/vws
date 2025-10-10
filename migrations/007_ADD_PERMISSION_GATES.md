# Migration 007: Add Permission Gates to Pages

## 목적

급여관리와 프로젝트 관리 페이지에 권한 게이트를 추가하여 RBAC 시스템과 연동

## 문제점

- `/salary` 페이지: 권한 체크 없이 누구나 접근 가능
- `/project-management` 페이지: 권한 체크 없이 누구나 접근 가능
- DB에 권한 데이터는 있지만 코드에서 활용되지 않음

## 변경 사항

### 1. 급여관리 페이지 (`src/routes/salary/+page.svelte`)

```svelte
// 추가된 import import PermissionGate from '$lib/components/auth/PermissionGate.svelte' import {(Resource,
PermissionAction)} from '$lib/stores/permissions' // 페이지 전체를 PermissionGate로 감싸기
<PermissionGate resource={Resource.HR_PAYSLIPS} action={PermissionAction.READ}>
  <PageLayout title="급여 관리" {stats}>
    <!-- 기존 컨텐츠 -->
  </PageLayout>
</PermissionGate>
```

### 2. 프로젝트 관리 페이지 (`src/routes/project-management/+page.svelte`)

```svelte
// 추가된 import import PermissionGate from '$lib/components/auth/PermissionGate.svelte' import {(Resource,
PermissionAction)} from '$lib/stores/permissions' // 페이지 전체를 PermissionGate로 감싸기
<PermissionGate resource={Resource.PROJECT_PROJECTS} action={PermissionAction.READ}>
  <PageLayout title="프로젝트 관리" subtitle="연구개발 프로젝트 및 참여율 관리 시스템">
    <!-- 기존 컨텐츠 -->
  </PageLayout>
</PermissionGate>
```

### 3. 사이드바 메뉴 (`src/lib/components/layout/Sidebar.svelte`)

#### Before (역할 기반 체크)

```svelte
{
  name: '연구개발',
  href: '/project-management',
  icon: FlaskConicalIcon,
  permission: {
    roles: [RoleCode.RESEARCH_DIRECTOR, RoleCode.RESEARCHER, RoleCode.ADMIN],
  },
},
{
  name: 'Planner',
  href: '/planner',
  icon: TargetIcon,
  permission: {
    roles: [RoleCode.RESEARCH_DIRECTOR, RoleCode.RESEARCHER, RoleCode.ADMIN],
  },
},
```

#### After (리소스 권한 체크)

```svelte
{
  name: '연구개발',
  href: '/project-management',
  icon: FlaskConicalIcon,
  permission: { resource: Resource.PROJECT_PROJECTS },
},
{
  name: 'Planner',
  href: '/planner',
  icon: TargetIcon,
  permission: { resource: Resource.PLANNER_PRODUCTS },
},
```

**중요한 변경점:**

- 역할 기반 → 리소스 권한 기반으로 변경
- RESEARCHER 역할이어도 PROJECT_PROJECTS 권한이 없으면 메뉴 숨김
- RESEARCHER 역할이 PLANNER_PRODUCTS 권한이 있으면 메뉴 표시

## 효과

### Before (권한 체크 누락)

- 연구원이 급여관리 페이지 접근 ✅ (잘못됨)
- 연구원이 프로젝트 관리 페이지 접근 ✅ (잘못됨)
- 사이드바에 급여관리 메뉴 표시 ✅ (잘못됨)
- 사이드바에 연구개발 메뉴 표시 ✅ (잘못됨)

### After (권한 체크 적용)

- 연구원이 급여관리 페이지 접근 ❌ (차단됨)
- 연구원이 프로젝트 관리 페이지 접근 ❌ (차단됨)
- 연구원이 플래너 페이지 접근 ✅ (허용됨)
- **사이드바에 급여관리 메뉴 숨김** 🔒
- **사이드바에 연구개발 메뉴 숨김** 🔒
- **사이드바에 Planner 메뉴 표시** ✅

## 연구원 최종 권한 (21개)

| 카테고리   | 리소스              | 권한 수             |
| ---------- | ------------------- | ------------------- |
| **공통**   | common.dashboard    | 1 (읽기)            |
|            | common.profile      | 2 (읽기/쓰기)       |
| **HR**     | hr.attendance       | 1 (출퇴근)          |
|            | hr.leaves           | 1 (휴가)            |
|            | hr.payslips         | 1 (급여명세서 조회) |
| **플래너** | planner.products    | 3 (읽기/쓰기/삭제)  |
|            | planner.initiatives | 3 (읽기/쓰기/삭제)  |
|            | planner.threads     | 3 (읽기/쓰기/삭제)  |
|            | planner.formations  | 3 (읽기/쓰기/삭제)  |
|            | planner.milestones  | 3 (읽기/쓰기/삭제)  |

## 검증

### 1. 코드 체크

```bash
# 에러 없음 확인
npm run check
```

### 2. 브라우저 테스트 - 페이지 접근

1. 연구원 계정으로 로그인
2. `/salary` 접근 시도 → "권한이 없습니다" 메시지 표시
3. `/project-management` 접근 시도 → "권한이 없습니다" 메시지 표시
4. `/planner` 접근 시도 → 정상 접근 가능

### 3. 브라우저 테스트 - 사이드바 메뉴

연구원 계정으로 확인:

- ❌ 급여관리 메뉴 **숨김** (HR_PAYSLIPS 권한 없음)
- ❌ 연구개발 메뉴 **숨김** (PROJECT_PROJECTS 권한 없음)
- ✅ Planner 메뉴 **표시** (PLANNER_PRODUCTS 권한 있음)
- ✅ 대시보드, 프로필, HR 메뉴 **표시**

관리자 계정으로 확인:

- ✅ 모든 메뉴 표시

## 주의사항

### PermissionGate 컴포넌트 동작

- 권한이 없으면 자동으로 `/unauthorized` 페이지로 리다이렉트
- 또는 커스텀 에러 메시지 표시
- 로딩 중에는 스피너 표시

### 추가 보안 레이어

서버 사이드 체크도 필요합니다:

```typescript
// +page.server.ts 또는 API 라우트에서
import { requirePermission } from '$lib/server/rbac/middleware'

export const load = async ({ locals }) => {
  requirePermission(locals, 'hr.payslips', 'read')
  // ... 데이터 로드
}
```

## 다음 단계

1. 모든 주요 페이지에 PermissionGate 추가
2. API 라우트에 서버 사이드 권한 체크 추가
3. 권한 변경 시 permission_cache 자동 무효화 확인
