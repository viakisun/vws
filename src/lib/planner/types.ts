// Planner Type Definitions

export type InitiativeStage = 'shaping' | 'building' | 'testing' | 'shipping' | 'done'
export type InitiativeStatus = 'active' | 'paused' | 'shipped' | 'abandoned'
export type ThreadState = 'proposed' | 'active' | 'resolved' | 'archived'
export type ThreadShape = 'decision' | 'build' | 'research' | 'block' | 'question'
export type FormationRole = 'driver' | 'contributor' | 'advisor' | 'observer'
export type FormationBandwidth = 'full' | 'partial' | 'support'
export type CadenceType = 'daily' | 'weekly' | 'biweekly' | 'async'
export type EnergyState = 'aligned' | 'healthy' | 'strained' | 'blocked'
export type ProductStatus = 'active' | 'archived'
export type MilestoneStatus = 'upcoming' | 'in_progress' | 'achieved' | 'missed'

export interface ExternalLink {
  url: string
  title: string
  type: 'doc' | 'figma' | 'notion' | 'other'
}

// ============================================================================
// DATABASE ENTITIES (from DB)
// ============================================================================

export interface Product {
  id: string
  name: string
  code: string
  description?: string
  owner_id: string
  status: ProductStatus
  repository_url?: string
  documentation_url?: string
  deleted_at?: string
  created_at: string
  updated_at: string
}

export interface Milestone {
  id: string
  product_id: string
  name: string
  description?: string
  target_date?: string // ISO date string
  status: MilestoneStatus
  achieved_at?: string
  achievement_notes?: string
  deleted_at?: string
  created_at: string
  updated_at: string
}

export interface Initiative {
  id: string
  title: string
  intent: string
  success_criteria: string[]
  owner_id: string
  product_id?: string
  milestone_id?: string
  formation_id?: string
  stage: InitiativeStage
  status: InitiativeStatus
  horizon?: string // ISO date string
  context_links: ExternalLink[]
  pause_reason?: string
  abandonment_reason?: string
  shipped_notes?: string
  deleted_at?: string
  created_at: string
  updated_at: string
}

export interface Formation {
  id: string
  name: string
  description?: string
  cadence_type: CadenceType
  cadence_anchor_time?: string
  energy_state: EnergyState
  deleted_at?: string
  created_at: string
  updated_at: string
}

export interface FormationMember {
  id: string
  formation_id: string
  employee_id: string
  role: FormationRole
  bandwidth: FormationBandwidth
  created_at: string
  updated_at: string
}

export interface FormationInitiative {
  id: string
  formation_id: string
  initiative_id: string
  allocation_percentage?: number // 0-100
  start_date?: string
  end_date?: string
  created_at: string
}

export interface Thread {
  id: string
  initiative_id: string
  title: string
  body?: string
  shape: ThreadShape
  state: ThreadState
  owner_id: string
  external_links: ExternalLink[]
  mentions: string[]
  resolution?: string
  resolved_at?: string
  deleted_at?: string
  created_at: string
  updated_at: string
}

export interface ThreadContributor {
  id: string
  thread_id: string
  employee_id: string
  created_at: string
}

export interface ThreadReply {
  id: string
  thread_id: string
  author_id: string
  content: string
  mentions: string[] // employee IDs
  created_at: string
  updated_at: string
}

export interface Todo {
  id: string
  initiative_id: string
  title: string
  description?: string
  assignee_id?: string
  status: 'todo' | 'in_progress' | 'done'
  due_date?: string // ISO date string
  completed_at?: string
  deleted_at?: string
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  entity_type: 'initiative' | 'formation' | 'thread'
  entity_id: string
  action: string
  actor_id: string
  old_value?: Record<string, unknown>
  new_value?: Record<string, unknown>
  metadata?: Record<string, unknown>
  created_at: string
}

// ============================================================================
// VIEW MODELS (enriched for UI)
// ============================================================================

export interface Employee {
  id: string
  first_name: string
  last_name: string
  email: string
  department?: string
  position?: string
}

export interface ProductWithOwner extends Product {
  owner: Employee
  initiative_count: number
  milestone_count: number
  active_initiative_count: number
}

export interface MilestoneWithProduct extends Milestone {
  product: Product
  initiative_count: number
}

export interface InitiativeWithOwner extends Initiative {
  owner: Employee
  product?: Product
  milestone?: Milestone
  formation?: Formation
  thread_counts: {
    total: number
    blocks: number
    questions: number
    decisions: number
    builds: number
    research: number
    active: number
    resolved: number
  }
}

export interface FormationWithMembers extends Formation {
  members: (FormationMember & { employee: Employee })[]
  initiatives: Initiative[]
  member_count: number
}

export interface ThreadWithDetails extends Thread {
  owner: Employee
  contributors: Employee[]
  reply_count: number
  latest_reply?: ThreadReply & { author: Employee }
  initiative_title: string
}

export interface ThreadReplyWithAuthor extends ThreadReply {
  author: Employee
}

export interface TodoWithAssignee extends Todo {
  assignee?: Employee
}

// ============================================================================
// INPUT TYPES (for creation/update)
// ============================================================================

export interface CreateProductInput {
  name: string
  code: string
  description?: string
  owner_id: string
  repository_url?: string
  documentation_url?: string
}

export interface UpdateProductInput {
  name?: string
  code?: string
  description?: string
  owner_id?: string
  status?: ProductStatus
  repository_url?: string
  documentation_url?: string
}

export interface CreateMilestoneInput {
  product_id: string
  name: string
  description?: string
  target_date?: string
}

