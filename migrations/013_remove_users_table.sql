-- =============================================
-- Migration 013: users 테이블 및 관련 테이블 제거
-- =============================================
-- 목적: 불필요한 users 테이블 제거
-- 현재 시스템은 system_accounts + employees로 작동
-- users 테이블은 코드에서 사용되지 않음
-- =============================================

BEGIN;

-- 1. 의존성 확인
DO $$
DECLARE
  users_exists BOOLEAN;
  user_sessions_exists BOOLEAN;
  audit_logs_exists BOOLEAN;
BEGIN
  -- users 테이블 존재 확인
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) INTO users_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_sessions'
  ) INTO user_sessions_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'audit_logs'
  ) INTO audit_logs_exists;
  
  RAISE NOTICE 'Table existence check:';
  RAISE NOTICE '  - users: %', users_exists;
  RAISE NOTICE '  - user_sessions: %', user_sessions_exists;
  RAISE NOTICE '  - audit_logs: %', audit_logs_exists;
END $$;

-- 2. 테이블 삭제
DO $$
BEGIN
  -- user_sessions 테이블 삭제
  DROP TABLE IF EXISTS user_sessions CASCADE;
  RAISE NOTICE '✅ user_sessions table dropped';

  -- audit_logs 테이블 삭제
  DROP TABLE IF EXISTS audit_logs CASCADE;
  RAISE NOTICE '✅ audit_logs table dropped';

  -- users 테이블 삭제
  DROP TABLE IF EXISTS users CASCADE;
  RAISE NOTICE '✅ users table dropped';

  -- 관련 트리거 및 함수 정리
  DROP TRIGGER IF EXISTS update_users_updated_at ON users;
  RAISE NOTICE '✅ Trigger dropped';
  
  DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
  RAISE NOTICE '✅ Function dropped';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Error during table removal: %', SQLERRM;
    RAISE;
END $$;

-- 6. 최종 확인
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM information_schema.tables
  WHERE table_schema = 'public' 
    AND table_name IN ('users', 'user_sessions', 'audit_logs');
  
  IF remaining_count = 0 THEN
    RAISE NOTICE '✅ All users-related tables successfully removed!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Current authentication system:';
    RAISE NOTICE '  ├─ system_accounts (시스템 관리자)';
    RAISE NOTICE '  └─ employees (일반 직원)';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 RBAC system:';
    RAISE NOTICE '  ├─ employee_roles (직원-역할 매핑)';
    RAISE NOTICE '  ├─ role_permissions (역할-권한 매핑)';
    RAISE NOTICE '  └─ permission_cache (권한 캐시)';
  ELSE
    RAISE WARNING '⚠️  Some tables still exist. Count: %', remaining_count;
  END IF;
END $$;

COMMIT;
