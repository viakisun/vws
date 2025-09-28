import { reportScheduler } from '$lib/finance/services/scheduler/report-scheduler'
import type { Handle } from '@sveltejs/kit'

// 스케줄러 시작 (서버 시작 시 한 번만 실행)
let schedulerStarted = false

export const handle: Handle = async ({ event, resolve }) => {
  // 스케줄러 시작 (개발 환경에서만) - 임시 비활성화
  // if (!schedulerStarted && process.env.NODE_ENV === 'development') {
  //   reportScheduler.start()
  //   schedulerStarted = true
  //   console.log('📧 이메일 리포트 스케줄러가 시작되었습니다.')
  // }

  return resolve(event)
}
