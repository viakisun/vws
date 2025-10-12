-- =====================================================
-- Migration 003: Sales to CRM Refactoring
-- =====================================================
-- 목적: Sales 관련 모든 테이블을 CRM으로 리네이밍
-- 날짜: 2025-10-12
-- 설명: 업계 표준에 맞춰 Sales → CRM으로 아키텍처 변경
-- =====================================================

-- Step 1: 테이블 이름 변경
-- 주의: Foreign key가 있는 테이블은 의존성 순서대로 변경

ALTER TABLE sales_customers RENAME TO crm_customers;
ALTER TABLE sales_opportunities RENAME TO crm_opportunities;
ALTER TABLE sales_quotations RENAME TO crm_quotations;
ALTER TABLE sales_contracts RENAME TO crm_contracts;
ALTER TABLE sales_transactions RENAME TO crm_transactions;
ALTER TABLE sales_invoices RENAME TO crm_invoices;

-- Step 2: Primary Key 제약조건 이름 변경
ALTER TABLE crm_customers 
  RENAME CONSTRAINT sales_customers_pkey TO crm_customers_pkey;

ALTER TABLE crm_opportunities 
  RENAME CONSTRAINT sales_opportunities_pkey TO crm_opportunities_pkey;

ALTER TABLE crm_quotations 
  RENAME CONSTRAINT sales_quotations_pkey TO crm_quotations_pkey;

ALTER TABLE crm_contracts 
  RENAME CONSTRAINT sales_contracts_pkey TO crm_contracts_pkey;

ALTER TABLE crm_transactions 
  RENAME CONSTRAINT sales_transactions_pkey TO crm_transactions_pkey;

ALTER TABLE crm_invoices 
  RENAME CONSTRAINT sales_invoices_pkey TO crm_invoices_pkey;

-- Step 3: Foreign Key 제약조건 이름 변경
ALTER TABLE crm_opportunities 
  RENAME CONSTRAINT sales_opportunities_customer_id_fkey TO crm_opportunities_customer_id_fkey;

ALTER TABLE crm_contracts 
  RENAME CONSTRAINT sales_contracts_customer_id_fkey TO crm_contracts_customer_id_fkey;

ALTER TABLE crm_transactions 
  RENAME CONSTRAINT sales_transactions_contract_id_fkey TO crm_transactions_contract_id_fkey;

ALTER TABLE crm_transactions 
  RENAME CONSTRAINT sales_transactions_customer_id_fkey TO crm_transactions_customer_id_fkey;

ALTER TABLE crm_quotations 
  RENAME CONSTRAINT sales_quotations_customer_id_fkey TO crm_quotations_customer_id_fkey;

ALTER TABLE crm_quotations 
  RENAME CONSTRAINT sales_quotations_opportunity_id_fkey TO crm_quotations_opportunity_id_fkey;

ALTER TABLE crm_invoices 
  RENAME CONSTRAINT sales_invoices_customer_id_fkey TO crm_invoices_customer_id_fkey;

ALTER TABLE crm_invoices 
  RENAME CONSTRAINT sales_invoices_contract_id_fkey TO crm_invoices_contract_id_fkey;

ALTER TABLE crm_invoices 
  RENAME CONSTRAINT sales_invoices_quotation_id_fkey TO crm_invoices_quotation_id_fkey;

-- Step 4: evidence_items 테이블의 FK 제약조건 업데이트
-- (sales_customers를 참조하는 외부 테이블)
ALTER TABLE evidence_items 
  RENAME CONSTRAINT fk_evidence_items_vendor TO fk_evidence_items_vendor_crm;

-- Step 5: Check 제약조건 이름 변경 (있는 경우)
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN 
        SELECT conname, conrelid::regclass::text as table_name
        FROM pg_constraint 
        WHERE contype = 'c' 
        AND conrelid::regclass::text IN ('crm_customers', 'crm_opportunities', 'crm_quotations', 'crm_contracts', 'crm_transactions', 'crm_invoices')
        AND conname LIKE 'sales_%'
    LOOP
        EXECUTE format('ALTER TABLE %I RENAME CONSTRAINT %I TO %I',
            constraint_rec.table_name,
            constraint_rec.conname,
            replace(constraint_rec.conname, 'sales_', 'crm_')
        );
    END LOOP;
END $$;

-- Step 6: 인덱스 이름 변경
DO $$
DECLARE
    index_rec RECORD;
BEGIN
    FOR index_rec IN 
        SELECT indexname, tablename
        FROM pg_indexes 
        WHERE schemaname = 'public'
        AND indexname LIKE 'sales_%'
    LOOP
        EXECUTE format('ALTER INDEX %I RENAME TO %I',
            index_rec.indexname,
            replace(index_rec.indexname, 'sales_', 'crm_')
        );
    END LOOP;
END $$;

-- Step 7: 시퀀스 이름 변경 (있는 경우)
DO $$
DECLARE
    seq_rec RECORD;
BEGIN
    FOR seq_rec IN 
        SELECT sequencename
        FROM pg_sequences 
        WHERE schemaname = 'public'
        AND sequencename LIKE 'sales_%'
    LOOP
        EXECUTE format('ALTER SEQUENCE %I RENAME TO %I',
            seq_rec.sequencename,
            replace(seq_rec.sequencename, 'sales_', 'crm_')
        );
    END LOOP;
END $$;

-- Step 8: 검증 쿼리 (마이그레이션 후 확인용)
-- 아래 쿼리들은 주석 처리하고, 마이그레이션 후 수동 실행 권장

-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'crm_%';
-- SELECT conname, conrelid::regclass FROM pg_constraint WHERE conrelid::regclass::text LIKE 'crm_%';
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'crm_%';

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE 'Migration 003 completed successfully!';
    RAISE NOTICE 'All sales_* tables renamed to crm_*';
    RAISE NOTICE 'Please verify foreign key relationships with: SELECT conname, conrelid::regclass, confrelid::regclass FROM pg_constraint WHERE contype = ''f'' AND (conrelid::regclass::text LIKE ''crm_%%'' OR confrelid::regclass::text LIKE ''crm_%%'');';
END $$;

