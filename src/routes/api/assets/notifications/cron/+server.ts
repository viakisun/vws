import { notificationService } from '$lib/services/asset/notification-service'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * 크론잡 엔드포인트 - 자산 관련 알림 자동화
 * 매일 실행되어 만료 알림, 갱신 알림, 실사 알림 등을 스케줄링
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    // 크론잡 인증 (API 키 또는 토큰 검증)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET_TOKEN || 'default-cron-token'

    if (
      !authHeader ||
      !authHeader.startsWith('Bearer ') ||
      authHeader.split(' ')[1] !== expectedToken
    ) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const action = body.action || 'schedule'

    if (action === 'schedule') {
      // 알림 스케줄링
      await notificationService.scheduleAllNotifications()
      return json({ success: true, message: '알림 스케줄링이 완료되었습니다.' })
    } else if (action === 'send') {
      // 알림 발송
      await notificationService.sendNotifications()
      return json({ success: true, message: '알림 발송이 완료되었습니다.' })
    } else if (action === 'both') {
      // 스케줄링 + 발송
      await notificationService.scheduleAllNotifications()
      await notificationService.sendNotifications()
      return json({ success: true, message: '알림 스케줄링 및 발송이 완료되었습니다.' })
    } else {
      return json({ success: false, error: '잘못된 액션입니다.' }, { status: 400 })
    }
  } catch (error) {
    console.error('Failed to process cron job:', error)
    return json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * 수동 트리거용 GET 엔드포인트 (개발/테스트용)
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    const action = url.searchParams.get('action') || 'schedule'

    if (action === 'schedule') {
      await notificationService.scheduleAllNotifications()
      return json({ success: true, message: '알림 스케줄링이 완료되었습니다.' })
    } else if (action === 'send') {
      await notificationService.sendNotifications()
      return json({ success: true, message: '알림 발송이 완료되었습니다.' })
    } else if (action === 'both') {
      await notificationService.scheduleAllNotifications()
      await notificationService.sendNotifications()
      return json({ success: true, message: '알림 스케줄링 및 발송이 완료되었습니다.' })
    } else {
      return json({ success: false, error: '잘못된 액션입니다.' }, { status: 400 })
    }
  } catch (error) {
    console.error('Failed to process manual trigger:', error)
    return json({ success: false, error: error.message }, { status: 500 })
  }
}
