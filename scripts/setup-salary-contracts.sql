-- 급여 계약 관리 시스템 테이블 생성

-- 급여 계약 테이블 (이미 존재하는 경우 컬럼 추가만)
DO $$
BEGIN
    -- monthly_salary 컬럼이 없으면 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salary_contracts' AND column_name = 'monthly_salary') THEN
        ALTER TABLE salary_contracts ADD COLUMN monthly_salary DECIMAL(12,2);
    END IF;
    
    -- notes 컬럼이 없으면 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salary_contracts' AND column_name = 'notes') THEN
        ALTER TABLE salary_contracts ADD COLUMN notes TEXT;
    END IF;
    
    -- created_by 컬럼이 없으면 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salary_contracts' AND column_name = 'created_by') THEN
        ALTER TABLE salary_contracts ADD COLUMN created_by VARCHAR(100) DEFAULT 'system';
    END IF;
END $$;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_salary_contracts_employee_id ON salary_contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_contracts_status ON salary_contracts(status);
CREATE INDEX IF NOT EXISTS idx_salary_contracts_dates ON salary_contracts(start_date, end_date);

-- 현재 유효한 급여 계약 뷰
CREATE OR REPLACE VIEW active_salary_contracts AS
SELECT 
    sc.*,
    e.name as employee_name,
    e.employee_id_number,
    e.department,
    e.position
FROM salary_contracts sc
JOIN employees e ON sc.employee_id = e.id
WHERE sc.status = 'active' 
    AND sc.start_date <= CURRENT_DATE 
    AND (sc.end_date IS NULL OR sc.end_date >= CURRENT_DATE);

-- 급여 계약 이력 뷰 (모든 계약 포함)
CREATE OR REPLACE VIEW salary_contract_history AS
SELECT 
    sc.*,
    e.name as employee_name,
    e.employee_id_number,
    e.department,
    e.position,
    CASE 
        WHEN sc.end_date IS NULL THEN '무기한'
        ELSE TO_CHAR(sc.end_date, 'YYYY-MM-DD')
    END as contract_end_display,
    CASE 
        WHEN sc.status = 'active' AND sc.end_date IS NULL THEN '진행중 (무기한)'
        WHEN sc.status = 'active' AND sc.end_date >= CURRENT_DATE THEN '진행중'
        WHEN sc.status = 'expired' OR sc.end_date < CURRENT_DATE THEN '만료됨'
        ELSE sc.status
    END as status_display
FROM salary_contracts sc
JOIN employees e ON sc.employee_id = e.id
ORDER BY sc.start_date DESC;

-- 급여 계약 업데이트 트리거
CREATE OR REPLACE FUNCTION update_salary_contract_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_salary_contract_updated_at
    BEFORE UPDATE ON salary_contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_salary_contract_updated_at();

-- 기존 직원들에 대한 기본 급여 계약 데이터 생성
INSERT INTO salary_contracts (employee_id, start_date, end_date, annual_salary, monthly_salary, contract_type, status, notes)
SELECT 
    e.id,
    COALESCE(e.hire_date, '2024-01-01')::DATE as start_date,
    NULL as end_date, -- 무기한 계약
    CASE
        WHEN e.position = '대표' THEN 120000000 -- 1억 2천만원
        WHEN e.position = '연구소장' THEN 90000000 -- 9천만원
        WHEN e.position = '책임연구원' THEN 70000000 -- 7천만원
        WHEN e.position IN ('선임연구원', '선임디자이너') THEN 55000000 -- 5천 5백만원
        WHEN e.position = '연구원' THEN 35000000 -- 3천 5백만원
        WHEN e.position = '행정원' THEN 40000000 -- 4천만원
        ELSE 30000000 -- 3천만원
    END as annual_salary,
    CASE
        WHEN e.position = '대표' THEN 10000000 -- 1천만원
        WHEN e.position = '연구소장' THEN 7500000 -- 750만원
        WHEN e.position = '책임연구원' THEN 5833333 -- 약 583만원
        WHEN e.position IN ('선임연구원', '선임디자이너') THEN 4583333 -- 약 458만원
        WHEN e.position = '연구원' THEN 2916667 -- 약 292만원
        WHEN e.position = '행정원' THEN 3333333 -- 약 333만원
        ELSE 2500000 -- 250만원
    END as monthly_salary,
    'full_time' as contract_type,
    'active' as status,
    '시스템 자동 생성 - 기존 직원 기본 계약' as notes
FROM employees e
WHERE e.status = 'active'
    AND NOT EXISTS (
        SELECT 1 FROM salary_contracts sc 
        WHERE sc.employee_id = e.id 
        AND sc.status = 'active'
    );

-- 성공 메시지
DO $$
BEGIN
    RAISE NOTICE '급여 계약 관리 시스템 테이블이 성공적으로 생성되었습니다.';
    RAISE NOTICE '기존 활성 직원 %명에 대한 기본 급여 계약이 생성되었습니다.', 
        (SELECT COUNT(*) FROM salary_contracts WHERE status = 'active');
END $$;
