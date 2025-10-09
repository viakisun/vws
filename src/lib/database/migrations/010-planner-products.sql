-- =============================================
-- Migration 010: Planner Products & Milestones
-- =============================================
-- Adds Product and Milestone concepts to the Planner system
-- Products represent different products/services the company builds
-- Milestones are time-based goals within each product

-- =============================================
-- PRODUCTS
-- =============================================

CREATE TABLE IF NOT EXISTS planner_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'vws', 'product-x'
    description TEXT,
    owner_id UUID NOT NULL REFERENCES employees(id),

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    -- Status transitions: active -> archived

    -- URLs and Links
    repository_url VARCHAR(500),
    documentation_url VARCHAR(500),

    -- Timestamps
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_planner_products_owner ON planner_products(owner_id);
CREATE INDEX idx_planner_products_status ON planner_products(status);
CREATE INDEX idx_planner_products_deleted ON planner_products(deleted_at) WHERE deleted_at IS NULL;

-- Check constraint for status
ALTER TABLE planner_products
ADD CONSTRAINT planner_products_status_check
CHECK (status IN ('active', 'archived'));

-- =============================================
-- MILESTONES
-- =============================================

CREATE TABLE IF NOT EXISTS planner_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES planner_products(id) ON DELETE CASCADE,

    name VARCHAR(200) NOT NULL,
    description TEXT,
    target_date DATE,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'upcoming',
    -- Status: upcoming -> in_progress -> achieved/missed

    achieved_at TIMESTAMP WITH TIME ZONE,
    achievement_notes TEXT,

    -- Timestamps
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_planner_milestones_product ON planner_milestones(product_id);
CREATE INDEX idx_planner_milestones_status ON planner_milestones(status);
CREATE INDEX idx_planner_milestones_target_date ON planner_milestones(target_date);
CREATE INDEX idx_planner_milestones_deleted ON planner_milestones(deleted_at) WHERE deleted_at IS NULL;

-- Check constraint for milestone status
ALTER TABLE planner_milestones
ADD CONSTRAINT planner_milestones_status_check
CHECK (status IN ('upcoming', 'in_progress', 'achieved', 'missed'));

-- =============================================
-- UPDATE INITIATIVES
-- =============================================

-- Add product_id to initiatives
ALTER TABLE planner_initiatives
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES planner_products(id);

-- Add milestone_id to initiatives (nullable - not all initiatives are milestone-driven)
ALTER TABLE planner_initiatives
ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES planner_milestones(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_planner_initiatives_product ON planner_initiatives(product_id);
CREATE INDEX IF NOT EXISTS idx_planner_initiatives_milestone ON planner_initiatives(milestone_id);

-- =============================================
-- FORMATION-INITIATIVE ALLOCATION
-- =============================================

-- Add allocation tracking to formation-initiative relationship
ALTER TABLE planner_formation_initiatives
ADD COLUMN IF NOT EXISTS allocation_percentage INTEGER DEFAULT 100;

ALTER TABLE planner_formation_initiatives
ADD COLUMN IF NOT EXISTS start_date DATE;

ALTER TABLE planner_formation_initiatives
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Check constraint for allocation percentage
ALTER TABLE planner_formation_initiatives
ADD CONSTRAINT planner_formation_initiatives_allocation_check
CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100);

-- =============================================
-- ACTIVITY LOG UPDATES
-- =============================================

-- Add product and milestone to activity log
ALTER TABLE planner_activity_log
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES planner_products(id);

ALTER TABLE planner_activity_log
ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES planner_milestones(id);

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE planner_products IS 'Products/services that the company builds and maintains';
COMMENT ON TABLE planner_milestones IS 'Time-based goals and releases for each product';
COMMENT ON COLUMN planner_initiatives.product_id IS 'The product this initiative belongs to';
COMMENT ON COLUMN planner_initiatives.milestone_id IS 'Optional milestone this initiative contributes to';
COMMENT ON COLUMN planner_formation_initiatives.allocation_percentage IS 'Percentage of team capacity allocated to this initiative (0-100)';
