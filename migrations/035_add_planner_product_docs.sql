-- =============================================
-- Migration 035: Planner Product Documentation
-- =============================================
-- Adds Product Documentation table to store markdown documents
-- for planner products

-- =============================================
-- PRODUCT DOCUMENTATION
-- =============================================

CREATE TABLE IF NOT EXISTS planner_product_docs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES planner_products(id) ON DELETE CASCADE,
    
    -- Basic information
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    
    -- Display order
    display_order INTEGER DEFAULT 0,
    
    -- Audit fields
    created_by UUID NOT NULL REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_planner_product_docs_product ON planner_product_docs(product_id);
CREATE INDEX idx_planner_product_docs_deleted ON planner_product_docs(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_planner_product_docs_created_by ON planner_product_docs(created_by);
CREATE INDEX idx_planner_product_docs_display_order ON planner_product_docs(product_id, display_order);

-- Check constraints for data integrity
-- Display order must be non-negative
ALTER TABLE planner_product_docs
ADD CONSTRAINT planner_product_docs_display_order_check
CHECK (display_order >= 0);

-- Content must not be empty
ALTER TABLE planner_product_docs
ADD CONSTRAINT planner_product_docs_content_not_empty_check
CHECK (LENGTH(TRIM(content)) > 0);

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE planner_product_docs IS 'Markdown documentation for planner products';
COMMENT ON COLUMN planner_product_docs.title IS 'Document title';
COMMENT ON COLUMN planner_product_docs.content IS 'Markdown content of the document';
COMMENT ON COLUMN planner_product_docs.display_order IS 'Order for displaying docs within a product';
