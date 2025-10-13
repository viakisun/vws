import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  try {
    const customerId = url.searchParams.get('customerId')
    const type = url.searchParams.get('type')
    const limit = url.searchParams.get('limit') || '50'

    let whereConditions = ['1=1']
    const params: any[] = []
    let paramIndex = 1

    if (customerId) {
      whereConditions.push(`i.customer_id = $${paramIndex}`)
      params.push(customerId)
      paramIndex++
    }

    if (type) {
      whereConditions.push(`i.type = $${paramIndex}`)
      params.push(type)
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')
    params.push(parseInt(limit))

    const result = await query(
      `
      SELECT 
        i.id,
        i.customer_id,
        i.type,
        i.title,
        i.description,
        i.interaction_date::text,
        i.next_action_date::text,
        i.created_by,
        i.created_at::text,
        i.updated_at::text,
        c.name as customer_name,
        COALESCE(CONCAT(e.last_name, e.first_name), '') as created_by_name
      FROM crm_interactions i
      LEFT JOIN crm_customers c ON i.customer_id = c.id
      LEFT JOIN employees e ON i.created_by = e.id
      WHERE ${whereClause}
      ORDER BY i.interaction_date DESC
      LIMIT $${paramIndex}
      `,
      params,
    )

    const interactions = result.rows.map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      customerName: row.customer_name,
      type: row.type,
      title: row.title,
      description: row.description,
      interactionDate: row.interaction_date,
      nextActionDate: row.next_action_date,
      createdBy: row.created_by,
      createdByName: row.created_by_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return json({ success: true, data: interactions })
  } catch (error: unknown) {
    logger.error('Failed to fetch interactions:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '상호작용 목록 조회에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const body = await request.json()
    const user = locals.user

    const result = await query(
      `
      INSERT INTO crm_interactions (
        customer_id,
        type,
        title,
        description,
        interaction_date,
        next_action_date,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id,
        customer_id,
        type,
        title,
        description,
        interaction_date::text,
        next_action_date::text,
        created_by,
        created_at::text,
        updated_at::text
      `,
      [
        body.customerId,
        body.type,
        body.title,
        body.description || '',
        body.interactionDate || new Date().toISOString(),
        body.nextActionDate || null,
        user?.employeeId || null,
      ],
    )

    return json({ success: true, data: result.rows[0] })
  } catch (error: unknown) {
    logger.error('Failed to create interaction:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '상호작용 생성에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
