# Migration 003: 플래너 권한 추가 및 RBAC 연동

## 📦 포함된 파일

```
migrations/
├── 003_add_planner_permissions.sql    # 메인 마이그레이션 SQL
├── 003_MIGRATION_GUIDE.md             # 실행 가이드
├── 003_IMPLEMENTATION_SUMMARY.md      # 구현 요약
├── 003_COMPLETED.md                   # 완료 체크리스트
└── 003_README.md                      # 이 파일

scripts/
├── run-migration-003.ts               # 마이그레이션 실행 스크립트
└── check-permissions.ts               # 권한 확인 스크립트
```

## 🚀 빠른 시작

### 1. 마이그레이션 실행

```bash
# Option 1: Node.js 스크립트 (권장)
npx tsx scripts/run-migration-003.ts

# Option 2: psql 직접 실행
PGPASSWORD="your-password" psql \
  -h your-db-host \
  -U your-db-user \
  -d your-db-name \
  -f migrations/003_add_planner_permissions.sql
```

### 2. 권한 확인

```bash
npx tsx scripts/check-permissions.ts
```

예상 출력:
```
📊 권한 매트릭스 현황

✅ 플래너 권한: 15개
   - planner.products.read
   - planner.products.write
   - planner.products.delete
   ... 외 12개

📋 역할별 권한:
   관리자        | 플래너: ✓ (15)  | 프로젝트: ✓ (5)
   경영관리자    | 플래너: ✓ (5)   | 프로젝트: ✓ (2)
   연구원        | 플래너: ✓ (15)  | 프로젝트: ✗ (0)
   연구소장      | 플래너: ✓ (15)  | 프로젝트: ✓ (5)
   일반직원      | 플래너: ✗ (0)   | 프로젝트: ✗ (0)

🔍 연구원 권한 상세:
   planner: read, write, delete
```

### 3. 웹에서 확인

```bash
# 개발 서버 시작
npm run dev

# 브라우저에서 확인
# 1. 관리자로 로그인
# 2. https://localhost:5173/admin/permissions
# 3. "권한 매트릭스" 탭 클릭
# 4. "플래너" 행 확인
```

## 🎯 주요 변경사항

### DB 변경
- ✅ 플래너 권한 15개 추가
- ✅ 연구원: 프로젝트 관리 권한 제거, 플래너 권한 추가
- ✅ 경영관리자: 플래너 읽기 권한 추가
- ✅ 연구소장: 플래너 전체 권한 추가

### 코드 변경
- ✅ `permissions.ts`: Resource enum 업데이트
- ✅ `planner/+page.svelte`: PermissionGate 추가
- ✅ `PermissionMatrix.svelte`: DB 동적 로딩
- ✅ API 엔드포인트 추가: `/api/admin/permission-matrix`

## 📚 상세 문서

- **실행 방법**: `003_MIGRATION_GUIDE.md` 참고
- **구현 상세**: `003_IMPLEMENTATION_SUMMARY.md` 참고
- **완료 체크리스트**: `003_COMPLETED.md` 참고

## ✅ 테스트

### 자동 테스트
```bash
# 마이그레이션 스크립트가 자동으로 검증합니다
npx tsx scripts/run-migration-003.ts
```

### 수동 테스트
1. 연구원 계정으로 `/planner` 접근 → ✅
2. 연구원 계정으로 `/project-management` 접근 → ❌
3. 일반 직원으로 `/planner` 접근 → ❌
4. 권한 매트릭스에서 "플래너" 행 확인

## 🔄 롤백

문제 발생시:
```sql
-- 플래너 권한 삭제
DELETE FROM permissions WHERE resource LIKE 'planner.%';

-- 연구원에게 프로젝트 권한 복구
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'RESEARCHER'),
  id
FROM permissions
WHERE resource LIKE 'project.%'
ON CONFLICT DO NOTHING;

-- 캐시 무효화
DELETE FROM permission_cache;
```

## 📊 영향 범위

- **영향받는 역할**: RESEARCHER, RESEARCH_DIRECTOR, MANAGEMENT, ADMIN
- **영향받는 페이지**: `/planner/*`, `/admin/permissions`
- **다운타임**: 없음
- **실행 시간**: < 1초

## 🎉 완료!

권한 매트릭스가 이제 실제 DB의 RBAC 시스템과 100% 연동됩니다!
