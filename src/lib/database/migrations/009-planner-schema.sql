-- Planner Schema Migration
-- A living system for intentional work across all domains

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

-- Initiatives: The outcomes we're committed to delivering
CREATE TABLE IF NOT EXISTS planner_initiatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    intent TEXT NOT NULL, -- The "why" - rich text explaining the purpose
    success_criteria TEXT[], -- Array of success conditions
    owner_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    formation_id UUID, -- Optional: primary formation (added after formations table)
    state VARCHAR(50) NOT NULL DEFAULT 'shaping'
        CHECK (state IN ('shaping', 'active', 'paused', 'shipped', 'abandoned')),
    horizon TIMESTAMP WITH TIME ZONE, -- Not a deadline - an expected resolution signal
    context_links JSONB DEFAULT '[]'::jsonb, -- External links (Google Docs, Notion, etc.)
    pause_reason TEXT, -- Required when state = 'paused'
    abandonment_reason TEXT, -- Required when state = 'abandoned'
    shipped_notes TEXT, -- Optional notes when shipped
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Formations: Working groups assembled to execute
CREATE TABLE IF NOT EXISTS planner_formations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cadence_type VARCHAR(50) NOT NULL DEFAULT 'weekly'
        CHECK (cadence_type IN ('daily', 'weekly', 'biweekly', 'async')),
    cadence_anchor_time TIMESTAMP WITH TIME ZONE, -- When syncs happen (if not async)
    energy_state VARCHAR(50) NOT NULL DEFAULT 'healthy'
        CHECK (energy_state IN ('aligned', 'healthy', 'strained', 'blocked')),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Formation Members: Who's in each formation and their role
CREATE TABLE IF NOT EXISTS planner_formation_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formation_id UUID NOT NULL REFERENCES planner_formations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'contributor'
        CHECK (role IN ('driver', 'contributor', 'advisor', 'observer')),
    bandwidth VARCHAR(50) NOT NULL DEFAULT 'partial'
        CHECK (bandwidth IN ('full', 'partial', 'support')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(formation_id, employee_id) -- Can't have duplicate members
);

-- Formation-Initiative relationships (many-to-many)
CREATE TABLE IF NOT EXISTS planner_formation_initiatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formation_id UUID NOT NULL REFERENCES planner_formations(id) ON DELETE CASCADE,
    initiative_id UUID NOT NULL REFERENCES planner_initiatives(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(formation_id, initiative_id)
);

