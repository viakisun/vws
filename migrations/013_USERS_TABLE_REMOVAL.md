# Users 테이블 제거 및 인증 시스템 정리

## 📋 작업 개요

**날짜**: 2025-10-10  
**목적**: 불필요한 `users` 테이블 제거 및 2-tier 인증 시스템으로 정리

## 🎯 왜 제거하는가?

### 문제점

1. **코드에서 사용되지 않음**
   - `user-service.ts`는 `system_accounts`와 `employees`만 사용
   - `hooks.server.ts`도 `employees` 기반으로 작동
   - RBAC 시스템은 100% `employee_roles` 기준

2. **데이터 중복**
   - `users`, `system_accounts`, `employees` 테이블에 같은 정보 중복 저장
   - 불필요한 복잡성 증가

3. **유지보수 어려움**
   - 3개 테이블 동기화 필요
   - 버그 발생 가능성 증가

## 📊 변경 전후 비교

### Before (3-tier 시스템) ❌

```
users (인증용?)
  ├─ audit_logs (user_id 참조)
  └─ user_sessions (user_id 참조)

system_accounts (시스템 관리자)

employees (일반 직원)
  └─ employee_roles → roles → role_permissions → permissions
```

### After (2-tier 시스템) ✅

```
system_accounts (시스템 관리자)
  └─ ADMIN 역할 고정, 모든 권한

employees (일반 직원)
  └─ employee_roles → roles → role_permissions → permissions
```

## 🔧 실행할 Migration

### Migration 013: users 테이블 제거

```bash
psql $DB_URL -f migrations/013_remove_users_table.sql
```

**제거 대상**:

- `user_sessions` 테이블
- `audit_logs` 테이블
- `users` 테이블
- 관련 트리거 및 함수

### Migration 014: RBAC 스키마 정리

```bash
psql $DB_URL -f migrations/014_cleanup_rbac_schema.sql
```

**정리 대상**:

- `user_roles` 테이블 제거 (→ `employee_roles` 사용)
- `role_permissions.granted_by` 컬럼 제거 (→ `granted_by_employee_id` 사용)

## 📝 코드 변경 사항

### 1. `src/lib/database/connection.ts`

```typescript
// 제거됨: createUser, getUserById, getUserByEmail, getUsers
// → user-service.ts에서 system_accounts와 employees 직접 쿼리
```

### 2. Migration 파일

- ✅ `migrations/013_remove_users_table.sql` (새로 생성)
- ✅ `migrations/014_cleanup_rbac_schema.sql` (새로 생성)

## 🚀 실행 순서

```bash
# 1. Migration 013 실행 (users 테이블 제거)
psql postgresql://postgres:viahubdev@db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com:5432/postgres \
  -f migrations/013_remove_users_table.sql

# 2. Migration 014 실행 (RBAC 스키마 정리)
psql postgresql://postgres:viahubdev@db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com:5432/postgres \
  -f migrations/014_cleanup_rbac_schema.sql

# 3. 권한 캐시 초기화
psql postgresql://postgres:viahubdev@db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com:5432/postgres \
  -c "DELETE FROM permission_cache;"

# 4. 서버 재시작
# Ctrl+C로 중지 후
npm run dev

# 5. 재로그인
# 브라우저에서 로그아웃 → 로그인
```

## ✅ 검증 방법

### 1. DB 테이블 확인

```sql
-- users 관련 테이블이 없어야 함
\dt users
\dt user_sessions
\dt audit_logs
\dt user_roles

-- 이 테이블들만 존재해야 함
\dt system_accounts
\dt employees
\dt employee_roles
\dt roles
\dt permissions
\dt role_permissions
\dt permission_cache
```

### 2. 코드 작동 확인

```bash
# 에러 없이 컴파일되어야 함
npm run build

# 린트 통과해야 함
npm run lint

# 서버 정상 시작되어야 함
npm run dev
```

### 3. 기능 테스트

- [ ] Google OAuth 로그인 정상 작동
- [ ] 시스템 관리자 로그인 → ADMIN 권한 확인
- [ ] 일반 직원 로그인 → RBAC 권한 적용 확인
- [ ] 사이드바 메뉴 권한별 표시 확인
- [ ] 페이지 접근 권한 확인

## 📌 최종 인증 흐름

```mermaid
graph TD
    A[Google OAuth 로그인] --> B{이메일 확인}
    B -->|system_accounts 존재| C[시스템 관리자 로그인]
    B -->|employees 존재| D[일반 직원 로그인]
    B -->|둘 다 없음| E[에러: 등록되지 않은 이메일]

    C --> F[ADMIN 역할]
    D --> G[employee_roles 조회]
    G --> H[RBAC 권한 적용]

    F --> I[모든 권한]
    H --> J[역할별 권한]
```

## 🎉 기대 효과

1. **단순성**: 2-tier 시스템으로 명확한 구조
2. **성능**: 불필요한 테이블 제거로 쿼리 단순화
3. **유지보수**: 동기화 문제 해결
4. **명확성**: 인증과 권한의 명확한 분리

## ⚠️ 주의사항

1. **백업 필수**: migration 실행 전 DB 백업
2. **순서 준수**: 013 → 014 순서대로 실행
3. **캐시 초기화**: permission_cache 삭제 필수
4. **서버 재시작**: 변경사항 적용을 위해 필수
5. **재로그인**: 사용자 모두 재로그인 필요

## 📚 관련 파일

- `migrations/013_remove_users_table.sql`
- `migrations/014_cleanup_rbac_schema.sql`
- `src/lib/database/connection.ts`
- `src/lib/auth/user-service.ts`
- `src/hooks.server.ts`
