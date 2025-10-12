-- 증빙 항목에 고객 ID 추가
-- 인건비를 제외한 증빙 항목에서 고객 정보를 참조하여
-- 사업자등록증, 통장사본 등의 문서를 자동으로 연결

ALTER TABLE evidence_items
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES crm_customers(id);

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_evidence_items_customer_id 
  ON evidence_items(customer_id);

-- 컬럼 설명
COMMENT ON COLUMN evidence_items.customer_id IS '연결된 고객 ID (인건비 증빙 제외, CRM 고객과 연동)';

