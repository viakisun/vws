-- Migration: Add VIA Institution and Populate Timeline Dates
-- Description: Add VIA (비아로보틱스) as an institution, convert VIA roles to deliverables, 
--              and assign target dates to all deliverables based on phase midpoints

-- ============================================================================
-- PART 1: Add VIA Institution for Both Projects
-- ============================================================================

-- Add VIA institution for smartfarm multirobot project
INSERT INTO rd_dev_institutions (id, project_id, institution_name, institution_type, role_description)
VALUES (
  gen_random_uuid(),
  'd4e3e077-d4c5-42d4-8a2f-1565951886e6',
  'VIA',
  '기업',
  'SaaS 통합 관제 시스템, AI 협업, UI/UX, 실증 환경 구축 및 데이터 분석'
);

-- Add VIA institution for worker_follow AMR project
INSERT INTO rd_dev_institutions (id, project_id, institution_name, institution_type, role_description)
VALUES (
  gen_random_uuid(),
  'c8ff67ba-99a3-4021-b3d6-079c1d341256',
  'VIA',
  '기업',
  'SaaS 통합 관제 시스템, AI 서비스, 자율주행 협업, UI/UX 개발, 실증 및 검증'
);

-- ============================================================================
-- PART 2: Add VIA Deliverables for Smartfarm Multirobot Project
-- ============================================================================

