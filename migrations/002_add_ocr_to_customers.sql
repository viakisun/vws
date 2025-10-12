-- =====================================================
-- Migration 002: Add OCR fields to customers
-- =====================================================
-- 목적: CRM 고객 정보에 OCR 관련 필드 추가
-- 날짜: 2025-10-12
-- 설명: 사업자등록증 및 통장사본 OCR 데이터 저장을 위한 컬럼 추가
-- =====================================================

-- sales_customers 테이블에 OCR 관련 필드 추가
ALTER TABLE public.sales_customers
  ADD COLUMN IF NOT EXISTS business_registration_file_url TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_file_url TEXT,
  ADD COLUMN IF NOT EXISTS representative_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS business_address TEXT,
  ADD COLUMN IF NOT EXISTS business_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS business_category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS establishment_date DATE,
  ADD COLUMN IF NOT EXISTS is_corporation BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS bank_name VARCHAR(50),
  ADD COLUMN IF NOT EXISTS account_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS account_holder VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ocr_processed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS ocr_confidence NUMERIC(5,2);

-- 사업자번호에 UNIQUE 제약조건 추가 (NULL 허용, 더미값 제외)
-- 000-00-00000 같은 테스트 데이터는 제외
CREATE UNIQUE INDEX IF NOT EXISTS sales_customers_business_number_unique 
  ON public.sales_customers (business_number) 
  WHERE business_number IS NOT NULL AND business_number != '000-00-00000';

-- 코멘트 추가
COMMENT ON COLUMN public.sales_customers.business_registration_file_url IS '사업자등록증 S3 URL';
COMMENT ON COLUMN public.sales_customers.bank_account_file_url IS '통장사본 S3 URL';
COMMENT ON COLUMN public.sales_customers.representative_name IS '대표자명';
COMMENT ON COLUMN public.sales_customers.business_address IS '사업장 주소';
COMMENT ON COLUMN public.sales_customers.business_type IS '업태';
COMMENT ON COLUMN public.sales_customers.business_category IS '종목';
COMMENT ON COLUMN public.sales_customers.establishment_date IS '개업일자';
COMMENT ON COLUMN public.sales_customers.is_corporation IS '법인여부';
COMMENT ON COLUMN public.sales_customers.bank_name IS '은행명';
COMMENT ON COLUMN public.sales_customers.account_number IS '계좌번호';
COMMENT ON COLUMN public.sales_customers.account_holder IS '예금주명';
COMMENT ON COLUMN public.sales_customers.ocr_processed_at IS 'OCR 처리 시각';
COMMENT ON COLUMN public.sales_customers.ocr_confidence IS 'OCR 신뢰도 (0-100)';

