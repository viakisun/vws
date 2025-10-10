-- =============================================
-- Migration 014: RBAC 테이블 스키마 정리
-- =============================================
-- 목적: users 참조를 employees로 변경
-- role_permissions.granted_by_employee_id 이미 존재
-- user_roles 테이블은 실제로 employee_roles로 사용 중
-- =============================================

BEGIN;

-- 1. user_roles 테이블 확인 (존재하면 제거)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) THEN
    DROP TABLE user_roles CASCADE;
    RAISE NOTICE '✅ user_roles table dropped (replaced by employee_roles)';
  ELSE
    RAISE NOTICE 'ℹ️  user_roles table does not exist (already using employee_roles)';
  END IF;
END $$;

-- 2. role_permissions 테이블의 granted_by 컬럼 확인
DO $$
DECLARE
  has_granted_by BOOLEAN;
  has_granted_by_employee_id BOOLEAN;
BEGIN
  -- granted_by 컬럼 존재 확인
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'role_permissions'
      AND column_name = 'granted_by'
  ) INTO has_granted_by;
  
  -- granted_by_employee_id 컬럼 존재 확인
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'role_permissions'
      AND column_name = 'granted_by_employee_id'
  ) INTO has_granted_by_employee_id;
  
  RAISE NOTICE 'role_permissions columns:';
  RAISE NOTICE '  - granted_by: %', has_granted_by;
  RAISE NOTICE '  - granted_by_employee_id: %', has_granted_by_employee_id;
  
  -- granted_by 컬럼이 있으면 제거
  IF has_granted_by THEN
    ALTER TABLE role_permissions DROP COLUMN IF EXISTS granted_by CASCADE;
    RAISE NOTICE '✅ Removed granted_by column (uses granted_by_employee_id instead)';
  END IF;
END $$;

-- 3. employee_roles 테이블 구조 확인
DO $$
DECLARE
  employee_roles_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'employee_roles'
  ) INTO employee_roles_exists;
  
  IF employee_roles_exists THEN
    RAISE NOTICE '✅ employee_roles table exists';
  ELSE
    RAISE WARNING '⚠️  employee_roles table does not exist! Need to create it.';
  END IF;
END $$;

-- 4. 최종 RBAC 구조 확인
DO $$
DECLARE
  roles_count INTEGER;
  permissions_count INTEGER;
  role_perms_count INTEGER;
  employee_roles_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO roles_count FROM roles;
  SELECT COUNT(*) INTO permissions_count FROM permissions;
  SELECT COUNT(*) INTO role_perms_count FROM role_permissions;
  
  SELECT COUNT(*) INTO employee_roles_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'employee_roles';
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 RBAC System Status:';
  RAISE NOTICE '  ├─ roles: % rows', roles_count;
  RAISE NOTICE '  ├─ permissions: % rows', permissions_count;
  RAISE NOTICE '  ├─ role_permissions: % rows', role_perms_count;
  RAISE NOTICE '  └─ employee_roles: % (1=exists, 0=missing)', employee_roles_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ RBAC schema cleanup complete!';
END $$;

COMMIT;
