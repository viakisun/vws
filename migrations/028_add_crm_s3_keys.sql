-- CRM 고객 문서에 s3Key 컬럼 추가
-- URL 대신 s3Key를 저장하여 보안 강화 (Presigned URL 방식)

ALTER TABLE crm_customers
  ADD COLUMN IF NOT EXISTS business_registration_s3_key TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_s3_key TEXT;

-- 기존 URL에서 s3Key 추출 (있는 경우)
UPDATE crm_customers
SET business_registration_s3_key = 
  CASE 
    WHEN business_registration_file_url LIKE '%amazonaws.com/%' THEN
      SUBSTRING(business_registration_file_url FROM 'amazonaws\.com/(.*)$')
    ELSE NULL
  END
WHERE business_registration_file_url IS NOT NULL;

UPDATE crm_customers
SET bank_account_s3_key = 
  CASE 
    WHEN bank_account_file_url LIKE '%amazonaws.com/%' THEN
      SUBSTRING(bank_account_file_url FROM 'amazonaws\.com/(.*)$')
    ELSE NULL
  END
WHERE bank_account_file_url IS NOT NULL;

-- 기존 URL 컬럼은 deprecated하지만 호환성을 위해 유지
COMMENT ON COLUMN crm_customers.business_registration_file_url IS 'Deprecated: Use business_registration_s3_key instead';
COMMENT ON COLUMN crm_customers.bank_account_file_url IS 'Deprecated: Use bank_account_s3_key instead';

