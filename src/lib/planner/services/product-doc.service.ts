import { DatabaseService } from '$lib/database/connection'
import type {
  CreateProductDocInput,
  ProductDoc,
  ProductDocWithCreator,
  UpdateProductDocInput,
} from '$lib/planner/types'

export class ProductDocService {
  // =============================================
  // CREATE
  // =============================================

  async create(input: CreateProductDocInput, actorId: string): Promise<ProductDoc> {
    const result = await DatabaseService.query(
      `
      INSERT INTO planner_product_docs (
        product_id, title, content, display_order, created_by, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, product_id, title, content, display_order, created_by, 
                created_at::text, updated_at::text, deleted_at::text
    `,
      [input.product_id, input.title, input.content, input.display_order || 0, actorId],
    )

    // Log activity
    await this.logActivity(
      'product_doc',
      result.rows[0].id,
      'created',
      actorId,
      null,
      result.rows[0],
    )

    return result.rows[0]
  }

  // =============================================
  // READ
  // =============================================

  async getById(id: string): Promise<ProductDocWithCreator | null> {
    const result = await DatabaseService.query(
      `
      SELECT
        d.id,
        d.product_id,
        d.title,
        d.content,
        d.display_order,
        d.created_by,
        d.deleted_at::text as deleted_at,
        d.created_at::text as created_at,
        d.updated_at::text as updated_at,
        json_build_object(
          'id', e.id,
          'first_name', e.first_name,
          'last_name', e.last_name,
          'email', e.email,
          'department', e.department,
          'position', e.position
        ) as creator
      FROM planner_product_docs d
      JOIN employees e ON d.created_by = e.id
      WHERE d.id = $1 AND d.deleted_at IS NULL
    `,
      [id],
    )

    return result.rows[0] || null
  }

  async getByProductId(productId: string): Promise<ProductDocWithCreator[]> {
    try {
      const result = await DatabaseService.query(
        `
        SELECT
          d.id,
          d.product_id,
          d.title,
          d.content,
          d.display_order,
          d.created_by,
          d.deleted_at::text as deleted_at,
          d.created_at::text as created_at,
          d.updated_at::text as updated_at,
          json_build_object(
            'id', e.id,
            'first_name', e.first_name,
            'last_name', e.last_name,
            'email', e.email,
            'department', e.department,
            'position', e.position
          ) as creator
        FROM planner_product_docs d
        JOIN employees e ON d.created_by = e.id
        WHERE d.product_id = $1 AND d.deleted_at IS NULL
        ORDER BY d.display_order ASC, d.created_at DESC
      `,
        [productId],
      )

      return result.rows as ProductDocWithCreator[]
    } catch (error) {
      console.error('Error in ProductDocService.getByProductId:', error)
      if (
        error instanceof Error &&
        error.message.includes('relation "planner_product_docs" does not exist')
      ) {
        throw new Error(
          'Product docs table does not exist. Please run database migration 035_add_planner_product_docs.sql',
        )
      }
      throw error
    }
  }

  // =============================================
  // UPDATE
  // =============================================

  async update(
    id: string,
    input: UpdateProductDocInput,
    actorId: string,
  ): Promise<ProductDoc | null> {
    const current = await this.getById(id)
    if (!current) return null

    const updates: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (input.title !== undefined) {
      updates.push(`title = $${paramIndex}`)
      params.push(input.title)
      paramIndex++
    }

    if (input.content !== undefined) {
      updates.push(`content = $${paramIndex}`)
      params.push(input.content)
      paramIndex++
    }

    if (input.display_order !== undefined) {
      updates.push(`display_order = $${paramIndex}`)
      params.push(input.display_order)
      paramIndex++
    }

    if (updates.length === 0) return current

    updates.push(`updated_at = NOW()`)

    const result = await DatabaseService.query(
      `
      UPDATE planner_product_docs
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING id, product_id, title, content, display_order, created_by,
                created_at::text, updated_at::text, deleted_at::text
    `,
      [...params, id],
    )

    if (result.rows[0]) {
      await this.logActivity('product_doc', id, 'updated', actorId, current, result.rows[0])
    }

    return result.rows[0] || null
  }

  // =============================================
  // DELETE
  // =============================================

  async delete(id: string, actorId: string): Promise<{ success: boolean }> {
    const current = await this.getById(id)
    if (!current) return { success: false }

    const result = await DatabaseService.query(
      `
      UPDATE planner_product_docs
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
    `,
      [id],
    )

    if (result.rowCount && result.rowCount > 0) {
      await this.logActivity('product_doc', id, 'deleted', actorId, current, null)
      return { success: true }
    }

    return { success: false }
  }

  // =============================================
  // ACTIVITY LOG
  // =============================================

  private async logActivity(
    entityType: string,
    entityId: string,
    action: string,
    actorId: string,
    oldValue: unknown,
    newValue: unknown,
  ): Promise<void> {
    await DatabaseService.query(
      `
      INSERT INTO planner_activity_log (
        entity_type, entity_id, action, actor_id,
        old_value, new_value, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `,
      [
        entityType,
        entityId,
        action,
        actorId,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
      ],
    )
  }
}

export const productDocService = new ProductDocService()
