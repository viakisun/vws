import { query } from '$lib/database/connection'
import type { RdDevTechnicalSpec } from '$lib/types/rd-development'

export class RdDevTechnicalSpecService {
  async getTechnicalSpecs(filters?: {
    project_id?: number
    category?: string
    search?: string
  }): Promise<RdDevTechnicalSpec[]> {
    let sql = `
      SELECT * FROM rd_dev_technical_specs
      WHERE 1=1
    `
    const params: any[] = []

    if (filters?.project_id) {
      sql += ` AND project_id = $${params.length + 1}`
      params.push(filters.project_id)
    }

    if (filters?.category) {
      sql += ` AND category = $${params.length + 1}`
      params.push(filters.category)
    }

    if (filters?.search) {
      sql += ` AND (spec_name ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`
      params.push(`%${filters.search}%`)
    }

    sql += ` ORDER BY created_at DESC`

    const result = await query(sql, params)
    return result.rows
  }

  async getTechnicalSpecById(id: number): Promise<RdDevTechnicalSpec | null> {
    const result = await query('SELECT * FROM rd_dev_technical_specs WHERE id = $1', [id])
    return result.rows[0] || null
  }

  async createTechnicalSpec(data: Partial<RdDevTechnicalSpec>): Promise<RdDevTechnicalSpec> {
    const result = await query(
      `
      INSERT INTO rd_dev_technical_specs (
        project_id, category, spec_name, description, specifications,
        requirements, constraints
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
      [
        data.project_id,
        data.category,
        data.spec_name,
        data.description,
        data.specifications ? JSON.stringify(data.specifications) : null,
        data.requirements ? JSON.stringify(data.requirements) : null,
        data.constraints ? JSON.stringify(data.constraints) : null,
      ],
    )
    return result.rows[0]
  }

  async updateTechnicalSpec(
    id: number,
    data: Partial<RdDevTechnicalSpec>,
  ): Promise<RdDevTechnicalSpec | null> {
    const fields: string[] = []
    const params: any[] = []
    let paramCount = 0

    if (data.category !== undefined) {
      paramCount++
      fields.push(`category = $${paramCount}`)
      params.push(data.category)
    }

    if (data.spec_name !== undefined) {
      paramCount++
      fields.push(`spec_name = $${paramCount}`)
      params.push(data.spec_name)
    }

    if (data.description !== undefined) {
      paramCount++
      fields.push(`description = $${paramCount}`)
      params.push(data.description)
    }

    if (data.specifications !== undefined) {
      paramCount++
      fields.push(`specifications = $${paramCount}`)
      params.push(JSON.stringify(data.specifications))
    }

    if (data.requirements !== undefined) {
      paramCount++
      fields.push(`requirements = $${paramCount}`)
      params.push(JSON.stringify(data.requirements))
    }

    if (data.constraints !== undefined) {
      paramCount++
      fields.push(`constraints = $${paramCount}`)
      params.push(JSON.stringify(data.constraints))
    }

    if (fields.length === 0) {
      return this.getTechnicalSpecById(id)
    }

    paramCount++
    fields.push(`updated_at = CURRENT_TIMESTAMP`)

    const sql = `UPDATE rd_dev_technical_specs SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`
    params.push(id)

    const result = await query(sql, params)
    return result.rows[0] || null
  }

  async deleteTechnicalSpec(id: number): Promise<boolean> {
    const result = await query('DELETE FROM rd_dev_technical_specs WHERE id = $1', [id])
    return result.rowCount > 0
  }
}
