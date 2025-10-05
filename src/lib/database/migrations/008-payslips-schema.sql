-- 급여명세서 테이블
CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    period VARCHAR(7) NOT NULL, -- YYYY-MM 형식
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    
    -- 지급 내역
    basic_salary DECIMAL(12,2) DEFAULT 0,
    overtime_pay DECIMAL(12,2) DEFAULT 0,
    bonus DECIMAL(12,2) DEFAULT 0,
    allowances DECIMAL(12,2) DEFAULT 0,
    gross_pay DECIMAL(12,2) DEFAULT 0,
    
    -- 공제 내역
    income_tax DECIMAL(12,2) DEFAULT 0,
    national_pension DECIMAL(12,2) DEFAULT 0,
    health_insurance DECIMAL(12,2) DEFAULT 0,
    employment_insurance DECIMAL(12,2) DEFAULT 0,
    long_term_care_insurance DECIMAL(12,2) DEFAULT 0,
    total_deductions DECIMAL(12,2) DEFAULT 0,
    
    -- 최종 지급액
    net_pay DECIMAL(12,2) DEFAULT 0,
    
    -- 근무 정보
    working_days INTEGER DEFAULT 0,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 제약조건
    UNIQUE(employee_id, year, month)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_payslips_employee_id ON payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_period ON payslips(year, month);
CREATE INDEX IF NOT EXISTS idx_payslips_created_at ON payslips(created_at);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_payslips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payslips_updated_at
    BEFORE UPDATE ON payslips
    FOR EACH ROW
    EXECUTE FUNCTION update_payslips_updated_at();

-- 샘플 데이터 삽입 (테스트용)
INSERT INTO payslips (
    employee_id, period, year, month,
    basic_salary, overtime_pay, bonus, allowances, gross_pay,
    income_tax, national_pension, health_insurance, employment_insurance, long_term_care_insurance, total_deductions,
    net_pay, working_days, overtime_hours
) 
SELECT 
    e.id,
    '2024-12',
    2024,
    12,
    5000000, -- 기본급 500만원
    200000,  -- 연장근무수당 20만원
    500000,  -- 상여금 50만원
    100000,  -- 제수당 10만원
    5800000, -- 지급총액 580만원
    580000,  -- 소득세 58만원
    232000,  -- 국민연금 23.2만원
    116000,  -- 건강보험 11.6만원
    29000,   -- 고용보험 2.9만원
    17400,   -- 장기요양보험 1.74만원
    975400,  -- 공제총액 97.54만원
    4824600, -- 실지급액 482.46만원
    22,      -- 근무일수 22일
    8.5      -- 연장근무 8.5시간
FROM employees e 
WHERE e.email = 'kiseonpark@viasoft.ai'
ON CONFLICT (employee_id, year, month) DO NOTHING;

-- 2024년 11월 샘플 데이터
INSERT INTO payslips (
    employee_id, period, year, month,
    basic_salary, overtime_pay, bonus, allowances, gross_pay,
    income_tax, national_pension, health_insurance, employment_insurance, long_term_care_insurance, total_deductions,
    net_pay, working_days, overtime_hours
) 
SELECT 
    e.id,
    '2024-11',
    2024,
    11,
    5000000, -- 기본급 500만원
    150000,  -- 연장근무수당 15만원
    0,       -- 상여금 0원
    100000,  -- 제수당 10만원
    5250000, -- 지급총액 525만원
    525000,  -- 소득세 52.5만원
    210000,  -- 국민연금 21만원
    105000,  -- 건강보험 10.5만원
    26250,   -- 고용보험 2.625만원
    15750,   -- 장기요양보험 1.575만원
    877500,  -- 공제총액 87.75만원
    4372500, -- 실지급액 437.25만원
    21,      -- 근무일수 21일
    6.0      -- 연장근무 6시간
FROM employees e 
WHERE e.email = 'kiseonpark@viasoft.ai'
ON CONFLICT (employee_id, year, month) DO NOTHING;
