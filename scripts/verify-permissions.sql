-- 빠른 권한 확인 쿼리
-- =============================================

\echo '========================================='
\echo '연구원(RESEARCHER) 권한 확인'
\echo '========================================='

SELECT 
  COUNT(*) as total_perms,
  COUNT(CASE WHEN p.resource LIKE 'planner.%' THEN 1 END) as planner_perms,
  COUNT(CASE WHEN p.resource LIKE 'common.%' THEN 1 END) as common_perms,
  COUNT(CASE WHEN p.resource LIKE 'hr.%' THEN 1 END) as hr_perms
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.code = 'RESEARCHER';

\echo ''
\echo '========================================='
\echo '권한 매트릭스'
\echo '========================================='

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
  END as "프로젝트",
  COUNT(DISTINCT p.id) as "총권한"
FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id = r.id
LEFT JOIN permissions p ON p.id = rp.permission_id
WHERE r.code IN ('ADMIN', 'MANAGEMENT', 'RESEARCHER', 'RESEARCH_DIRECTOR', 'EMPLOYEE')
GROUP BY r.code, r.name_ko, r.priority
ORDER BY r.priority DESC;
