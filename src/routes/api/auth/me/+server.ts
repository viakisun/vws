import { requireAuth } from '$lib/auth/middleware'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async (event) => {
  try {
    const { user } = await requireAuth(event)

    return json({
      success: true,
      data: user,
    })
  } catch (error) {
    // requireAuth에서 이미 적절한 에러를 던지므로 여기서는 그대로 전달
    throw error
  }
}
