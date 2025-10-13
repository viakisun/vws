import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  try {
    const customerId = url.searchParams.get('customerId')
    const contractType = url.searchParams.get('contractType') // revenue or expense
    const status = url.searchParams.get('status')

    let whereConditions = ['1=1']
    const params: any[] = []
    let paramIndex = 1

    if (customerId) {
      whereConditions.push(`c.customer_id = $${paramIndex}`)
      params.push(customerId)
      paramIndex++
    }

    if (contractType) {
      whereConditions.push(`c.contract_type = $${paramIndex}`)
      params.push(contractType)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`c.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')

    const result = await query(
      `
      SELECT 
        c.id,
        c.customer_id,
        c.contract_number,
        c.title,
        c.type,
        c.contract_party,
        c.total_amount,
        c.paid_amount,
        c.contract_type,
        c.start_date::text,
        c.end_date::text,
        c.payment_method,
        c.payment_terms,
        c.assigned_to,
        c.status,
        c.contract_file_s3_key,
        c.renewal_date::text,
        c.description,
        c.created_at::text,
        c.updated_at::text,
        cust.name as customer_name
      FROM crm_contracts c
      LEFT JOIN crm_customers cust ON c.customer_id = cust.id
      WHERE ${whereClause}
      ORDER BY c.start_date DESC NULLS LAST, c.created_at DESC
      `,
      params,
    )

    const contracts = result.rows.map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      customerName: row.customer_name,
      contractNumber: row.contract_number,
      title: row.title,
      type: row.type,
      contractParty: row.contract_party,
      totalAmount: parseFloat(row.total_amount),
      paidAmount: row.paid_amount ? parseFloat(row.paid_amount) : 0,
      contractType: row.contract_type,
      startDate: row.start_date,
      endDate: row.end_date,
      paymentMethod: row.payment_method,
      paymentTerms: row.payment_terms,
      assignedTo: row.assigned_to,
      status: row.status,
      contractFileS3Key: row.contract_file_s3_key,
      renewalDate: row.renewal_date,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return json({ success: true, data: contracts })
  } catch (error: unknown) {
    logger.error('Failed to fetch contracts:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '계약 목록 조회에 실패했습니다.',
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
      INSERT INTO crm_contracts (
        customer_id,
        contract_number,
        title,
        type,
        contract_party,
        total_amount,
        contract_type,
        start_date,
        end_date,
        payment_method,
        assigned_to,
        status,
        description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING 
        id,
        customer_id,
        contract_number,
        title,
        type,
        contract_party,
        total_amount,
        contract_type,
        start_date::text,
        end_date::text,
        payment_method,
        assigned_to,
        status,
        description,
        created_at::text,
        updated_at::text
      `,
      [
        body.customerId,
        body.contractNumber,
        body.title,
        body.type || 'sales',
        body.contractParty,
        body.totalAmount,
        body.contractType || 'revenue',
        body.startDate,
        body.endDate || null,
        body.paymentMethod || '',
        body.assignedTo || '',
        body.status || 'active',
        body.description || '',
      ],
    )

    return json({ success: true, data: result.rows[0] })
  } catch (error: unknown) {
    logger.error('Failed to create contract:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '계약 생성에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