-- Threads: Atomic units of progress and communication
CREATE TABLE IF NOT EXISTS planner_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initiative_id UUID NOT NULL REFERENCES planner_initiatives(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    body TEXT, -- Optional detail
    shape VARCHAR(50) NOT NULL
        CHECK (shape IN ('decision', 'build', 'research', 'block', 'question')),
    state VARCHAR(50) NOT NULL DEFAULT 'proposed'
        CHECK (state IN ('proposed', 'active', 'resolved', 'archived')),
    owner_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    external_links JSONB DEFAULT '[]'::jsonb,
    resolution TEXT, -- What happened / decision made (required for resolved state)
    resolved_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Thread Contributors (many-to-many)
CREATE TABLE IF NOT EXISTS planner_thread_contributors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES planner_threads(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(thread_id, employee_id)
);

-- Thread Replies: Nested discussion
CREATE TABLE IF NOT EXISTS planner_thread_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES planner_threads(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    content TEXT NOT NULL,
    mentions JSONB DEFAULT '[]'::jsonb, -- Array of employee IDs mentioned
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- AUDIT & ACTIVITY
-- ============================================================================

-- Activity log for all state transitions and significant changes
CREATE TABLE IF NOT EXISTS planner_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('initiative', 'formation', 'thread')),
    entity_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'created', 'state_changed', 'updated', 'deleted'
    actor_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    old_value JSONB, -- Previous state (for updates)
    new_value JSONB, -- New state
    metadata JSONB, -- Additional context
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Initiatives
CREATE INDEX IF NOT EXISTS idx_planner_initiatives_owner ON planner_initiatives(owner_id);
CREATE INDEX IF NOT EXISTS idx_planner_initiatives_state ON planner_initiatives(state);
CREATE INDEX IF NOT EXISTS idx_planner_initiatives_horizon ON planner_initiatives(horizon);
CREATE INDEX IF NOT EXISTS idx_planner_initiatives_formation ON planner_initiatives(formation_id);
CREATE INDEX IF NOT EXISTS idx_planner_initiatives_deleted ON planner_initiatives(deleted_at);
CREATE INDEX IF NOT EXISTS idx_planner_initiatives_search ON planner_initiatives USING gin(to_tsvector('english', title || ' ' || intent));

-- Formations
CREATE INDEX IF NOT EXISTS idx_planner_formations_energy ON planner_formations(energy_state);
CREATE INDEX IF NOT EXISTS idx_planner_formations_deleted ON planner_formations(deleted_at);

-- Formation Members
CREATE INDEX IF NOT EXISTS idx_planner_formation_members_formation ON planner_formation_members(formation_id);
CREATE INDEX IF NOT EXISTS idx_planner_formation_members_employee ON planner_formation_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_planner_formation_members_role ON planner_formation_members(role);

-- Formation Initiatives
CREATE INDEX IF NOT EXISTS idx_planner_formation_initiatives_formation ON planner_formation_initiatives(formation_id);
CREATE INDEX IF NOT EXISTS idx_planner_formation_initiatives_initiative ON planner_formation_initiatives(initiative_id);

-- Threads
CREATE INDEX IF NOT EXISTS idx_planner_threads_initiative ON planner_threads(initiative_id);
CREATE INDEX IF NOT EXISTS idx_planner_threads_owner ON planner_threads(owner_id);
CREATE INDEX IF NOT EXISTS idx_planner_threads_state ON planner_threads(state);
CREATE INDEX IF NOT EXISTS idx_planner_threads_shape ON planner_threads(shape);
CREATE INDEX IF NOT EXISTS idx_planner_threads_deleted ON planner_threads(deleted_at);
CREATE INDEX IF NOT EXISTS idx_planner_threads_search ON planner_threads USING gin(to_tsvector('english', title || ' ' || COALESCE(body, '')));

-- Thread Contributors
CREATE INDEX IF NOT EXISTS idx_planner_thread_contributors_thread ON planner_thread_contributors(thread_id);
CREATE INDEX IF NOT EXISTS idx_planner_thread_contributors_employee ON planner_thread_contributors(employee_id);

-- Thread Replies
CREATE INDEX IF NOT EXISTS idx_planner_thread_replies_thread ON planner_thread_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_planner_thread_replies_author ON planner_thread_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_planner_thread_replies_created ON planner_thread_replies(created_at);

-- Activity Log
CREATE INDEX IF NOT EXISTS idx_planner_activity_log_entity ON planner_activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_planner_activity_log_actor ON planner_activity_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_planner_activity_log_created ON planner_activity_log(created_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at columns
CREATE TRIGGER update_planner_initiatives_updated_at BEFORE UPDATE ON planner_initiatives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planner_formations_updated_at BEFORE UPDATE ON planner_formations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planner_formation_members_updated_at BEFORE UPDATE ON planner_formation_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planner_threads_updated_at BEFORE UPDATE ON planner_threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planner_thread_replies_updated_at BEFORE UPDATE ON planner_thread_replies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-set resolved_at when thread state changes to 'resolved'
CREATE OR REPLACE FUNCTION set_thread_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.state = 'resolved' AND OLD.state != 'resolved' THEN
        NEW.resolved_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_set_thread_resolved_at BEFORE UPDATE ON planner_threads
    FOR EACH ROW EXECUTE FUNCTION set_thread_resolved_at();

-- ============================================================================
-- FOREIGN KEY CONSTRAINT (added after formations table exists)
-- ============================================================================

-- Add foreign key for formation_id in initiatives
ALTER TABLE planner_initiatives
    ADD CONSTRAINT fk_planner_initiatives_formation
    FOREIGN KEY (formation_id)
    REFERENCES planner_formations(id)
    ON DELETE SET NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE planner_initiatives IS 'Strategic outcomes teams are committed to delivering';
COMMENT ON TABLE planner_formations IS 'Working groups assembled to execute on initiatives';
COMMENT ON TABLE planner_threads IS 'Atomic units of progress and communication within initiatives';
COMMENT ON TABLE planner_thread_replies IS 'Discussion threads within each thread';
COMMENT ON TABLE planner_activity_log IS 'Audit log for all significant changes in planner entities';

COMMENT ON COLUMN planner_initiatives.intent IS 'The WHY - explains purpose and context';
COMMENT ON COLUMN planner_initiatives.success_criteria IS 'What will be true when this succeeds';
COMMENT ON COLUMN planner_initiatives.horizon IS 'Expected resolution signal (not a deadline)';
COMMENT ON COLUMN planner_threads.shape IS 'Nature of the thread: decision, build, research, block, question';
COMMENT ON COLUMN planner_formations.energy_state IS 'Team health indicator';
COMMENT ON COLUMN planner_formation_members.bandwidth IS 'How much capacity this person has for this formation';
