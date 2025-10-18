/**
 * R&D Development Test Locations API
 * GET  /api/rd-development/projects/:id/test-locations - 테스트 장소 목록 조회
 * POST /api/rd-development/projects/:id/test-locations - 테스트 장소 생성
 */

import { RdDevTestLocationService } from '$lib/services/rd-development'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

const testLocationService = new RdDevTestLocationService()

/**
 * 테스트 장소 목록 조회
 */
export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const projectId = params.id
    const locationType = url.searchParams.get('location_type')

    let locations
    if (locationType) {
      locations = await testLocationService.getTestLocationsByType(projectId, locationType)
    } else {
      locations = await testLocationService.getTestLocationsByProjectId(projectId)
    }

    return json({ success: true, data: locations })
  } catch (error) {
    console.error('GET /api/rd-development/projects/[id]/test-locations error:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch test locations',
      },
      { status: 500 },
    )
  }
}

/**
 * 테스트 장소 생성
 */
export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const projectId = params.id
    const data = await request.json()

    const location = await testLocationService.createTestLocation({
      project_id: projectId,
      ...data,
    })

    return json({ success: true, data: location }, { status: 201 })
  } catch (error) {
    console.error('POST /api/rd-development/projects/[id]/test-locations error:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create test location',
      },
      { status: 500 },
    )
  }
}
