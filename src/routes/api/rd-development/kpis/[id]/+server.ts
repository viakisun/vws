/**
 * R&D Development KPI Detail API
 * GET    /api/rd-development/kpis/:id - KPI 상세 조회
 * PUT    /api/rd-development/kpis/:id - KPI 업데이트 (측정값 기록)
 * DELETE /api/rd-development/kpis/:id - KPI 삭제
 */

import { RdDevKpiService } from '$lib/services/rd-development'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

const kpiService = new RdDevKpiService()

/**
 * KPI 상세 조회
 */
export const GET: RequestHandler = async ({ params }) => {
  try {
    const kpi = await kpiService.getKpiById(params.id)

    if (!kpi) {
      return json({ success: false, error: 'KPI not found' }, { status: 404 })
    }

    return json({ success: true, data: kpi })
  } catch (error) {
    console.error('GET /api/rd-development/kpis/[id] error:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch KPI',
      },
      { status: 500 },
    )
  }
}

/**
 * KPI 업데이트 (측정값 기록)
 */
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const data = await request.json()
    const kpi = await kpiService.updateKpi(params.id, data)

    return json({ success: true, data: kpi })
  } catch (error) {
    console.error('PUT /api/rd-development/kpis/[id] error:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update KPI',
      },
      { status: 500 },
    )
  }
}

/**
 * KPI 삭제
 */
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const result = await kpiService.deleteKpi(params.id)

    if (!result) {
      return json({ success: false, error: 'KPI not found' }, { status: 404 })
    }

    return json({ success: true })
  } catch (error) {
    console.error('DELETE /api/rd-development/kpis/[id] error:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete KPI',
      },
      { status: 500 },
    )
  }
}
