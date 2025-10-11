import { DatabaseService } from '$lib/database/connection'
import type {
  CreateProductInput,
  Product,
  ProductFilters,
  ProductWithOwner,
  UpdateProductInput,
} from '$lib/planner/types'

export class ProductService {
  // =============================================
  // CREATE
  // =============================================

  async create(input: CreateProductInput, actorId: string): Promise<Product> {
    const result = await DatabaseService.query(
      `
			INSERT INTO planner_products (
				name, code, description, owner_id,
				repository_url, documentation_url,
				status, created_at, updated_at
			)
			VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())
			RETURNING id, name, code, description, owner_id, status, repository_url, 
                documentation_url, deleted_at::text, created_at::text, updated_at::text, 
                category, display_order
		`,
      [
        input.name,
        input.code,
        input.description || null,
        input.owner_id,
        input.repository_url || null,
        input.documentation_url || null,
      ],
    )

    // Log activity
    await this.logActivity('product', result.rows[0].id, 'created', actorId, null, result.rows[0])

    return result.rows[0]
  }

  // =============================================
  // READ
  // =============================================

  async getById(id: string): Promise<ProductWithOwner | null> {
    const result = await DatabaseService.query(
      `
			SELECT
				p.*,
				json_build_object(
					'id', e.id,
					'first_name', e.first_name,
					'last_name', e.last_name,
					'email', e.email,
					'department', e.department,
					'position', e.position
				) as owner,
				(SELECT COUNT(*) FROM planner_initiatives WHERE product_id = p.id AND deleted_at IS NULL) as initiative_count,
				(SELECT COUNT(*) FROM planner_initiatives WHERE product_id = p.id AND status = 'active' AND deleted_at IS NULL) as active_initiative_count,
				(SELECT COUNT(*) FROM planner_milestones WHERE product_id = p.id AND deleted_at IS NULL) as milestone_count
			FROM planner_products p
			JOIN employees e ON p.owner_id = e.id
			WHERE p.id = $1 AND p.deleted_at IS NULL
		`,
      [id],
    )

    return result.rows[0] || null
  }

  async list(filters: ProductFilters = {}): Promise<ProductWithOwner[]> {
    const conditions: string[] = ['p.deleted_at IS NULL']
    const params: unknown[] = []
    let paramIndex = 1

    if (filters.status) {
      conditions.push(`p.status = $${paramIndex}`)
      params.push(filters.status)
      paramIndex++
    }

    if (filters.owner_id) {
      conditions.push(`p.owner_id = $${paramIndex}`)
      params.push(filters.owner_id)
      paramIndex++
    }

    if (filters.search) {
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.code ILIKE $${paramIndex})`)
      params.push(`%${filters.search}%`)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const limit = filters.limit || 100
    const offset = filters.offset || 0

    const result = await DatabaseService.query(
      `
			SELECT
				p.*,
				json_build_object(
					'id', e.id,
					'first_name', e.first_name,
					'last_name', e.last_name,
					'email', e.email,
					'department', e.department,
					'position', e.position
				) as owner,
				(SELECT COUNT(*) FROM planner_initiatives WHERE product_id = p.id AND deleted_at IS NULL) as initiative_count,
				(SELECT COUNT(*) FROM planner_initiatives WHERE product_id = p.id AND status = 'active' AND deleted_at IS NULL) as active_initiative_count,
				(SELECT COUNT(*) FROM planner_milestones WHERE product_id = p.id AND deleted_at IS NULL) as milestone_count
			FROM planner_products p
			JOIN employees e ON p.owner_id = e.id
			${whereClause}
			ORDER BY p.created_at DESC
			LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
		`,
      [...params, limit, offset],
    )

    return result.rows
  }

  // =============================================
  // UPDATE
  // =============================================

  async update(id: string, input: UpdateProductInput, actorId: string): Promise<Product | null> {
    const current = await this.getById(id)
    if (!current) return null

    const updates: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (input.name !== undefined) {
      updates.push(`name = $${paramIndex}`)
      params.push(input.name)
      paramIndex++
    }

    if (input.code !== undefined) {
      updates.push(`code = $${paramIndex}`)
      params.push(input.code)
      paramIndex++
    }

    if (input.description !== undefined) {
      updates.push(`description = $${paramIndex}`)
      params.push(input.description)
      paramIndex++
    }

    if (input.owner_id !== undefined) {
      updates.push(`owner_id = $${paramIndex}`)
      params.push(input.owner_id)
      paramIndex++
    }

    if (input.status !== undefined) {
      updates.push(`status = $${paramIndex}`)
      params.push(input.status)
      paramIndex++
    }

    if (input.repository_url !== undefined) {
      updates.push(`repository_url = $${paramIndex}`)
      params.push(input.repository_url)
      paramIndex++
    }

    if (input.documentation_url !== undefined) {
      updates.push(`documentation_url = $${paramIndex}`)
      params.push(input.documentation_url)
      paramIndex++
    }

    if (input.category !== undefined) {
      updates.push(`category = $${paramIndex}`)
      params.push(input.category)
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
			UPDATE planner_products
			SET ${updates.join(', ')}
			WHERE id = $${paramIndex} AND deleted_at IS NULL
			RETURNING id, name, code, description, owner_id, status, repository_url, 
                documentation_url, deleted_at::text, created_at::text, updated_at::text, 
                category, display_order
		`,
      [...params, id],
    )

    if (result.rows[0]) {
      await this.logActivity('product', id, 'updated', actorId, current, result.rows[0])
    }

    return result.rows[0] || null
  }

  // =============================================
  // DELETE
  // =============================================

  async delete(id: string, actorId: string): Promise<boolean> {
    const current = await this.getById(id)
    if (!current) return false

    const result = await DatabaseService.query(
      `
			UPDATE planner_products
			SET deleted_at = NOW(), updated_at = NOW()
			WHERE id = $1 AND deleted_at IS NULL
		`,
      [id],
    )

    if (result.rowCount && result.rowCount > 0) {
      await this.logActivity('product', id, 'deleted', actorId, current, null)
      return true
    }

    return false
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

export const productService = new ProductService()
