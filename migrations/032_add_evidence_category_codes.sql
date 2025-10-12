-- 1. evidence_categories 테이블에 code 컬럼 추가
ALTER TABLE evidence_categories 
ADD COLUMN IF NOT EXISTS code VARCHAR(10),
ADD COLUMN IF NOT EXISTS parent_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. 기존 카테고리에 코드 할당
UPDATE evidence_categories SET code = '1001', display_order = 10 WHERE name = '인건비' AND code IS NULL;
UPDATE evidence_categories SET code = '2001', display_order = 20 WHERE name = '연구재료비' AND code IS NULL;
UPDATE evidence_categories SET code = '2002', display_order = 21 WHERE name = '재료비' AND code IS NULL;
UPDATE evidence_categories SET code = '3001', display_order = 30 WHERE name = '연구활동비' AND code IS NULL;
UPDATE evidence_categories SET code = '9001', display_order = 90 WHERE name = '간접비' AND code IS NULL;

-- 3. 새 카테고리 추가
INSERT INTO evidence_categories (code, name, description, display_order, is_active)
VALUES 
  ('2003', '시제품제작경비', '시제품 및 프로토타입 제작 비용', 22, true),
  ('3002', '연구용역비', '외주 용역 비용', 31, true),
  ('3003', '국내여비', '국내 출장 관련 비용', 32, true),
  ('3005', '회의비', '회의 관련 비용', 33, true),
  ('3006', '업무추진비', '사업 추진 관련 비용', 34, true)
ON CONFLICT DO NOTHING;

-- 4. 코드 unique 제약 및 필수 제약 추가 (중복 방지)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'evidence_categories_code_unique'
    ) THEN
        ALTER TABLE evidence_categories 
        ADD CONSTRAINT evidence_categories_code_unique UNIQUE (code);
    END IF;
END $$;

-- NULL이 아닌 경우만 NOT NULL 제약 추가
UPDATE evidence_categories SET code = '0000' WHERE code IS NULL;
ALTER TABLE evidence_categories ALTER COLUMN code SET NOT NULL;

-- 5. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_evidence_categories_code 
  ON evidence_categories(code);
CREATE INDEX IF NOT EXISTS idx_evidence_categories_parent_code 
  ON evidence_categories(parent_code);
CREATE INDEX IF NOT EXISTS idx_evidence_categories_display_order 
  ON evidence_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_evidence_categories_is_active 
  ON evidence_categories(is_active);

-- 6. 컬럼 설명 추가
COMMENT ON COLUMN evidence_categories.code 
  IS '카테고리 코드 (예: 1001=인건비, 2001=연구재료비, 3001=연구활동비)';
COMMENT ON COLUMN evidence_categories.parent_code 
  IS '상위 카테고리 코드 (계층 구조용)';
COMMENT ON COLUMN evidence_categories.display_order 
  IS '표시 순서';
COMMENT ON COLUMN evidence_categories.is_active 
  IS '활성화 여부';

