-- VIA Product Ecosystem - Full Initiatives Seeding
-- This script populates all initiatives for VIA's product taxonomy

-- Get the admin user ID (assuming first employee as seeder)
DO $$
DECLARE
    v_admin_id UUID;
    v_product_id UUID;

    -- Product IDs
    v_workstream_id UUID;
    v_danngam_id UUID;
    v_farmflow_id UUID;
    v_viahubdev_id UUID;
    v_eidryon_id UUID;
    v_floodeye_id UUID;
    v_aprofleet_id UUID;
    v_craneeyes_id UUID;
    v_cargolink_id UUID;
    v_growthai_id UUID;
    v_whizlink_id UUID;
    v_newlearn_id UUID;
    v_jb2_id UUID;
    v_fida_id UUID;
    v_kdsa_id UUID;

BEGIN
    -- Get admin user (first employee)
    SELECT id INTO v_admin_id FROM employees ORDER BY created_at LIMIT 1;

    -- Get all product IDs
    SELECT id INTO v_workstream_id FROM planner_products WHERE code = 'workstream';
    SELECT id INTO v_danngam_id FROM planner_products WHERE code = 'danngam';
    SELECT id INTO v_farmflow_id FROM planner_products WHERE code = 'farmflow';
    SELECT id INTO v_viahubdev_id FROM planner_products WHERE code = 'viahub-dev';
    SELECT id INTO v_eidryon_id FROM planner_products WHERE code = 'eidryon';
    SELECT id INTO v_floodeye_id FROM planner_products WHERE code = 'floodeye';
    SELECT id INTO v_aprofleet_id FROM planner_products WHERE code = 'aprofleet';
    SELECT id INTO v_craneeyes_id FROM planner_products WHERE code = 'craneeyes';
    SELECT id INTO v_cargolink_id FROM planner_products WHERE code = 'cargolink-gcs';
    SELECT id INTO v_growthai_id FROM planner_products WHERE code = 'growth-analysis-robot';
    SELECT id INTO v_whizlink_id FROM planner_products WHERE code = 'whizlink';
    SELECT id INTO v_newlearn_id FROM planner_products WHERE code = 'newlearn';
    SELECT id INTO v_jb2_id FROM planner_products WHERE code = 'jb2';
    SELECT id INTO v_fida_id FROM planner_products WHERE code = 'fida';
    SELECT id INTO v_kdsa_id FROM planner_products WHERE code = 'kdsa';

    -- ========================================
    -- CLOUD PLATFORMS
    -- ========================================

    -- WorkStream Initiatives
    INSERT INTO planner_initiatives (id, product_id, title, intent, state, owner_id, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_workstream_id, 'WorkOps 표준화 플랫폼 구축',
         '조직 단위 워크플로우를 AI 기반으로 분석·최적화하여 기업의 운영 효율을 극대화합니다. 각 부서와 팀의 작업 패턴을 학습하고, 병목 구간을 자동으로 식별하여 프로세스 개선안을 제시합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_workstream_id, '지능형 협업 엔진 개발',
         '일정, 리소스, 문서, 승인 프로세스를 자동으로 연결하는 통합 협업 시스템을 구축합니다. 팀원들의 작업 상태와 우선순위를 실시간으로 파악하여 최적의 협업 구조를 제안합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_workstream_id, '산업별 모듈형 SaaS 전환',
         'R&D Ops, Safety Ops, Field Ops 등 산업 특성에 맞는 모듈을 개발하여 다양한 기업 환경에 빠르게 적응 가능한 SaaS 플랫폼으로 전환합니다.',
         'shaping', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_workstream_id, '성과 기반 데이터 시각화',
         'KPI, 성과, 예산 데이터를 통합하여 경영진과 실무자 모두가 직관적으로 이해할 수 있는 대시보드를 구축합니다. 실시간 데이터 기반 의사결정을 지원합니다.',
         'active', v_admin_id, NOW(), NOW());

    -- DannGam Initiatives
    INSERT INTO planner_initiatives (id, product_id, title, intent, state, owner_id, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_danngam_id, '농작업 거래 자동화 시스템',
         '의뢰부터 정산, 리뷰까지 전 과정을 표준화하여 농가와 작업자 간의 신뢰성 높은 거래 구조를 만듭니다. 블록체인 기반 정산 시스템으로 투명성을 확보합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_danngam_id, '로봇 작업자 계정 연동',
         '농업 로봇이 실제 작업자로 등록되어 작업을 수행하고 정산받을 수 있는 시스템을 구축합니다. 로봇-인간 협업 작업의 새로운 패러다임을 제시합니다.',
         'shaping', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_danngam_id, '지역 운영센터 네트워크화',
         '전국 주요 농업 지역에 ROC(Regional Operation Center)를 구축하여 지역 밀착형 서비스를 제공합니다. 장비 대여, 교육, 기술 지원을 통합 운영합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_danngam_id, '데이터 기반 농작업 분석',
         '누적된 작업 데이터를 분석하여 작물별, 지역별 최적 작업 시기와 방법을 제안합니다. 수익성 분석 리포트를 통해 농가의 의사결정을 지원합니다.',
         'active', v_admin_id, NOW(), NOW());

    -- FarmFlow Initiatives
    INSERT INTO planner_initiatives (id, product_id, title, intent, state, owner_id, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_farmflow_id, '다중 로봇 제어 시스템 고도화',
         '농업, 물류, 방역, 건설 등 다양한 산업의 이종 로봇들을 하나의 플랫폼에서 통합 제어합니다. 각 로봇의 특성과 제약사항을 고려한 지능형 제어 알고리즘을 개발합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_farmflow_id, '시각적 워크플로우 빌더',
         '코딩 없이 드래그앤드롭으로 센서, 액추에이터, AI 모듈을 연결하여 복잡한 로봇 작업을 설계할 수 있는 노코드 플랫폼을 구축합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_farmflow_id, '로봇 오케스트레이션 엔진 개발',
         '여러 대의 로봇이 하나의 목표를 위해 동기화, 분업, 협업할 수 있도록 조율하는 오케스트레이션 엔진을 개발합니다. 실시간 상황 변화에 대응하는 적응형 협업 알고리즘을 구현합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_farmflow_id, '로봇 생태계 중앙 제어 코어 구축',
         'VIA의 모든 로봇과 스마트 장비를 통합 관리하는 중앙 제어 허브로 발전시킵니다. 엣지-클라우드 하이브리드 아키텍처로 실시간성과 확장성을 동시에 확보합니다.',
         'shaping', v_admin_id, NOW(), NOW());

    -- VIAHUB.DEV Initiatives
    INSERT INTO planner_initiatives (id, product_id, title, intent, state, owner_id, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_viahubdev_id, '통합 DevOps 파이프라인 구축',
         '코드 작성부터 빌드, 테스트, 배포까지 전 과정을 자동화하여 개발 생산성을 극대화합니다. CI/CD 파이프라인과 자동화된 품질 검증 시스템을 구축합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_viahubdev_id, '공유형 협업 환경 조성',
         '제조사, 연구소, 개발자가 함께 협업할 수 있는 오픈 허브를 구축합니다. 코드 공유, 이슈 트래킹, 문서화를 통합 지원하는 협업 플랫폼을 제공합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_viahubdev_id, '모델·펌웨어 인증 체계 표준화',
         '개발된 코드와 모델의 품질, 버전, 호환성을 자동으로 검증하는 인증 시스템을 구축합니다. 안전성과 신뢰성이 검증된 코드만 배포되도록 관리합니다.',
         'shaping', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_viahubdev_id, '현장 데이터 피드백 루프',
         '실제 운용 중인 로봇과 장비에서 수집된 데이터를 개발 환경으로 자동 반영하여 지속적인 개선이 이루어지도록 합니다. 현장-개발 간 실시간 피드백 구조를 구현합니다.',
         'active', v_admin_id, NOW(), NOW());

    -- ========================================
    -- GCS (GROUND CONTROL SYSTEMS)
    -- ========================================

    -- Eidryon Initiatives
    INSERT INTO planner_initiatives (id, product_id, title, intent, state, owner_id, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_eidryon_id, '전술 상황 인식 시각화 시스템',
         '드론, 센서, 통신 데이터를 통합하여 실시간 전장 상황을 3D 지도로 시각화합니다. 지휘관이 직관적으로 상황을 파악하고 신속한 의사결정을 내릴 수 있도록 지원합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_eidryon_id, '하이브리드 드론 통합 제어',
         '엔진과 전기를 복합 사용하는 하이브리드 드론의 에너지 관리와 비행 제어를 최적화합니다. 장시간 운용이 가능한 전술 드론 시스템을 구축합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_eidryon_id, 'AI 기반 임무 최적화',
         '실시간 경로 예측, 위험도 분석, 작전 효율화를 AI 알고리즘으로 자동화합니다. 동적으로 변하는 전장 환경에 적응하는 지능형 임무 계획 시스템을 개발합니다.',
         'shaping', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_eidryon_id, '시뮬레이터 연동형 훈련 시스템',
         '가상 전장 환경과 실제 장비를 실시간으로 연동하여 현실감 있는 훈련을 제공합니다. 다양한 전술 시나리오를 시뮬레이션하여 운용 숙련도를 향상시킵니다.',
         'active', v_admin_id, NOW(), NOW());

    -- FloodEye Initiatives
    INSERT INTO planner_initiatives (id, product_id, title, intent, state, owner_id, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_floodeye_id, '도시 수자원 디지털 트윈 구축',
         '실시간 수문 데이터와 드론 관측 정보를 결합하여 도시 전체의 수자원 상황을 디지털 트윈으로 구현합니다. 침수 위험 지역을 사전에 예측하고 대응합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_floodeye_id, 'AI 침수 예측 모델 개발',
         '기상 데이터, 수위 센서, 지형 정보를 결합한 딥러닝 모델로 침수를 조기에 예측합니다. 위험 지역 주민들에게 자동으로 경보를 발송하는 시스템을 구축합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_floodeye_id, '공공 데이터 네트워크 연동',
         '재난안전부, 기상청, 지자체 치수 시스템과 표준 API로 연결하여 통합 재난 대응 네트워크를 구축합니다. 실시간 정보 공유로 신속한 대응을 가능하게 합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_floodeye_id, '자율형 스테이션 운용 시스템',
         '드론의 무인 충전, 자가진단, 데이터 전송을 자동화하여 24시간 무인 운영이 가능한 스테이션 시스템을 구축합니다.',
         'shaping', v_admin_id, NOW(), NOW());

    -- ========================================
    -- DEPLOYED SERVICES
    -- ========================================

    -- AproFleet Initiatives
    INSERT INTO planner_initiatives (id, product_id, title, intent, state, owner_id, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_aprofleet_id, 'FleetOps SaaS 서비스화',
         '골프장 자율주행 카트 관제 시스템을 클라우드 기반 SaaS로 전환하여 다양한 골프장에 빠르게 도입 가능하도록 합니다. 구독형 비즈니스 모델을 구축합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_aprofleet_id, '지도 및 주행 경로 편집 고도화',
         '골프장 관리자가 직접 맵을 편집하고 주행 경로를 설정할 수 있는 직관적인 에디터를 제공합니다. 실시간 경로 수정과 시뮬레이션 기능을 지원합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_aprofleet_id, '운행 데이터 기반 운영 최적화',
         '축적된 주행 로그를 분석하여 최적의 배차 계획과 충전 스케줄을 제안합니다. 차량 상태 예측 정비로 가동률을 향상시킵니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_aprofleet_id, '다분야 차량 확장성 확보',
         '골프장 외에도 공원, 리조트, 물류센터 등 다양한 환경에서 자율주행 차량을 운영할 수 있도록 플랫폼을 확장합니다.',
         'shaping', v_admin_id, NOW(), NOW());

    -- CraneEyes Initiatives
    INSERT INTO planner_initiatives (id, product_id, title, intent, state, owner_id, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_craneeyes_id, 'AI 영상 분석 기반 위험 탐지',
         '작업 현장의 CCTV와 센서를 통해 인체-장비 간 위험 거리를 실시간으로 감지하고 경보를 발생시킵니다. 딥러닝 기반 위험 동작 인식 모델을 고도화합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_craneeyes_id, 'Predictive Safety 구현',
         '센서 로그와 작업 패턴을 분석하여 사고를 사전에 예측합니다. 위험 징후를 조기에 발견하여 예방 조치를 취할 수 있도록 지원합니다.',
         'shaping', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_craneeyes_id, '모바일-백오피스 실시간 연동',
         '크레인 운전자와 현장 관리자, 안전 관리 부서가 실시간으로 통신하고 정보를 공유할 수 있는 통합 플랫폼을 구축합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_craneeyes_id, '산업별 확장 패키지',
         '항만, 물류, 건설 현장별 특성에 맞는 맞춤형 안전 관리 모듈을 개발합니다. 산업 특화 위험 요소를 자동으로 감지합니다.',
         'active', v_admin_id, NOW(), NOW());

    -- CargoLink GCS Initiatives
    INSERT INTO planner_initiatives (id, product_id, title, intent, state, owner_id, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_cargolink_id, '물류 드론 네트워크 구축',
         '여러 대의 물류 드론을 네트워크로 연결하여 산업 물류를 자동화합니다. 최적 배송 경로와 드론 할당을 AI로 관리합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_cargolink_id, '라스트마일 자율배송 시스템',
         '스테이션에서 최종 배송지까지 완전 자동화된 배송 시스템을 구축합니다. 드론 자동 이착륙, 화물 적재/하역, 경로 최적화를 통합 운영합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_cargolink_id, '물류 시스템 연동',
         'WMS(창고관리), ERP(전사관리) 시스템과 실시간 API 연동으로 주문부터 배송까지 끊김없는 물류 프로세스를 구현합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_cargolink_id, 'UAM(도심항공) 확장 대응',
         '중·대형 화물 드론과 도심항공교통(UAM) 시스템으로 확장 가능한 아키텍처를 구축합니다. 미래 항공 물류 시장을 선점합니다.',
         'shaping', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_cargolink_id, '비행 데이터 자동 보고',
         '항공 안전 규정에 따라 모든 비행 데이터를 자동으로 기록하고 보고하는 시스템을 구축합니다. 로그 표준화와 규제 대응을 자동화합니다.',
         'active', v_admin_id, NOW(), NOW());

    -- ========================================
    -- ROBOTICS
    -- ========================================

    -- Growth Analysis Robot Initiatives
    INSERT INTO planner_initiatives (id, product_id, title, intent, state, owner_id, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_growthai_id, 'AI 생육 분석 모델 개발',
         '작물별 생체 정보를 분석하는 딥러닝 모델을 개발합니다. RGB, NIR, 열화상 이미지를 종합하여 작물의 건강 상태, 생장 속도, 수확 시기를 예측합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_growthai_id, '다중센서 자율주행 엔진',
         'LiDAR, RGB 카메라, NIR 센서, IMU를 융합하여 온실 내 정밀 자율주행 기술을 고도화합니다. 좁은 통로와 복잡한 장애물 환경에서도 안정적으로 주행합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_growthai_id, 'FarmFlow 연동 실시간 관제',
         '로봇의 위치, 배터리, 센서 상태, 수집 데이터를 FarmFlow 플랫폼으로 실시간 전송하여 통합 관리합니다. 원격 제어와 작업 스케줄링을 지원합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_growthai_id, '데이터 마켓플레이스 구축',
         '로봇이 수집한 생육 데이터를 연구기관, 종자회사, 농업 기업에 판매할 수 있는 데이터 마켓플레이스를 구축합니다. 데이터 경제 생태계를 조성합니다.',
         'shaping', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_growthai_id, '모듈형 로봇 확장',
         '생육분석 외에도 방제, 수확, 운반 등의 작업을 수행할 수 있도록 모듈형 구조로 설계합니다. 다목적 농업 로봇 플랫폼으로 발전시킵니다.',
         'shaping', v_admin_id, NOW(), NOW());

    -- WhizLink Initiatives
    INSERT INTO planner_initiatives (id, product_id, title, intent, state, owner_id, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_whizlink_id, 'UWB 기반 위치 인식 인프라 구축',
         '로봇, 드론, 차량의 위치를 cm 단위로 실시간 추적하는 UWB 인프라를 구축합니다. GPS가 불가능한 실내 환경에서도 정밀 측위를 제공합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_whizlink_id, 'WhizLink Tracker 개발',
         '여러 개의 UWB 앵커와 트랜시버를 활용하여 복잡한 환경에서도 안정적으로 위치를 계산하고 시각화하는 소프트웨어를 개발합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_whizlink_id, '하이브리드 통신 구조 통합',
         'UWB와 함께 BLE, LTE-M, WiFi를 병행 사용하여 통신 신뢰성과 커버리지를 향상시킵니다. 환경에 따라 최적의 통신 방식을 자동 선택합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_whizlink_id, 'VIA 생태계 연동 API 표준화',
         'FarmFlow, AproFleet, Eidryon 등 VIA의 모든 플랫폼과 연동 가능한 표준 API를 제공합니다. 위치 데이터를 생태계 전반에 공유합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_whizlink_id, '산업 IoT 확장',
         '공장, 물류센터, 농장, 건설현장 등 다양한 산업 환경에서 자산과 인력을 추적하는 위치 관리 서비스로 확장합니다.',
         'shaping', v_admin_id, NOW(), NOW());

    -- ========================================
    -- AI / DATA SERVICES
    -- ========================================

    -- NewLearn Initiatives
    INSERT INTO planner_initiatives (id, product_id, title, intent, state, owner_id, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_newlearn_id, '데이터셋 품질 관리 시스템 구축',
         '수집된 데이터의 자동 라벨링, 이상치 검증, 버전 관리를 통합한 데이터 품질 관리 시스템을 구축합니다. 고품질 학습 데이터를 확보합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_newlearn_id, 'MLOps 파이프라인 구현',
         '모델 학습부터 검증, 배포까지 전 과정을 자동화한 MLOps 파이프라인을 구축합니다. 지속적인 모델 개선과 신속한 배포를 지원합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_newlearn_id, 'Edge Deployment 엔진 개발',
         'Jetson, reComputer 등 엣지 디바이스로 AI 모델을 자동 배포하는 시스템을 개발합니다. 최적화된 모델을 현장 장비에 실시간 전송합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_newlearn_id, 'AI 모델 성능 대시보드',
         '배포된 모델의 정확도, 추론 속도, 리소스 사용량 등을 실시간으로 모니터링하는 대시보드를 구축합니다. 성능 저하를 즉시 감지합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_newlearn_id, 'AI 모델 마켓플레이스 구축',
         '연구자와 개발자가 AI 모델을 공유하고 거래할 수 있는 마켓플레이스를 구축합니다. AI 모델 상용화 생태계를 조성합니다.',
         'shaping', v_admin_id, NOW(), NOW());

    -- ========================================
    -- WEB SERVICES
    -- ========================================

    -- JB2 Initiatives
    INSERT INTO planner_initiatives (id, product_id, title, intent, state, owner_id, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_jb2_id, '바이오 기업 데이터베이스 구축',
         '전북 바이오 클러스터 내 연구소, 기업, 인프라 정보를 통합 관리하는 데이터베이스를 구축합니다. 기업 검색과 매칭 서비스를 제공합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_jb2_id, '지원사업·정책 포털 운영',
         '바이오 기업을 위한 지원 프로그램, 공고, 정책 정보를 통합 제공하는 포털을 운영합니다. 기업이 필요한 지원을 쉽게 찾을 수 있도록 합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_jb2_id, '입주기업 관리 시스템',
         '클러스터 입주 신청, 심사, 계약, 평가 절차를 디지털화하여 효율적으로 관리합니다. 입주 기업의 성장을 체계적으로 지원합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_jb2_id, '콘텐츠·홍보 허브',
         '바이오 클러스터의 뉴스, 연구 성과, 미디어 콘텐츠를 아카이브하고 홍보하는 허브를 운영합니다. 지역 바이오 산업의 가시성을 높입니다.',
         'active', v_admin_id, NOW(), NOW());

    -- FIDA Initiatives
    INSERT INTO planner_initiatives (id, product_id, title, intent, state, owner_id, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_fida_id, '글로벌 대회 운영 관리 시스템',
         '국제 드론축구 대회의 일정, 선수 등록, 경기 결과를 자동으로 관리하는 시스템을 구축합니다. 실시간 경기 업데이트와 통계를 제공합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_fida_id, '국가 협회 연동 포털 구축',
         '각국 드론축구 협회와 데이터를 연동하고 글로벌 랭킹 시스템을 통합 관리합니다. 국가별 경기 정보를 실시간으로 공유합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_fida_id, '드론축구 홍보 플랫폼',
         '경기 영상, 하이라이트, 인터뷰, 대회 기록을 아카이브하여 드론축구를 전 세계에 홍보합니다. 팬 커뮤니티를 육성합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_fida_id, 'FIDA 회원 포털 서비스',
         '회원 인증, 심판 교육, 규정 관리 기능을 제공하는 통합 회원 포털을 구축합니다. 협회 운영의 투명성과 효율성을 높입니다.',
         'active', v_admin_id, NOW(), NOW());

    -- KDSA Initiatives
    INSERT INTO planner_initiatives (id, product_id, title, intent, state, owner_id, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_kdsa_id, '국내 리그 경기 운영 시스템',
         '국내 드론축구 리그의 경기 일정, 결과, 심판 기록을 자동으로 관리합니다. 리그별 순위와 통계를 실시간으로 업데이트합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_kdsa_id, '선수 및 팀 관리 기능',
         '선수 등록, 팀 인증, 경기 기록을 체계적으로 관리합니다. 선수별 통계와 성적을 자동으로 집계하여 제공합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_kdsa_id, '협회-지부 연동 구조 구축',
         '중앙 협회와 지역 지부 간 경기 데이터를 실시간으로 통합하고 동기화합니다. 전국 단위 통합 관리 체계를 구축합니다.',
         'active', v_admin_id, NOW(), NOW()),

        (gen_random_uuid(), v_kdsa_id, '대회 홍보 및 기록 서비스',
         '국내 리그의 경기 영상, 뉴스, 홍보 콘텐츠를 제공합니다. 드론축구 저변 확대와 팬 확보를 위한 콘텐츠 마케팅을 수행합니다.',
         'active', v_admin_id, NOW(), NOW());

    RAISE NOTICE 'Successfully seeded all VIA initiatives!';

END $$;
