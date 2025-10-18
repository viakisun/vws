/**
 * R&D Development KPI Stats API
 * GET /api/rd-development/projects/:id/kpis/stats - KPI 통계 조회
 */

import { RdDevKpiService } from '$lib/services/rd-development'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

const kpiService = new RdDevKpiService()

/**
 * KPI 통계 조회
 */
export const GET: RequestHandler = async ({ params }) => {
  try {
    const stats = await kpiService.getKpiStats(params.id)
    return json({ success: true, data: stats })
  } catch (error) {
    console.error('GET /api/rd-development/projects/[id]/kpis/stats error:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch KPI stats',
      },
      { status: 500 },
    )
  }
}
