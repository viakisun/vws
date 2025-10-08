# RBAC 권한 체계 구현 계획

## 📌 개요

도메인 기반 역할 접근 제어(Domain-oriented RBAC) 시스템 구현 계획서

## 🎯 목표

- 유연하고 확장 가능한 권한 관리 체계 구축
- 역할별 명확한 책임과 권한 정의
- 중복 권한 최소화 및 권한 상속 구조 구현

---

## 📊 권한 체계 설계

### 1. 역할 정의 (Roles)

| 역할           | 코드              | 설명               | 주요 권한                            |
| -------------- | ----------------- | ------------------ | ------------------------------------ |
| **관리자**     | ADMIN             | 시스템 전체 관리자 | 모든 권한, 사용자 역할 관리          |
| **경영관리자** | MANAGEMENT        | 경영 정보 관리     | 경영 대시보드, 전사 보고서           |
| **재무관리자** | FINANCE_MANAGER   | 재무 정보 관리     | 계정관리, 거래내역, 예산관리         |
| **인사관리자** | HR_MANAGER        | 인사 정보 관리     | 급여명세서, 인사카드, 근태관리       |
| **행정원**     | ADMINISTRATOR     | 일반 행정 업무     | 조직관리, 근태, 연차, 자산관리(TODO) |
| **연구소장**   | RESEARCH_DIRECTOR | 연구개발 총괄      | R&D 프로젝트, 연구원 관리            |
| **영업**       | SALES             | 영업 관련 업무     | 고객관리, 계약관리                   |
| **연구원**     | RESEARCHER        | 연구개발 업무      | 프로젝트 참여, 산출물 관리(TODO)     |
| **일반직원**   | EMPLOYEE          | 기본 역할          | 개인 대시보드, 개인정보 조회         |

### 2. 리소스별 권한 매트릭스

#### 2.1 재무 도메인 (Finance)

| 리소스                 | ADMIN | MANAGEMENT | FINANCE_MANAGER | HR_MANAGER | OTHERS |
| ---------------------- | ----- | ---------- | --------------- | ---------- | ------ |
| 계정(Accounts)         | CRUD  | R          | CRUD            | -          | -      |
| 거래내역(Transactions) | CRUD  | R          | CRUD            | -          | -      |
| 예산(Budgets)          | CRUD  | RU         | CRUD            | -          | -      |
| 재무보고서             | CRUD  | R          | CRUD            | -          | -      |

#### 2.2 인사 도메인 (HR)

| 리소스     | ADMIN | MANAGEMENT | FINANCE_MANAGER | HR_MANAGER | ADMINISTRATOR | EMPLOYEE |
| ---------- | ----- | ---------- | --------------- | ---------- | ------------- | -------- |
| 인사카드   | CRUD  | R          | -               | CRUD       | RU            | R(own)   |
| 급여명세서 | CRUD  | R          | R               | CRUD       | -             | R(own)   |
| 근태관리   | CRUD  | R          | -               | CRUD       | RU            | R(own)   |
| 연차관리   | CRUD  | R          | -               | CRUD       | RU            | RU(own)  |

#### 2.3 프로젝트 도메인 (Project)

| 리소스   | ADMIN | RESEARCH_DIRECTOR | RESEARCHER | PM   | OTHERS |
| -------- | ----- | ----------------- | ---------- | ---- | ------ |
| 프로젝트 | CRUD  | CRUD              | R          | CRUD | -      |
| 산출물   | CRUD  | RU                | CRU        | CRUD | -      |
| 일정관리 | CRUD  | RU                | R          | CRUD | -      |

### 3. 권한 상속 구조

```
ADMIN
  ├── MANAGEMENT
  │   ├── FINANCE_MANAGER
  │   └── HR_MANAGER
  ├── RESEARCH_DIRECTOR
  │   └── RESEARCHER
  └── ADMINISTRATOR
      └── EMPLOYEE
```

---

## 🚀 구현 단계

### Phase 1: 데이터베이스 설계 (1주)

#### 1.1 테이블 구조

```sql
-- 역할 테이블
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_role_id UUID REFERENCES roles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 권한 테이블
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource VARCHAR(100) NOT NULL,  -- 'finance.accounts', 'hr.payslips'
  action VARCHAR(50) NOT NULL,     -- 'read', 'write', 'delete', 'approve'
  scope VARCHAR(50),                -- 'own', 'department', 'all'
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 역할-권한 매핑
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id)
);

-- 사용자-역할 매핑
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  PRIMARY KEY (user_id, role_id)
);

-- 권한 캐시 (성능 최적화)
CREATE TABLE permission_cache (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permissions JSONB NOT NULL,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  PRIMARY KEY (user_id)
);
```

#### 1.2 인덱스 전략

```sql
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_expires ON user_roles(expires_at);
CREATE INDEX idx_permission_cache_expires ON permission_cache(expires_at);
```

### Phase 2: 백엔드 구현 (2주)

