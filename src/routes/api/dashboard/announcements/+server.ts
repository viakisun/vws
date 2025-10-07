import { requireAuth } from '$lib/auth/middleware'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 공지사항 목록 조회
export const GET: RequestHandler = async (event) => {
  try {
    const { user } = await requireAuth(event)
    const { url } = event

    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const category = url.searchParams.get('category')
    const priority = url.searchParams.get('priority')
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true'

    const offset = (page - 1) * limit

    // WHERE 조건 구성
    const whereConditions = ['a.is_published = true']
    const params = [user.id, limit, offset]
    let paramIndex = 4

    if (category) {
      whereConditions.push(`a.category = $${paramIndex}`)
      params.push(category)
      paramIndex++
    }

    if (priority) {
      whereConditions.push(`a.priority = $${paramIndex}`)
      params.push(priority)
      paramIndex++
    }

    if (unreadOnly) {
      whereConditions.push(`ar.announcement_id IS NULL`)
    }

    // 만료되지 않은 공지사항만 조회
    whereConditions.push(`(a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)`)

    const whereClause = whereConditions.join(' AND ')

    // 공지사항 목록 조회
    const announcementsResult = await query(
      `
      SELECT 
        a.*,
        author.first_name || ' ' || author.last_name as author_name,
        CASE WHEN ar.announcement_id IS NOT NULL THEN true ELSE false END as is_read,
        ar.read_at
      FROM announcements a
      JOIN employees author ON a.author_id = author.id
      LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.employee_id = $1
      WHERE ${whereClause}
      ORDER BY 
        CASE 
          WHEN a.priority = 'urgent' THEN 1
          WHEN a.priority = 'high' THEN 2
          WHEN a.priority = 'normal' THEN 3
          ELSE 4
        END,
        a.published_at DESC
      LIMIT $2 OFFSET $3
    `,
      params,
    )

    // 전체 개수 조회
    const countResult = await query(
      `
      SELECT COUNT(*) as total
      FROM announcements a
      LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.employee_id = $1
      WHERE ${whereClause}
    `,
      params.slice(0, -2),
    ) // limit, offset 제거

    const total = parseInt(countResult.rows[0].total)

    // 읽지 않은 공지사항 개수 조회
    const unreadCountResult = await query(
      `
      SELECT COUNT(*) as unread_count
      FROM announcements a
      LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.employee_id = $1
      WHERE a.is_published = true 
        AND ar.announcement_id IS NULL
        AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)
    `,
      [user.id],
    )

    const unreadCount = parseInt(unreadCountResult.rows[0].unread_count)

    return json({
      success: true,
      data: {
        announcements: announcementsResult.rows,
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
    logger.error('Error fetching announcements:', error)
    return json({ success: false, message: '공지사항 조회에 실패했습니다.' }, { status: 500 })
  }
}

// 공지사항 읽음 처리
export const POST: RequestHandler = async (event) => {
  try {
    const { user } = await requireAuth(event)
    const { announcementId, action } = await event.request.json()

    if (!announcementId) {
      return json({ success: false, message: '공지사항 ID가 필요합니다.' }, { status: 400 })
    }

    if (action === 'mark_read') {
      // 읽음 처리
      await query(
        `
        INSERT INTO announcement_reads (announcement_id, employee_id, read_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (announcement_id, employee_id) DO NOTHING
      `,
        [announcementId, user.id],
      )

      return json({
        success: true,
        message: '공지사항을 읽음으로 표시했습니다.',
      })
    } else if (action === 'mark_unread') {
      // 읽지 않음 처리
      await query(
        `
        DELETE FROM announcement_reads 
        WHERE announcement_id = $1 AND employee_id = $2
      `,
        [announcementId, user.id],
      )

      return json({
        success: true,
        message: '공지사항을 읽지 않음으로 표시했습니다.',
      })
    } else if (action === 'mark_all_read') {
      // 모든 공지사항 읽음 처리
      await query(
        `
        INSERT INTO announcement_reads (announcement_id, employee_id, read_at)
        SELECT a.id, $1, CURRENT_TIMESTAMP
        FROM announcements a
        WHERE a.is_published = true 
          AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)
          AND NOT EXISTS (
            SELECT 1 FROM announcement_reads ar 
            WHERE ar.announcement_id = a.id AND ar.employee_id = $1
          )
      `,
        [user.id],
      )

      return json({
        success: true,
        message: '모든 공지사항을 읽음으로 표시했습니다.',
      })
    } else {
      return json({ success: false, message: '잘못된 액션입니다.' }, { status: 400 })
    }
  } catch (error) {
    logger.error('Error updating announcement read status:', error)
    return json(
      { success: false, message: '공지사항 읽음 상태 업데이트에 실패했습니다.' },
      { status: 500 },
    )
  }
}
