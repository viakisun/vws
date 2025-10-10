-- Migration 008: Add salary management permission
-- 급여관리 페이지 전용 권한 추가

BEGIN;

-- salary.management 권한 생성 (급여 관리자만)
INSERT INTO permissions (code, resource, action, description, scope)
SELECT 'salary.management.read', 'salary.management', 'read', '급여 관리 시스템 접근', 'all'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions 
  WHERE resource = 'salary.management' AND action = 'read'
);

-- ADMIN에게 부여
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'ADMIN'
  AND p.resource = 'salary.management'
  AND p.action = 'read'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp2
    WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
  );

-- HR_MANAGER에게 부여
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'HR_MANAGER'
  AND p.resource = 'salary.management'
  AND p.action = 'read'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp2
    WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
  );

-- MANAGEMENT에게 부여
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'MANAGEMENT'
  AND p.resource = 'salary.management'
  AND p.action = 'read'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp2
    WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
  );

-- 권한 캐시 초기화
DELETE FROM permission_cache;

-- 확인
SELECT 
  r.name_ko as "역할",
  COUNT(CASE WHEN p.resource = 'salary.management' THEN 1 END) as "급여관리 권한",
  COUNT(CASE WHEN p.resource = 'hr.payslips' THEN 1 END) as "급여명세서 권한"
FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id = r.id
LEFT JOIN permissions p ON p.id = rp.permission_id
WHERE r.code IN ('ADMIN', 'HR_MANAGER', 'MANAGEMENT', 'RESEARCHER')
GROUP BY r.code, r.name_ko, r.priority
ORDER BY r.priority DESC;

COMMIT;
