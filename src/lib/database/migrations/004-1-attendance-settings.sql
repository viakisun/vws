-- 출퇴근 설정 테이블
CREATE TABLE IF NOT EXISTS attendance_settings (
    id SERIAL PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    work_start_time TIME NOT NULL DEFAULT '09:00:00',
    work_end_time TIME NOT NULL DEFAULT '18:00:00',
    late_threshold_minutes INTEGER DEFAULT 10, -- 지각 기준 (분)
    early_leave_threshold_minutes INTEGER DEFAULT 10, -- 조기퇴근 기준 (분)
    allowed_ips TEXT[], -- 허용 IP 목록
    require_ip_check BOOLEAN DEFAULT false, -- IP 검증 필수 여부
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id)
);

-- 출퇴근 설정 업데이트 트리거
CREATE OR REPLACE FUNCTION update_attendance_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_attendance_settings_updated_at
    BEFORE UPDATE ON attendance_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_settings_updated_at();

-- attendance 테이블에 IP 주소 컬럼 추가
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS check_in_ip VARCHAR(45);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS check_out_ip VARCHAR(45);

-- 기본 설정 삽입 (첫 번째 회사에 대해)
INSERT INTO attendance_settings (company_id, work_start_time, work_end_time, late_threshold_minutes, early_leave_threshold_minutes, require_ip_check)
SELECT id, '09:00:00', '18:00:00', 10, 10, false
FROM companies
LIMIT 1
ON CONFLICT (company_id) DO NOTHING;
