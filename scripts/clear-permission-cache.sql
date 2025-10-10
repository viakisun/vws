-- =============================================
-- Clear Permission Cache
-- =============================================
-- 권한 변경 후 캐시를 초기화하여 새로운 권한을 로드하도록 함
-- =============================================

BEGIN;

-- 캐시 초기화 전 카운트
SELECT COUNT(*) as "Cache entries before clear" FROM permission_cache;

-- 모든 캐시 삭제
DELETE FROM permission_cache;

-- 초기화 확인
SELECT COUNT(*) as "Cache entries after clear" FROM permission_cache;

SELECT '✅ Permission cache cleared! Please restart server and re-login.' as status;

COMMIT;
