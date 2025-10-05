-- 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success', 'approval_request', 'system', 'reminder')),
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'attendance', 'leave', 'salary', 'announcement', 'system', 'approval')),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    action_url VARCHAR(500), -- 알림 클릭 시 이동할 URL
    action_data JSONB, -- 추가 데이터 (예: 승인 요청 ID)
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 알림 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_employee ON notifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON notifications(expires_at);

-- 알림 업데이트 트리거
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- 알림 읽음 처리 트리거
CREATE OR REPLACE FUNCTION set_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
    -- 알림이 읽음으로 변경되는 경우 read_at 설정
    IF NEW.is_read = true AND (OLD.is_read IS NULL OR OLD.is_read = false) THEN
        NEW.read_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- 알림이 읽지 않음으로 변경되는 경우 read_at 초기화
    IF NEW.is_read = false AND OLD.is_read = true THEN
        NEW.read_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_notification_read_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION set_notification_read_at();

-- 만료된 알림 자동 삭제 함수
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL 
    AND expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- 재직증명서 발급 요청 테이블
CREATE TABLE IF NOT EXISTS certificate_requests (
    id SERIAL PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    certificate_type VARCHAR(50) NOT NULL CHECK (certificate_type IN ('employment', 'income', 'career', 'other')),
    purpose VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'issued')),
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP,
    issued_at TIMESTAMP,
    file_path VARCHAR(500), -- 발급된 증명서 파일 경로
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 재직증명서 발급 요청 인덱스
CREATE INDEX IF NOT EXISTS idx_certificate_requests_employee ON certificate_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_certificate_requests_status ON certificate_requests(status);
CREATE INDEX IF NOT EXISTS idx_certificate_requests_type ON certificate_requests(certificate_type);

-- 재직증명서 발급 요청 업데이트 트리거
CREATE OR REPLACE FUNCTION update_certificate_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_certificate_requests_updated_at
    BEFORE UPDATE ON certificate_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_certificate_requests_updated_at();
