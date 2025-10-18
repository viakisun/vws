/**
 * R&D Development KPIs API
 * GET  /api/rd-development/projects/:id/kpis - KPI 목록 조회
 * POST /api/rd-development/projects/:id/kpis - KPI 생성
 */

import { RdDevKpiService } from '$lib/services/rd-development'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

const kpiService = new RdDevKpiService()

/**
 * KPI 목록 조회
 */
export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const projectId = params.id
    const category = url.searchParams.get('category')

    let kpis
    if (category) {
      kpis = await kpiService.getKpisByCategory(projectId, category)
    } else {
      kpis = await kpiService.getKpisByProjectId(projectId)
    }

    return json({ success: true, data: kpis })
  } catch (error) {
    console.error('GET /api/rd-development/projects/[id]/kpis error:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch KPIs',
      },
      { status: 500 },
    )
  }
}

/**
 * KPI 생성
 */
export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const projectId = params.id
    const data = await request.json()

    const kpi = await kpiService.createKpi({
      project_id: projectId,
      ...data,
    })

    return json({ success: true, data: kpi }, { status: 201 })
  } catch (error) {
    console.error('POST /api/rd-development/projects/[id]/kpis error:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create KPI',
      },
      { status: 500 },
    )
  }
}
