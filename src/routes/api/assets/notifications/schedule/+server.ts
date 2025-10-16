import { notificationService } from '$lib/services/asset/notification-service'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// POST /api/assets/notifications/schedule - 알림 스케줄링 (수동 트리거)
export const POST: RequestHandler = async () => {
  try {
    await notificationService.scheduleAllNotifications()
    return json({ success: true, message: '알림 스케줄링이 완료되었습니다.' })
  } catch (error) {
    console.error('Failed to schedule notifications:', error)
    return json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST /api/assets/notifications/send - 알림 발송
export const PUT: RequestHandler = async () => {
  try {
    await notificationService.sendNotifications()
    return json({ success: true, message: '알림 발송이 완료되었습니다.' })
  } catch (error) {
    console.error('Failed to send notifications:', error)
    return json({ success: false, error: error.message }, { status: 500 })
  }
}
