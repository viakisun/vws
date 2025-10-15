import { DatabaseService } from '$lib/database/connection'
import type {
  CreateProductReferenceInput,
  ProductReference,
  ProductReferenceFilters,
  ProductReferenceType,
  ProductReferenceWithCreator,
  UpdateProductReferenceInput,
} from '$lib/planner/types'
import { detectLinkType } from '$lib/utils/link-detector'

export class ProductReferenceService {
  // =============================================
  // CREATE
  // =============================================

  async create(input: CreateProductReferenceInput, actorId: string): Promise<ProductReference> {
    // Auto-detect type if not provided and we have a URL
    let type = input.type
    if (!type && input.url) {
      type = detectLinkType(input.url, input.file_name)
    }

    const result = await DatabaseService.query(
      `
      INSERT INTO planner_product_references (
        product_id, title, description, type, url, s3_key, file_name,
        file_size, mime_type, thumbnail_url, metadata, display_order,
        created_by, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING id, product_id, title, description, type, url, s3_key, file_name,
                file_size, mime_type, thumbnail_url, metadata, display_order,
                created_by, created_at::text, updated_at::text, deleted_at::text
    `,
      [
        input.product_id,
        input.title,
        input.description || null,
        type || 'other',
        input.url || null,
        input.s3_key || null,
        input.file_name || null,
        input.file_size || null,
        input.mime_type || null,
        input.thumbnail_url || null,
        input.metadata ? JSON.stringify(input.metadata) : null,
        input.display_order || 0,
        actorId,
      ],
    )

    // Log activity
    await this.logActivity(
      'product_reference',
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

  async getById(id: string): Promise<ProductReferenceWithCreator | null> {
    const result = await DatabaseService.query(
      `
      SELECT
        r.id,
        r.product_id,
        r.title,
        r.description,
        r.type,
        r.url,
        r.s3_key,
        r.file_name,
        r.file_size,
        r.mime_type,
        r.thumbnail_url,
        r.metadata,
        r.display_order,
        r.created_by,
        r.deleted_at::text as deleted_at,
        r.created_at::text as created_at,
        r.updated_at::text as updated_at,
        json_build_object(
          'id', e.id,
          'first_name', e.first_name,
          'last_name', e.last_name,
          'email', e.email,
          'department', e.department,
          'position', e.position
        ) as creator
      FROM planner_product_references r
      JOIN employees e ON r.created_by = e.id
      WHERE r.id = $1 AND r.deleted_at IS NULL
    `,
      [id],
    )

    return result.rows[0] || null
  }

  async list(filters: ProductReferenceFilters = {}): Promise<ProductReferenceWithCreator[]> {
    try {
      const conditions: string[] = ['r.deleted_at IS NULL']
      const params: unknown[] = []
      let paramIndex = 1

      if (filters.product_id) {
        conditions.push(`r.product_id = $${paramIndex}`)
        params.push(filters.product_id)
        paramIndex++
      }

      if (filters.type) {
        if (Array.isArray(filters.type)) {
          const placeholders = filters.type.map(() => `$${paramIndex++}`).join(', ')
          conditions.push(`r.type IN (${placeholders})`)
          params.push(...filters.type)
        } else {
          conditions.push(`r.type = $${paramIndex}`)
          params.push(filters.type)
          paramIndex++
        }
      }

      if (filters.created_by) {
        conditions.push(`r.created_by = $${paramIndex}`)
        params.push(filters.created_by)
        paramIndex++
      }

      if (filters.search) {
        conditions.push(`(r.title ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex})`)
        params.push(`%${filters.search}%`)
        paramIndex++
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
      const limit = filters.limit || 100
      const offset = filters.offset || 0

      const result = await DatabaseService.query(
        `
        SELECT
          r.id,
          r.product_id,
          r.title,
          r.description,
          r.type,
          r.url,
          r.s3_key,
          r.file_name,
          r.file_size,
          r.mime_type,
          r.thumbnail_url,
          r.metadata,
          r.display_order,
          r.created_by,
          r.deleted_at::text as deleted_at,
          r.created_at::text as created_at,
          r.updated_at::text as updated_at,
          json_build_object(
            'id', e.id,
            'first_name', e.first_name,
            'last_name', e.last_name,
            'email', e.email,
            'department', e.department,
            'position', e.position
          ) as creator
        FROM planner_product_references r
        JOIN employees e ON r.created_by = e.id
        ${whereClause}
        ORDER BY r.display_order ASC, r.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
        [...params, limit, offset],
      )

      const references = result.rows as ProductReferenceWithCreator[]

      // Auto-fix references with generic types by re-detecting the actual type
      references.forEach((ref) => {
        // Check both 'url' and 'file' types that might need more specific detection
        if (
          (ref.type === 'url' && ref.url) || 
          (ref.type === 'file' && ref.file_name)
        ) {
          const detectedType = detectLinkType(ref.url || '', ref.file_name)
          
          // Update if we detected a more specific type
          if (
            detectedType !== 'url' && 
            detectedType !== 'file' && 
            detectedType !== 'other' &&
            detectedType !== ref.type
          ) {
            // Update the display immediately
            ref.type = detectedType as ProductReferenceType
            // Update the type in the background
            this.update(ref.id, { type: detectedType }, ref.created_by).catch((error) => {
              console.warn(`Failed to auto-update reference ${ref.id} type:`, error)
            })
          }
        }
      })

      return references
    } catch (error) {
      console.error('Error in ProductReferenceService.list:', error)
      if (
        error instanceof Error &&
        error.message.includes('relation "planner_product_references" does not exist')
      ) {
        throw new Error(
          'Product references table does not exist. Please run database migration 032_add_planner_product_references.sql',
        )
      }
      throw error
    }
  }

  async getByProductId(productId: string): Promise<ProductReferenceWithCreator[]> {
    return this.list({ product_id: productId })
  }

  // =============================================
  // UPDATE
  // =============================================

  async update(
    id: string,
    input: UpdateProductReferenceInput,
    actorId: string,
  ): Promise<ProductReference | null> {
    const current = await this.getById(id)
    if (!current) return null

    // Auto-detect type if URL is being updated, no type is specified, or current type is generic
    let type = input.type
    if (input.url !== undefined && (!type || input.url !== current.url || current.type === 'url')) {
      type = detectLinkType(input.url, current.file_name)
    } else if (current.type === 'file' && current.file_name && !type) {
      // Also auto-detect for existing 'file' type references that might need more specific typing
      const detectedType = detectLinkType(current.url || '', current.file_name)
      if (detectedType !== 'file' && detectedType !== 'url' && detectedType !== 'other') {
        type = detectedType
      }
    }

    const updates: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (input.title !== undefined) {
      updates.push(`title = $${paramIndex}`)
      params.push(input.title)
      paramIndex++
    }

    if (input.description !== undefined) {
      updates.push(`description = $${paramIndex}`)
      params.push(input.description)
      paramIndex++
    }

    if (type !== undefined) {
      updates.push(`type = $${paramIndex}`)
      params.push(type)
      paramIndex++
    }

    if (input.url !== undefined) {
      updates.push(`url = $${paramIndex}`)
      params.push(input.url)
      paramIndex++
    }

    if (input.display_order !== undefined) {
      updates.push(`display_order = $${paramIndex}`)
      params.push(input.display_order)
      paramIndex++
    }

    if (input.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex}`)
      params.push(JSON.stringify(input.metadata))
      paramIndex++
    }

    if (updates.length === 0) return current

    updates.push(`updated_at = NOW()`)

    const result = await DatabaseService.query(
      `
      UPDATE planner_product_references
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING id, product_id, title, description, type, url, s3_key, file_name,
                file_size, mime_type, thumbnail_url, metadata, display_order,
                created_by, created_at::text, updated_at::text, deleted_at::text
    `,
      [...params, id],
    )

    if (result.rows[0]) {
      await this.logActivity('product_reference', id, 'updated', actorId, current, result.rows[0])
    }

    return result.rows[0] || null
  }

  // =============================================
  // DELETE
  // =============================================

  async delete(id: string, actorId: string): Promise<{ success: boolean; s3Key?: string }> {
    const current = await this.getById(id)
    if (!current) return { success: false }

    const result = await DatabaseService.query(
      `
      UPDATE planner_product_references
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING s3_key
    `,
      [id],
    )

    if (result.rowCount && result.rowCount > 0) {
      await this.logActivity('product_reference', id, 'deleted', actorId, current, null)
      return {
        success: true,
        s3Key: result.rows[0]?.s3_key, // Return S3 key for potential cleanup
      }
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

export const productReferenceService = new ProductReferenceService()
