-- =====================================================
-- Migration 004: SALES 역할을 CRM으로 통합
-- =====================================================
-- 목적: SALES 역할을 제거하고 CRM 역할로 통합
-- 날짜: 2025-10-12
-- 설명: /sales 라우트 제거 및 /crm 통합에 따른 역할 정리
-- =====================================================

-- 1. SALES 역할을 가진 사용자들을 CRM 역할로 업데이트
UPDATE user_roles
SET role_code = 'CRM'
WHERE role_code = 'SALES';

-- 2. SALES 역할을 가진 리소스 권한을 CRM으로 업데이트 (만약 있다면)
UPDATE role_resource_permissions
SET role_code = 'CRM'
WHERE role_code = 'SALES';

-- 3. SALES 역할 삭제
DELETE FROM roles
WHERE code = 'SALES';

-- 로그
DO $$ BEGIN
    RAISE NOTICE 'Migration 004 completed: SALES role migrated to CRM';
END $$;

