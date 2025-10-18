/**
 * R&D Development Type Definitions
 * 개발자 중심 R&D 프로젝트 관리 타입 정의
 */

// ============================================
// Enums
// ============================================

export enum RdDevProjectType {
  WORKER_FOLLOW_AMR = 'worker_follow_amr',
  SMARTFARM_MULTIROBOT = 'smartfarm_multirobot',
}

export enum RdDevPhaseStatus {
  PLANNED = 'planned',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DELAYED = 'delayed',
}

export enum RdDevDeliverableStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DELAYED = 'delayed',
  CANCELLED = 'cancelled',
}

export enum RdDevViaRoleCategory {
  CONTROL = '관제',
  AI_COLLABORATION = 'AI협업',
  AUTONOMOUS_DRIVING = '자율주행협업',
  UI_UX = 'UI/UX',
  FIELD_ANALYSIS = '실증분석',
}

export enum RdDevQuarter {
  Q1 = 'Q1',
  Q2 = 'Q2',
  Q3 = 'Q3',
  Q4 = 'Q4',
}

// ============================================
// Main Types
// ============================================

export interface RdDevProject {
  id: string
  project_id: string
  project_type: RdDevProjectType
  total_duration_months: number
  government_funding?: number
  institution_funding?: number
  phase_1_duration_months?: number
  phase_2_duration_months?: number
  phase_3_duration_months?: number
  created_at: string
  updated_at: string

  // Fields from projects table (via JOIN)
  code?: string
  title?: string
  description?: string
  sponsor?: string
  sponsor_type?: string
  manager_employee_id?: string
  project_status?: string
  budget_total?: number
  start_date?: string
  end_date?: string

  // Related data (populated by services)
  phases?: RdDevPhase[]
  institutions?: RdDevInstitution[]
  deliverables?: RdDevDeliverable[]
  via_roles?: RdDevViaRole[]
  technical_specs?: RdDevTechnicalSpec[]
}

export interface RdDevPhase {
  id: string
  project_id: string
  phase_number: number
  year_number: number
  start_date: string
  end_date: string
  status: RdDevPhaseStatus
  objectives: string[]
  key_technologies: string[]
  created_at: string
  updated_at: string

  // Related data
  deliverables?: RdDevDeliverable[]
  quarterly_milestones?: RdDevQuarterlyMilestone[]
  via_roles?: RdDevViaRole[]
}

export interface RdDevInstitution {
  id: string
  project_id: string
  institution_name: string
  institution_type?: string
  role_description?: string
  primary_researcher_name?: string
  contact_info: Record<string, unknown>
  created_at: string
  updated_at: string

  // Related data
  deliverables?: RdDevDeliverable[]
}

export interface RdDevDeliverable {
  id: string
  project_id: string
  phase_id?: string
  institution_id?: string
  deliverable_type: string
  title: string
  description?: string
  target_date?: string
  completion_date?: string
  status: RdDevDeliverableStatus
  verification_notes?: string
  created_at: string
  updated_at: string

  // Related data
  phase?: RdDevPhase
  institution?: RdDevInstitution
}

export interface RdDevQuarterlyMilestone {
  id: string
  project_id: string
  phase_id?: string
  quarter: RdDevQuarter
  year: number
  planned_activities?: string[]
  institution_assignments?: Record<string, string[]>
  deliverables_expected?: string[]
  budget_allocation?: number
  created_at: string
  updated_at: string

  // Related data
  phase?: RdDevPhase
}

export interface RdDevViaRole {
  id: string
  project_id: string
  phase_id?: string
  role_category: RdDevViaRoleCategory
  role_title: string
  role_description?: string
  technical_details: Record<string, unknown>
  integration_points: string[]
  created_at: string
  updated_at: string

  // Related data
  phase?: RdDevPhase
}

export interface RdDevTechnicalSpec {
  id: string
  project_id: string
  category: string
  spec_name: string
  description?: string
  specifications?: Record<string, unknown>
  requirements?: Record<string, unknown>
  constraints?: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateRdDevProjectRequest {
  project_type: RdDevProjectType
  total_duration_months: number
  government_funding?: number
  institution_funding?: number
  phase_1_duration_months?: number
  phase_2_duration_months?: number
  phase_3_duration_months?: number
}

export interface UpdateRdDevProjectRequest {
  project_type?: RdDevProjectType
  total_duration_months?: number
  government_funding?: number
  institution_funding?: number
  phase_1_duration_months?: number
  phase_2_duration_months?: number
  phase_3_duration_months?: number
}

export interface CreateRdDevPhaseRequest {
  phase_number: number
  year_number: number
  start_date: string
  end_date: string
  objectives: string[]
  key_technologies: string[]
}

export interface CreateRdDevInstitutionRequest {
  institution_name: string
  institution_type?: string
  role_description?: string
  primary_researcher_name?: string
  contact_info?: Record<string, unknown>
}

export interface CreateRdDevDeliverableRequest {
  phase_id?: string
  institution_id?: string
  deliverable_type: string
  title: string
  description?: string
  target_date?: string
  status?: RdDevDeliverableStatus
}

export interface CreateRdDevViaRoleRequest {
  phase_id?: string
  role_category: RdDevViaRoleCategory
  role_title: string
  role_description?: string
  technical_details?: Record<string, unknown>
  integration_points?: string[]
}

export interface CreateRdDevTechnicalSpecRequest {
  spec_category: string
  spec_title: string
  spec_data: Record<string, unknown>
}

// ============================================
// Query/Filter Types
// ============================================

export interface RdDevProjectFilters {
  project_type?: RdDevProjectType
  status?: string
  search?: string
  limit?: number
  offset?: number
}

export interface RdDevDeliverableFilters {
  project_id?: string
  phase_id?: string
  institution_id?: string
  status?: RdDevDeliverableStatus
  deliverable_type?: string
  type?: string
  search?: string
  limit?: number
  offset?: number
}

// ============================================
// Timeline Types
// ============================================

export interface RdDevTimelineView {
  project: RdDevProject
  phases: RdDevPhaseWithMilestones[]
  current_phase?: RdDevPhase
  current_quarter?: {
    quarter: RdDevQuarter
    year: number
    phase_id: string
  }
}

export interface RdDevPhaseWithMilestones extends RdDevPhase {
  quarterly_milestones: RdDevQuarterlyMilestone[]
  deliverables: RdDevDeliverable[]
  institutions: RdDevInstitution[]
}

// ============================================
// Statistics Types
// ============================================

export interface RdDevProjectStats {
  total_projects: number
  active_projects: number
  completed_deliverables: number
  total_deliverables: number
  institutions_count: number
  current_phase_distribution: Record<string, number>
}

export interface RdDevPhaseProgress {
  phase_id: string
  phase_name: string
  completion_percentage: number
  completed_deliverables: number
  total_deliverables: number
  days_remaining?: number
}
