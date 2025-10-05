-- 출퇴근 관리 테이블
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    break_start_time TIMESTAMP,
    break_end_time TIMESTAMP,
    total_work_hours DECIMAL(4,2) DEFAULT 0,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'early_leave', 'half_day')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);

-- 출퇴근 기록 인덱스
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

-- 출퇴근 기록 업데이트 트리거
CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_updated_at();

-- 근무시간 자동 계산 트리거
CREATE OR REPLACE FUNCTION calculate_work_hours()
RETURNS TRIGGER AS $$
DECLARE
    work_hours DECIMAL(4,2) := 0;
    break_hours DECIMAL(4,2) := 0;
BEGIN
    -- 출근/퇴근 시간이 모두 있는 경우
    IF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
        -- 기본 근무시간 계산 (9시간)
        work_hours := EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 3600;
        
        -- 휴게시간이 있는 경우
        IF NEW.break_start_time IS NOT NULL AND NEW.break_end_time IS NOT NULL THEN
            break_hours := EXTRACT(EPOCH FROM (NEW.break_end_time - NEW.break_start_time)) / 3600;
            work_hours := work_hours - break_hours;
        END IF;
        
        -- 8시간 이상이면 초과근무 계산
        IF work_hours > 8 THEN
            NEW.overtime_hours := work_hours - 8;
            NEW.total_work_hours := 8;
        ELSE
            NEW.total_work_hours := work_hours;
            NEW.overtime_hours := 0;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_work_hours
    BEFORE INSERT OR UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION calculate_work_hours();
