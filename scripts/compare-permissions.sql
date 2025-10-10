-- =============================================
-- Compare ADMIN and RESEARCHER Permissions
-- =============================================

-- 전체 권한 수
SELECT '📊 Total Permissions' as info, COUNT(*) as count FROM permissions;

-- 각 역할별 권한 수
SELECT 
  '👑 Role Permission Counts' as info,
  r.code as role_code,
  r.name_ko as role_name,
  COUNT(p.id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE r.code IN ('ADMIN', 'RESEARCHER')
GROUP BY r.code, r.name_ko
ORDER BY r.code;

-- Planner 권한 비교
SELECT 
  '🎯 Planner Permissions by Role' as info,
  r.code as role_code,
  p.code as permission_code
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.code IN ('ADMIN', 'RESEARCHER')
  AND p.resource LIKE 'planner.%'
ORDER BY r.code, p.code;

-- ADMIN이 가지고 있지 않은 권한 (있으면 안됨)
SELECT 
  '⚠️  Permissions ADMIN is missing' as info,
  p.code as missing_permission
FROM permissions p
WHERE p.id NOT IN (
  SELECT rp.permission_id
  FROM role_permissions rp
  WHERE rp.role_id = (SELECT id FROM roles WHERE code = 'ADMIN')
)
ORDER BY p.code;
