-- =============================================
-- Migration 012: ADMIN에게 모든 권한 할당
-- =============================================
-- 목적: ADMIN 역할이 시스템의 모든 권한을 가지도록 보장
-- 날짜: 2025-10-10
-- =============================================

BEGIN;

-- ADMIN 역할에게 모든 권한 할당 (이미 있는 것은 무시)
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'ADMIN') as role_id,
  p.id as permission_id
FROM permissions p
WHERE NOT EXISTS (
  SELECT 1
  FROM role_permissions rp
  WHERE rp.role_id = (SELECT id FROM roles WHERE code = 'ADMIN')
    AND rp.permission_id = p.id
);

-- 결과 확인
DO $$
DECLARE
  admin_perm_count INTEGER;
  total_perm_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_perm_count
  FROM role_permissions rp
  WHERE rp.role_id = (SELECT id FROM roles WHERE code = 'ADMIN');
  
  SELECT COUNT(*) INTO total_perm_count
  FROM permissions;
  
  RAISE NOTICE 'ADMIN now has % out of % total permissions', admin_perm_count, total_perm_count;
  
  IF admin_perm_count = total_perm_count THEN
    RAISE NOTICE '✅ ADMIN has all permissions!';
  ELSE
    RAISE WARNING '⚠️  ADMIN is missing % permissions', (total_perm_count - admin_perm_count);
  END IF;
END $$;

COMMIT;
