import { query } from '$lib/database/connection'
import type { FinanceAlert } from '$lib/finance/types'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 알림 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    // 쿼리 파라미터 파싱
    const isRead = url.searchParams.get('isRead')
    const type = url.searchParams.get('type')
    const severity = url.searchParams.get('severity')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    // 동적 쿼리 구성
    let queryText = `
      SELECT
        a.*,
        acc.name as account_name,
        t.description as transaction_description
      FROM finance_alerts a
      LEFT JOIN finance_accounts acc ON a.account_id = acc.id
      LEFT JOIN finance_transactions t ON a.transaction_id = t.id
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (isRead !== null) {
      queryText += ` AND a.is_read = $${paramIndex++}`
      params.push(isRead === 'true')
    }

    if (type) {
      queryText += ` AND a.type = $${paramIndex++}`
      params.push(type)
    }

    if (severity) {
      queryText += ` AND a.severity = $${paramIndex++}`
      params.push(severity)
    }

    queryText += ` ORDER BY a.created_at DESC LIMIT $${paramIndex++}`
    params.push(limit)

    const result = await query(queryText, params)

    const alerts: FinanceAlert[] = result.rows.map((row) => ({
      id: row.id,
      type: row.type,
      severity: row.severity,
      title: row.title,
      message: row.message,
      accountId: row.account_id,
      account: row.account_id
        ? {
            id: row.account_id,
            name: row.account_name,
            accountNumber: '',
            bankId: '',
            accountType: 'checking' as const,
            balance: 0,
            status: 'active' as const,
            isPrimary: false,
            createdAt: '',
            updatedAt: '',
          }
        : undefined,
      transactionId: row.transaction_id,
      transaction: row.transaction_id
        ? {
            id: row.transaction_id,
            accountId: '',
            categoryId: '',
            amount: 0,
            type: 'expense' as const,
            status: 'completed' as const,
            description: row.transaction_description,
            transactionDate: '',
            referenceNumber: '',
            notes: '',
            tags: [],
            isRecurring: false,
            recurringPattern: null,
            attachments: [],
            createdAt: '',
            updatedAt: '',
          }
        : undefined,
      isRead: row.is_read,
      isResolved: row.is_resolved,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return json({
      success: true,
      data: alerts,
      message: `${alerts.length}개의 알림을 조회했습니다.`,
    })
  } catch (error) {
    logger.error('알림 목록 조회 실패:', error)
    return json(
      {
        success: false,
        data: [],
        error: '알림 목록을 조회할 수 없습니다.',
      },
      { status: 500 },
    )
  }
}

// 새 알림 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json()

    // 필수 필드 검증
    if (!body.type || !body.severity || !body.title || !body.message) {
      return json(
        {
          success: false,
          error: '필수 필드가 누락되었습니다.',
        },
        { status: 400 },
      )
    }

    // 알림 생성
    const queryText = `
      INSERT INTO finance_alerts (
        type, severity, title, message,
        account_id, transaction_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id,
        type,
        severity,
        title,
        message,
        account_id,
        transaction_id,
        is_read,
        is_resolved,
        created_at::text,
        updated_at::text
    `

    const params = [
      body.type,
      body.severity,
      body.title,
      body.message,
      body.accountId || null,
      body.transactionId || null,
    ]

    const result = await query(queryText, params)
    const alert = result.rows[0]

    return json({
      success: true,
      data: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        accountId: alert.account_id,
        transactionId: alert.transaction_id,
        isRead: alert.is_read,
        isResolved: alert.is_resolved,
        createdAt: alert.created_at,
        updatedAt: alert.updated_at,
      },
      message: '알림이 성공적으로 생성되었습니다.',
    })
  } catch (error) {
    logger.error('알림 생성 실패:', error)
    return json(
      {
        success: false,
        error: '알림 생성에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
