-- 산출물 의존성 추가 스크립트
-- 작업자 추종형 AMR 프로젝트의 주요 의존성 관계 정의

-- 먼저 산출물 ID를 변수로 저장 (예시)
-- 실제 실행 시에는 산출물 제목으로 ID를 찾아서 실행해야 함

-- 정원SFA의 산출물들 간 의존성
-- SLAM → 자율주행
INSERT INTO rd_dev_deliverable_dependencies (
  source_deliverable_id,
  target_deliverable_id,
  dependency_type,
  description,
  is_blocking
)
SELECT 
  (SELECT id FROM rd_dev_deliverables WHERE title LIKE '%SLAM%' LIMIT 1),
  (SELECT id FROM rd_dev_deliverables WHERE title LIKE '%Nav2%' LIMIT 1),
  '선행조건',
  'SLAM 맵이 생성되어야 Nav2 자율주행 가능',
  true
WHERE EXISTS (SELECT id FROM rd_dev_deliverables WHERE title LIKE '%SLAM%')
  AND EXISTS (SELECT id FROM rd_dev_deliverables WHERE title LIKE '%Nav2%');

-- 회피 알고리즘 → AMR 시작품
INSERT INTO rd_dev_deliverable_dependencies (
  source_deliverable_id,
  target_deliverable_id,
  dependency_type,
  description,
  is_blocking
)
SELECT 
  (SELECT id FROM rd_dev_deliverables WHERE title LIKE '%회피%' LIMIT 1),
  (SELECT id FROM rd_dev_deliverables WHERE title LIKE '%시작품%' LIMIT 1),
  '통합대상',
  '회피 알고리즘이 AMR 시작품에 통합되어야 함',
  true
WHERE EXISTS (SELECT id FROM rd_dev_deliverables WHERE title LIKE '%회피%')
  AND EXISTS (SELECT id FROM rd_dev_deliverables WHERE title LIKE '%시작품%');

-- BMS → 자동 충전
INSERT INTO rd_dev_deliverable_dependencies (
  source_deliverable_id,
  target_deliverable_id,
  dependency_type,
  description,
  is_blocking
)
SELECT 
  (SELECT id FROM rd_dev_deliverables WHERE title LIKE '%BMS%' LIMIT 1),
  (SELECT id FROM rd_dev_deliverables WHERE title LIKE '%충전%' LIMIT 1),
  '선행조건',
  'BMS 설계가 완료되어야 충전 스테이션 설계 가능',
  true
WHERE EXISTS (SELECT id FROM rd_dev_deliverables WHERE title LIKE '%BMS%')
  AND EXISTS (SELECT id FROM rd_dev_deliverables WHERE title LIKE '%충전%');

-- 충남대 AI 모델 → 정원SFA 제어
INSERT INTO rd_dev_deliverable_dependencies (
  source_deliverable_id,
  target_deliverable_id,
  dependency_type,
  description,
  is_blocking
)
SELECT 
  (SELECT id FROM rd_dev_deliverables WHERE title LIKE '%추종%' OR title LIKE '%제스처%' LIMIT 1),
  (SELECT id FROM rd_dev_deliverables WHERE title LIKE '%제어%' LIMIT 1),
  '입력데이터',
  '작업자 추종 모델의 출력이 AMR 제어의 입력',
  false
WHERE EXISTS (SELECT id FROM rd_dev_deliverables WHERE title LIKE '%추종%' OR title LIKE '%제스처%')
  AND EXISTS (SELECT id FROM rd_dev_deliverables WHERE title LIKE '%제어%');

-- 생기원 레일 인식 → 정원SFA 레일 진입
INSERT INTO rd_dev_deliverable_dependencies (
  source_deliverable_id,
  target_deliverable_id,
  dependency_type,
  description,
  is_blocking
)
SELECT 
  d1.id,
  d2.id,
  '통합대상',
  '레일 인식 센서 모듈이 AMR에 통합되어야 함',
  true
FROM rd_dev_deliverables d1
JOIN rd_dev_deliverables d2 ON true
JOIN rd_dev_institutions i1 ON d1.institution_id = i1.id
JOIN rd_dev_institutions i2 ON d2.institution_id = i2.id
WHERE i1.institution_name LIKE '%생산기술%'
  AND i2.institution_name LIKE '%정원%'
  AND d1.title LIKE '%레일%'
  AND d2.title LIKE '%진입%'
LIMIT 1;

SELECT COUNT(*) as total_dependencies FROM rd_dev_deliverable_dependencies;

