-- =====================================================
-- Migration 005: 사업자 유형 필드 추가
-- =====================================================
-- 목적: corporation_status (법인여부)를 더 구체적인 business_entity_type으로 확장
-- 날짜: 2025-10-12
-- 설명: 개인사업자, 법인사업자, 비영리법인, 공공기관, 협동조합, 외국법인 구분
-- =====================================================

-- 사업자 유형 ENUM 타입 생성
DO $$ BEGIN
    CREATE TYPE business_entity_type AS ENUM (
        'individual',    -- 개인사업자
        'corporation',   -- 법인사업자
        'nonprofit',     -- 비영리법인
        'public',        -- 공공기관
        'cooperative',   -- 협동조합
        'foreign'        -- 외국법인
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- crm_customers 테이블에 business_entity_type 컬럼 추가
ALTER TABLE public.crm_customers
  ADD COLUMN IF NOT EXISTS business_entity_type business_entity_type DEFAULT 'individual';

-- 기존 corporation_status 값을 기반으로 business_entity_type 초기화
UPDATE public.crm_customers
SET business_entity_type = CASE
    WHEN corporation_status = true THEN 'corporation'::business_entity_type
    ELSE 'individual'::business_entity_type
END
WHERE business_entity_type = 'individual';

-- 코멘트 추가
COMMENT ON COLUMN public.crm_customers.business_entity_type IS '사업자 유형 (개인사업자/법인사업자/비영리법인/공공기관/협동조합/외국법인)';

-- 로그
DO $$ BEGIN
    RAISE NOTICE 'Migration 005 completed: business_entity_type column added to crm_customers';
END $$;

