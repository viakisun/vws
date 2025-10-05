import { requireRole } from '$lib/auth/middleware'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async (event) => {
  // 관리자 권한 확인
  await requireRole(event, ['ADMIN', 'MANAGER'])

  return {
    // 페이지 로드 시 필요한 데이터가 있으면 여기에 추가
  }
}