-- Phase 1-Year 1: SaaS Architecture (Target: Q3 2025)
INSERT INTO rd_dev_deliverables (id, project_id, phase_id, institution_id, title, description, deliverable_type, target_date, status)
SELECT 
  gen_random_uuid(),
  'd4e3e077-d4c5-42d4-8a2f-1565951886e6',
  (SELECT id FROM rd_dev_phases WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6' AND phase_number = 1 AND year_number = 1),
  (SELECT id FROM rd_dev_institutions WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6' AND institution_name = 'VIA'),
  'SaaS 기반 통합 관제 시스템 아키텍처',
  '클라우드 기반 SaaS 플랫폼 아키텍처 설계 및 통합관제 시스템 개발',
  '시스템',
  '2025-10-01',
  'planned';

-- Phase 1-Year 2: AI Service (Target: Q3 2026)
INSERT INTO rd_dev_deliverables (id, project_id, phase_id, institution_id, title, description, deliverable_type, target_date, status)
SELECT 
  gen_random_uuid(),
  'd4e3e077-d4c5-42d4-8a2f-1565951886e6',
  (SELECT id FROM rd_dev_phases WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6' AND phase_number = 1 AND year_number = 2),
  (SELECT id FROM rd_dev_institutions WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6' AND institution_name = 'VIA'),
  'AI 서비스 및 데이터 파이프라인',
  '인식 모델 데이터 파이프라인, AI 서비스 연동',
  '시스템',
  '2026-07-01',
  'planned';

-- Phase 1-Year 2: UI/UX (Target: Q4 2026)
INSERT INTO rd_dev_deliverables (id, project_id, phase_id, institution_id, title, description, deliverable_type, target_date, status)
SELECT 
  gen_random_uuid(),
  'd4e3e077-d4c5-42d4-8a2f-1565951886e6',
  (SELECT id FROM rd_dev_phases WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6' AND phase_number = 1 AND year_number = 2),
  (SELECT id FROM rd_dev_institutions WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6' AND institution_name = 'VIA'),
  'UI/UX 및 운영 기능',
  '다중 로봇 동시 제어·협업 기능 구현, 웹 기반 UI, 농장 환경 데이터 분석',
  '시스템',
  '2026-10-01',
  'planned';

-- Phase 2-Year 1: Field Testing (Target: Q3 2027)
INSERT INTO rd_dev_deliverables (id, project_id, phase_id, institution_id, title, description, deliverable_type, target_date, status)
SELECT 
  gen_random_uuid(),
  'd4e3e077-d4c5-42d4-8a2f-1565951886e6',
  (SELECT id FROM rd_dev_phases WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6' AND phase_number = 2 AND year_number = 1),
  (SELECT id FROM rd_dev_institutions WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6' AND institution_name = 'VIA'),
  '실증 환경 구축 및 데이터 분석',
  '실증 환경 구축, 알고리즘 통합/테스트, 상호작용/사용성 평가·데이터 분석',
  '실증',
  '2027-07-01',
  'planned';

-- ============================================================================
-- PART 3: Add VIA Deliverables for Worker Follow AMR Project
-- ============================================================================

-- Phase 1-Year 1: Control SaaS Architecture (Target: Q3 2025)
INSERT INTO rd_dev_deliverables (id, project_id, phase_id, institution_id, title, description, deliverable_type, target_date, status)
SELECT 
  gen_random_uuid(),
  'c8ff67ba-99a3-4021-b3d6-079c1d341256',
  (SELECT id FROM rd_dev_phases WHERE project_id = 'c8ff67ba-99a3-4021-b3d6-079c1d341256' AND phase_number = 1 AND year_number = 1),
  (SELECT id FROM rd_dev_institutions WHERE project_id = 'c8ff67ba-99a3-4021-b3d6-079c1d341256' AND institution_name = 'VIA'),
  '관제 SaaS 아키텍처/플랫폼',
  'MSA/EDA 기반 스마트팜 로봇 관제 아키텍처, 실시간 데이터 수집, 원격 관제·경로 최적화',
  '시스템',
  '2025-09-15',
  'planned';

-- Phase 1-Year 2: Vision AI Collaboration (Target: Q2 2026)
INSERT INTO rd_dev_deliverables (id, project_id, phase_id, institution_id, title, description, deliverable_type, target_date, status)
SELECT 
  gen_random_uuid(),
  'c8ff67ba-99a3-4021-b3d6-079c1d341256',
  (SELECT id FROM rd_dev_phases WHERE project_id = 'c8ff67ba-99a3-4021-b3d6-079c1d341256' AND phase_number = 1 AND year_number = 2),
  (SELECT id FROM rd_dev_institutions WHERE project_id = 'c8ff67ba-99a3-4021-b3d6-079c1d341256' AND institution_name = 'VIA'),
  '시각화 AI 협업',
  '경량화 모델, 실내 환경 최적화, 실시간 장애물/작업자 인식 서비스',
  '시스템',
  '2026-05-01',
  'planned';

-- Phase 1-Year 2: SLAM Collaboration (Target: Q3 2026)
INSERT INTO rd_dev_deliverables (id, project_id, phase_id, institution_id, title, description, deliverable_type, target_date, status)
SELECT 
  gen_random_uuid(),
  'c8ff67ba-99a3-4021-b3d6-079c1d341256',
  (SELECT id FROM rd_dev_phases WHERE project_id = 'c8ff67ba-99a3-4021-b3d6-079c1d341256' AND phase_number = 1 AND year_number = 2),
  (SELECT id FROM rd_dev_institutions WHERE project_id = 'c8ff67ba-99a3-4021-b3d6-079c1d341256' AND institution_name = 'VIA'),
  'SLAM/2D 맵·회피/경로계획 협업',
  '구동방식 최적화·소형화, 모듈형 센서 마운트, UWB·SLAM 기반 실내측위, 센서 융합 알고리즘 최적화',
  '시스템',
  '2026-08-01',
  'planned';

-- Phase 1-Year 2: UI/UX (Target: Q4 2026)
INSERT INTO rd_dev_deliverables (id, project_id, phase_id, institution_id, title, description, deliverable_type, target_date, status)
SELECT 
  gen_random_uuid(),
  'c8ff67ba-99a3-4021-b3d6-079c1d341256',
  (SELECT id FROM rd_dev_phases WHERE project_id = 'c8ff67ba-99a3-4021-b3d6-079c1d341256' AND phase_number = 1 AND year_number = 2),
  (SELECT id FROM rd_dev_institutions WHERE project_id = 'c8ff67ba-99a3-4021-b3d6-079c1d341256' AND institution_name = 'VIA'),
  'UI/UX 및 운영 기능',
  '로봇 상태, 제어, 시각화를 포함한 웹 기반 UI, 농장 환경 데이터 분석, 작업 계획·스케줄링',
  '시스템',
  '2026-11-01',
  'planned';

-- Phase 2-Year 1: Field Testing Data Analysis (Target: Q3 2027)
INSERT INTO rd_dev_deliverables (id, project_id, phase_id, institution_id, title, description, deliverable_type, target_date, status)
SELECT 
  gen_random_uuid(),
  'c8ff67ba-99a3-4021-b3d6-079c1d341256',
  (SELECT id FROM rd_dev_phases WHERE project_id = 'c8ff67ba-99a3-4021-b3d6-079c1d341256' AND phase_number = 2 AND year_number = 1),
  (SELECT id FROM rd_dev_institutions WHERE project_id = 'c8ff67ba-99a3-4021-b3d6-079c1d341256' AND institution_name = 'VIA'),
  '실증 데이터 분석',
  '성능지표 저장·시각화·리포트 자동 생성, 비즈니스 모델: 경제성/효율성 분석 연계',
  '실증',
  '2027-08-01',
  'planned';

-- ============================================================================
-- PART 4: Update Existing Deliverables with Target Dates (Smartfarm)
-- ============================================================================

-- Update deliverables for Phase 1-Year 1 (2025-04-01 to 2025-12-31)
-- Distribute across Q2, Q3, Q4 2025
UPDATE rd_dev_deliverables
SET target_date = '2025-06-15'
WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6'
  AND phase_id = (SELECT id FROM rd_dev_phases WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6' AND phase_number = 1 AND year_number = 1)
  AND target_date IS NULL
  AND title LIKE '%설계%';

UPDATE rd_dev_deliverables
SET target_date = '2025-08-31'
WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6'
  AND phase_id = (SELECT id FROM rd_dev_phases WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6' AND phase_number = 1 AND year_number = 1)
  AND target_date IS NULL
  AND (title LIKE '%지도%' OR title LIKE '%특성%' OR title LIKE '%데이터%');

UPDATE rd_dev_deliverables
SET target_date = '2025-11-30'
WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6'
  AND phase_id = (SELECT id FROM rd_dev_phases WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6' AND phase_number = 1 AND year_number = 1)
  AND target_date IS NULL;

-- Update deliverables for Phase 1-Year 2 (2026-01-01 to 2026-12-31)
-- Distribute across Q2, Q3, Q4 2026
UPDATE rd_dev_deliverables
SET target_date = '2026-05-31'
WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6'
  AND phase_id = (SELECT id FROM rd_dev_phases WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6' AND phase_number = 1 AND year_number = 2)
  AND target_date IS NULL
  AND (title LIKE '%지도%' OR title LIKE '%추적%');

UPDATE rd_dev_deliverables
SET target_date = '2026-08-31'
WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6'
  AND phase_id = (SELECT id FROM rd_dev_phases WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6' AND phase_number = 1 AND year_number = 2)
  AND target_date IS NULL
  AND (title LIKE '%엔드이펙터%' OR title LIKE '%시제품%');

UPDATE rd_dev_deliverables
SET target_date = '2026-11-30'
WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6'
  AND phase_id = (SELECT id FROM rd_dev_phases WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6' AND phase_number = 1 AND year_number = 2)
  AND target_date IS NULL;

-- Update deliverables for Phase 2-Year 1 (2027-01-01 to 2027-12-31)
-- Distribute across Q2, Q3, Q4 2027
UPDATE rd_dev_deliverables
SET target_date = '2027-05-31'
WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6'
  AND phase_id = (SELECT id FROM rd_dev_phases WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6' AND phase_number = 2 AND year_number = 1)
  AND target_date IS NULL
  AND (title LIKE '%최적화%' OR title LIKE '%통합%');

UPDATE rd_dev_deliverables
SET target_date = '2027-09-30'
WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6'
  AND phase_id = (SELECT id FROM rd_dev_phases WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6' AND phase_number = 2 AND year_number = 1)
  AND target_date IS NULL;

-- ============================================================================
-- PART 5: Update Existing Deliverables with Target Dates (Worker Follow)
-- ============================================================================

-- Update deliverables for Phase 1-Year 1
UPDATE rd_dev_deliverables
SET target_date = '2025-08-15'
WHERE project_id = 'c8ff67ba-99a3-4021-b3d6-079c1d341256'
  AND phase_id = (SELECT id FROM rd_dev_phases WHERE project_id = 'c8ff67ba-99a3-4021-b3d6-079c1d341256' AND phase_number = 1 AND year_number = 1)
  AND target_date IS NULL;

-- Update deliverables for Phase 1-Year 2
UPDATE rd_dev_deliverables
SET target_date = '2026-06-30'
WHERE project_id = 'c8ff67ba-99a3-4021-b3d6-079c1d341256'
  AND phase_id = (SELECT id FROM rd_dev_phases WHERE project_id = 'c8ff67ba-99a3-4021-b3d6-079c1d341256' AND phase_number = 1 AND year_number = 2)
  AND target_date IS NULL;

-- Update deliverables for Phase 2-Year 1
UPDATE rd_dev_deliverables
SET target_date = '2027-06-30'
WHERE project_id = 'c8ff67ba-99a3-4021-b3d6-079c1d341256'
  AND phase_id = (SELECT id FROM rd_dev_phases WHERE project_id = 'c8ff67ba-99a3-4021-b3d6-079c1d341256' AND phase_number = 2 AND year_number = 1)
  AND target_date IS NULL;

