# 권한 매트릭스와 RBAC 연동 완료 ✅

## 🎯 작업 완료 내용

### 1. DB 마이그레이션 파일 생성
- 📄 `migrations/003_add_planner_permissions.sql`
- 📄 `migrations/003_MIGRATION_GUIDE.md`

**추가된 권한:**
- `planner.products.*` (read, write, delete)
- `planner.initiatives.*` (read, write, delete)  
- `planner.threads.*` (read, write, delete)
- `planner.formations.*` (read, write, delete)
- `planner.milestones.*` (read, write, delete)

**역할별 권한 변경:**
- RESEARCHER: 프로젝트 관리 권한 제거 → 플래너 전체 권한 추가
- RESEARCH_DIRECTOR: 플래너 전체 권한 추가
- MANAGEMENT: 플래너 읽기 권한 추가
- ADMIN: 플래너 전체 권한 추가

### 2. 코드 변경

#### `src/lib/stores/permissions.ts`
```typescript
// Resource enum에 플래너 추가
export enum Resource {
  // ...
  PLANNER_PRODUCTS = 'planner.products',
  PLANNER_INITIATIVES = 'planner.initiatives',
  PLANNER_THREADS = 'planner.threads',
  PLANNER_FORMATIONS = 'planner.formations',
  PLANNER_MILESTONES = 'planner.milestones',
  // ...
}

// menuAccess에 planner 추가
export const menuAccess: Readable<{
  // ...
  planner: boolean
  // ...
}>
```

#### `src/routes/planner/+page.svelte`
```svelte
<!-- PermissionGate 추가로 권한 체크 -->
<PermissionGate resource={Resource.PLANNER_PRODUCTS} action={PermissionAction.READ}>
  <!-- 플래너 콘텐츠 -->
</PermissionGate>
```

#### `src/lib/components/admin/PermissionMatrix.svelte`
- 하드코딩된 권한 데이터 제거
- DB에서 실시간으로 권한 매트릭스 로딩
- 새로고침 버튼 추가
- 로딩/에러 상태 처리

#### `src/lib/server/rbac/permission-matrix.ts` (신규)
- DB에서 역할별 권한 데이터 조회
- 리소스별 권한 집계
- 매트릭스 형태로 데이터 반환

#### `src/routes/api/admin/permission-matrix/+server.ts` (신규)
- GET 엔드포인트로 권한 매트릭스 제공
- `/api/admin/permission-matrix`

### 3. 권한 매트릭스 구조

이제 권한 매트릭스는 DB에서 실시간으로 가져옵니다:

```typescript
{
  roles: [
    { code: 'ADMIN', nameKo: '관리자', priority: 100 },
    { code: 'MANAGEMENT', nameKo: '경영관리자', priority: 80 },
    // ...
  ],
  matrix: [
    {
      resource: '플래너',
      resourceKo: '플래너',
      permissions: {
        admin: 'full',
        management: 'read',
        researcher: 'full',  // ✅ 변경됨
        employee: 'none'
      }
    },
    {
      resource: '프로젝트 관리',
      resourceKo: '프로젝트 관리',
      permissions: {
        admin: 'full',
        management: 'read',
        researcher: 'none',  // ✅ 변경됨 (기존 'full')
        employee: 'read'
      }
    }
    // ...
  ]
}
```

## 🚀 다음 단계: 마이그레이션 실행

### 1. DB 마이그레이션 실행

```bash
# PostgreSQL 연결 정보 확인
cat .env | grep DB_

# 마이그레이션 실행
psql -h localhost -U postgres -d vws_dev -f migrations/003_add_planner_permissions.sql
```

### 2. 애플리케이션 재시작

```bash
npm run dev
```

### 3. 테스트

1. **권한 매트릭스 확인**
   - 관리자로 로그인
   - `/admin/permissions` 접속
   - "권한 매트릭스" 탭에서 "플래너" 행 확인
   - 연구원이 플래너에 전체 권한(✓), 프로젝트 관리에 권한 없음(X) 확인

2. **플래너 접근 테스트**
   - 연구원 계정: `/planner` 접근 가능 ✅
   - 연구원 계정: `/project-management` 접근 불가 ❌
   - 일반 직원: `/planner` 접근 불가 ❌

3. **API 테스트**
   ```bash
   curl http://localhost:5173/api/admin/permission-matrix
   ```

## 📊 변경 전/후 비교

### Before (하드코딩)
```typescript
const permissions: PermissionRow[] = [
  { resource: '플래너', admin: 'full', researcher: 'full', ... }
]
```
- ❌ DB와 무관한 정적 데이터
- ❌ 실제 권한과 불일치 가능
- ❌ 권한 변경시 코드 수정 필요

### After (DB 연동)
```typescript
async function loadPermissionMatrix() {
  const response = await fetch('/api/admin/permission-matrix')
  const data = await response.json()
  // DB에서 실시간 데이터 로딩
}
```
- ✅ DB의 실제 권한 데이터 반영
- ✅ 권한 변경시 자동 업데이트
- ✅ 실제 RBAC 시스템과 100% 일치

## 🔒 보안 강화

### 플래너 페이지 권한 체크
```svelte
<PermissionGate 
  resource={Resource.PLANNER_PRODUCTS} 
  action={PermissionAction.READ}
>
  <!-- 권한이 있는 사용자만 접근 가능 -->
</PermissionGate>
```

### 메뉴 접근 제어
```typescript
export const menuAccess: Readable<{
  planner: boolean  // 플래너 권한 자동 체크
}>
```

## 📝 관련 파일

### 신규 파일
- `migrations/003_add_planner_permissions.sql`
- `migrations/003_MIGRATION_GUIDE.md`
- `src/lib/server/rbac/permission-matrix.ts`
- `src/routes/api/admin/permission-matrix/+server.ts`

### 수정된 파일
- `src/lib/stores/permissions.ts`
- `src/lib/components/admin/PermissionMatrix.svelte`
- `src/routes/planner/+page.svelte`

## ✅ 체크리스트

- [x] DB 마이그레이션 파일 생성
- [x] permissions.ts에 Resource 추가
- [x] menuAccess에 planner 추가
- [x] 플래너 페이지에 PermissionGate 추가
- [x] PermissionMatrix DB 연동
- [x] API 엔드포인트 생성
- [x] 마이그레이션 가이드 작성
- [ ] DB 마이그레이션 실행 (사용자 작업)
- [ ] 테스트 완료 (사용자 작업)

## 🎉 완료!

이제 권한 매트릭스는 실제 DB의 RBAC 데이터와 연동되어 실시간으로 표시됩니다.
연구원은 프로젝트 관리 대신 플래너에 접근할 수 있게 됩니다.
