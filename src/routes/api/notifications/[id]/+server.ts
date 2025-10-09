import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { notificationService } from '$lib/planner/services/notification.service'

// Mark notification as read
export const PATCH: RequestHandler = async ({ params, locals }) => {
	try {
		const user = locals.user
		if (!user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 })
		}

		const notificationId = parseInt(params.id)
		if (isNaN(notificationId)) {
			return json({ success: false, error: 'Invalid notification ID' }, { status: 400 })
		}

		await notificationService.markAsRead(notificationId)

		return json({
			success: true,
		})
	} catch (error) {
		console.error('Failed to mark notification as read:', error)
		return json(
			{
				success: false,
				error:
					error instanceof Error
						? error.message
						: 'Failed to mark notification as read',
			},
			{ status: 500 },
		)
	}
}

// Delete notification
export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		const user = locals.user
		if (!user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 })
		}

		const notificationId = parseInt(params.id)
		if (isNaN(notificationId)) {
			return json({ success: false, error: 'Invalid notification ID' }, { status: 400 })
		}

		await notificationService.delete(notificationId)

		return json({
			success: true,
		})
	} catch (error) {
		console.error('Failed to delete notification:', error)
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to delete notification',
			},
			{ status: 500 },
		)
	}
}
