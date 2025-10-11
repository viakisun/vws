import { describe, it, expect } from 'vitest'
import { assertDbDateText } from '$lib/database/connection'

describe('assertDbDateText', () => {
  describe('valid KST timestamp formats', () => {
    it('should pass valid KST timestamp with seconds', () => {
      expect(assertDbDateText('2025-10-08 11:30:00+09')).toBe('2025-10-08 11:30:00+09')
      expect(assertDbDateText('2024-01-15 23:59:59+09')).toBe('2024-01-15 23:59:59+09')
    })

    it('should pass valid KST timestamp with milliseconds', () => {
      expect(assertDbDateText('2025-10-08 11:30:00.123+09')).toBe('2025-10-08 11:30:00.123+09')
      expect(assertDbDateText('2024-12-31 23:59:59.999+09')).toBe('2024-12-31 23:59:59.999+09')
    })

    it('should pass KST timestamp with different timezone offsets', () => {
      expect(assertDbDateText('2025-10-08 11:30:00+09')).toBe('2025-10-08 11:30:00+09')
      expect(assertDbDateText('2025-10-08 02:30:00+00')).toBe('2025-10-08 02:30:00+00')
    })
  })

  describe('valid DATE formats', () => {
    it('should pass valid DATE format', () => {
      expect(assertDbDateText('2025-10-08')).toBe('2025-10-08')
      expect(assertDbDateText('2024-01-01')).toBe('2024-01-01')
      expect(assertDbDateText('2024-12-31')).toBe('2024-12-31')
    })
  })

  describe('invalid formats - ISO 8601', () => {
    it('should warn but pass ISO 8601 format (missing ::text)', () => {
      const result = assertDbDateText('2025-10-08T11:30:00Z')
      expect(result).toBe('2025-10-08T11:30:00Z')
      // Error is logged but value is returned
    })

    it('should warn on ISO 8601 with milliseconds', () => {
      const result = assertDbDateText('2025-10-08T11:30:00.123Z')
      expect(result).toBe('2025-10-08T11:30:00.123Z')
    })

    it('should warn on ISO 8601 with timezone offset', () => {
      const result = assertDbDateText('2025-10-08T11:30:00+09:00')
      expect(result).toBe('2025-10-08T11:30:00+09:00')
    })
  })

  describe('invalid formats - Date object', () => {
    it('should warn on Date object (missing ::text)', () => {
      const date = new Date('2025-10-08')
      const result = assertDbDateText(date)
      expect(typeof result).toBe('string')
      expect(result).toBeTruthy()
      // Error is logged
    })

    it('should handle invalid Date object', () => {
      const invalidDate = new Date('invalid')
      const result = assertDbDateText(invalidDate)
      expect(result).toBe('Invalid Date')
    })
  })

  describe('invalid formats - non-string types', () => {
    it('should warn on number', () => {
      const result = assertDbDateText(1234567890)
      expect(result).toBe('1234567890')
      // Error is logged
    })

    it('should warn on null', () => {
      const result = assertDbDateText(null)
      expect(result).toBe('')
    })

    it('should warn on undefined', () => {
      const result = assertDbDateText(undefined)
      expect(result).toBe('')
    })

    it('should warn on object', () => {
      const result = assertDbDateText({ date: '2025-10-08' })
      expect(result).toBe('[object Object]')
      // Error is logged
    })
  })

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(assertDbDateText('')).toBe('')
    })

    it('should warn on non-standard date format', () => {
      const result = assertDbDateText('10/08/2025')
      expect(result).toBe('10/08/2025')
      // Error is logged
    })

    it('should warn on Korean date format', () => {
      const result = assertDbDateText('2025년 10월 08일')
      expect(result).toBe('2025년 10월 08일')
      // Error is logged
    })

    it('should handle date string with extra whitespace', () => {
      // These should fail validation and log errors
      const result = assertDbDateText(' 2025-10-08 ')
      expect(result).toBe(' 2025-10-08 ')
      // Error is logged for non-standard format
    })
  })
})

