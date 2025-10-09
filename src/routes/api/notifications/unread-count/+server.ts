import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { notificationService } from '$lib/planner/services/notification.service'

// Get unread count for current user
export const GET: RequestHandler = async ({ locals }) => {
	try {
		const user = locals.user
		if (!user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 })
		}

		const count = await notificationService.getUnreadCount(user.id)

		return json({
			success: true,
			data: { count },
		})
	} catch (error) {
		console.error('Failed to get unread count:', error)
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to get unread count',
			},
			{ status: 500 },
		)
	}
}
