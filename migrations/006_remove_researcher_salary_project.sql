-- Migration 006: Remove salary and project permissions from RESEARCHER role
-- Date: 2025-10-10
-- Description: 연구원에게서 급여관리와 프로젝트 관리 권한 삭제

BEGIN;

-- 연구원의 급여관리 권한 삭제
DELETE FROM role_permissions
WHERE role_id = (SELECT id FROM roles WHERE code = 'RESEARCHER')
  AND permission_id IN (
    SELECT id FROM permissions 
    WHERE resource LIKE 'salary.%'
  );

-- 연구원의 프로젝트 관리 권한 삭제
DELETE FROM role_permissions
WHERE role_id = (SELECT id FROM roles WHERE code = 'RESEARCHER')
  AND permission_id IN (
    SELECT id FROM permissions 
    WHERE resource LIKE 'project.%'
  );

-- 권한 캐시 초기화
DELETE FROM permission_cache;

-- 최종 확인
SELECT 
  '✅ 연구원 권한 삭제 완료' as status,
  COUNT(*) as remaining_permissions
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
WHERE r.code = 'RESEARCHER';

-- 연구원 권한 목록 확인
SELECT 
  p.resource,
  COUNT(*) as action_count
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.code = 'RESEARCHER'
GROUP BY p.resource
ORDER BY p.resource;

COMMIT;
