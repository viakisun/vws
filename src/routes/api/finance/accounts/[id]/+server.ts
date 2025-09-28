import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { getDatabasePool } from '$lib/finance/services/database/connection'

// 특정 계좌 조회
export const GET: RequestHandler = async ({ params }) => {
  try {
    const pool = getDatabasePool()
    const accountId = params.id

    const query = `
      SELECT
        a.*,
        b.name as bank_name,
        b.code as bank_code,
        b.color as bank_color
      FROM finance_accounts a
      LEFT JOIN finance_banks b ON a.bank_id = b.id
      WHERE a.id = $1
    `

    const result = await pool.query(query, [accountId])

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '계좌를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const row = result.rows[0]
    const account = {
      id: row.id,
      name: row.name,
      accountNumber: row.account_number,
      bankId: row.bank_id,
      bank: {
        id: row.bank_id,
        name: row.bank_name,
        code: row.bank_code,
        color: row.bank_color,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      accountType: row.account_type,
      balance: parseFloat(row.balance),
      status: row.status,
      description: row.description,
      isPrimary: row.is_primary,
      alertThreshold: row.alert_threshold ? parseFloat(row.alert_threshold) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }

    return json({
      success: true,
      data: account,
    })
  } catch (error) {
    console.error('계좌 조회 실패:', error)
    return json(
      {
        success: false,
        error: '계좌를 조회할 수 없습니다.',
      },
      { status: 500 },
    )
  }
}

// 계좌 정보 수정
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const pool = getDatabasePool()
    const accountId = params.id
    const body = await request.json()

    // 업데이트할 필드들 구성
    const updateFields: string[] = []
    const queryParams: any[] = []
    let paramIndex = 1

    if (body.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`)
      queryParams.push(body.name)
    }

    if (body.accountNumber !== undefined) {
      updateFields.push(`account_number = $${paramIndex++}`)
      queryParams.push(body.accountNumber)
    }

    if (body.bankId !== undefined) {
      updateFields.push(`bank_id = $${paramIndex++}`)
      queryParams.push(body.bankId)
    }

    if (body.accountType !== undefined) {
      updateFields.push(`account_type = $${paramIndex++}`)
      queryParams.push(body.accountType)
    }

    if (body.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`)
      queryParams.push(body.status)
    }

    if (body.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`)
      queryParams.push(body.description)
    }

    if (body.isPrimary !== undefined) {
      updateFields.push(`is_primary = $${paramIndex++}`)
      queryParams.push(body.isPrimary)
    }

    if (body.alertThreshold !== undefined) {
      updateFields.push(`alert_threshold = $${paramIndex++}`)
      queryParams.push(body.alertThreshold)
    }

    if (updateFields.length === 0) {
      return json(
        {
          success: false,
          error: '수정할 필드가 없습니다.',
        },
        { status: 400 },
      )
    }

    updateFields.push(`updated_at = NOW()`)
    queryParams.push(accountId)

    const query = `
      UPDATE finance_accounts
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await pool.query(query, queryParams)

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '계좌를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const account = result.rows[0]

    return json({
      success: true,
      data: {
        id: account.id,
        name: account.name,
        accountNumber: account.account_number,
        bankId: account.bank_id,
        accountType: account.account_type,
        balance: parseFloat(account.balance),
        status: account.status,
        description: account.description,
        isPrimary: account.is_primary,
        alertThreshold: account.alert_threshold ? parseFloat(account.alert_threshold) : undefined,
        createdAt: account.created_at,
        updatedAt: account.updated_at,
      },
      message: '계좌 정보가 성공적으로 수정되었습니다.',
    })
  } catch (error) {
    console.error('계좌 수정 실패:', error)
    return json(
      {
        success: false,
        error: '계좌 수정에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// 계좌 삭제
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const pool = getDatabasePool()
    const accountId = params.id

    // 계좌에 연결된 거래가 있는지 확인
    const transactionCheck = await pool.query(
      'SELECT COUNT(*) as count FROM finance_transactions WHERE account_id = $1',
      [accountId],
    )

    if (parseInt(transactionCheck.rows[0].count) > 0) {
      return json(
        {
          success: false,
          error: '거래 내역이 있는 계좌는 삭제할 수 없습니다.',
        },
        { status: 400 },
      )
    }

    // 계좌 삭제
    const result = await pool.query('DELETE FROM finance_accounts WHERE id = $1 RETURNING name', [
      accountId,
    ])

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '계좌를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    return json({
      success: true,
      message: `계좌 "${result.rows[0].name}"이 성공적으로 삭제되었습니다.`,
    })
  } catch (error) {
    console.error('계좌 삭제 실패:', error)
    return json(
      {
        success: false,
        error: '계좌 삭제에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
