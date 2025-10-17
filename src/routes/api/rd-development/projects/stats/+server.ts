import { RdDevProjectService } from '$lib/services/rd-development'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * R&D Development 프로젝트 전체 통계 조회
 * GET /api/rd-development/projects/stats
 */
export const GET: RequestHandler = async () => {
  try {
    const projectService = new RdDevProjectService()
    const stats = await projectService.getProjectStats()

    return json(stats)
  } catch (error) {
    console.error('Failed to fetch project stats:', error)
    return json({ error: '프로젝트 통계를 불러오는데 실패했습니다' }, { status: 500 })
  }
}
