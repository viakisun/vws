import { requireAuth } from '$lib/auth/middleware'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async (event) => {
  const { user } = await requireAuth(event)

  return json({
    success: true,
    data: user,
  })
}
