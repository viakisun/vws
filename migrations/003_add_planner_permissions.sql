-- =============================================
-- Migration 003: 플래너 권한 추가 및 역할별 권한 재구성
-- =============================================

-- =============================================
-- 1. 플래너 권한 추가
-- =============================================

-- 플래너 권한 삽입
INSERT INTO permissions (code, resource, action, scope, description) VALUES
  ('planner.products.read', 'planner.products', 'read', 'all', '제품 조회'),
  ('planner.products.write', 'planner.products', 'write', 'all', '제품 생성/수정'),
  ('planner.products.delete', 'planner.products', 'delete', 'all', '제품 삭제'),
  ('planner.initiatives.read', 'planner.initiatives', 'read', 'all', '이니셔티브 조회'),
  ('planner.initiatives.write', 'planner.initiatives', 'write', 'all', '이니셔티브 생성/수정'),
  ('planner.initiatives.delete', 'planner.initiatives', 'delete', 'all', '이니셔티브 삭제'),
  ('planner.threads.read', 'planner.threads', 'read', 'all', '스레드 조회'),
  ('planner.threads.write', 'planner.threads', 'write', 'all', '스레드 생성/수정'),
  ('planner.threads.delete', 'planner.threads', 'delete', 'all', '스레드 삭제'),
  ('planner.formations.read', 'planner.formations', 'read', 'all', '포메이션 조회'),
  ('planner.formations.write', 'planner.formations', 'write', 'all', '포메이션 생성/수정'),
  ('planner.formations.delete', 'planner.formations', 'delete', 'all', '포메이션 삭제'),
  ('planner.milestones.read', 'planner.milestones', 'read', 'all', '마일스톤 조회'),
  ('planner.milestones.write', 'planner.milestones', 'write', 'all', '마일스톤 생성/수정'),
  ('planner.milestones.delete', 'planner.milestones', 'delete', 'all', '마일스톤 삭제')
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 2. ADMIN: 플래너 권한 추가 (이미 모든 권한 보유)
-- =============================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'ADMIN'),
  id
FROM permissions
WHERE resource LIKE 'planner.%'
ON CONFLICT DO NOTHING;

-- =============================================
-- 3. RESEARCHER: 프로젝트 관리 권한 제거 및 플래너 권한 추가
-- =============================================

-- 연구원의 프로젝트 관리 권한 제거
DELETE FROM role_permissions
WHERE role_id = (SELECT id FROM roles WHERE code = 'RESEARCHER')
  AND permission_id IN (
    SELECT id FROM permissions WHERE resource LIKE 'project.%'
  );

-- 연구원에게 플래너 전체 권한 부여
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'RESEARCHER'),
  id
FROM permissions
WHERE resource LIKE 'planner.%'
ON CONFLICT DO NOTHING;

-- =============================================
-- 4. MANAGEMENT: 플래너 읽기 권한 추가
-- =============================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'MANAGEMENT'),
  id
FROM permissions
WHERE resource LIKE 'planner.%' AND action = 'read'
ON CONFLICT DO NOTHING;

-- =============================================
-- 5. RESEARCH_DIRECTOR: 플래너 권한 상속 (연구원의 상위 역할)
-- =============================================

-- 연구소장도 플래너 전체 권한 부여 (연구원의 상위 역할)
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'RESEARCH_DIRECTOR'),
  id
FROM permissions
WHERE resource LIKE 'planner.%'
ON CONFLICT DO NOTHING;

-- =============================================
-- 6. 권한 캐시 무효화
-- =============================================

-- 영향받는 사용자들의 권한 캐시 삭제
DELETE FROM permission_cache
WHERE user_id IN (
  SELECT user_id FROM user_roles 
  WHERE role_id IN (
    SELECT id FROM roles 
    WHERE code IN ('RESEARCHER', 'RESEARCH_DIRECTOR', 'MANAGEMENT', 'ADMIN')
  )
  AND is_active = true
);

-- =============================================
-- 7. 권한 매트릭스 확인 쿼리 (선택적 실행)
-- =============================================

-- 역할별 플래너 권한 확인
-- SELECT 
--   r.code as role_code,
--   r.name_ko as role_name,
--   p.resource,
--   p.action,
--   CASE 
--     WHEN rp.role_id IS NOT NULL THEN 'O'
--     ELSE 'X'
--   END as has_permission
-- FROM roles r
-- CROSS JOIN (
--   SELECT DISTINCT resource, action 
--   FROM permissions 
--   WHERE resource LIKE 'planner.%'
-- ) p
-- LEFT JOIN role_permissions rp ON rp.role_id = r.id 
--   AND rp.permission_id IN (
--     SELECT id FROM permissions 
--     WHERE resource = p.resource AND action = p.action
--   )
-- WHERE r.code IN ('ADMIN', 'MANAGEMENT', 'RESEARCHER', 'RESEARCH_DIRECTOR', 'EMPLOYEE')
-- ORDER BY r.priority DESC, p.resource, p.action;

-- =============================================
-- 완료 메시지
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE '플래너 권한 마이그레이션 완료';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✓ 플래너 권한 15개 추가 (products, initiatives, threads, formations, milestones)';
  RAISE NOTICE '✓ RESEARCHER: 프로젝트 관리 권한 제거, 플래너 전체 권한 추가';
  RAISE NOTICE '✓ RESEARCH_DIRECTOR: 플래너 전체 권한 추가';
  RAISE NOTICE '✓ MANAGEMENT: 플래너 읽기 권한 추가';
  RAISE NOTICE '✓ ADMIN: 플래너 전체 권한 추가';
  RAISE NOTICE '✓ 권한 캐시 무효화 완료';
  RAISE NOTICE '===========================================';
END $$;
