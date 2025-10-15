-- =============================================
-- Migration 032: Planner Product References
-- =============================================
-- Adds Product References table to store various types of references
-- like PDFs, Figma links, Google Docs, images, etc.

-- =============================================
-- PRODUCT REFERENCES
-- =============================================

CREATE TABLE IF NOT EXISTS planner_product_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES planner_products(id) ON DELETE CASCADE,
    
    -- Basic information
    title VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Reference type and content
    type VARCHAR(50) NOT NULL,
    url TEXT,
    s3_key TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    thumbnail_url TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Display order
    display_order INTEGER DEFAULT 0,
    
    -- Audit fields
    created_by UUID NOT NULL REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_planner_product_references_product ON planner_product_references(product_id);
CREATE INDEX idx_planner_product_references_type ON planner_product_references(type);
CREATE INDEX idx_planner_product_references_deleted ON planner_product_references(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_planner_product_references_created_by ON planner_product_references(created_by);
CREATE INDEX idx_planner_product_references_display_order ON planner_product_references(product_id, display_order);

-- Check constraints for data integrity
ALTER TABLE planner_product_references
ADD CONSTRAINT planner_product_references_type_check
CHECK (type IN (
    'file', 
    'url', 
    'figma', 
    'notion', 
    'google_docs', 
    'pdf', 
    'image', 
    'github',
    'other'
));

-- Either url or s3_key must be provided
ALTER TABLE planner_product_references
ADD CONSTRAINT planner_product_references_content_check
CHECK (
    (url IS NOT NULL AND s3_key IS NULL) OR 
    (url IS NULL AND s3_key IS NOT NULL)
);

-- File size must be positive if provided
ALTER TABLE planner_product_references
ADD CONSTRAINT planner_product_references_file_size_check
CHECK (file_size IS NULL OR file_size > 0);

-- Display order must be non-negative
ALTER TABLE planner_product_references
ADD CONSTRAINT planner_product_references_display_order_check
CHECK (display_order >= 0);

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE planner_product_references IS 'References and attachments for planner products (PDFs, links, images, etc.)';
COMMENT ON COLUMN planner_product_references.type IS 'Type of reference: file, url, figma, notion, google_docs, pdf, image, github, other';
COMMENT ON COLUMN planner_product_references.url IS 'External URL for the reference';
COMMENT ON COLUMN planner_product_references.s3_key IS 'S3 key for uploaded files';
COMMENT ON COLUMN planner_product_references.metadata IS 'Additional metadata for the reference (e.g., thumbnail info, processing status)';
COMMENT ON COLUMN planner_product_references.display_order IS 'Order for displaying references within a product';
