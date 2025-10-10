-- ================================================================================
-- 권한 데이터 탐색 SQL 쿼리 모음
-- ================================================================================
-- 사용법: psql에서 각 쿼리를 복사하여 실행하거나,
--        \i scripts/explore-permissions.sql 로 전체 실행
-- ================================================================================

\echo '================================================================================'
\echo '1. 플래너 권한 목록'
\echo '================================================================================'

SELECT 
  code,
  resource,
  action,
  scope,
  description
FROM permissions
WHERE resource LIKE 'planner.%'
ORDER BY resource, action;

\echo ''
\echo '================================================================================'
\echo '2. 역할별 권한 통계'
\echo '================================================================================'

SELECT 
  r.code as role_code,
  r.name_ko as role_name,
  r.priority,
  COUNT(DISTINCT CASE WHEN p.resource LIKE 'planner.%' THEN p.id END) as planner_perms,
  COUNT(DISTINCT CASE WHEN p.resource LIKE 'project.%' THEN p.id END) as project_perms,
  COUNT(DISTINCT CASE WHEN p.resource LIKE 'finance.%' THEN p.id END) as finance_perms,
  COUNT(DISTINCT CASE WHEN p.resource LIKE 'hr.%' THEN p.id END) as hr_perms,
  COUNT(DISTINCT CASE WHEN p.resource LIKE 'sales.%' THEN p.id END) as sales_perms,
  COUNT(DISTINCT p.id) as total_perms
FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id = r.id
LEFT JOIN permissions p ON p.id = rp.permission_id
WHERE r.is_active = true
GROUP BY r.code, r.name_ko, r.priority
ORDER BY r.priority DESC;

\echo ''
\echo '================================================================================'
\echo '3. 연구원(RESEARCHER) 상세 권한'
\echo '================================================================================'

SELECT 
  p.resource,
  p.action,
  p.scope,
  p.description
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.code = 'RESEARCHER'
ORDER BY p.resource, p.action;

\echo ''
\echo '================================================================================'
\echo '4. 연구원의 플래너 vs 프로젝트 권한 비교'
\echo '================================================================================'

SELECT 
  CASE 
    WHEN p.resource LIKE 'planner.%' THEN 'planner'
    WHEN p.resource LIKE 'project.%' THEN 'project'
    ELSE 'other'
  END as category,
  COUNT(*) as permission_count,
  string_agg(DISTINCT p.action, ', ') as actions
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.code = 'RESEARCHER'
  AND (p.resource LIKE 'planner.%' OR p.resource LIKE 'project.%')
GROUP BY category;

\echo ''
\echo '================================================================================'
\echo '5. 전체 역할 목록'
\echo '================================================================================'

SELECT 
  code,
  name as name_en,
  name_ko,
  priority,
  is_active,
  (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.id) as perm_count
FROM roles r
ORDER BY priority DESC;

\echo ''
\echo '================================================================================'
\echo '6. 리소스별 권한 분포'
\echo '================================================================================'

SELECT 
  SPLIT_PART(resource, '.', 1) as category,
  COUNT(*) as permission_count,
  COUNT(DISTINCT SPLIT_PART(resource, '.', 2)) as resource_types
FROM permissions
WHERE is_active = true
GROUP BY category
ORDER BY permission_count DESC;

\echo ''
\echo '================================================================================'
\echo '7. 플래너 권한을 가진 역할들'
\echo '================================================================================'

SELECT 
  r.code,
  r.name_ko,
  COUNT(CASE WHEN p.action = 'read' THEN 1 END) as read_perms,
  COUNT(CASE WHEN p.action = 'write' THEN 1 END) as write_perms,
  COUNT(CASE WHEN p.action = 'delete' THEN 1 END) as delete_perms,
  COUNT(*) as total_planner_perms
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE p.resource LIKE 'planner.%'
GROUP BY r.code, r.name_ko
ORDER BY total_planner_perms DESC;

\echo ''
\echo '================================================================================'
\echo '8. 권한 캐시 상태'
\echo '================================================================================'

SELECT 
  COUNT(*) as cached_users,
  MIN(calculated_at) as oldest_cache,
  MAX(calculated_at) as newest_cache,
  MIN(expires_at) as earliest_expiry,
  MAX(expires_at) as latest_expiry
FROM permission_cache;

\echo ''
\echo '================================================================================'
\echo '9. 최근 권한 변경 이력 (최근 20건)'
\echo '================================================================================'

SELECT 
  action,
  performed_at,
  details
FROM permission_audit_log
ORDER BY performed_at DESC
LIMIT 20;

\echo ''
\echo '================================================================================'
\echo '10. 플래너와 프로젝트 권한 매트릭스 비교'
\echo '================================================================================'

SELECT 
  r.name_ko as "역할",
  CASE 
    WHEN COUNT(CASE WHEN p.resource LIKE 'planner.%' AND p.action = 'read' THEN 1 END) > 0 
      AND COUNT(CASE WHEN p.resource LIKE 'planner.%' AND p.action = 'write' THEN 1 END) > 0
    THEN '✓ 전체'
    WHEN COUNT(CASE WHEN p.resource LIKE 'planner.%' AND p.action = 'read' THEN 1 END) > 0
    THEN '⚠ 읽기'
    ELSE '✗ 없음'
  END as "플래너",
  CASE 
    WHEN COUNT(CASE WHEN p.resource LIKE 'project.%' AND p.action = 'read' THEN 1 END) > 0 
      AND COUNT(CASE WHEN p.resource LIKE 'project.%' AND p.action = 'write' THEN 1 END) > 0
    THEN '✓ 전체'
    WHEN COUNT(CASE WHEN p.resource LIKE 'project.%' AND p.action = 'read' THEN 1 END) > 0
    THEN '⚠ 읽기'
    ELSE '✗ 없음'
  END as "프로젝트"
FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id = r.id
LEFT JOIN permissions p ON p.id = rp.permission_id
WHERE r.code IN ('ADMIN', 'MANAGEMENT', 'RESEARCHER', 'RESEARCH_DIRECTOR', 'EMPLOYEE')
GROUP BY r.code, r.name_ko, r.priority
ORDER BY r.priority DESC;

\echo ''
\echo '================================================================================'
\echo '✅ 데이터 탐색 완료!'
\echo '================================================================================'
