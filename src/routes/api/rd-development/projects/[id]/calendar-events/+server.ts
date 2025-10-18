/**
 * R&D Development Calendar Events API
 * GET  /api/rd-development/projects/:id/calendar-events - 캘린더 이벤트 조회
 * POST /api/rd-development/projects/:id/calendar-events - 캘린더 이벤트 생성
 */

import { RdDevCalendarEventService } from '$lib/services/rd-development'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

const calendarEventService = new RdDevCalendarEventService()

/**
 * 캘린더 이벤트 조회
 */
export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const projectId = params.id
    const startDate = url.searchParams.get('start_date')
    const endDate = url.searchParams.get('end_date')
    const eventType = url.searchParams.get('event_type')
    const isCompleted = url.searchParams.get('is_completed')
    const upcoming = url.searchParams.get('upcoming')
    const year = url.searchParams.get('year')
    const month = url.searchParams.get('month')

    let events

    if (upcoming) {
      const days = parseInt(upcoming)
      events = await calendarEventService.getUpcomingEvents(projectId, days)
    } else if (year && month) {
      events = await calendarEventService.getEventsByMonth(
        projectId,
        parseInt(year),
        parseInt(month),
      )
    } else {
      events = await calendarEventService.getCalendarEventsByProjectId(projectId, {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        event_type: eventType || undefined,
        is_completed: isCompleted ? isCompleted === 'true' : undefined,
      })
    }

    return json({ success: true, data: events })
  } catch (error) {
    console.error('GET /api/rd-development/projects/[id]/calendar-events error:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch calendar events',
      },
      { status: 500 },
    )
  }
}

/**
 * 캘린더 이벤트 생성
 */
export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const projectId = params.id
    const data = await request.json()

    const event = await calendarEventService.createCalendarEvent({
      project_id: projectId,
      ...data,
    })

    return json({ success: true, data: event }, { status: 201 })
  } catch (error) {
    console.error('POST /api/rd-development/projects/[id]/calendar-events error:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create calendar event',
      },
      { status: 500 },
    )
  }
}
