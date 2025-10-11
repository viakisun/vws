import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 알림 읽음 처리
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const alertId = params.id
    const body = await request.json()

    if (!body.action || !['read', 'resolve'].includes(body.action)) {
      return json(
        {
          success: false,
          error: '유효하지 않은 액션입니다.',
        },
        { status: 400 },
      )
    }

    let queryText: string
    let params_array: any[]

    const returningClause = `
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

    if (body.action === 'read') {
      queryText = `
        UPDATE finance_alerts
        SET is_read = true, updated_at = NOW()
        WHERE id = $1
        ${returningClause}
      `
      params_array = [alertId]
    } else {
      queryText = `
        UPDATE finance_alerts
        SET is_resolved = true, updated_at = NOW()
        WHERE id = $1
        ${returningClause}
      `
      params_array = [alertId]
    }

    const result = await query(queryText, params_array)

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '알림을 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

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
      message: `알림이 ${body.action === 'read' ? '읽음' : '해결'} 처리되었습니다.`,
    })
  } catch (error) {
    logger.error('알림 처리 실패:', error)
    return json(
      {
        success: false,
        error: '알림 처리에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// 알림 삭제
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const alertId = params.id

    const result = await query('DELETE FROM finance_alerts WHERE id = $1 RETURNING title', [
      alertId,
    ])

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '알림을 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    return json({
      success: true,
      message: `알림 "${result.rows[0].title}"이 성공적으로 삭제되었습니다.`,
    })
  } catch (error) {
    logger.error('알림 삭제 실패:', error)
    return json(
      {
        success: false,
        error: '알림 삭제에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
