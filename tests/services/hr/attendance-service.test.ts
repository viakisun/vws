import type { AttendanceRecord } from '$lib/services/attendance/attendance-service'
import {
    ATTENDANCE_ERRORS,
    ATTENDANCE_MESSAGES,
    fetchAttendanceData,
    recordBreakEnd,
    recordBreakStart,
    recordCheckIn,
    recordCheckOut,
} from '$lib/services/attendance/attendance-service'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DBHelper } from '../../helpers/db-helper'
import { mockLogger } from '../../helpers/mock-helper'

// Mock holidays utility
vi.mock('$lib/utils/holidays', () => ({
  getHoliday: vi.fn((date: string) => {
    // Mock some holidays for testing
    const holidays = ['2025-01-01', '2025-12-25']
    return holidays.includes(date)
  }),
}))

describe('Attendance Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogger()
    DBHelper.reset()
  })

  describe('fetchAttendanceData', () => {
    it('출퇴근 데이터를 성공적으로 조회해야 함', async () => {
      const mockTodayRecord: AttendanceRecord = {
        id: 'attendance-1',
        date: '2025-01-15',
        check_in_time: '2025-01-15T09:00:00Z',
        check_out_time: null,
        break_start_time: null,
        break_end_time: null,
        total_work_hours: null,
        overtime_hours: null,
        status: 'present',
        notes: null,
      }

      const mockWeekRecords: AttendanceRecord[] = [
        {
          id: 'attendance-1',
          date: '2025-01-15',
          check_in_time: '2025-01-15T09:00:00Z',
          check_out_time: null,
          break_start_time: null,
          break_end_time: null,
          total_work_hours: null,
          overtime_hours: null,
          status: 'present',
          notes: null,
        },
        {
          id: 'attendance-2',
          date: '2025-01-14',
          check_in_time: '2025-01-14T09:15:00Z',
          check_out_time: '2025-01-14T18:00:00Z',
          break_start_time: '2025-01-14T12:00:00Z',
          break_end_time: '2025-01-14T13:00:00Z',
          total_work_hours: 8,
          overtime_hours: 0,
          status: 'late',
          notes: null,
        },
      ]

      const mockMonthRecords = [
        {
          date_str: '2025-01-15',
          check_in_time: '2025-01-15T09:00:00Z',
          check_out_time: null,
          total_work_hours: null,
          status: 'present',
        },
        {
          date_str: '2025-01-14',
          check_in_time: '2025-01-14T09:15:00Z',
          check_out_time: '2025-01-14T18:00:00Z',
          total_work_hours: 8,
          status: 'late',
        },
      ]

      const mockStats = {
        total_days: 15,
        work_days: 12,
        late_days: 2,
        early_leave_days: 1,
        total_work_hours: 96,
        total_overtime_hours: 8,
      }

      DBHelper.mockQueryResponse('SELECT id, DATE(check_in_time)::text as date, check_in_time::text as check_in_time, check_out_time::text as check_out_time, break_start_time::text as break_start_time, break_end_time::text as break_end_time, total_work_hours, overtime_hours, status, notes FROM attendance WHERE employee_id = $1 AND DATE(check_in_time) = $2::date', {
        rows: [mockTodayRecord],
      })

      DBHelper.mockQueryResponse('SELECT DATE(check_in_time)::text as date, check_in_time::text as check_in_time, check_out_time::text as check_out_time, total_work_hours, overtime_hours, status FROM attendance WHERE employee_id = $1 AND DATE(check_in_time) >= $2::date AND DATE(check_in_time) <= $3::date ORDER BY DATE(check_in_time) DESC', {
        rows: mockWeekRecords,
      })

      DBHelper.mockQueryResponse('SELECT COUNT(*) as total_days, COUNT(CASE WHEN check_in_time IS NOT NULL THEN 1 END) as work_days, COUNT(CASE WHEN status = \'late\' THEN 1 END) as late_days, COUNT(CASE WHEN status = \'early_leave\' THEN 1 END) as early_leave_days, COALESCE(SUM(total_work_hours), 0) as total_work_hours, COALESCE(SUM(overtime_hours), 0) as total_overtime_hours FROM attendance WHERE employee_id = $1 AND DATE(check_in_time) >= $2::date AND DATE(check_in_time) <= $3::date', {
        rows: [mockStats],
      })

      DBHelper.mockQueryResponse('SELECT DATE(check_in_time)::text as date_str, check_in_time::text as check_in_time, check_out_time::text as check_out_time, total_work_hours, status FROM attendance WHERE employee_id = $1 AND DATE(check_in_time) >= $2::date AND DATE(check_in_time) <= $3::date ORDER BY DATE(check_in_time) ASC', {
        rows: mockMonthRecords,
      })

      const result = await fetchAttendanceData('employee-1', '2025-01-15')

      expect(result.success).toBe(true)
      expect(result.data?.today).toEqual(mockTodayRecord)
      expect(result.data?.week).toEqual(mockWeekRecords)
      expect(result.data?.month).toHaveLength(2)
      expect(result.data?.stats.totalDays).toBe(15)
      expect(result.data?.stats.workDays).toBe(12)
      expect(result.data?.stats.lateDays).toBe(2)
      expect(result.data?.stats.earlyLeaveDays).toBe(1)
      expect(result.data?.stats.totalWorkHours).toBe(96)
      expect(result.data?.stats.totalOvertimeHours).toBe(8)
    })

    it('빈 출퇴근 데이터를 올바르게 처리해야 함', async () => {
      DBHelper.mockQueryResponse('SELECT id, DATE(check_in_time)::text as date, check_in_time::text as check_in_time, check_out_time::text as check_out_time, break_start_time::text as break_start_time, break_end_time::text as break_end_time, total_work_hours, overtime_hours, status, notes FROM attendance WHERE employee_id = $1 AND DATE(check_in_time) = $2::date', {
        rows: [],
      })

      DBHelper.mockQueryResponse('SELECT DATE(check_in_time)::text as date, check_in_time::text as check_in_time, check_out_time::text as check_out_time, total_work_hours, overtime_hours, status FROM attendance WHERE employee_id = $1 AND DATE(check_in_time) >= $2::date AND DATE(check_in_time) <= $3::date ORDER BY DATE(check_in_time) DESC', {
        rows: [],
      })

      DBHelper.mockQueryResponse('SELECT COUNT(*) as total_days, COUNT(CASE WHEN check_in_time IS NOT NULL THEN 1 END) as work_days, COUNT(CASE WHEN status = \'late\' THEN 1 END) as late_days, COUNT(CASE WHEN status = \'early_leave\' THEN 1 END) as early_leave_days, COALESCE(SUM(total_work_hours), 0) as total_work_hours, COALESCE(SUM(overtime_hours), 0) as total_overtime_hours FROM attendance WHERE employee_id = $1 AND DATE(check_in_time) >= $2::date AND DATE(check_in_time) <= $3::date', {
        rows: [{ total_days: 0, work_days: 0, late_days: 0, early_leave_days: 0, total_work_hours: 0, total_overtime_hours: 0 }],
      })

      DBHelper.mockQueryResponse('SELECT DATE(check_in_time)::text as date_str, check_in_time::text as check_in_time, check_out_time::text as check_out_time, total_work_hours, status FROM attendance WHERE employee_id = $1 AND DATE(check_in_time) >= $2::date AND DATE(check_in_time) <= $3::date ORDER BY DATE(check_in_time) ASC', {
        rows: [],
      })

      const result = await fetchAttendanceData('employee-1', '2025-01-15')

      expect(result.success).toBe(true)
      expect(result.data?.today).toBeNull()
      expect(result.data?.week).toEqual([])
      expect(result.data?.month).toEqual([])
      expect(result.data?.stats.totalDays).toBe(0)
      expect(result.data?.stats.workDays).toBe(0)
    })

    it('데이터베이스 오류 시 에러를 반환해야 함', async () => {
      DBHelper.mockError(new Error('Database connection failed'))

      const result = await fetchAttendanceData('employee-1', '2025-01-15')

      expect(result.success).toBe(false)
      expect(result.message).toBe(ATTENDANCE_ERRORS.FETCH_FAILED)
    })

    it('기본 날짜로 출퇴근 데이터를 조회해야 함', async () => {
      const today = new Date().toISOString().split('T')[0]

      DBHelper.mockQueryResponse('SELECT id, DATE(check_in_time)::text as date, check_in_time::text as check_in_time, check_out_time::text as check_out_time, break_start_time::text as break_start_time, break_end_time::text as break_end_time, total_work_hours, overtime_hours, status, notes FROM attendance WHERE employee_id = $1 AND DATE(check_in_time) = $2::date', {
        rows: [],
      })

      DBHelper.mockQueryResponse('SELECT DATE(check_in_time)::text as date, check_in_time::text as check_in_time, check_out_time::text as check_out_time, total_work_hours, overtime_hours, status FROM attendance WHERE employee_id = $1 AND DATE(check_in_time) >= $2::date AND DATE(check_in_time) <= $3::date ORDER BY DATE(check_in_time) DESC', {
        rows: [],
      })

      DBHelper.mockQueryResponse('SELECT COUNT(*) as total_days, COUNT(CASE WHEN check_in_time IS NOT NULL THEN 1 END) as work_days, COUNT(CASE WHEN status = \'late\' THEN 1 END) as late_days, COUNT(CASE WHEN status = \'early_leave\' THEN 1 END) as early_leave_days, COALESCE(SUM(total_work_hours), 0) as total_work_hours, COALESCE(SUM(overtime_hours), 0) as total_overtime_hours FROM attendance WHERE employee_id = $1 AND DATE(check_in_time) >= $2::date AND DATE(check_in_time) <= $3::date', {
        rows: [{ total_days: 0, work_days: 0, late_days: 0, early_leave_days: 0, total_work_hours: 0, total_overtime_hours: 0 }],
      })

      DBHelper.mockQueryResponse('SELECT DATE(check_in_time)::text as date_str, check_in_time::text as check_in_time, check_out_time::text as check_out_time, total_work_hours, status FROM attendance WHERE employee_id = $1 AND DATE(check_in_time) >= $2::date AND DATE(check_in_time) <= $3::date ORDER BY DATE(check_in_time) ASC', {
        rows: [],
      })

      const result = await fetchAttendanceData('employee-1')

      expect(result.success).toBe(true)
      expect(DBHelper.getMockQuery()).toHaveBeenCalledWith(
        expect.stringContaining('WHERE employee_id = $1 AND DATE(check_in_time) = $2::date'),
        ['employee-1', today]
      )
    })
  })

  describe('recordCheckIn', () => {
    it('출근을 성공적으로 기록해야 함', async () => {
      const mockAttendanceRecord: AttendanceRecord = {
        id: 'attendance-1',
        date: '2025-01-15',
        check_in_time: '2025-01-15T09:00:00Z',
        check_out_time: null,
        break_start_time: null,
        break_end_time: null,
        total_work_hours: null,
        overtime_hours: null,
        status: 'present',
        notes: '정상 출근',
      }

      // Mock attendance settings
      DBHelper.mockQueryResponse('SELECT id FROM companies LIMIT 1', {
        rows: [{ id: 'company-1' }],
      })

      DBHelper.mockQueryResponse('SELECT work_start_time, work_end_time, late_threshold_minutes, early_leave_threshold_minutes, allowed_ips, require_ip_check FROM attendance_settings WHERE company_id = $1', {
        rows: [{
          work_start_time: '09:00',
          work_end_time: '18:00',
          late_threshold_minutes: 15,
          early_leave_threshold_minutes: 30,
          allowed_ips: ['192.168.1.0/24'],
          require_ip_check: false,
        }],
      })

      DBHelper.mockQueryResponse('INSERT INTO attendance (employee_id, check_in_time, check_in_ip, notes, status) VALUES ($1, now(), $2, $3, $4) ON CONFLICT (employee_id, check_in_date) DO UPDATE SET check_in_time = now(), check_in_ip = $2, notes = $3, status = $4, updated_at = now() RETURNING id, employee_id, check_in_time::text, check_out_time::text, break_start_time::text, break_end_time::text, total_work_hours, overtime_hours, status, notes, created_at::text, updated_at::text', {
        rows: [mockAttendanceRecord],
      })

      const result = await recordCheckIn('employee-1', '2025-01-15', '192.168.1.100', '정상 출근')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockAttendanceRecord)
      expect(result.message).toBe(ATTENDANCE_MESSAGES.CHECK_IN)
    })

    it('지각으로 출근을 기록해야 함', async () => {
      const mockAttendanceRecord: AttendanceRecord = {
        id: 'attendance-1',
        date: '2025-01-15',
        check_in_time: '2025-01-15T09:20:00Z',
        check_out_time: null,
        break_start_time: null,
        break_end_time: null,
        total_work_hours: null,
        overtime_hours: null,
        status: 'late',
        notes: '지각',
      }

      // Mock attendance settings with strict late threshold
      DBHelper.mockQueryResponse('SELECT id FROM companies LIMIT 1', {
        rows: [{ id: 'company-1' }],
      })

      DBHelper.mockQueryResponse('SELECT work_start_time, work_end_time, late_threshold_minutes, early_leave_threshold_minutes, allowed_ips, require_ip_check FROM attendance_settings WHERE company_id = $1', {
        rows: [{
          work_start_time: '09:00',
          work_end_time: '18:00',
          late_threshold_minutes: 10,
          early_leave_threshold_minutes: 30,
          allowed_ips: ['192.168.1.0/24'],
          require_ip_check: false,
        }],
      })

      DBHelper.mockQueryResponse('INSERT INTO attendance (employee_id, check_in_time, check_in_ip, notes, status) VALUES ($1, now(), $2, $3, $4) ON CONFLICT (employee_id, check_in_date) DO UPDATE SET check_in_time = now(), check_in_ip = $2, notes = $3, status = $4, updated_at = now() RETURNING id, employee_id, check_in_time::text, check_out_time::text, break_start_time::text, break_end_time::text, total_work_hours, overtime_hours, status, notes, created_at::text, updated_at::text', {
        rows: [mockAttendanceRecord],
      })

      const result = await recordCheckIn('employee-1', '2025-01-15', '192.168.1.100', '지각')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockAttendanceRecord)
      expect(result.message).toBe(ATTENDANCE_MESSAGES.CHECK_IN_LATE)
    })

    it('허용되지 않은 IP에서 출근 시 에러를 반환해야 함', async () => {
      // Mock attendance settings with IP check enabled
      DBHelper.mockQueryResponse('SELECT id FROM companies LIMIT 1', {
        rows: [{ id: 'company-1' }],
      })

      DBHelper.mockQueryResponse('SELECT work_start_time, work_end_time, late_threshold_minutes, early_leave_threshold_minutes, allowed_ips, require_ip_check FROM attendance_settings WHERE company_id = $1', {
        rows: [{
          work_start_time: '09:00',
          work_end_time: '18:00',
          late_threshold_minutes: 15,
          early_leave_threshold_minutes: 30,
          allowed_ips: ['192.168.1.0/24'],
          require_ip_check: true,
        }],
      })

      const result = await recordCheckIn('employee-1', '2025-01-15', '10.0.0.100', '외부 IP')

      expect(result.success).toBe(false)
      expect(result.message).toContain(ATTENDANCE_ERRORS.IP_NOT_ALLOWED)
      expect(result.message).toContain('10.0.0.100')
    })

    it('휴일에 출근 시 정상으로 처리해야 함', async () => {
      const mockAttendanceRecord: AttendanceRecord = {
        id: 'attendance-1',
        date: '2025-01-01',
        check_in_time: '2025-01-01T10:00:00Z',
        check_out_time: null,
        break_start_time: null,
        break_end_time: null,
        total_work_hours: null,
        overtime_hours: null,
        status: 'present',
        notes: '휴일 출근',
      }

      // Mock attendance settings
      DBHelper.mockQueryResponse('SELECT id FROM companies LIMIT 1', {
        rows: [{ id: 'company-1' }],
      })

      DBHelper.mockQueryResponse('SELECT work_start_time, work_end_time, late_threshold_minutes, early_leave_threshold_minutes, allowed_ips, require_ip_check FROM attendance_settings WHERE company_id = $1', {
        rows: [{
          work_start_time: '09:00',
          work_end_time: '18:00',
          late_threshold_minutes: 15,
          early_leave_threshold_minutes: 30,
          allowed_ips: ['192.168.1.0/24'],
          require_ip_check: false,
        }],
      })

      DBHelper.mockQueryResponse('INSERT INTO attendance (employee_id, check_in_time, check_in_ip, notes, status) VALUES ($1, now(), $2, $3, $4) ON CONFLICT (employee_id, check_in_date) DO UPDATE SET check_in_time = now(), check_in_ip = $2, notes = $3, status = $4, updated_at = now() RETURNING id, employee_id, check_in_time::text, check_out_time::text, break_start_time::text, break_end_time::text, total_work_hours, overtime_hours, status, notes, created_at::text, updated_at::text', {
        rows: [mockAttendanceRecord],
      })

      const result = await recordCheckIn('employee-1', '2025-01-01', '192.168.1.100', '휴일 출근')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockAttendanceRecord)
      expect(result.message).toBe(ATTENDANCE_MESSAGES.CHECK_IN)
    })

    it('데이터베이스 오류 시 에러를 반환해야 함', async () => {
      DBHelper.mockError(new Error('Database connection failed'))

      const result = await recordCheckIn('employee-1', '2025-01-15', '192.168.1.100')

      expect(result.success).toBe(false)
      expect(result.message).toBe(ATTENDANCE_ERRORS.RECORD_FAILED)
    })
  })

  describe('recordCheckOut', () => {
    it('퇴근을 성공적으로 기록해야 함', async () => {
      const mockAttendanceRecord: AttendanceRecord = {
        id: 'attendance-1',
        date: '2025-01-15',
        check_in_time: '2025-01-15T09:00:00Z',
        check_out_time: '2025-01-15T18:00:00Z',
        break_start_time: '2025-01-15T12:00:00Z',
        break_end_time: '2025-01-15T13:00:00Z',
        total_work_hours: 8,
        overtime_hours: 0,
        status: 'present',
        notes: '정상 퇴근',
      }

      // Mock attendance settings
      DBHelper.mockQueryResponse('SELECT id FROM companies LIMIT 1', {
        rows: [{ id: 'company-1' }],
      })

      DBHelper.mockQueryResponse('SELECT work_start_time, work_end_time, late_threshold_minutes, early_leave_threshold_minutes, allowed_ips, require_ip_check FROM attendance_settings WHERE company_id = $1', {
        rows: [{
          work_start_time: '09:00',
          work_end_time: '18:00',
          late_threshold_minutes: 15,
          early_leave_threshold_minutes: 30,
          allowed_ips: ['192.168.1.0/24'],
          require_ip_check: false,
        }],
      })

      DBHelper.mockQueryResponse('UPDATE attendance SET check_out_time = now(), check_out_ip = $2, notes = COALESCE($3, notes), updated_at = now() WHERE employee_id = $1 AND DATE(check_in_time) = CURRENT_DATE RETURNING id, employee_id, check_in_time::text, check_out_time::text, break_start_time::text, break_end_time::text, total_work_hours, overtime_hours, status, notes, created_at::text, updated_at::text', {
        rows: [mockAttendanceRecord],
      })

      const result = await recordCheckOut('employee-1', '192.168.1.100', '정상 퇴근')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockAttendanceRecord)
      expect(result.message).toBe(ATTENDANCE_MESSAGES.CHECK_OUT)
    })

    it('조기퇴근을 기록해야 함', async () => {
      const mockAttendanceRecord: AttendanceRecord = {
        id: 'attendance-1',
        date: '2025-01-15',
        check_in_time: '2025-01-15T09:00:00Z',
        check_out_time: '2025-01-15T17:00:00Z',
        break_start_time: '2025-01-15T12:00:00Z',
        break_end_time: '2025-01-15T13:00:00Z',
        total_work_hours: 7,
        overtime_hours: 0,
        status: 'early_leave',
        notes: '조기퇴근',
      }

      // Mock attendance settings with strict early leave threshold
      DBHelper.mockQueryResponse('SELECT id FROM companies LIMIT 1', {
        rows: [{ id: 'company-1' }],
      })

      DBHelper.mockQueryResponse('SELECT work_start_time, work_end_time, late_threshold_minutes, early_leave_threshold_minutes, allowed_ips, require_ip_check FROM attendance_settings WHERE company_id = $1', {
        rows: [{
          work_start_time: '09:00',
          work_end_time: '18:00',
          late_threshold_minutes: 15,
          early_leave_threshold_minutes: 15,
          allowed_ips: ['192.168.1.0/24'],
          require_ip_check: false,
        }],
      })

      DBHelper.mockQueryResponse('UPDATE attendance SET check_out_time = now(), check_out_ip = $2, notes = COALESCE($3, notes), status = \'early_leave\', updated_at = now() WHERE employee_id = $1 AND DATE(check_in_time) = CURRENT_DATE RETURNING id, employee_id, check_in_time::text, check_out_time::text, break_start_time::text, break_end_time::text, total_work_hours, overtime_hours, status, notes, created_at::text, updated_at::text', {
        rows: [mockAttendanceRecord],
      })

      const result = await recordCheckOut('employee-1', '192.168.1.100', '조기퇴근')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockAttendanceRecord)
      expect(result.message).toBe(ATTENDANCE_MESSAGES.CHECK_OUT_EARLY)
    })

    it('출근 기록이 없을 시 에러를 반환해야 함', async () => {
      // Mock attendance settings
      DBHelper.mockQueryResponse('SELECT id FROM companies LIMIT 1', {
        rows: [{ id: 'company-1' }],
      })

      DBHelper.mockQueryResponse('SELECT work_start_time, work_end_time, late_threshold_minutes, early_leave_threshold_minutes, allowed_ips, require_ip_check FROM attendance_settings WHERE company_id = $1', {
        rows: [{
          work_start_time: '09:00',
          work_end_time: '18:00',
          late_threshold_minutes: 15,
          early_leave_threshold_minutes: 30,
          allowed_ips: ['192.168.1.0/24'],
          require_ip_check: false,
        }],
      })

      DBHelper.mockQueryResponse('UPDATE attendance SET check_out_time = now(), check_out_ip = $2, notes = COALESCE($3, notes), updated_at = now() WHERE employee_id = $1 AND DATE(check_in_time) = CURRENT_DATE RETURNING id, employee_id, check_in_time::text, check_out_time::text, break_start_time::text, break_end_time::text, total_work_hours, overtime_hours, status, notes, created_at::text, updated_at::text', {
        rows: [],
      })

      const result = await recordCheckOut('employee-1', '192.168.1.100')

      expect(result.success).toBe(false)
      expect(result.message).toBe(ATTENDANCE_ERRORS.NO_CHECK_IN)
    })

    it('허용되지 않은 IP에서 퇴근 시 에러를 반환해야 함', async () => {
      // Mock attendance settings with IP check enabled
      DBHelper.mockQueryResponse('SELECT id FROM companies LIMIT 1', {
        rows: [{ id: 'company-1' }],
      })

      DBHelper.mockQueryResponse('SELECT work_start_time, work_end_time, late_threshold_minutes, early_leave_threshold_minutes, allowed_ips, require_ip_check FROM attendance_settings WHERE company_id = $1', {
        rows: [{
          work_start_time: '09:00',
          work_end_time: '18:00',
          late_threshold_minutes: 15,
          early_leave_threshold_minutes: 30,
          allowed_ips: ['192.168.1.0/24'],
          require_ip_check: true,
        }],
      })

      const result = await recordCheckOut('employee-1', '10.0.0.100')

      expect(result.success).toBe(false)
      expect(result.message).toContain(ATTENDANCE_ERRORS.IP_NOT_ALLOWED)
      expect(result.message).toContain('10.0.0.100')
    })

    it('데이터베이스 오류 시 에러를 반환해야 함', async () => {
      DBHelper.mockError(new Error('Database connection failed'))

      const result = await recordCheckOut('employee-1', '192.168.1.100')

      expect(result.success).toBe(false)
      expect(result.message).toBe(ATTENDANCE_ERRORS.RECORD_FAILED)
    })
  })

  describe('recordBreakStart', () => {
    it('휴게 시작을 성공적으로 기록해야 함', async () => {
      const mockAttendanceRecord: AttendanceRecord = {
        id: 'attendance-1',
        date: '2025-01-15',
        check_in_time: '2025-01-15T09:00:00Z',
        check_out_time: null,
        break_start_time: '2025-01-15T12:00:00Z',
        break_end_time: null,
        total_work_hours: null,
        overtime_hours: null,
        status: 'present',
        notes: null,
      }

      DBHelper.mockQueryResponse('UPDATE attendance SET break_start_time = now(), updated_at = now() WHERE employee_id = $1 AND DATE(check_in_time) = CURRENT_DATE RETURNING id, employee_id, check_in_time::text, check_out_time::text, break_start_time::text, break_end_time::text, total_work_hours, overtime_hours, status, notes, created_at::text, updated_at::text', {
        rows: [mockAttendanceRecord],
      })

      const result = await recordBreakStart('employee-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockAttendanceRecord)
      expect(result.message).toBe(ATTENDANCE_MESSAGES.BREAK_START)
    })

    it('출근 기록이 없을 시 에러를 반환해야 함', async () => {
      DBHelper.mockQueryResponse('UPDATE attendance SET break_start_time = now(), updated_at = now() WHERE employee_id = $1 AND DATE(check_in_time) = CURRENT_DATE RETURNING id, employee_id, check_in_time::text, check_out_time::text, break_start_time::text, break_end_time::text, total_work_hours, overtime_hours, status, notes, created_at::text, updated_at::text', {
        rows: [],
      })

      const result = await recordBreakStart('employee-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe(ATTENDANCE_ERRORS.NO_CHECK_IN)
    })

    it('데이터베이스 오류 시 에러를 반환해야 함', async () => {
      DBHelper.mockError(new Error('Database connection failed'))

      const result = await recordBreakStart('employee-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe(ATTENDANCE_ERRORS.RECORD_FAILED)
    })
  })

  describe('recordBreakEnd', () => {
    it('휴게 종료를 성공적으로 기록해야 함', async () => {
      const mockAttendanceRecord: AttendanceRecord = {
        id: 'attendance-1',
        date: '2025-01-15',
        check_in_time: '2025-01-15T09:00:00Z',
        check_out_time: null,
        break_start_time: '2025-01-15T12:00:00Z',
        break_end_time: '2025-01-15T13:00:00Z',
        total_work_hours: null,
        overtime_hours: null,
        status: 'present',
        notes: null,
      }

      DBHelper.mockQueryResponse('UPDATE attendance SET break_end_time = now(), updated_at = now() WHERE employee_id = $1 AND DATE(check_in_time) = CURRENT_DATE RETURNING id, employee_id, check_in_time::text, check_out_time::text, break_start_time::text, break_end_time::text, total_work_hours, overtime_hours, status, notes, created_at::text, updated_at::text', {
        rows: [mockAttendanceRecord],
      })

      const result = await recordBreakEnd('employee-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockAttendanceRecord)
      expect(result.message).toBe(ATTENDANCE_MESSAGES.BREAK_END)
    })

    it('출근 기록이 없을 시 에러를 반환해야 함', async () => {
      DBHelper.mockQueryResponse('UPDATE attendance SET break_end_time = now(), updated_at = now() WHERE employee_id = $1 AND DATE(check_in_time) = CURRENT_DATE RETURNING id, employee_id, check_in_time::text, check_out_time::text, break_start_time::text, break_end_time::text, total_work_hours, overtime_hours, status, notes, created_at::text, updated_at::text', {
        rows: [],
      })

      const result = await recordBreakEnd('employee-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe(ATTENDANCE_ERRORS.NO_CHECK_IN)
    })

    it('데이터베이스 오류 시 에러를 반환해야 함', async () => {
      DBHelper.mockError(new Error('Database connection failed'))

      const result = await recordBreakEnd('employee-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe(ATTENDANCE_ERRORS.RECORD_FAILED)
    })
  })

  describe('Integration tests', () => {
    it('전체 출퇴근 관리 워크플로우가 올바르게 작동해야 함', async () => {
      // 1. 출근 기록
      const mockCheckInRecord: AttendanceRecord = {
        id: 'attendance-1',
        date: '2025-01-15',
        check_in_time: '2025-01-15T09:00:00Z',
        check_out_time: null,
        break_start_time: null,
        break_end_time: null,
        total_work_hours: null,
        overtime_hours: null,
        status: 'present',
        notes: '정상 출근',
      }

      // 2. 휴게 시작
      const mockBreakStartRecord: AttendanceRecord = {
        ...mockCheckInRecord,
        break_start_time: '2025-01-15T12:00:00Z',
      }

      // 3. 휴게 종료
      const mockBreakEndRecord: AttendanceRecord = {
        ...mockBreakStartRecord,
        break_end_time: '2025-01-15T13:00:00Z',
      }

      // 4. 퇴근 기록
      const mockCheckOutRecord: AttendanceRecord = {
        ...mockBreakEndRecord,
        check_out_time: '2025-01-15T18:00:00Z',
        total_work_hours: 8,
        overtime_hours: 0,
      }

      // Mock attendance settings
      DBHelper.mockQueryResponse('SELECT id FROM companies LIMIT 1', {
        rows: [{ id: 'company-1' }],
      })

      DBHelper.mockQueryResponse('SELECT work_start_time, work_end_time, late_threshold_minutes, early_leave_threshold_minutes, allowed_ips, require_ip_check FROM attendance_settings WHERE company_id = $1', {
        rows: [{
          work_start_time: '09:00',
          work_end_time: '18:00',
          late_threshold_minutes: 15,
          early_leave_threshold_minutes: 30,
          allowed_ips: ['192.168.1.0/24'],
          require_ip_check: false,
        }],
      })

      // Mock check-in
      DBHelper.mockQueryResponse('INSERT INTO attendance (employee_id, check_in_time, check_in_ip, notes, status) VALUES ($1, now(), $2, $3, $4) ON CONFLICT (employee_id, check_in_date) DO UPDATE SET check_in_time = now(), check_in_ip = $2, notes = $3, status = $4, updated_at = now() RETURNING id, employee_id, check_in_time::text, check_out_time::text, break_start_time::text, break_end_time::text, total_work_hours, overtime_hours, status, notes, created_at::text, updated_at::text', {
        rows: [mockCheckInRecord],
      })

      // Mock break start
      DBHelper.mockQueryResponse('UPDATE attendance SET break_start_time = now(), updated_at = now() WHERE employee_id = $1 AND DATE(check_in_time) = CURRENT_DATE RETURNING id, employee_id, check_in_time::text, check_out_time::text, break_start_time::text, break_end_time::text, total_work_hours, overtime_hours, status, notes, created_at::text, updated_at::text', {
        rows: [mockBreakStartRecord],
      })

      // Mock break end
      DBHelper.mockQueryResponse('UPDATE attendance SET break_end_time = now(), updated_at = now() WHERE employee_id = $1 AND DATE(check_in_time) = CURRENT_DATE RETURNING id, employee_id, check_in_time::text, check_out_time::text, break_start_time::text, break_end_time::text, total_work_hours, overtime_hours, status, notes, created_at::text, updated_at::text', {
        rows: [mockBreakEndRecord],
      })

      // Mock check-out
      DBHelper.mockQueryResponse('UPDATE attendance SET check_out_time = now(), check_out_ip = $2, notes = COALESCE($3, notes), updated_at = now() WHERE employee_id = $1 AND DATE(check_in_time) = CURRENT_DATE RETURNING id, employee_id, check_in_time::text, check_out_time::text, break_start_time::text, break_end_time::text, total_work_hours, overtime_hours, status, notes, created_at::text, updated_at::text', {
        rows: [mockCheckOutRecord],
      })

      // 출근
      const checkInResult = await recordCheckIn('employee-1', '2025-01-15', '192.168.1.100', '정상 출근')
      expect(checkInResult.success).toBe(true)
      expect(checkInResult.message).toBe(ATTENDANCE_MESSAGES.CHECK_IN)

      // 휴게 시작
      const breakStartResult = await recordBreakStart('employee-1')
      expect(breakStartResult.success).toBe(true)
      expect(breakStartResult.message).toBe(ATTENDANCE_MESSAGES.BREAK_START)

      // 휴게 종료
      const breakEndResult = await recordBreakEnd('employee-1')
      expect(breakEndResult.success).toBe(true)
      expect(breakEndResult.message).toBe(ATTENDANCE_MESSAGES.BREAK_END)

      // 퇴근
      const checkOutResult = await recordCheckOut('employee-1', '192.168.1.100', '정상 퇴근')
      expect(checkOutResult.success).toBe(true)
      expect(checkOutResult.message).toBe(ATTENDANCE_MESSAGES.CHECK_OUT)
    })

    it('다양한 출퇴근 상태를 올바르게 처리해야 함', async () => {
      const testCases = [
        {
          name: '정상 출퇴근',
          checkInTime: '2025-01-15T09:00:00Z',
          checkOutTime: '2025-01-15T18:00:00Z',
          expectedStatus: 'present',
          expectedMessage: ATTENDANCE_MESSAGES.CHECK_IN,
        },
        {
          name: '지각',
          checkInTime: '2025-01-15T09:20:00Z',
          checkOutTime: '2025-01-15T18:00:00Z',
          expectedStatus: 'late',
          expectedMessage: ATTENDANCE_MESSAGES.CHECK_IN_LATE,
        },
        {
          name: '조기퇴근',
          checkInTime: '2025-01-15T09:00:00Z',
          checkOutTime: '2025-01-15T17:00:00Z',
          expectedStatus: 'early_leave',
          expectedMessage: ATTENDANCE_MESSAGES.CHECK_OUT_EARLY,
        },
      ]

      for (const testCase of testCases) {
        DBHelper.reset()

        const mockAttendanceRecord: AttendanceRecord = {
          id: 'attendance-1',
          date: '2025-01-15',
          check_in_time: testCase.checkInTime,
          check_out_time: testCase.checkOutTime,
          break_start_time: null,
          break_end_time: null,
          total_work_hours: 8,
          overtime_hours: 0,
          status: testCase.expectedStatus,
          notes: testCase.name,
        }

        // Mock attendance settings
        DBHelper.mockQueryResponse('SELECT id FROM companies LIMIT 1', {
          rows: [{ id: 'company-1' }],
        })

        DBHelper.mockQueryResponse('SELECT work_start_time, work_end_time, late_threshold_minutes, early_leave_threshold_minutes, allowed_ips, require_ip_check FROM attendance_settings WHERE company_id = $1', {
          rows: [{
            work_start_time: '09:00',
            work_end_time: '18:00',
            late_threshold_minutes: 15,
            early_leave_threshold_minutes: 30,
            allowed_ips: ['192.168.1.0/24'],
            require_ip_check: false,
          }],
        })

        DBHelper.mockQueryResponse('INSERT INTO attendance (employee_id, check_in_time, check_in_ip, notes, status) VALUES ($1, now(), $2, $3, $4) ON CONFLICT (employee_id, check_in_date) DO UPDATE SET check_in_time = now(), check_in_ip = $2, notes = $3, status = $4, updated_at = now() RETURNING id, employee_id, check_in_time::text, check_out_time::text, break_start_time::text, break_end_time::text, total_work_hours, overtime_hours, status, notes, created_at::text, updated_at::text', {
          rows: [mockAttendanceRecord],
        })

        const result = await recordCheckIn('employee-1', '2025-01-15', '192.168.1.100', testCase.name)

        expect(result.success).toBe(true)
        expect(result.data?.status).toBe(testCase.expectedStatus)
        expect(result.message).toBe(testCase.expectedMessage)
      }
    })
  })
})
