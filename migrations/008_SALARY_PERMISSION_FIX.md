# Migration 008: Fix Salary Permission Issue

## 문제점
연구원이 급여관리 페이지(`/salary`)에 접근할 수 있었던 이유:
- 연구원에게 `hr.payslips.read` 권한이 있음 (본인 급여명세서 조회용)
- 급여관리 페이지가 `hr.payslips.read` 권한으로 보호되고 있음
- 결과: 연구원이 급여관리 **시스템 전체**에 접근 가능 (잘못됨!)

## 해결 방법
급여관리 시스템 전용 권한 생성:
- `salary.management.read` - 급여 관리 시스템 접근 권한
- `hr.payslips.read` - 본인 급여명세서 조회 권한 (유지)

## 변경 사항

### 1. 데이터베이스
```sql
-- 새 권한 추가
INSERT INTO permissions (resource, action, description, scope)
VALUES ('salary.management', 'read', '급여 관리 시스템 접근', 'all');

-- 급여 관리자에게만 부여
- ADMIN ✅
- HR_MANAGER ✅
- MANAGEMENT ✅
- RESEARCHER ❌ (없음)
```

### 2. 코드 변경

#### src/lib/stores/permissions.ts
```typescript
export enum Resource {
  // ...
  SALARY_MANAGEMENT = 'salary.management',  // NEW!
  // ...
}
```

#### src/routes/salary/+page.server.ts
```typescript
// Before
const hasPermission = permissions.permissions.some(
  (p) => p.resource === 'hr.payslips' && p.action === 'read'
)

// After
const hasPermission = permissions.permissions.some(
  (p) => p.resource === 'salary.management' && p.action === 'read'
)
```

#### src/routes/salary/+page.svelte
```typescript
// Before
<PermissionGate resource={Resource.HR_PAYSLIPS} ...>

// After
<PermissionGate resource={Resource.SALARY_MANAGEMENT} ...>
```

#### src/lib/components/layout/Sidebar.svelte
```typescript
// Before
permission: { resource: Resource.HR_PAYSLIPS }

// After
permission: { resource: Resource.SALARY_MANAGEMENT }
```

## 권한 구분

| 권한 | 설명 | 역할 |
|------|------|------|
| **salary.management.read** | 급여 관리 시스템 전체 접근 | ADMIN, HR_MANAGER, MANAGEMENT |
| **hr.payslips.read** | 본인 급여명세서 조회 | 모든 직원 (RESEARCHER 포함) |

## 결과

### Before
```
연구원 → /salary 접근 ✅ (hr.payslips.read 권한)
       → 급여 계약 관리 가능 (잘못됨!)
       → 전체 급여명세서 관리 가능 (잘못됨!)
```

### After
```
연구원 → /salary 접근 ❌ (salary.management.read 권한 없음)
       → /unauthorized로 리다이렉트
       → 사이드바에서 급여관리 메뉴 숨김
       → 본인 급여명세서만 조회 가능 ✅
```

## 테스트

### 1. 연구원 계정
```bash
# 로그아웃 → 재로그인
# /salary 접근 시도
→ 🚫 /unauthorized로 리다이렉트
→ 🚫 사이드바에서 급여관리 메뉴 안 보임
```

### 2. HR 관리자 계정
```bash
# /salary 접근 시도
→ ✅ 정상 접근
→ ✅ 사이드바에서 급여관리 메뉴 보임
```

### 3. 관리자 계정
```bash
# /salary 접근 시도
→ ✅ 정상 접근 (ADMIN 역할)
```

## 로그 확인
서버 로그에서 권한 체크 확인:
```
🔍 [Salary Page] Checking permissions...
👥 Roles: [ 'RESEARCHER' ]
🎫 Permissions: [ ..., 'hr.payslips.read', ... ]
🔍 Has salary.management.read permission: false
❌ No permission, redirecting to unauthorized
```

## 추가 작업 필요
1. **서버 재시작** 필수
2. **캐시 초기화**: `DELETE FROM permission_cache;`
3. **재로그인**: 권한 캐시 갱신

## 보안 개선
이제 3중 보안이 제대로 작동:
1. 사이드바: `salary.management` 권한 없으면 메뉴 숨김
2. 서버: `+page.server.ts`에서 권한 체크 → 리다이렉트
3. 클라이언트: `PermissionGate`에서 권한 체크
