/**
 * R&D Development Timeline Service
 * 타임라인 및 분기별 마일스톤 관리
 */

import { query } from '$lib/database/connection'
import type {
  RdDevPhaseWithMilestones,
  RdDevQuarterlyMilestone,
  RdDevTimelineView,
} from '$lib/types/rd-development'
import { logger } from '$lib/utils/logger'

export class RdDevTimelineService {
  /**
   * 프로젝트 타임라인 조회
   */
  async getProjectTimeline(projectId: string): Promise<RdDevTimelineView | null> {
    try {
      // 프로젝트 기본 정보 조회
      const projectSql = `
        SELECT 
          rdp.id,
          rdp.project_id,
          rdp.project_type,
          rdp.total_duration_months,
          rdp.government_funding,
          rdp.institution_funding,
          rdp.phase_1_duration_months,
          rdp.phase_2_duration_months,
          rdp.phase_3_duration_months,
          rdp.created_at,
          rdp.updated_at
        FROM rd_dev_projects rdp
        WHERE rdp.id = $1
      `

      const projectResult = await query(projectSql, [projectId])
      if (projectResult.rows.length === 0) {
        return null
      }

      const project = projectResult.rows[0]

      // 단계별 정보 조회
      const phases = await this.getPhasesWithMilestones(projectId)

      // 현재 활성 단계 찾기
      const currentPhase = phases.find((phase) => phase.status === 'active')

      // 현재 분기 찾기
      const currentQuarter = await this.getCurrentQuarter(projectId)

      return {
        project,
        phases,
        current_phase: currentPhase,
        current_quarter: currentQuarter,
      }
    } catch (error) {
      logger.error('Failed to fetch project timeline:', error)
      throw new Error('Failed to fetch project timeline')
    }
  }

  /**
   * 단계별 마일스톤 정보 포함 조회
   */
  async getPhasesWithMilestones(projectId: string): Promise<RdDevPhaseWithMilestones[]> {
    try {
      const sql = `
        SELECT 
          p.id,
          p.project_id,
          p.phase_number,
          p.year_number,
          p.start_date,
          p.end_date,
          p.status,
          p.objectives,
          p.key_technologies,
          p.created_at,
          p.updated_at
        FROM rd_dev_phases p
        WHERE p.project_id = $1
        ORDER BY p.phase_number, p.year_number
      `

      const result = await query(sql, [projectId])

      // 각 단계에 대한 마일스톤, 산출물, 기관 정보 추가
      const phasesWithMilestones = await Promise.all(
        result.rows.map(async (phase) => {
          const [quarterlyMilestones, deliverables, institutions] = await Promise.all([
            this.getQuarterlyMilestonesByPhase(phase.id),
            this.getDeliverablesByPhase(phase.id),
            this.getInstitutionsByPhase(phase.id),
          ])

          return {
            ...phase,
            quarterly_milestones: quarterlyMilestones,
            deliverables,
            institutions,
          }
        }),
      )

      return phasesWithMilestones
    } catch (error) {
      logger.error('Failed to fetch phases with milestones:', error)
      throw new Error('Failed to fetch phases with milestones')
    }
  }

  /**
   * 분기별 마일스톤 조회
   */
  async getQuarterlyMilestonesByPhase(phaseId: string): Promise<RdDevQuarterlyMilestone[]> {
    try {
      const sql = `
        SELECT 
          id,
          project_id,
          phase_id,
          quarter,
          year,
          planned_activities,
          institution_assignments,
          created_at,
          updated_at
        FROM rd_dev_quarterly_milestones
        WHERE phase_id = $1
        ORDER BY year, quarter
      `

      const result = await query(sql, [phaseId])
      return result.rows
    } catch (error) {
      logger.error('Failed to fetch quarterly milestones:', error)
      throw new Error('Failed to fetch quarterly milestones')
    }
  }

  /**
   * 단계별 산출물 조회
   */
  async getDeliverablesByPhase(phaseId: string) {
    try {
      const sql = `
        SELECT 
          d.id,
          d.project_id,
          d.phase_id,
          d.institution_id,
          d.deliverable_type,
          d.title,
          d.description,
          d.target_date,
          d.completion_date,
          d.status,
          d.verification_notes,
          d.created_at,
          d.updated_at,
          i.institution_name
        FROM rd_dev_deliverables d
        LEFT JOIN rd_dev_institutions i ON d.institution_id = i.id
        WHERE d.phase_id = $1
        ORDER BY d.target_date ASC
      `

      const result = await query(sql, [phaseId])
      return result.rows
    } catch (error) {
      logger.error('Failed to fetch deliverables by phase:', error)
      throw new Error('Failed to fetch deliverables by phase')
    }
  }

  /**
   * 단계별 참여기관 조회
   */
  async getInstitutionsByPhase(phaseId: string) {
    try {
      const sql = `
        SELECT DISTINCT
          i.id,
          i.project_id,
          i.institution_name,
          i.institution_type,
          i.role_description,
          i.primary_researcher_name,
          i.contact_info,
          i.created_at,
          i.updated_at
        FROM rd_dev_institutions i
        INNER JOIN rd_dev_deliverables d ON i.id = d.institution_id
        WHERE d.phase_id = $1
        ORDER BY i.institution_name
      `

      const result = await query(sql, [phaseId])
      return result.rows
    } catch (error) {
      logger.error('Failed to fetch institutions by phase:', error)
      throw new Error('Failed to fetch institutions by phase')
    }
  }