export interface UpdateMilestoneInput {
  name?: string
  description?: string
  target_date?: string
  status?: MilestoneStatus
  achievement_notes?: string
}

export interface CreateInitiativeInput {
  title: string
  intent: string
  success_criteria?: string[]
  owner_id: string
  product_id?: string
  milestone_id?: string
  formation_id?: string
  horizon?: string
  context_links?: ExternalLink[]
}

export interface UpdateInitiativeInput {
  title?: string
  intent?: string
  success_criteria?: string[]
  product_id?: string
  milestone_id?: string
  formation_id?: string
  horizon?: string
  context_links?: ExternalLink[]
  pause_reason?: string
  abandonment_reason?: string
  shipped_notes?: string
}

export interface CreateFormationInput {
  name: string
  description?: string
  cadence_type: CadenceType
  cadence_anchor_time?: string
  energy_state?: EnergyState
}

export interface UpdateFormationInput {
  name?: string
  description?: string
  cadence_type?: CadenceType
  cadence_anchor_time?: string
  energy_state?: EnergyState
}

export interface CreateThreadInput {
  initiative_id: string
  title: string
  body?: string
  shape: ThreadShape
  owner_id: string
  external_links?: ExternalLink[]
  contributor_ids?: string[]
  mentions?: string[]
}

export interface UpdateThreadInput {
  title?: string
  body?: string
  shape?: ThreadShape
  owner_id?: string
  external_links?: ExternalLink[]
  resolution?: string
}

export interface CreateThreadReplyInput {
  thread_id: string
  author_id: string
  content: string
  mentions?: string[]
}

export interface AddFormationMemberInput {
  formation_id: string
  employee_id: string
  role: FormationRole
  bandwidth: FormationBandwidth
}

export interface CreateTodoInput {
  initiative_id: string
  title: string
  description?: string
  assignee_id?: string
  due_date?: string
}

export interface UpdateTodoInput {
  title?: string
  description?: string
  assignee_id?: string
  status?: 'todo' | 'in_progress' | 'done'
  due_date?: string
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface ProductFilters {
  status?: ProductStatus
  owner_id?: string
  search?: string
  limit?: number
  offset?: number
}

export interface MilestoneFilters {
  product_id?: string
  status?: MilestoneStatus | MilestoneStatus[]
  target_before?: string
  target_after?: string
  limit?: number
  offset?: number
}

export interface InitiativeFilters {
  stage?: InitiativeStage | InitiativeStage[]
  status?: InitiativeStatus | InitiativeStatus[]
  owner_id?: string
  product_id?: string
  milestone_id?: string
  formation_id?: string
  horizon_before?: string
  horizon_after?: string
  search?: string
  limit?: number
  offset?: number
}

export interface ThreadFilters {
  initiative_id?: string
  owner_id?: string
  contributor_id?: string
  state?: ThreadState | ThreadState[]
  shape?: ThreadShape | ThreadShape[]
  search?: string
  limit?: number
  offset?: number
}

export interface FormationFilters {
  energy_state?: EnergyState
  member_id?: string
  limit?: number
  offset?: number
}

// ============================================================================
// STATE TRANSITION VALIDATION
// ============================================================================

export const INITIATIVE_STAGE_TRANSITIONS: Record<
  InitiativeStage,
  { allowed: InitiativeStage[]; requires?: string[] }
> = {
  shaping: {
    allowed: ['building'],
    requires: ['success_criteria'],
  },
  building: {
    allowed: ['testing', 'shipping'],
  },
  testing: {
    allowed: ['building', 'shipping'],
  },
  shipping: {
    allowed: ['done'],
  },
  done: {
    allowed: [], // terminal stage
  },
}

export const INITIATIVE_STATUS_TRANSITIONS: Record<
  InitiativeStatus,
  { allowed: InitiativeStatus[] }
> = {
  active: {
    allowed: ['paused', 'shipped', 'abandoned'],
  },
  paused: {
    allowed: ['active', 'abandoned'],
  },
  shipped: {
    allowed: [], // terminal status
  },
  abandoned: {
    allowed: [], // terminal status
  },
}

export const THREAD_STATE_TRANSITIONS: Record<
  ThreadState,
  { allowed: ThreadState[]; requires?: string[] }
> = {
  proposed: {
    allowed: ['active', 'archived'],
  },
  active: {
    allowed: ['resolved', 'archived'],
    requires: ['resolution'], // for 'resolved'
  },
  resolved: {
    allowed: ['archived', 'active'], // can reopen
  },
  archived: {
    allowed: ['active'], // can restore
  },
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const THREAD_SHAPE_COLORS: Record<ThreadShape, string> = {
  block: 'red',
  question: 'yellow',
  decision: 'purple',
  build: 'blue',
  research: 'green',
}

export const THREAD_SHAPE_ICONS: Record<ThreadShape, string> = {
  block: '🔴',
  question: '🟡',
  decision: '🟣',
  build: '🔵',
  research: '🟢',
}

export const ENERGY_STATE_COLORS: Record<EnergyState, string> = {
  aligned: 'green',
  healthy: 'blue',
  strained: 'orange',
  blocked: 'red',
}

export const INITIATIVE_STAGE_COLORS: Record<InitiativeStage, string> = {
  shaping: 'gray',
  building: 'blue',
  testing: 'purple',
  shipping: 'orange',
  done: 'green',
}

export const INITIATIVE_STATUS_COLORS: Record<InitiativeStatus, string> = {
  active: 'blue',
  paused: 'orange',
  shipped: 'green',
  abandoned: 'red',
}
