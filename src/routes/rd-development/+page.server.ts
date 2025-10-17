/**
 * R&D Development Projects List Server-side Data Loading
 */

import { RdDevProjectService } from '$lib/services/rd-development'
import type { RdDevProjectType } from '$lib/types/rd-development'
import type { PageServerLoad } from './$types'

const projectService = new RdDevProjectService()

export const load: PageServerLoad = async ({ url, locals }) => {
  try {
    // URL 쿼리 파라미터에서 필터 추출
    const filters = {
      project_type: (url.searchParams.get('project_type') as RdDevProjectType) || undefined,
      status: url.searchParams.get('status') || undefined,
      search: url.searchParams.get('search') || undefined,
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 50,
      offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0,
    }

    // 프로젝트 목록과 통계를 병렬로 로드
    const [projects, stats] = await Promise.all([
      projectService.getProjects(filters),
      projectService.getProjectStats(),
    ])

    return {
      projects,
      stats,
      filters,
      user: locals.user || null,
    }
  } catch (error) {
    console.error('Failed to load R&D development projects:', error)

    return {
      projects: [],
      stats: null,
      filters: {
        project_type: undefined,
        status: undefined,
        search: undefined,
        limit: 50,
        offset: 0,
      },
      user: locals.user || null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