  /**
   * 현재 분기 정보 조회
   */
  async getCurrentQuarter(projectId: string) {
    try {
      const sql = `
        SELECT 
          qm.quarter,
          qm.year,
          qm.phase_id
        FROM rd_dev_quarterly_milestones qm
        INNER JOIN rd_dev_phases p ON qm.phase_id = p.id
        WHERE p.project_id = $1
        AND p.status = 'active'
        AND (
          (qm.year = EXTRACT(year FROM CURRENT_DATE) AND 
           CASE qm.quarter
             WHEN 'Q1' THEN EXTRACT(month FROM CURRENT_DATE) BETWEEN 1 AND 3
             WHEN 'Q2' THEN EXTRACT(month FROM CURRENT_DATE) BETWEEN 4 AND 6
             WHEN 'Q3' THEN EXTRACT(month FROM CURRENT_DATE) BETWEEN 7 AND 9
             WHEN 'Q4' THEN EXTRACT(month FROM CURRENT_DATE) BETWEEN 10 AND 12
           END)
          OR
          (qm.year = EXTRACT(year FROM CURRENT_DATE) + 1 AND 
           EXTRACT(month FROM CURRENT_DATE) = 12)
        )
        ORDER BY qm.year, qm.quarter
        LIMIT 1
      `

      const result = await query(sql, [projectId])
      return result.rows[0] || null
    } catch (error) {
      logger.error('Failed to fetch current quarter:', error)
      throw new Error('Failed to fetch current quarter')
    }
  }

  /**
   * 분기별 활동 계획 생성
   */
  async createQuarterlyMilestone(
    projectId: string,
    phaseId: string,
    quarter: string,
    year: number,
    plannedActivities: string[],
    institutionAssignments: Record<string, string[]>,
  ): Promise<RdDevQuarterlyMilestone> {
    try {
      const sql = `
        INSERT INTO rd_dev_quarterly_milestones (
          project_id,
          phase_id,
          quarter,
          year,
          planned_activities,
          institution_assignments
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING 
          id,
          project_id,
          phase_id,
          quarter,
          year,
          planned_activities,
          institution_assignments,
          created_at,
          updated_at
      `

      const params = [
        projectId,
        phaseId,
        quarter,
        year,
        JSON.stringify(plannedActivities),
        JSON.stringify(institutionAssignments),
      ]

      const result = await query(sql, params)
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to create quarterly milestone:', error)
      throw new Error('Failed to create quarterly milestone')
    }
  }

  /**
   * 분기별 마일스톤 수정
   */
  async updateQuarterlyMilestone(
    id: string,
    plannedActivities?: string[],
    institutionAssignments?: Record<string, string[]>,
  ): Promise<RdDevQuarterlyMilestone> {
    try {
      const fields: string[] = []
      const params: unknown[] = []
      let paramCount = 0

      if (plannedActivities !== undefined) {
        paramCount++
        fields.push(`planned_activities = $${paramCount}`)
        params.push(JSON.stringify(plannedActivities))
      }

      if (institutionAssignments !== undefined) {
        paramCount++
        fields.push(`institution_assignments = $${paramCount}`)
        params.push(JSON.stringify(institutionAssignments))
      }

      if (fields.length === 0) {
        throw new Error('No fields to update')
      }

      paramCount++
      fields.push(`updated_at = CURRENT_TIMESTAMP`)

      const sql = `
        UPDATE rd_dev_quarterly_milestones 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING 
          id,
          project_id,
          phase_id,
          quarter,
          year,
          planned_activities,
          institution_assignments,
          created_at,
          updated_at
      `

      params.push(id)
      const result = await query(sql, params)

      if (result.rows.length === 0) {
        throw new Error('Quarterly milestone not found')
      }

      return result.rows[0]
    } catch (error) {
      logger.error('Failed to update quarterly milestone:', error)
      throw new Error('Failed to update quarterly milestone')
    }
  }

  /**
   * 타임라인 진행률 계산
   */
  async calculateTimelineProgress(projectId: string): Promise<{
    overall_progress: number
    phase_progress: Array<{
      phase_name: string
      progress: number
      completed_quarters: number
      total_quarters: number
    }>
  }> {
    try {
      const sql = `
        SELECT 
          p.phase_number,
          p.year_number,
          p.status,
          COUNT(qm.id) as total_quarters,
          COUNT(CASE WHEN qm.created_at < CURRENT_DATE THEN 1 END) as completed_quarters
        FROM rd_dev_phases p
        LEFT JOIN rd_dev_quarterly_milestones qm ON p.id = qm.phase_id
        WHERE p.project_id = $1
        GROUP BY p.id, p.phase_number, p.year_number, p.status
        ORDER BY p.phase_number, p.year_number
      `

      const result = await query(sql, [projectId])

      let totalProgress = 0
      let totalPhases = 0

      const phaseProgress = result.rows.map((row) => {
        const phaseName = `Phase ${row.phase_number}-Year ${row.year_number}`
        const progress =
          row.total_quarters > 0
            ? Math.round((parseInt(row.completed_quarters) / parseInt(row.total_quarters)) * 100)
            : 0

        totalProgress += progress
        totalPhases++

        return {
          phase_name: phaseName,
          progress,
          completed_quarters: parseInt(row.completed_quarters),
          total_quarters: parseInt(row.total_quarters),
        }
      })

      const overallProgress = totalPhases > 0 ? Math.round(totalProgress / totalPhases) : 0

      return {
        overall_progress: overallProgress,
        phase_progress: phaseProgress,
      }
    } catch (error) {
      logger.error('Failed to calculate timeline progress:', error)
      throw new Error('Failed to calculate timeline progress')
    }
  }
}
