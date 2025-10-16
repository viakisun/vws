import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url, locals }) => {
  // 인증 확인
  if (!locals.user) {
    throw redirect(302, '/login')
  }

  return {
    user: locals.user,
  }
}
