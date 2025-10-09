-- =============================================
-- VIA Product Ecosystem - Initial Data Seed
-- =============================================
-- This script seeds all VIA products and their initial structure
-- Run after migration 010-planner-products.sql

-- Get CEO ID (박기선 대표)
DO $$
DECLARE
    ceo_id UUID;
BEGIN
    SELECT id INTO ceo_id FROM employees WHERE position = '대표' LIMIT 1;

    -- =============================================
    -- CATEGORY: Cloud Platforms
    -- =============================================

    -- WorkStream
    INSERT INTO planner_products (id, name, code, description, owner_id, status)
    VALUES (
        uuid_generate_v4(),
        'WorkStream',
        'workstream',
        '기업의 연구개발, 생산, 행정, 운영 프로세스를 하나의 워크플로우로 통합하는 엔터프라이즈 클라우드 플랫폼',
        ceo_id,
        'active'
    );

    -- DannGam
    INSERT INTO planner_products (id, name, code, description, owner_id, status)
    VALUES (
        uuid_generate_v4(),
        'DannGam',
        'danngam',
        '농가와 작업자를 연결하는 농작업 대행 모바일 거래 플랫폼',
        ceo_id,
        'active'
    );

    -- FarmFlow
    INSERT INTO planner_products (id, name, code, description, owner_id, status)
    VALUES (
        uuid_generate_v4(),
        'FarmFlow',
        'farmflow',
        '다분야 로봇과 IoT 장비를 통합 제어하고 작업 순서를 시각적으로 설계하는 워크플로우 빌더 플랫폼',
        ceo_id,
        'active'
    );

    -- VIAHUB.DEV
    INSERT INTO planner_products (id, name, code, description, owner_id, status)
    VALUES (
        uuid_generate_v4(),
        'VIAHUB.DEV',
        'viahub-dev',
        '로봇 및 스마트 농기계 개발자를 위한 DevOps 기반 오픈 개발 허브',
        ceo_id,
        'active'
    );

    -- =============================================
    -- CATEGORY: GCS (Ground Control Systems)
    -- =============================================

    -- Eidryon
    INSERT INTO planner_products (id, name, code, description, owner_id, status)
    VALUES (
        uuid_generate_v4(),
        'Eidryon',
        'eidryon',
        '다중 드론과 임무 장비를 통합 제어하는 3D 전술 작전용 GCS',
        ceo_id,
        'active'
    );

    -- FloodEye
    INSERT INTO planner_products (id, name, code, description, owner_id, status)
    VALUES (
        uuid_generate_v4(),
        'FloodEye',
        'floodeye',
        '도시 침수 및 수자원 안전 관리를 위한 드론·스테이션 통합 GCS',
        ceo_id,
        'active'
    );

    -- =============================================
    -- CATEGORY: Deployed Services
    -- =============================================

    -- AproFleet
    INSERT INTO planner_products (id, name, code, description, owner_id, status)
    VALUES (
        uuid_generate_v4(),
        'AproFleet',
        'aprofleet',
        '골프카트 자율주행 운영을 위한 관제 및 지도 관리 시스템',
        ceo_id,
        'active'
    );

    -- CraneEyes
    INSERT INTO planner_products (id, name, code, description, owner_id, status)
    VALUES (
        uuid_generate_v4(),
        'CraneEyes',
        'craneeyes',
        '건설 및 산업현장의 크레인 안전관리 시스템',
        ceo_id,
        'active'
    );

    -- CargoLink GCS
    INSERT INTO planner_products (id, name, code, description, owner_id, status)
    VALUES (
        uuid_generate_v4(),
        'CargoLink GCS',
        'cargolink-gcs',
        '산업 물류 및 배송용 드론을 통합 제어·운영하는 상용 GCS',
        ceo_id,
        'active'
    );

    -- =============================================
    -- CATEGORY: Robotics
    -- =============================================

    -- Growth Analysis Robot
    INSERT INTO planner_products (id, name, code, description, owner_id, status)
    VALUES (
        uuid_generate_v4(),
        'Growth Analysis Robot',
        'growth-analysis-robot',
        '온실 및 실내 환경에서 자율주행하며 생육 데이터를 수집·분석하는 AI 로봇',
        ceo_id,
        'active'
    );

    -- WhizLink
    INSERT INTO planner_products (id, name, code, description, owner_id, status)
    VALUES (
        uuid_generate_v4(),
        'WhizLink',
        'whizlink',
        '초정밀 위치 추적 및 통신용 UWB 트랜시버·컨트롤러 시스템',
        ceo_id,
        'active'
    );

    -- =============================================
    -- CATEGORY: AI / Data Services
    -- =============================================

    -- NewLearn
    INSERT INTO planner_products (id, name, code, description, owner_id, status)
    VALUES (
        uuid_generate_v4(),
        'NewLearn',
        'newlearn',
        '로봇·드론·장비로부터 수집된 데이터를 학습·검증·배포하는 AI 학습 플랫폼',
        ceo_id,
        'active'
    );

    -- =============================================
    -- CATEGORY: Web Services
    -- =============================================

    -- JB2 (전북바이오플랫폼)
    INSERT INTO planner_products (id, name, code, description, owner_id, status)
    VALUES (
        uuid_generate_v4(),
        'JB2',
        'jb2',
        '전북 지역 바이오 클러스터 통합 지원 플랫폼',
        ceo_id,
        'active'
    );

    -- FIDA (국제드론축구협회)
    INSERT INTO planner_products (id, name, code, description, owner_id, status)
    VALUES (
        uuid_generate_v4(),
        'FIDA',
        'fida',
        '국제 드론축구 경기 운영 및 홍보를 위한 공식 웹 플랫폼',
        ceo_id,
        'active'
    );

    -- KDSA (대한드론축구협회)
    INSERT INTO planner_products (id, name, code, description, owner_id, status)
    VALUES (
        uuid_generate_v4(),
        'KDSA',
        'kdsa',
        '국내 드론축구 경기 관리 및 지역 리그 운영을 위한 통합 플랫폼',
        ceo_id,
        'active'
    );

    RAISE NOTICE 'Successfully seeded % VIA products', (SELECT COUNT(*) FROM planner_products);

END $$;
