/**
 * R&D Development Calendar Event Service
 * 캘린더 이벤트 통합 관리
 */

import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'

export interface RdDevCalendarEvent {
  id: string
  project_id: string
  event_type: string
  event_title: string
  event_description: string | null
  event_date: string
  event_time: string | null
  end_date: string | null
  end_time: string | null
  all_day: boolean
  related_entity_type: string | null
  related_entity_id: string | null
  location_id: string | null
  participants: unknown[]
  reminder_days: number
  is_completed: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateCalendarEventRequest {
  project_id: string
  event_type: string
  event_title: string
  event_description?: string
  event_date: string
  event_time?: string
  end_date?: string
  end_time?: string
  all_day?: boolean
  related_entity_type?: string
  related_entity_id?: string
  location_id?: string
  participants?: unknown[]
  reminder_days?: number
}

export interface UpdateCalendarEventRequest {
  event_title?: string
  event_description?: string
  event_date?: string
  event_time?: string
  end_date?: string
  end_time?: string
  is_completed?: boolean
  notes?: string
}

export interface CalendarEventsFilter {
  start_date?: string
  end_date?: string
  event_type?: string
  is_completed?: boolean
}

export class RdDevCalendarEventService {
  /**
   * 프로젝트의 캘린더 이벤트 조회
   */
  async getCalendarEventsByProjectId(
    projectId: string,
    filter?: CalendarEventsFilter,
  ): Promise<RdDevCalendarEvent[]> {
    try {
      let sql = `
        SELECT 
          ce.*,
          tl.location_name
        FROM rd_dev_calendar_events ce
        LEFT JOIN rd_dev_test_locations tl ON ce.location_id = tl.id
        WHERE ce.project_id = $1
      `
      const params: unknown[] = [projectId]
      let paramCount = 1

      if (filter?.start_date) {
        paramCount++
        sql += ` AND ce.event_date >= $${paramCount}`
        params.push(filter.start_date)
      }

      if (filter?.end_date) {
        paramCount++
        sql += ` AND ce.event_date <= $${paramCount}`
        params.push(filter.end_date)
      }

      if (filter?.event_type) {
        paramCount++
        sql += ` AND ce.event_type = $${paramCount}`
        params.push(filter.event_type)
      }

      if (filter?.is_completed !== undefined) {
        paramCount++
        sql += ` AND ce.is_completed = $${paramCount}`
        params.push(filter.is_completed)
      }

      sql += ' ORDER BY ce.event_date, ce.event_time NULLS LAST'

      const result = await query(sql, params)
      return result.rows
    } catch (error) {
      logger.error('Failed to fetch calendar events:', error)
      throw new Error('Failed to fetch calendar events')
    }
  }

  /**
   * 다가오는 이벤트 조회 (N일 이내)
   */
  async getUpcomingEvents(projectId: string, days: number = 30): Promise<RdDevCalendarEvent[]> {
    try {
      const sql = `
        SELECT 
          ce.*,
          tl.location_name
        FROM rd_dev_calendar_events ce
        LEFT JOIN rd_dev_test_locations tl ON ce.location_id = tl.id
        WHERE ce.project_id = $1 
          AND ce.event_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days} days'
          AND ce.is_completed = false
        ORDER BY ce.event_date, ce.event_time NULLS LAST
      `
      const result = await query(sql, [projectId])
      return result.rows
    } catch (error) {
      logger.error('Failed to fetch upcoming events:', error)
      throw new Error('Failed to fetch upcoming events')
    }
  }

  /**
   * 특정 월의 이벤트 조회
   */
  async getEventsByMonth(
    projectId: string,
    year: number,
    month: number,
  ): Promise<RdDevCalendarEvent[]> {
    try {
      const sql = `
        SELECT 
          ce.*,
          tl.location_name
        FROM rd_dev_calendar_events ce
        LEFT JOIN rd_dev_test_locations tl ON ce.location_id = tl.id
        WHERE ce.project_id = $1 
          AND EXTRACT(YEAR FROM ce.event_date) = $2
          AND EXTRACT(MONTH FROM ce.event_date) = $3
        ORDER BY ce.event_date, ce.event_time NULLS LAST
      `
      const result = await query(sql, [projectId, year, month])
      return result.rows
    } catch (error) {
      logger.error('Failed to fetch events by month:', error)
      throw new Error('Failed to fetch events by month')
    }
  }