#### 2.1 권한 서비스 (`src/lib/server/services/permission.service.ts`)

```typescript
export class PermissionService {
  // 사용자 권한 체크
  async hasPermission(userId: string, resource: string, action: string): Promise<boolean>

  // 권한 캐시 갱신
  async refreshPermissionCache(userId: string): Promise<void>

  // 역할 할당
  async assignRole(userId: string, roleCode: string): Promise<void>

  // 권한 상속 처리
  async getInheritedPermissions(roleId: string): Promise<Permission[]>
}
```

#### 2.2 미들웨어 구현 (`src/hooks.server.ts`)

```typescript
// 권한 검증 미들웨어
export const permissionGuard = async ({ event, resolve }) => {
  const session = await getSession(event.cookies)
  if (!session) return resolve(event)

  // 권한 캐시 확인 및 갱신
  const permissions = await getOrRefreshPermissions(session.userId)
  event.locals.permissions = permissions

  // 라우트별 권한 체크
  const requiredPermission = getRequiredPermission(event.url.pathname)
  if (requiredPermission && !hasPermission(permissions, requiredPermission)) {
    throw error(403, 'Insufficient permissions')
  }

  return resolve(event)
}
```

### Phase 3: 프론트엔드 구현 (2주)

#### 3.1 권한 스토어 (`src/lib/stores/permissions.ts`)

```typescript
import { writable, derived } from 'svelte/store'

export const userPermissions = writable<Permission[]>([])

export const can = derived(userPermissions, ($permissions) => ({
  read: (resource: string) => hasPermission($permissions, resource, 'read'),
  write: (resource: string) => hasPermission($permissions, resource, 'write'),
  delete: (resource: string) => hasPermission($permissions, resource, 'delete'),
  approve: (resource: string) => hasPermission($permissions, resource, 'approve'),
}))
```

#### 3.2 권한 기반 컴포넌트 (`src/lib/components/auth/PermissionGate.svelte`)

```svelte
<script lang="ts">
  import { can } from '$lib/stores/permissions'

  export let resource: string
  export let action: string = 'read'
  export let fallback: 'hide' | 'disable' | 'message' = 'hide'
</script>

{#if $can[action](resource)}
  <slot />
{:else if fallback === 'message'}
  <div class="alert alert-warning">이 콘텐츠에 대한 권한이 없습니다.</div>
{:else if fallback === 'disable'}
  <div class="opacity-50 pointer-events-none">
    <slot />
  </div>
{/if}
```

### Phase 4: 권한 관리 UI (1주)

#### 4.1 관리자 대시보드

- 사용자별 역할 조회/수정
- 역할별 권한 조회/수정
- 권한 감사 로그

#### 4.2 역할 관리 화면

- 역할 생성/수정/삭제
- 권한 매핑 관리
- 상속 구조 시각화

### Phase 5: 테스트 및 마이그레이션 (1주)

#### 5.1 테스트 시나리오

- [ ] 각 역할별 접근 권한 테스트
- [ ] 권한 상속 테스트
- [ ] 권한 캐시 성능 테스트
- [ ] 동시성 테스트

#### 5.2 데이터 마이그레이션

```sql
-- 기존 users.role 데이터를 새 구조로 마이그레이션
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = UPPER(u.role)
WHERE u.role IS NOT NULL;
```

---

## 📝 TODO 항목

### 즉시 구현 가능

- [x] 데이터베이스 스키마 설계
- [ ] 기본 역할 시드 데이터
- [ ] 권한 서비스 구현
- [ ] API 엔드포인트 보호

### 추가 구현 필요

- [ ] 자재/기자재 자산 관리 (ADMINISTRATOR)
- [ ] 개발 일정 및 산출물 관리 도구 (RESEARCHER)
- [ ] 임시 권한 부여 기능
- [ ] 역할 위임 기능
- [ ] 권한 승인 워크플로우

### 장기 개선 사항

- [ ] 동적 권한 생성
- [ ] 조건부 권한 (시간, 위치 기반)
- [ ] 권한 분석 대시보드
- [ ] AI 기반 권한 이상 탐지

---

## 🔄 권한 확장 가이드

### 새로운 역할 추가 시

1. `roles` 테이블에 역할 정의 추가
2. 필요한 권한을 `permissions` 테이블에 추가
3. `role_permissions`에 매핑 추가
4. 프론트엔드 권한 체크 로직 업데이트

### 새로운 리소스 추가 시

1. `permissions` 테이블에 리소스별 액션 정의
2. 해당 역할에 권한 매핑
3. API 라우트에 권한 체크 추가
4. UI에 PermissionGate 적용

---

## 📊 예상 효과

- **보안 강화**: 세분화된 권한 관리로 데이터 보안 향상
- **유연성**: 역할 기반으로 쉽게 권한 조정 가능
- **확장성**: 새로운 기능 추가 시 권한 체계 쉽게 확장
- **감사 추적**: 모든 권한 변경 이력 추적 가능
