import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { notificationService } from '$lib/planner/services/notification.service'

// Get notifications for current user
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const unreadOnly = url.searchParams.get('unread_only') === 'true'
    const category = url.searchParams.get('category')
    const limit = url.searchParams.get('limit')
    const offset = url.searchParams.get('offset')

    const notifications = await notificationService.getForUser(user.id, {
      unread_only: unreadOnly,
      category: category || undefined,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    })

    return json({
      success: true,
      data: notifications,
    })
  } catch (error) {
    console.error('Failed to get notifications:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get notifications',
      },
      { status: 500 },
    )
  }
}

// Mark all notifications as read
export const PATCH: RequestHandler = async ({ locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await notificationService.markAllAsRead(user.id)

    return json({
      success: true,
    })
  } catch (error) {
    console.error('Failed to mark notifications as read:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark notifications as read',
      },
      { status: 500 },
    )
  }
}
