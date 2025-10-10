-- =============================================
-- 전체 역할별 플래너 권한 설정
-- =============================================
-- ADMIN, MANAGEMENT, RESEARCH_DIRECTOR 에게 플래너 권한 추가
-- =============================================

BEGIN;

-- 1. ADMIN: 플래너 전체 권한
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'ADMIN'),
  id
FROM permissions
WHERE resource LIKE 'planner.%'
ON CONFLICT DO NOTHING;

RAISE NOTICE '✓ ADMIN 플래너 권한 추가';

-- 2. MANAGEMENT: 플래너 읽기 권한만
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'MANAGEMENT'),
  id
FROM permissions
WHERE resource LIKE 'planner.%' AND action = 'read'
ON CONFLICT DO NOTHING;

RAISE NOTICE '✓ MANAGEMENT 플래너 읽기 권한 추가';

-- 3. RESEARCH_DIRECTOR: 플래너 전체 권한
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'RESEARCH_DIRECTOR'),
  id
FROM permissions
WHERE resource LIKE 'planner.%'
ON CONFLICT DO NOTHING;

RAISE NOTICE '✓ RESEARCH_DIRECTOR 플래너 권한 추가';

-- 4. 권한 캐시 무효화
DELETE FROM permission_cache
WHERE user_id IN (
  SELECT user_id FROM user_roles 
  WHERE role_id IN (
    SELECT id FROM roles 
    WHERE code IN ('ADMIN', 'MANAGEMENT', 'RESEARCH_DIRECTOR', 'RESEARCHER')
  )
  AND is_active = true
);

RAISE NOTICE '✓ 권한 캐시 무효화 완료';
RAISE NOTICE '';

-- 5. 전체 권한 매트릭스 확인
RAISE NOTICE '========================================';
RAISE NOTICE '전체 권한 매트릭스';
RAISE NOTICE '========================================';

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

COMMIT;

RAISE NOTICE '';
RAISE NOTICE '✅ 전체 역할 플래너 권한 설정 완료!';
