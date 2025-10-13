import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params

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
        c.opportunity_id,
        c.created_at::text,
        c.updated_at::text,
        cust.name as customer_name
      FROM crm_contracts c
      LEFT JOIN crm_customers cust ON c.customer_id = cust.id
      WHERE c.id = $1
      `,
      [id],
    )

    if (result.rows.length === 0) {
      return json({ success: false, error: 'Contract not found' }, { status: 404 })
    }

    const row = result.rows[0]
    const contract = {
      id: row.id,
      customerId: row.customer_id,
      customerName: row.customer_name,
      opportunityId: row.opportunity_id,
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
    }

    return json({ success: true, data: contract })
  } catch (error: unknown) {
    logger.error('Failed to fetch contract:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '계약 조회에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params
    const body = await request.json()

    const result = await query(
      `
      UPDATE crm_contracts
      SET 
        customer_id = COALESCE($1, customer_id),
        contract_number = COALESCE($2, contract_number),
        title = COALESCE($3, title),
        type = COALESCE($4, type),
        contract_party = COALESCE($5, contract_party),
        total_amount = COALESCE($6, total_amount),
        contract_type = COALESCE($7, contract_type),
        start_date = COALESCE($8, start_date),
        end_date = $9,
        payment_method = COALESCE($10, payment_method),
        assigned_to = COALESCE($11, assigned_to),
        status = COALESCE($12, status),
        description = COALESCE($13, description),
        contract_file_s3_key = $14,
        updated_at = NOW()
      WHERE id = $15
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
        contract_file_s3_key,
        created_at::text,
        updated_at::text
      `,
      [
        body.customerId,
        body.contractNumber,
        body.title,
        body.type,
        body.contractParty,
        body.totalAmount,
        body.contractType,
        body.startDate,
        body.endDate || null,
        body.paymentMethod,
        body.assignedTo,
        body.status,
        body.description,
        body.contractFileS3Key || null,
        id,
      ],
    )

    if (result.rows.length === 0) {
      return json({ success: false, error: 'Contract not found' }, { status: 404 })
    }

    return json({ success: true, data: result.rows[0] })
  } catch (error: unknown) {
    logger.error('Failed to update contract:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '계약 수정에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { id } = params

    const result = await query(
      `
      DELETE FROM crm_contracts
      WHERE id = $1
      RETURNING id
      `,
      [id],
    )

    if (result.rows.length === 0) {
      return json({ success: false, error: 'Contract not found' }, { status: 404 })
    }

    return json({ success: true, message: '계약이 삭제되었습니다.' })
  } catch (error: unknown) {
    logger.error('Failed to delete contract:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '계약 삭제에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
