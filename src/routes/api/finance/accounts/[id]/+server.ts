import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

// 특정 계좌 조회
export const GET: RequestHandler = async ({ params }) => {
  try {
    const accountId = params.id

    const queryText = `
      SELECT
        a.*,
        b.name as bank_name,
        b.code as bank_code,
        b.color as bank_color,
        COALESCE(latest_tx.balance, 0) as current_balance
      FROM finance_accounts a
      LEFT JOIN finance_banks b ON a.bank_id = b.id
      LEFT JOIN LATERAL (
        SELECT balance 
        FROM finance_transactions 
        WHERE account_id = a.id AND balance > 0
        ORDER BY transaction_date DESC, created_at DESC 
        LIMIT 1
      ) latest_tx ON true
      WHERE a.id = $1
    `

    const result = await query(queryText, [accountId])

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
      balance: parseFloat(row.current_balance),
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
    logger.error('계좌 조회 실패:', error)
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

    const queryText = `
      UPDATE finance_accounts
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *,
        (SELECT name FROM finance_banks WHERE id = finance_accounts.bank_id) as bank_name,
        (SELECT code FROM finance_banks WHERE id = finance_accounts.bank_id) as bank_code,
        (SELECT color FROM finance_banks WHERE id = finance_accounts.bank_id) as bank_color,
        COALESCE((
          SELECT balance 
          FROM finance_transactions 
          WHERE account_id = finance_accounts.id AND balance > 0
          ORDER BY transaction_date DESC, created_at DESC 
          LIMIT 1
        ), 0) as current_balance
    `

    const result = await query(queryText, queryParams)

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
        bank: {
          id: account.bank_id,
          name: account.bank_name,
          code: account.bank_code,
          color: account.bank_color,
          isActive: true,
          createdAt: '',
          updatedAt: '',
        },
        accountType: account.account_type,
        balance: parseFloat(account.current_balance),
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
    logger.error('계좌 수정 실패:', error)
    return json(
      {
        success: false,
        error: '계좌 수정에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// 계좌 완전 삭제 (거래 내역 포함)
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const accountId = params.id

    logger.info(`🔥 계좌 완전 삭제 시작: ${accountId}`)

    // 계좌에 연결된 거래가 있는지 확인
    const transactionCheck = await query(
      'SELECT COUNT(*) as count FROM finance_transactions WHERE account_id = $1',
      [accountId],
    )

    const transactionCount = parseInt(transactionCheck.rows[0].count)
    logger.info(`🔥 삭제할 거래 내역 수: ${transactionCount}건`)

    // 트랜잭션으로 안전하게 삭제
    await query('BEGIN')

    try {
      // 1. 관련 거래 내역 완전 삭제
      if (transactionCount > 0) {
        logger.info(`🔥 거래 내역 삭제 시작...`)
        const deleteTransactions = await query(
          'DELETE FROM finance_transactions WHERE account_id = $1',
          [accountId],
        )
        logger.info(`🔥 거래 내역 삭제 완료: ${transactionCount}건`)
      }

      // 2. 계좌 완전 삭제
      logger.info(`🔥 계좌 삭제 시작...`)
      const result = await query('DELETE FROM finance_accounts WHERE id = $1 RETURNING name', [
        accountId,
      ])

      if (result.rows.length === 0) {
        await query('ROLLBACK')
        logger.info(`🔥 계좌를 찾을 수 없음: ${accountId}`)
        return json(
          {
            success: false,
            error: '계좌를 찾을 수 없습니다.',
          },
          { status: 404 },
        )
      }

      await query('COMMIT')
      logger.info(`🔥 계좌 완전 삭제 성공: ${result.rows[0].name}`)

      const deletedAccountName = result.rows[0].name
      const message =
        transactionCount > 0
          ? `✅ 계좌 "${deletedAccountName}"과 거래 내역 ${transactionCount}건이 완전히 삭제되었습니다.`
          : `✅ 계좌 "${deletedAccountName}"이 완전히 삭제되었습니다.`

      return json({
        success: true,
        message,
        deletedTransactionCount: transactionCount,
        deletedAccountName,
      })
    } catch (deleteError) {
      await query('ROLLBACK')
      logger.error('🔥 계좌 삭제 중 오류:', deleteError)
      throw deleteError
    }
  } catch (error) {
    logger.error('🔥 계좌 삭제 실패:', error)
    return json(
      {
        success: false,
        error: '계좌 삭제에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
