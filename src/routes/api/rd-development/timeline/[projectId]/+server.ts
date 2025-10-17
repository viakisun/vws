/**
 * R&D Development Timeline API
 * 프로젝트 타임라인 조회
 */

import { RdDevTimelineService } from '$lib/services/rd-development'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

const timelineService = new RdDevTimelineService()

/**
 * 프로젝트 타임라인 조회
 */
export const GET: RequestHandler = async ({ params }) => {
  try {
    const timeline = await timelineService.getProjectTimeline(params.projectId)

    if (!timeline) {
      return json(
        {
          success: false,
          error: 'Project timeline not found',
        },
        { status: 404 },
      )
    }

    // 진행률 계산
    const progress = await timelineService.calculateTimelineProgress(params.projectId)

    const timelineData = {
      ...timeline,
      progress,
    }

    return json({
      success: true,
      data: timelineData,
    })
  } catch (error) {
    logger.error('Failed to fetch project timeline:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
