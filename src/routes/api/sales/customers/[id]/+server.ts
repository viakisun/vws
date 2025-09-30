import { query } from '$lib/database/connection'
import type { Customer, SalesApiResponse } from '$lib/sales/types'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 개별 거래처 조회, 수정, 삭제
export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params

    const result = await query(
      'SELECT * FROM sales_customers WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      const response: SalesApiResponse<null> = {
        success: false,
        error: '거래처를 찾을 수 없습니다.',
      }
      return json(response, { status: 404 })
    }

    const response: SalesApiResponse<Customer> = {
      success: true,
      data: result.rows[0] as Customer,
    }

    return json(response)
  } catch (error) {
    console.error('거래처 조회 실패:', error)
    const response: SalesApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '거래처를 조회할 수 없습니다.',
    }
    return json(response, { status: 500 })
  }
}

// 거래처 수정
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params
    const data = await request.json()

    // 필수 필드 검증
    if (!data.name || !data.business_number) {
      const response: SalesApiResponse<null> = {
        success: false,
        error: '회사명과 사업자번호는 필수입니다.',
      }
      return json(response, { status: 400 })
    }

    const result = await query(
      `
      UPDATE sales_customers SET
        name = $1,
        type = $2,
        business_number = $3,
        contact_person = $4,
        contact_phone = $5,
        contact_email = $6,
        address = $7,
        industry = $8,
        payment_terms = $9,
        status = $10,
        notes = $11,
        updated_at = NOW()
      WHERE id = $12
      RETURNING *
      `,
      [
        data.name,
        data.type || 'customer',
        data.business_number,
        data.contact_person || null,
        data.contact_phone || null,
        data.contact_email || null,
        data.address || null,
        data.industry || null,
        data.payment_terms || 30,
        data.status || 'active',
        data.notes || null,
        id,
      ]
    )

    if (result.rows.length === 0) {
      const response: SalesApiResponse<null> = {
        success: false,
        error: '거래처를 찾을 수 없습니다.',
      }
      return json(response, { status: 404 })
    }

    const response: SalesApiResponse<Customer> = {
      success: true,
      data: result.rows[0] as Customer,
      message: '거래처가 성공적으로 수정되었습니다.',
    }

    return json(response)
  } catch (error) {
    console.error('거래처 수정 실패:', error)
    const response: SalesApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '거래처 수정에 실패했습니다.',
    }
    return json(response, { status: 500 })
  }
}

// 거래처 삭제
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { id } = params

    // 관련 데이터 확인 (계약, 거래내역 등)
    const contractCheck = await query(
      'SELECT COUNT(*) as count FROM sales_contracts WHERE customer_id = $1',
      [id]
    )

    const transactionCheck = await query(
      'SELECT COUNT(*) as count FROM sales_transactions WHERE customer_id = $1',
      [id]
    )

    if (parseInt(contractCheck.rows[0].count) > 0 || parseInt(transactionCheck.rows[0].count) > 0) {
      const response: SalesApiResponse<null> = {
        success: false,
        error: '관련 계약이나 거래내역이 있는 거래처는 삭제할 수 없습니다. 상태를 비활성으로 변경하세요.',
      }
      return json(response, { status: 400 })
    }

    const result = await query(
      'DELETE FROM sales_customers WHERE id = $1 RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      const response: SalesApiResponse<null> = {
        success: false,
        error: '거래처를 찾을 수 없습니다.',
      }
      return json(response, { status: 404 })
    }

    const response: SalesApiResponse<null> = {
      success: true,
      message: '거래처가 성공적으로 삭제되었습니다.',
    }

    return json(response)
  } catch (error) {
    console.error('거래처 삭제 실패:', error)
    const response: SalesApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '거래처 삭제에 실패했습니다.',
    }
    return json(response, { status: 500 })
  }
}
