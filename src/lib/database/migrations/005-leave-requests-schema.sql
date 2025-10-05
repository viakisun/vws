-- 연차/휴가 관리 테이블
CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(20) NOT NULL CHECK (leave_type IN ('annual', 'sick', 'personal', 'maternity', 'paternity', 'bereavement', 'military', 'other')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME, -- 반차/반반차용
    end_time TIME,   -- 반차/반반차용
    days DECIMAL(3,1) NOT NULL, -- 0.5 = 반차, 0.25 = 반반차
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 연차 잔여일수 관리 테이블
CREATE TABLE IF NOT EXISTS leave_balances (
    id SERIAL PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    total_annual_leave INTEGER DEFAULT 15, -- 기본 연차 15일
    used_annual_leave DECIMAL(3,1) DEFAULT 0,
    remaining_annual_leave DECIMAL(3,1) DEFAULT 15,
    total_sick_leave INTEGER DEFAULT 5, -- 기본 병가 5일
    used_sick_leave DECIMAL(3,1) DEFAULT 0,
    remaining_sick_leave DECIMAL(3,1) DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, year)
);

-- 휴가 신청 인덱스
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_date ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

-- 연차 잔여일수 인덱스
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_year ON leave_balances(employee_id, year);

-- 휴가 신청 업데이트 트리거
CREATE OR REPLACE FUNCTION update_leave_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leave_requests_updated_at
    BEFORE UPDATE ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_leave_requests_updated_at();

-- 연차 잔여일수 업데이트 트리거
CREATE OR REPLACE FUNCTION update_leave_balances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leave_balances_updated_at
    BEFORE UPDATE ON leave_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_leave_balances_updated_at();

-- 휴가 승인 시 연차 잔여일수 자동 차감 트리거
CREATE OR REPLACE FUNCTION update_leave_balance_on_approval()
RETURNS TRIGGER AS $$
DECLARE
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    balance_record RECORD;
BEGIN
    -- 휴가가 승인된 경우에만 처리
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- 해당 연도의 연차 잔여일수 레코드 조회
        SELECT * INTO balance_record 
        FROM leave_balances 
        WHERE employee_id = NEW.employee_id AND year = current_year;
        
        -- 레코드가 없으면 생성
        IF NOT FOUND THEN
            INSERT INTO leave_balances (employee_id, year, total_annual_leave, remaining_annual_leave, total_sick_leave, remaining_sick_leave)
            VALUES (NEW.employee_id, current_year, 15, 15, 5, 5);
            
            SELECT * INTO balance_record 
            FROM leave_balances 
            WHERE employee_id = NEW.employee_id AND year = current_year;
        END IF;
        
        -- 연차 타입에 따라 잔여일수 차감
        IF NEW.leave_type = 'annual' THEN
            UPDATE leave_balances 
            SET used_annual_leave = used_annual_leave + NEW.days,
                remaining_annual_leave = remaining_annual_leave - NEW.days
            WHERE employee_id = NEW.employee_id AND year = current_year;
        ELSIF NEW.leave_type = 'sick' THEN
            UPDATE leave_balances 
            SET used_sick_leave = used_sick_leave + NEW.days,
                remaining_sick_leave = remaining_sick_leave - NEW.days
            WHERE employee_id = NEW.employee_id AND year = current_year;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leave_balance_on_approval
    AFTER UPDATE ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_leave_balance_on_approval();
