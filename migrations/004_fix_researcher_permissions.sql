-- =============================================
-- 연구원(RESEARCHER) 권한 설정
-- =============================================
-- 기본 권한 + 플래너 전체 권한 부여
-- =============================================

BEGIN;

-- 1. 기존 연구원 권한 모두 제거 (깨끗하게 시작)
DELETE FROM role_permissions 
WHERE role_id = (SELECT id FROM roles WHERE code = 'RESEARCHER');

RAISE NOTICE '✓ 연구원 기존 권한 제거 완료';

-- 2. 기본 공통 권한 추가 (모든 직원이 가져야 하는 것들)
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'RESEARCHER'),
  id
FROM permissions
WHERE code IN (
  'common.dashboard.read',      -- 대시보드 조회
  'common.profile.read',         -- 개인 프로필 조회
  'common.profile.write',        -- 개인 프로필 수정
  'hr.payslips.read.own',        -- 본인 급여명세서 조회
  'hr.attendance.read.own',      -- 본인 근태 조회
  'hr.leaves.read.own'           -- 본인 연차 조회
)
ON CONFLICT DO NOTHING;

RAISE NOTICE '✓ 기본 권한 6개 추가 완료';

-- 3. 플래너 전체 권한 추가 (read, write, delete)
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'RESEARCHER'),
  id
FROM permissions
WHERE resource LIKE 'planner.%'
ON CONFLICT DO NOTHING;

RAISE NOTICE '✓ 플래너 권한 15개 추가 완료';

-- 4. 결과 확인
DO $$
DECLARE
  common_count INTEGER;
  planner_count INTEGER;
  total_count INTEGER;
BEGIN
  -- 공통 권한 개수
  SELECT COUNT(*) INTO common_count
  FROM role_permissions rp
  JOIN roles r ON r.id = rp.role_id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE r.code = 'RESEARCHER' 
    AND p.resource LIKE 'common.%' OR p.resource LIKE 'hr.%';

  -- 플래너 권한 개수
  SELECT COUNT(*) INTO planner_count
  FROM role_permissions rp
  JOIN roles r ON r.id = rp.role_id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE r.code = 'RESEARCHER' 
    AND p.resource LIKE 'planner.%';

  -- 전체 권한 개수
  SELECT COUNT(*) INTO total_count
  FROM role_permissions rp
  JOIN roles r ON r.id = rp.role_id
  WHERE r.code = 'RESEARCHER';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '연구원(RESEARCHER) 권한 설정 완료';
  RAISE NOTICE '========================================';
  RAISE NOTICE '공통/인사 권한: % 개', common_count;
  RAISE NOTICE '플래너 권한:     % 개', planner_count;
  RAISE NOTICE '총 권한:         % 개', total_count;
  RAISE NOTICE '========================================';
END $$;

-- 5. 권한 캐시 무효화 (연구원 사용자들)
DELETE FROM permission_cache
WHERE user_id IN (
  SELECT user_id FROM user_roles 
  WHERE role_id = (SELECT id FROM roles WHERE code = 'RESEARCHER')
    AND is_active = true
);

RAISE NOTICE '✓ 권한 캐시 무효화 완료';

-- 6. 권한 매트릭스 확인
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
  COUNT(DISTINCT p.id) as "총권한"
FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id = r.id
LEFT JOIN permissions p ON p.id = rp.permission_id
WHERE r.code = 'RESEARCHER'
GROUP BY r.code, r.name_ko;

-- 7. 연구원 상세 권한 목록
SELECT 
  p.resource,
  p.action,
  p.description
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.code = 'RESEARCHER'
ORDER BY p.resource, p.action;

COMMIT;

RAISE NOTICE '';
RAISE NOTICE '✅ 모든 작업 완료!';