  /**
   * 캘린더 이벤트 생성
   */
  async createCalendarEvent(data: CreateCalendarEventRequest): Promise<RdDevCalendarEvent> {
    try {
      const sql = `
        INSERT INTO rd_dev_calendar_events (
          project_id, event_type, event_title, event_description,
          event_date, event_time, end_date, end_time, all_day,
          related_entity_type, related_entity_id, location_id,
          participants, reminder_days
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `
      const result = await query(sql, [
        data.project_id,
        data.event_type,
        data.event_title,
        data.event_description || null,
        data.event_date,
        data.event_time || null,
        data.end_date || null,
        data.end_time || null,
        data.all_day !== undefined ? data.all_day : true,
        data.related_entity_type || null,
        data.related_entity_id || null,
        data.location_id || null,
        JSON.stringify(data.participants || []),
        data.reminder_days || 7,
      ])
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to create calendar event:', error)
      throw new Error('Failed to create calendar event')
    }
  }

  /**
   * 캘린더 이벤트 업데이트
   */
  async updateCalendarEvent(
    id: string,
    data: UpdateCalendarEventRequest,
  ): Promise<RdDevCalendarEvent> {
    try {
      const updates: string[] = []
      const params: unknown[] = []
      let paramCount = 0

      if (data.event_title !== undefined) {
        paramCount++
        updates.push(`event_title = $${paramCount}`)
        params.push(data.event_title)
      }

      if (data.event_description !== undefined) {
        paramCount++
        updates.push(`event_description = $${paramCount}`)
        params.push(data.event_description)
      }

      if (data.event_date !== undefined) {
        paramCount++
        updates.push(`event_date = $${paramCount}`)
        params.push(data.event_date)
      }

      if (data.event_time !== undefined) {
        paramCount++
        updates.push(`event_time = $${paramCount}`)
        params.push(data.event_time)
      }

      if (data.end_date !== undefined) {
        paramCount++
        updates.push(`end_date = $${paramCount}`)
        params.push(data.end_date)
      }

      if (data.end_time !== undefined) {
        paramCount++
        updates.push(`end_time = $${paramCount}`)
        params.push(data.end_time)
      }

      if (data.is_completed !== undefined) {
        paramCount++
        updates.push(`is_completed = $${paramCount}`)
        params.push(data.is_completed)
      }

      if (data.notes !== undefined) {
        paramCount++
        updates.push(`notes = $${paramCount}`)
        params.push(data.notes)
      }

      updates.push('updated_at = CURRENT_TIMESTAMP')

      paramCount++
      const sql = `
        UPDATE rd_dev_calendar_events
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `
      params.push(id)

      const result = await query(sql, params)
      if (result.rows.length === 0) {
        throw new Error('Calendar event not found')
      }
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to update calendar event:', error)
      throw new Error('Failed to update calendar event')
    }
  }

  /**
   * 캘린더 이벤트 삭제
   */
  async deleteCalendarEvent(id: string): Promise<boolean> {
    try {
      const sql = 'DELETE FROM rd_dev_calendar_events WHERE id = $1 RETURNING id'
      const result = await query(sql, [id])
      return result.rows.length > 0
    } catch (error) {
      logger.error('Failed to delete calendar event:', error)
      throw new Error('Failed to delete calendar event')
    }
  }

  /**
   * 이벤트 ID로 조회
   */
  async getCalendarEventById(id: string): Promise<RdDevCalendarEvent | null> {
    try {
      const sql = `
        SELECT 
          ce.*,
          tl.location_name
        FROM rd_dev_calendar_events ce
        LEFT JOIN rd_dev_test_locations tl ON ce.location_id = tl.id
        WHERE ce.id = $1
      `
      const result = await query(sql, [id])
      return result.rows[0] || null
    } catch (error) {
      logger.error('Failed to fetch calendar event:', error)
      throw new Error('Failed to fetch calendar event')
    }
  }
}
