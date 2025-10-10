-- Complete fix: Drop everything and recreate

BEGIN;

-- 1. 모든 트리거 삭제
DROP TRIGGER IF EXISTS trigger_invalidate_cache_on_employee_role_change ON employee_roles CASCADE;
DROP TRIGGER IF EXISTS trigger_invalidate_cache_on_role_permission_change ON role_permissions CASCADE;

-- 2. 모든 함수 버전 삭제
DROP FUNCTION IF EXISTS invalidate_permission_cache() CASCADE;

-- 3. 새 함수 생성 (employee_roles 기반)
CREATE OR REPLACE FUNCTION invalidate_permission_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- employee_roles 테이블 변경 시
  IF TG_TABLE_NAME = 'employee_roles' THEN
    DELETE FROM permission_cache
    WHERE employee_id = COALESCE(NEW.employee_id, OLD.employee_id);
    
  -- role_permissions 테이블 변경 시
  ELSIF TG_TABLE_NAME = 'role_permissions' THEN
    DELETE FROM permission_cache
    WHERE employee_id IN (
      SELECT employee_id FROM employee_roles 
      WHERE role_id = COALESCE(NEW.role_id, OLD.role_id) 
        AND is_active = true
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. 트리거 재생성
CREATE TRIGGER trigger_invalidate_cache_on_employee_role_change
  AFTER INSERT OR UPDATE OR DELETE ON employee_roles
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_permission_cache();

CREATE TRIGGER trigger_invalidate_cache_on_role_permission_change
  AFTER INSERT OR UPDATE OR DELETE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_permission_cache();

-- 5. 확인
SELECT 'Triggers created successfully' as status;

COMMIT;
