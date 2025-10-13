import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  try {
    const customerId = url.searchParams.get('customerId')
    const stage = url.searchParams.get('stage')
    const status = url.searchParams.get('status')

    let whereConditions = ['1=1']
    const params: any[] = []
    let paramIndex = 1

    if (customerId) {
      whereConditions.push(`o.customer_id = $${paramIndex}`)
      params.push(customerId)
      paramIndex++
    }

    if (stage) {
      whereConditions.push(`o.stage = $${paramIndex}`)
      params.push(stage)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`o.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')

    const result = await query(
      `
      SELECT 
        o.id,
        o.customer_id,
        o.title,
        o.amount,
        o.stage,
        o.probability,
        o.expected_close_date::text,
        o.actual_close_date::text,
        o.status,
        o.assigned_to,
        o.notes,
        o.created_at::text,
        o.updated_at::text,
        c.name as customer_name,
        COALESCE(CONCAT(e.last_name, e.first_name), '') as assigned_to_name
      FROM crm_opportunities o
      LEFT JOIN crm_customers c ON o.customer_id = c.id
      LEFT JOIN employees e ON o.assigned_to = e.id
      WHERE ${whereClause}
      ORDER BY o.expected_close_date ASC NULLS LAST, o.created_at DESC
      `,
      params,
    )

    const opportunities = result.rows.map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      customerName: row.customer_name,
      title: row.title,
      amount: parseFloat(row.amount),
      stage: row.stage,
      probability: row.probability,
      expectedCloseDate: row.expected_close_date,
      actualCloseDate: row.actual_close_date,
      status: row.status,
      assignedTo: row.assigned_to,
      assignedToName: row.assigned_to_name,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return json({ success: true, data: opportunities })
  } catch (error: unknown) {
    logger.error('Failed to fetch opportunities:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '영업 기회 목록 조회에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json()

    const result = await query(
      `
      INSERT INTO crm_opportunities (
        customer_id,
        title,
        amount,
        stage,
        probability,
        expected_close_date,
        status,
        assigned_to,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING 
        id,
        customer_id,
        title,
        amount,
        stage,
        probability,
        expected_close_date::text,
        status,
        assigned_to,
        notes,
        created_at::text,
        updated_at::text
      `,
      [
        body.customerId,
        body.title,
        body.amount || 0,
        body.stage || 'prospecting',
        body.probability || 50,
        body.expectedCloseDate || null,
        body.status || 'open',
        body.assignedTo || null,
        body.notes || '',
      ],
    )

    return json({ success: true, data: result.rows[0] })
  } catch (error: unknown) {
    logger.error('Failed to create opportunity:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '영업 기회 생성에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
