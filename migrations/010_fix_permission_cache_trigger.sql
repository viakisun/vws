-- Migration 010: Fix invalidate_permission_cache function
-- user_roles → employee_roles로 수정

BEGIN;

-- 1. 기존 함수 삭제
DROP FUNCTION IF EXISTS invalidate_permission_cache() CASCADE;

-- 2. 수정된 함수 생성
CREATE OR REPLACE FUNCTION invalidate_permission_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- employee_roles 테이블 변경 시 캐시 무효화
  IF TG_TABLE_NAME = 'employee_roles' THEN
    DELETE FROM permission_cache
    WHERE employee_id = COALESCE(NEW.employee_id, OLD.employee_id);
    
  -- role_permissions 테이블 변경 시 해당 역할을 가진 모든 직원의 캐시 무효화
  ELSIF TG_TABLE_NAME = 'role_permissions' THEN
    DELETE FROM permission_cache
    WHERE employee_id IN (
      SELECT employee_id FROM employee_roles 
      WHERE role_id = COALESCE(NEW.role_id, OLD.role_id) AND is_active = true
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. 트리거 재생성
DROP TRIGGER IF EXISTS trigger_invalidate_cache_on_employee_role_change ON employee_roles;
CREATE TRIGGER trigger_invalidate_cache_on_employee_role_change
  AFTER INSERT OR UPDATE OR DELETE ON employee_roles
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_permission_cache();

DROP TRIGGER IF EXISTS trigger_invalidate_cache_on_role_permission_change ON role_permissions;
CREATE TRIGGER trigger_invalidate_cache_on_role_permission_change
  AFTER INSERT OR UPDATE OR DELETE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_permission_cache();

-- 4. 테스트 확인
SELECT 
  t.tgname as trigger_name,
  t.tgrelid::regclass as table_name,
  p.proname as function_name,
  CASE t.tgenabled
    WHEN 'O' THEN 'enabled'
    WHEN 'D' THEN 'disabled'
    ELSE 'unknown'
  END as status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE p.proname = 'invalidate_permission_cache';

COMMIT;
