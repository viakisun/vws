import { requireAuth } from '$lib/auth/middleware'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 알림 목록 조회
export const GET: RequestHandler = async (event) => {
  try {
    const { user } = await requireAuth(event)
    const { url } = event

    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const type = url.searchParams.get('type')
    const category = url.searchParams.get('category')
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true'

    const offset = (page - 1) * limit

    // WHERE 조건 구성
    const whereConditions = ['n.employee_id = $1']
    const params = [user.id, limit, offset]
    let paramIndex = 4

    if (type) {
      whereConditions.push(`n.type = $${paramIndex}`)
      params.push(type)
      paramIndex++
    }

    if (category) {
      whereConditions.push(`n.category = $${paramIndex}`)
      params.push(category)
      paramIndex++
    }

    if (unreadOnly) {
      whereConditions.push(`n.is_read = false`)
    }

    // 만료되지 않은 알림만 조회
    whereConditions.push(`(n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP)`)

    const whereClause = whereConditions.join(' AND ')

    // 알림 목록 조회
    const notificationsResult = await query(
      `
      SELECT 
        n.*,
        CASE 
          WHEN n.type = 'info' THEN '정보'
          WHEN n.type = 'warning' THEN '경고'
          WHEN n.type = 'error' THEN '오류'
          WHEN n.type = 'success' THEN '성공'
          WHEN n.type = 'approval_request' THEN '승인 요청'
          WHEN n.type = 'system' THEN '시스템'
          WHEN n.type = 'reminder' THEN '알림'
          ELSE n.type
        END as type_label,
        CASE 
          WHEN n.category = 'general' THEN '일반'
          WHEN n.category = 'attendance' THEN '출퇴근'
          WHEN n.category = 'leave' THEN '휴가'
          WHEN n.category = 'salary' THEN '급여'
          WHEN n.category = 'announcement' THEN '공지사항'
          WHEN n.category = 'system' THEN '시스템'
          WHEN n.category = 'approval' THEN '승인'
          ELSE n.category
        END as category_label
      FROM notifications n
      WHERE ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $2 OFFSET $3
    `,
      params,
    )

    // 전체 개수 조회
    const countResult = await query(
      `
      SELECT COUNT(*) as total
      FROM notifications n
      WHERE ${whereClause}
    `,
      params.slice(0, -2),
    ) // limit, offset 제거

    const total = parseInt(countResult.rows[0].total)

    // 읽지 않은 알림 개수 조회
    const unreadCountResult = await query(
      `
      SELECT COUNT(*) as unread_count
      FROM notifications n
      WHERE n.employee_id = $1 
        AND n.is_read = false
        AND (n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP)
    `,
      [user.id],
    )

    const unreadCount = parseInt(unreadCountResult.rows[0].unread_count)

    return json({
      success: true,
      data: {
        notifications: notificationsResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        unreadCount,
      },
    })
  } catch (error) {
    logger.error('Error fetching notifications:', error)
    return json({ success: false, message: '알림 조회에 실패했습니다.' }, { status: 500 })
  }
}

// 알림 읽음 처리
export const POST: RequestHandler = async (event) => {
  try {
    const { user } = await requireAuth(event)
    const { notificationId, action } = await event.request.json()

    if (action === 'mark_read' && notificationId) {
      // 특정 알림 읽음 처리
      const result = await query(
        `
        UPDATE notifications 
        SET is_read = true, read_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND employee_id = $2
        RETURNING *
      `,
        [notificationId, user.id],
      )

      if (result.rows.length === 0) {
        return json({ success: false, message: '알림을 찾을 수 없습니다.' }, { status: 404 })
      }

      return json({
        success: true,
        message: '알림을 읽음으로 표시했습니다.',
        data: result.rows[0],
      })
    } else if (action === 'mark_unread' && notificationId) {
      // 특정 알림 읽지 않음 처리
      const result = await query(
        `
        UPDATE notifications 
        SET is_read = false, read_at = NULL
        WHERE id = $1 AND employee_id = $2
        RETURNING *
      `,
        [notificationId, user.id],
      )

      if (result.rows.length === 0) {
        return json({ success: false, message: '알림을 찾을 수 없습니다.' }, { status: 404 })
      }

      return json({
        success: true,
        message: '알림을 읽지 않음으로 표시했습니다.',
        data: result.rows[0],
      })
    } else if (action === 'mark_all_read') {
      // 모든 알림 읽음 처리
      const result = await query(
        `
        UPDATE notifications 
        SET is_read = true, read_at = CURRENT_TIMESTAMP
        WHERE employee_id = $1 AND is_read = false
        RETURNING COUNT(*) as updated_count
      `,
        [user.id],
      )

      const updatedCount = parseInt(result.rows[0].updated_count)

      return json({
        success: true,
        message: `${updatedCount}개의 알림을 읽음으로 표시했습니다.`,
        data: { updatedCount },
      })
    } else if (action === 'delete' && notificationId) {
      // 특정 알림 삭제
      const result = await query(
        `
        DELETE FROM notifications 
        WHERE id = $1 AND employee_id = $2
        RETURNING *
      `,
        [notificationId, user.id],
      )

      if (result.rows.length === 0) {
        return json({ success: false, message: '알림을 찾을 수 없습니다.' }, { status: 404 })
      }

      return json({
        success: true,
        message: '알림이 삭제되었습니다.',
      })
    } else if (action === 'delete_all_read') {
      // 읽은 알림 모두 삭제
      const result = await query(
        `
        DELETE FROM notifications 
        WHERE employee_id = $1 AND is_read = true
        RETURNING COUNT(*) as deleted_count
      `,
        [user.id],
      )

      const deletedCount = parseInt(result.rows[0].deleted_count)

      return json({
        success: true,
        message: `${deletedCount}개의 읽은 알림이 삭제되었습니다.`,
        data: { deletedCount },
      })
    } else {
      return json({ success: false, message: '잘못된 액션입니다.' }, { status: 400 })
    }
  } catch (error) {
    logger.error('Error updating notification:', error)
    return json({ success: false, message: '알림 처리에 실패했습니다.' }, { status: 500 })
  }
}
