-- 증빙 관리 시스템 데이터베이스 스키마
-- Evidence Management System Database Schema

-- 1. 증빙 카테고리 테이블
CREATE TABLE IF NOT EXISTS evidence_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 증빙 항목 테이블 (인건비 월별, 재료비 항목별, 연구활동비 항목별, 간접비 항목별)
CREATE TABLE IF NOT EXISTS evidence_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_budget_id UUID NOT NULL REFERENCES project_budgets(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES evidence_categories(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    budget_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    spent_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    assignee_id UUID REFERENCES employees(id),
    assignee_name VARCHAR(100),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'reviewing', 'cancelled')),
    due_date DATE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 증빙 서류 테이블
CREATE TABLE IF NOT EXISTS evidence_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_item_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- '급여명세서', '이체확인증', '구매계약서', '세금계산서' 등
    document_name VARCHAR(200) NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT,
    mime_type VARCHAR(100),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploader_id UUID REFERENCES employees(id),
    status VARCHAR(20) NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'reviewed', 'approved', 'rejected')),
    reviewer_id UUID REFERENCES employees(id),
    review_date TIMESTAMP,
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 증빙 일정 테이블
CREATE TABLE IF NOT EXISTS evidence_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_item_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
    task_name VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    completed_date DATE,
    assignee_id UUID REFERENCES employees(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 증빙 알림 테이블
CREATE TABLE IF NOT EXISTS evidence_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_item_id UUID REFERENCES evidence_items(id) ON DELETE CASCADE,
    evidence_schedule_id UUID REFERENCES evidence_schedules(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES employees(id),
    notification_type VARCHAR(50) NOT NULL, -- 'due_date_reminder', 'overdue_alert', 'completion_notice' 등
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- 6. 증빙 검토 이력 테이블
CREATE TABLE IF NOT EXISTS evidence_review_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_item_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES employees(id),
    review_type VARCHAR(50) NOT NULL, -- 'initial_review', 'progress_review', 'final_review' 등
    review_status VARCHAR(20) NOT NULL CHECK (review_status IN ('approved', 'rejected', 'needs_revision')),
    review_notes TEXT,
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_evidence_items_project_budget ON evidence_items(project_budget_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_category ON evidence_items(category_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_assignee ON evidence_items(assignee_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_status ON evidence_items(status);
CREATE INDEX IF NOT EXISTS idx_evidence_items_due_date ON evidence_items(due_date);

CREATE INDEX IF NOT EXISTS idx_evidence_documents_item ON evidence_documents(evidence_item_id);
CREATE INDEX IF NOT EXISTS idx_evidence_documents_type ON evidence_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_evidence_documents_status ON evidence_documents(status);

CREATE INDEX IF NOT EXISTS idx_evidence_schedules_item ON evidence_schedules(evidence_item_id);
CREATE INDEX IF NOT EXISTS idx_evidence_schedules_assignee ON evidence_schedules(assignee_id);
CREATE INDEX IF NOT EXISTS idx_evidence_schedules_due_date ON evidence_schedules(due_date);
CREATE INDEX IF NOT EXISTS idx_evidence_schedules_status ON evidence_schedules(status);

CREATE INDEX IF NOT EXISTS idx_evidence_notifications_recipient ON evidence_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_evidence_notifications_read ON evidence_notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_evidence_review_history_item ON evidence_review_history(evidence_item_id);
CREATE INDEX IF NOT EXISTS idx_evidence_review_history_reviewer ON evidence_review_history(reviewer_id);

-- 기본 증빙 카테고리 데이터 삽입
INSERT INTO evidence_categories (name, description) VALUES
('인건비', '연구원 급여 및 인건비 관련 증빙'),
('연구재료비', '연구에 필요한 재료 및 장비 구매 증빙'),
('연구활동비', '출장비, 회의비, 외주용역비 등 연구활동 관련 증빙'),
('간접비', '간접비 배분 및 특허출원 등 관련 증빙')
ON CONFLICT DO NOTHING;

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_evidence_items_updated_at BEFORE UPDATE ON evidence_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evidence_documents_updated_at BEFORE UPDATE ON evidence_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evidence_schedules_updated_at BEFORE UPDATE ON evidence_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evidence_categories_updated_at BEFORE UPDATE ON evidence_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 뷰 생성: 증빙 항목 상세 정보
CREATE OR REPLACE VIEW evidence_items_detail AS
SELECT 
    ei.id,
    ei.project_budget_id,
    pb.period_number,
    pb.fiscal_year,
    ei.category_id,
    ec.name as category_name,
    ei.name,
    ei.description,
    ei.budget_amount,
    ei.spent_amount,
    ei.assignee_id,
    ei.assignee_name,
    ei.progress,
    ei.status,
    ei.due_date,
    ei.start_date,
    ei.end_date,
    ei.created_at,
    ei.updated_at,
    -- 증빙 서류 개수
    (SELECT COUNT(*) FROM evidence_documents ed WHERE ed.evidence_item_id = ei.id) as document_count,
    -- 완료된 증빙 서류 개수
    (SELECT COUNT(*) FROM evidence_documents ed WHERE ed.evidence_item_id = ei.id AND ed.status = 'approved') as approved_document_count,
    -- 대기 중인 일정 개수
    (SELECT COUNT(*) FROM evidence_schedules es WHERE es.evidence_item_id = ei.id AND es.status = 'pending') as pending_schedule_count,
    -- 지연된 일정 개수
    (SELECT COUNT(*) FROM evidence_schedules es WHERE es.evidence_item_id = ei.id AND es.status = 'overdue') as overdue_schedule_count
FROM evidence_items ei
JOIN project_budgets pb ON ei.project_budget_id = pb.id
JOIN evidence_categories ec ON ei.category_id = ec.id;

-- 뷰 생성: 증빙 진행률 요약
CREATE OR REPLACE VIEW evidence_progress_summary AS
SELECT 
    pb.id as project_budget_id,
    pb.period_number,
    pb.fiscal_year,
    ec.name as category_name,
    COUNT(ei.id) as total_items,
    COUNT(CASE WHEN ei.status = 'completed' THEN 1 END) as completed_items,
    COUNT(CASE WHEN ei.status = 'in_progress' THEN 1 END) as in_progress_items,
    COUNT(CASE WHEN ei.status = 'planned' THEN 1 END) as planned_items,
    COUNT(CASE WHEN ei.status = 'reviewing' THEN 1 END) as reviewing_items,
    AVG(ei.progress) as average_progress,
    SUM(ei.budget_amount) as total_budget_amount,
    SUM(ei.spent_amount) as total_spent_amount
FROM project_budgets pb
LEFT JOIN evidence_items ei ON pb.id = ei.project_budget_id
LEFT JOIN evidence_categories ec ON ei.category_id = ec.id
GROUP BY pb.id, pb.period_number, pb.fiscal_year, ec.name;

COMMENT ON TABLE evidence_categories IS '증빙 카테고리 (인건비, 연구재료비, 연구활동비, 간접비)';
COMMENT ON TABLE evidence_items IS '증빙 항목 (월별 인건비, 항목별 재료비/연구활동비/간접비)';
COMMENT ON TABLE evidence_documents IS '증빙 서류 (급여명세서, 구매계약서, 세금계산서 등)';
COMMENT ON TABLE evidence_schedules IS '증빙 일정 (서류 준비, 검토, 승인 일정)';
COMMENT ON TABLE evidence_notifications IS '증빙 알림 (마감일 알림, 지연 알림 등)';
COMMENT ON TABLE evidence_review_history IS '증빙 검토 이력 (검토자, 검토 결과, 검토 의견)';

