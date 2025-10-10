# 플래너 권한 마이그레이션 가이드

## 개요

이 마이그레이션은 플래너 기능에 대한 RBAC 권한을 추가하고, 연구원 역할의 권한을 재구성합니다.

### 변경 사항

1. **플래너 권한 추가**
   - `planner.products` - 제품 관리 권한
   - `planner.initiatives` - 이니셔티브 관리 권한
   - `planner.threads` - 스레드 관리 권한
   - `planner.formations` - 포메이션 관리 권한
   - `planner.milestones` - 마일스톤 관리 권한

2. **역할별 권한 재구성**
   - **RESEARCHER (연구원)**
     - ❌ 프로젝트 관리 권한 제거 (`project.*`)
     - ✅ 플래너 전체 권한 추가 (`planner.*`)
   - **RESEARCH_DIRECTOR (연구소장)**
     - ✅ 플래너 전체 권한 추가 (`planner.*`)
   - **MANAGEMENT (경영관리자)**
     - ✅ 플래너 읽기 권한 추가 (`planner.*.read`)
   - **ADMIN (관리자)**
     - ✅ 플래너 전체 권한 추가 (`planner.*`)

3. **코드 변경**
   - `permissions.ts`: Resource enum에 플래너 리소스 추가
   - `permissions.ts`: menuAccess에 planner 추가
   - `/planner` 페이지: PermissionGate 추가
   - PermissionMatrix: DB 동적 로딩으로 변경

## 마이그레이션 실행

### 1. 환경 변수 확인

```bash
# .env 파일에서 DB 연결 정보 확인
cat .env | grep DB_
```

### 2. 마이그레이션 실행

```bash
# PostgreSQL에 연결하여 마이그레이션 실행
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/003_add_planner_permissions.sql
```

또는 직접 연결:

```bash
# 예시 (실제 값으로 변경)
psql -h localhost -U postgres -d vws_dev -f migrations/003_add_planner_permissions.sql
```

### 3. 마이그레이션 확인

마이그레이션 후 다음 쿼리로 권한이 올바르게 설정되었는지 확인:

```sql
-- 플래너 권한 확인
SELECT code, resource, action, scope
FROM permissions
WHERE resource LIKE 'planner.%'
ORDER BY resource, action;

-- 연구원 역할의 플래너 권한 확인
SELECT
  r.code as role_code,
  r.name_ko as role_name,
  p.code as permission_code,
  p.resource,
  p.action
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.code = 'RESEARCHER'
  AND p.resource LIKE 'planner.%'
ORDER BY p.resource, p.action;

-- 연구원의 프로젝트 관리 권한이 제거되었는지 확인 (결과 없어야 함)
SELECT
  r.code as role_code,
  p.code as permission_code
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.code = 'RESEARCHER'
  AND p.resource LIKE 'project.%';
```

### 4. 애플리케이션 재시작

```bash
# 개발 서버 재시작
npm run dev
```

## 테스트

### 1. 권한 매트릭스 확인

1. 관리자 계정으로 로그인
2. `/admin/permissions` 페이지 접속
3. "권한 매트릭스" 탭 선택
4. 다음 항목 확인:
   - "플래너" 행이 추가되었는지
   - 연구원이 플래너에 전체 권한(✓ 녹색)을 가지는지
   - 연구원이 프로젝트 관리에 권한 없음(X 회색)인지

### 2. 플래너 접근 테스트

#### 연구원 계정으로 테스트

```
✅ /planner - 접근 가능
✅ /planner/products - 접근 가능
✅ /planner/initiatives - 접근 가능
❌ /project-management - 접근 불가 (권한 없음 메시지)
```

#### 일반 직원 계정으로 테스트

```
❌ /planner - 접근 불가 (권한 없음 메시지)
```

### 3. API 테스트

```bash
# 권한 매트릭스 API 테스트
curl http://localhost:5173/api/admin/permission-matrix
```

## 롤백 (필요시)

마이그레이션을 되돌려야 하는 경우:

```sql
-- 1. 플래너 권한 삭제
DELETE FROM role_permissions
WHERE permission_id IN (
  SELECT id FROM permissions WHERE resource LIKE 'planner.%'
);

DELETE FROM permissions WHERE resource LIKE 'planner.%';

-- 2. 연구원에게 프로젝트 권한 재부여
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'RESEARCHER'),
  id
FROM permissions
WHERE resource LIKE 'project.%'
ON CONFLICT DO NOTHING;

-- 3. 권한 캐시 무효화
DELETE FROM permission_cache;
```

## 문제 해결

### 오류: "permission already exists"

이미 마이그레이션이 실행된 경우입니다. 확인:

```sql
SELECT COUNT(*) FROM permissions WHERE resource LIKE 'planner.%';
```

결과가 0이 아니면 이미 실행되었습니다.

### 오류: "relation does not exist"

RBAC 테이블이 없는 경우. 먼저 001_create_rbac_tables.sql을 실행:

```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/001_create_rbac_tables.sql
```

### 권한 캐시 문제

권한이 업데이트되지 않는 경우 캐시 삭제:

```sql
DELETE FROM permission_cache;
```

또는 애플리케이션 재시작 후 재로그인.

## 참고 사항

- 마이그레이션은 `ON CONFLICT DO NOTHING`을 사용하여 안전하게 여러 번 실행 가능
- 권한 캐시는 자동으로 무효화됨
- 사용자는 재로그인하여 새 권한을 받아야 함
