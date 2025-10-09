-- Migration: 012 - Planner Todos
-- Description: Create todos table for tracking initiative tasks
-- Author: AI Assistant
-- Date: 2025-01-09

-- Create planner_todos table
CREATE TABLE IF NOT EXISTS planner_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES planner_initiatives(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_planner_todos_initiative_id ON planner_todos(initiative_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_planner_todos_assignee_id ON planner_todos(assignee_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_planner_todos_status ON planner_todos(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_planner_todos_due_date ON planner_todos(due_date) WHERE deleted_at IS NULL;

-- Add comment
COMMENT ON TABLE planner_todos IS 'Todos/tasks for initiatives in the planner system';
