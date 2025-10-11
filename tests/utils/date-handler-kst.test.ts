import { describe, it, expect } from 'vitest'
import {
  toKstTextFromDateTimeLocal,
  formatDateForInput,
  formatDateTimeForInput,
  formatDateForDisplay,
  isValidDate,
  getCurrentKstIso,
} from '$lib/utils/date-handler'

describe('KST Date Handler', () => {
  describe('toKstTextFromDateTimeLocal', () => {
    it('should convert datetime-local to KST text', () => {
      expect(toKstTextFromDateTimeLocal('2025-10-08T11:30')).toBe('2025-10-08 11:30+09')
      expect(toKstTextFromDateTimeLocal('2025-01-01T00:00')).toBe('2025-01-01 00:00+09')
      expect(toKstTextFromDateTimeLocal('2024-12-31T23:59')).toBe('2024-12-31 23:59+09')
    })

    it('should handle empty input', () => {
      expect(toKstTextFromDateTimeLocal('')).toBe('')
    })

    it('should return empty string for invalid format', () => {
      expect(toKstTextFromDateTimeLocal('invalid')).toBe('')
      expect(toKstTextFromDateTimeLocal('2025-10-08')).toBe('')
    })
  })

  describe('formatDateTimeForInput', () => {
    it('should format DB timestamp to datetime-local', () => {
      expect(formatDateTimeForInput('2025-10-08 11:30:00+09')).toBe('2025-10-08T11:30')
      expect(formatDateTimeForInput('2025-10-08 11:30:45.123+09')).toBe('2025-10-08T11:30')
      expect(formatDateTimeForInput('2024-01-15 00:00:00+09')).toBe('2024-01-15T00:00')
    })

    it('should handle empty input', () => {
      expect(formatDateTimeForInput('')).toBe('')
    })

    it('should return empty string for date-only format', () => {
      expect(formatDateTimeForInput('2025-10-08')).toBe('')
    })
  })

  describe('formatDateForInput', () => {
    it('should extract date part from timestamp', () => {
      expect(formatDateForInput('2025-10-08 11:30:00+09')).toBe('2025-10-08')
      expect(formatDateForInput('2025-10-08 11:30:45.123+09')).toBe('2025-10-08')
    })

    it('should handle date-only format', () => {
      expect(formatDateForInput('2025-10-08')).toBe('2025-10-08')
      expect(formatDateForInput('2024-12-31')).toBe('2024-12-31')
    })

    it('should handle empty input', () => {
      expect(formatDateForInput('')).toBe('')
    })
  })

  describe('formatDateForDisplay', () => {
    it('should format for FULL display', () => {
      expect(formatDateForDisplay('2025-10-08', 'FULL')).toBe('2025. 10. 08.')
      expect(formatDateForDisplay('2024-01-01', 'FULL')).toBe('2024. 01. 01.')
    })

    it('should format for KOREAN display', () => {
      expect(formatDateForDisplay('2025-10-08', 'KOREAN')).toBe('2025년 10월 08일')
      expect(formatDateForDisplay('2024-12-25', 'KOREAN')).toBe('2024년 12월 25일')
    })

    it('should format for SHORT display', () => {
      expect(formatDateForDisplay('2025-10-08', 'SHORT')).toBe('10/08')
      expect(formatDateForDisplay('2024-01-15', 'SHORT')).toBe('01/15')
    })

    it('should format for ISO display', () => {
      expect(formatDateForDisplay('2025-10-08', 'ISO')).toBe('2025-10-08')
      expect(formatDateForDisplay('2024-12-31', 'ISO')).toBe('2024-12-31')
    })

    it('should handle timestamp input', () => {
      expect(formatDateForDisplay('2025-10-08 11:30:00+09', 'FULL')).toBe('2025. 10. 08.')
      expect(formatDateForDisplay('2025-10-08 11:30:00.123+09', 'KOREAN')).toBe('2025년 10월 08일')
    })

    it('should use FULL as default format', () => {
      expect(formatDateForDisplay('2025-10-08')).toBe('2025. 10. 08.')
    })

    it('should handle empty input', () => {
      expect(formatDateForDisplay('')).toBe('')
    })
  })

  describe('isValidDate', () => {
    it('should validate valid date strings', () => {
      expect(isValidDate('2025-10-08')).toBe(true)
      expect(isValidDate('2024-01-01')).toBe(true)
      expect(isValidDate('2025-10-08T11:30:00Z')).toBe(true)
    })

    it('should validate Date objects', () => {
      expect(isValidDate(new Date())).toBe(true)
      expect(isValidDate(new Date('2025-10-08'))).toBe(true)
    })

    it('should reject invalid dates', () => {
      expect(isValidDate('invalid')).toBe(false)
      expect(isValidDate('2025-13-01')).toBe(false)
      expect(isValidDate('')).toBe(false)
    })

    it('should reject null/undefined', () => {
      expect(isValidDate(null as unknown as string)).toBe(false)
      expect(isValidDate(undefined as unknown as string)).toBe(false)
    })
  })

  describe('getCurrentKstIso', () => {
    it('should return ISO format string', () => {
      const result = getCurrentKstIso()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('should return valid date', () => {
      const result = getCurrentKstIso()
      expect(isValidDate(result)).toBe(true)
    })

    it('should return current time (within 1 second)', () => {
      const before = new Date()
      const result = getCurrentKstIso()
      const after = new Date()

      const resultDate = new Date(result)
      expect(resultDate.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(resultDate.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })
})
