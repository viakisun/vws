-- 연구활동비 하위 카테고리들을 연구활동비(3001)로 통합
-- 연구용역비(3002), 국내여비(3003), 회의비(3005), 업무추진비(3006) → 연구활동비(3001)

-- 1. 연구활동비(3001) 카테고리 ID 가져오기 (변수 대신 서브쿼리 사용)
-- 2. 모든 하위 카테고리의 증빙을 연구활동비로 이동

UPDATE evidence_items
SET category_id = (SELECT id FROM evidence_categories WHERE code = '3001')
WHERE category_id IN (
  SELECT id FROM evidence_categories 
  WHERE code IN ('3002', '3003', '3005', '3006')
);

-- 3. 통합 결과 확인용 코멘트
COMMENT ON TABLE evidence_items IS '연구활동비 통합 완료: 3002, 3003, 3005, 3006 → 3001';

-- 4. 하위 카테고리들을 비활성화 (삭제하지 않고 보관)
UPDATE evidence_categories
SET is_active = false, 
    parent_code = '3001',
    description = COALESCE(description, '') || ' (통합됨 - 현재 연구활동비로 관리)'
WHERE code IN ('3002', '3003', '3005', '3006');

-- 5. 연구활동비 설명 업데이트
UPDATE evidence_categories
SET description = '연구용역비, 출장비, 회의비, 업무추진비 등 모든 연구활동 관련 비용 (통합 관리)'
WHERE code = '3001';

-- 6. 통합 결과 출력
SELECT 
  '통합 완료' as status,
  COUNT(*) as total_items,
  SUM(spent_amount) as total_amount
FROM evidence_items ei
JOIN evidence_categories ec ON ei.category_id = ec.id
WHERE ec.code = '3001';

