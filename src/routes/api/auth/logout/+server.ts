import { requireAuth } from '$lib/auth/middleware'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async (event) => {
  try {
    // 인증 확인 (로그아웃은 인증된 사용자만 가능)
    await requireAuth(event)

    // 쿠키 삭제
    event.cookies.delete('auth_token', { path: '/' })

    return json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    // 인증 실패 시에도 쿠키는 삭제
    event.cookies.delete('auth_token', { path: '/' })
    throw error
  }
}
