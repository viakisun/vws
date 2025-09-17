-- 글로벌 팩터 관리 테이블 생성

-- global_factors 테이블 생성
CREATE TABLE IF NOT EXISTS global_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factor_name VARCHAR(100) UNIQUE NOT NULL,
    factor_value VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_global_factors_name ON global_factors(factor_name);

-- 기본 글로벌 팩터 데이터 삽입
INSERT INTO global_factors (factor_name, factor_value, description) VALUES
('salary_multiplier', '1.15', '급여 배수 (계약금액 * 이 값 * 참여율)'),
('default_participation_rate', '100', '기본 참여율 (%)'),
('project_budget_buffer', '0.1', '프로젝트 예산 버퍼 (10%)'),
('max_participation_rate', '100', '최대 참여율 (%)')
ON CONFLICT (factor_name) DO UPDATE SET
    factor_value = EXCLUDED.factor_value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- 업데이트 트리거 생성
CREATE OR REPLACE FUNCTION update_global_factors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_global_factors_updated_at
    BEFORE UPDATE ON global_factors
    FOR EACH ROW
    EXECUTE FUNCTION update_global_factors_updated_at();

-- 성공 메시지
DO $$
BEGIN
    RAISE NOTICE '글로벌 팩터 테이블이 성공적으로 생성되었습니다.';
    RAISE NOTICE '기본 글로벌 팩터 %개가 설정되었습니다.', 
        (SELECT COUNT(*) FROM global_factors);
END $$;
