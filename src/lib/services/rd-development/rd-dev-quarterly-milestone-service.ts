import { query } from '$lib/database'
import type { RdDevQuarterlyMilestone } from '$lib/types/rd-development'

export class RdDevQuarterlyMilestoneService {
  async getAllQuarterlyMilestones(filters?: {
    project_id?: number
    phase_id?: number
    year?: number
    quarter?: string
  }): Promise<RdDevQuarterlyMilestone[]> {
    let sql = `
      SELECT * FROM rd_dev_quarterly_milestones
      WHERE 1=1
    `
    const params: any[] = []

    if (filters?.project_id) {
      sql += ` AND project_id = $${params.length + 1}`
      params.push(filters.project_id)
    }

    if (filters?.phase_id) {
      sql += ` AND phase_id = $${params.length + 1}`
      params.push(filters.phase_id)
    }

    if (filters?.year) {
      sql += ` AND year = $${params.length + 1}`
      params.push(filters.year)
    }

    if (filters?.quarter) {
      sql += ` AND quarter = $${params.length + 1}`
      params.push(filters.quarter)
    }

    sql += ` ORDER BY year DESC, quarter DESC`

    const result = await query(sql, params)
    return result.rows
  }

  async getQuarterlyMilestoneById(id: number): Promise<RdDevQuarterlyMilestone | null> {
    const result = await query('SELECT * FROM rd_dev_quarterly_milestones WHERE id = $1', [id])
    return result.rows[0] || null
  }

  async createQuarterlyMilestone(
    data: Partial<RdDevQuarterlyMilestone>,
  ): Promise<RdDevQuarterlyMilestone> {
    const result = await query(
      `
      INSERT INTO rd_dev_quarterly_milestones (
        project_id, phase_id, year, quarter, planned_activities,
        institution_assignments, deliverables_expected, budget_allocation
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [
        data.project_id,
        data.phase_id,
        data.year,
        data.quarter,
        data.planned_activities ? JSON.stringify(data.planned_activities) : null,
        data.institution_assignments ? JSON.stringify(data.institution_assignments) : null,
        data.deliverables_expected ? JSON.stringify(data.deliverables_expected) : null,
        data.budget_allocation,
      ],
    )
    return result.rows[0]
  }

  async updateQuarterlyMilestone(
    id: number,
    data: Partial<RdDevQuarterlyMilestone>,
  ): Promise<RdDevQuarterlyMilestone | null> {
    const fields: string[] = []
    const params: any[] = []
    let paramCount = 0

    if (data.year !== undefined) {
      paramCount++
      fields.push(`year = $${paramCount}`)
      params.push(data.year)
    }

    if (data.quarter !== undefined) {
      paramCount++
      fields.push(`quarter = $${paramCount}`)
      params.push(data.quarter)
    }

    if (data.planned_activities !== undefined) {
      paramCount++
      fields.push(`planned_activities = $${paramCount}`)
      params.push(JSON.stringify(data.planned_activities))
    }

    if (data.institution_assignments !== undefined) {
      paramCount++
      fields.push(`institution_assignments = $${paramCount}`)
      params.push(JSON.stringify(data.institution_assignments))
    }

    if (data.deliverables_expected !== undefined) {
      paramCount++
      fields.push(`deliverables_expected = $${paramCount}`)
      params.push(JSON.stringify(data.deliverables_expected))
    }

    if (data.budget_allocation !== undefined) {
      paramCount++
      fields.push(`budget_allocation = $${paramCount}`)
      params.push(data.budget_allocation)
    }

    if (fields.length === 0) {
      return this.getQuarterlyMilestoneById(id)
    }

    paramCount++
    fields.push(`updated_at = CURRENT_TIMESTAMP`)

    const sql = `UPDATE rd_dev_quarterly_milestones SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`
    params.push(id)

    const result = await query(sql, params)
    return result.rows[0] || null
  }

  async deleteQuarterlyMilestone(id: number): Promise<boolean> {
    const result = await query('DELETE FROM rd_dev_quarterly_milestones WHERE id = $1', [id])
    return result.rowCount > 0
  }
}
