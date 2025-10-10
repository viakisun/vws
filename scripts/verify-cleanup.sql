-- =============================================
-- 최종 검증: users 테이블 제거 및 RBAC 시스템 확인
-- =============================================

\echo ''
\echo '=========================================='
\echo '1. users 관련 테이블 확인 (존재하면 안됨)'
\echo '=========================================='

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All users-related tables removed'
    ELSE '⚠️  ' || COUNT(*) || ' users-related tables still exist'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'user_sessions', 'audit_logs', 'user_roles');

\echo ''
\echo '=========================================='
\echo '2. 인증 시스템 테이블 확인 (2-tier)'
\echo '=========================================='

SELECT 
  table_name,
  CASE 
    WHEN table_name = 'system_accounts' THEN '시스템 관리자 계정'
    WHEN table_name = 'employees' THEN '일반 직원'
    ELSE 'Unknown'
  END as description
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('system_accounts', 'employees')
ORDER BY table_name;

\echo ''
\echo '=========================================='
\echo '3. RBAC 시스템 테이블 확인'
\echo '=========================================='

SELECT 
  table_name,
  CASE 
    WHEN table_name = 'roles' THEN '역할'
    WHEN table_name = 'permissions' THEN '권한'
    WHEN table_name = 'role_permissions' THEN '역할-권한 매핑'
    WHEN table_name = 'employee_roles' THEN '직원-역할 매핑'
    WHEN table_name = 'permission_cache' THEN '권한 캐시'
    ELSE 'Unknown'
  END as description
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('roles', 'permissions', 'role_permissions', 'employee_roles', 'permission_cache')
ORDER BY table_name;

\echo ''
\echo '=========================================='
\echo '4. 데이터 개수 확인'
\echo '=========================================='

SELECT 
  'system_accounts' as table_name,
  COUNT(*) as row_count,
  '시스템 관리자' as description
FROM system_accounts
UNION ALL
SELECT 
  'employees',
  COUNT(*),
  '일반 직원'
FROM employees
UNION ALL
SELECT 
  'roles',
  COUNT(*),
  '역할 정의'
FROM roles
UNION ALL
SELECT 
  'permissions',
  COUNT(*),
  '권한 정의'
FROM permissions
UNION ALL
SELECT 
  'role_permissions',
  COUNT(*),
  '역할별 권한 매핑'
FROM role_permissions
UNION ALL
SELECT 
  'employee_roles',
  COUNT(*),
  '직원별 역할 매핑'
FROM employee_roles
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'employee_roles'
)
UNION ALL
SELECT 
  'permission_cache',
  COUNT(*),
  '권한 캐시'
FROM permission_cache;

\echo ''
\echo '=========================================='
\echo '5. role_permissions 스키마 확인'
\echo '=========================================='

SELECT 
  column_name,
  data_type,
  CASE 
    WHEN column_name = 'granted_by_employee_id' THEN '✅ Correct (uses employees)'
    WHEN column_name = 'granted_by' THEN '❌ Wrong (uses users)'
    ELSE ''
  END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'role_permissions'
  AND column_name LIKE '%granted%'
ORDER BY column_name;

\echo ''
\echo '=========================================='
\echo '6. ADMIN 권한 확인'
\echo '=========================================='

SELECT 
  r.code as role,
  COUNT(rp.permission_id) as permission_count,
  (SELECT COUNT(*) FROM permissions) as total_permissions,
  CASE 
    WHEN COUNT(rp.permission_id) = (SELECT COUNT(*) FROM permissions) 
    THEN '✅ Has all permissions'
    ELSE '⚠️  Missing ' || ((SELECT COUNT(*) FROM permissions) - COUNT(rp.permission_id))::text || ' permissions'
  END as status
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.code = 'ADMIN'
GROUP BY r.code;

\echo ''
\echo '=========================================='
\echo '✅ 검증 완료!'
\echo '=========================================='
\echo ''
