-- 1. evidence_items 테이블에 거래처 연동 및 세부 정보 필드 추가
ALTER TABLE evidence_items
ADD COLUMN IF NOT EXISTS vendor_id UUID,
ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS item_detail TEXT,
ADD COLUMN IF NOT EXISTS tax_amount BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. 외래키 제약 추가 (중복 방지)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_evidence_items_vendor'
    ) THEN
        ALTER TABLE evidence_items
        ADD CONSTRAINT fk_evidence_items_vendor
        FOREIGN KEY (vendor_id) REFERENCES sales_customers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. 금액 컬럼을 BIGINT로 변경 (기존이 DECIMAL인 경우)
DO $$ 
BEGIN
    -- budget_amount 컬럼 타입 확인 및 변경
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'evidence_items' 
        AND column_name = 'budget_amount' 
        AND data_type != 'bigint'
    ) THEN
        ALTER TABLE evidence_items 
        ALTER COLUMN budget_amount TYPE BIGINT USING budget_amount::BIGINT;
    END IF;
    
    -- spent_amount 컬럼 타입 확인 및 변경
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'evidence_items' 
        AND column_name = 'spent_amount' 
        AND data_type != 'bigint'
    ) THEN
        ALTER TABLE evidence_items 
        ALTER COLUMN spent_amount TYPE BIGINT USING spent_amount::BIGINT;
    END IF;
END $$;

-- 4. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_evidence_items_vendor_id 
  ON evidence_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_vendor_name 
  ON evidence_items(vendor_name);
CREATE INDEX IF NOT EXISTS idx_evidence_items_payment_date 
  ON evidence_items(payment_date);
CREATE INDEX IF NOT EXISTS idx_evidence_items_category_vendor 
  ON evidence_items(category_id, vendor_id);

-- 5. 컬럼 설명 추가
COMMENT ON COLUMN evidence_items.vendor_id 
  IS '거래처 ID (sales_customers 참조)';
COMMENT ON COLUMN evidence_items.vendor_name 
  IS '거래처명 (비정규화, 검색 및 표시용)';
COMMENT ON COLUMN evidence_items.item_detail 
  IS '품목 상세 (예: 시험용 드론 프레임, 라스베리파이 CM4)';
COMMENT ON COLUMN evidence_items.tax_amount 
  IS '세액 (원 단위)';
COMMENT ON COLUMN evidence_items.payment_date 
  IS '지급일';
COMMENT ON COLUMN evidence_items.notes 
  IS '비고';

