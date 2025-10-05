import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate } from '$lib/utils/format'

describe('Format Utils', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      expect(formatCurrency(1000000)).toBe('1,000천원')
      expect(formatCurrency(500000)).toBe('500천원')
      expect(formatCurrency(1234567)).toBe('1,234천원')
    })

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('0천원')
    })

    it('should format negative numbers correctly', () => {
      expect(formatCurrency(-1000000)).toBe('-1,000천원')
      expect(formatCurrency(-500000)).toBe('-500천원')
    })

    it('should handle decimal numbers', () => {
      expect(formatCurrency(1000000.5)).toBe('1,000천원')
      expect(formatCurrency(1000000.9)).toBe('1,000천원')
    })

    it('should handle undefined and null values', () => {
      expect(formatCurrency(undefined as unknown as string)).toBe('0천원')
      expect(formatCurrency(null as unknown as string)).toBe('0천원')
    })

    it('should format without unit when includeUnit is false', () => {
      expect(formatCurrency(1000000, false)).toBe('1,000')
      expect(formatCurrency(500000, false)).toBe('500')
    })
  })

  describe('formatDate', () => {
    it('should format ISO date strings correctly', () => {
      expect(formatDate('2024-01-15')).toBe('2024. 01. 15.')
      expect(formatDate('2024-12-31')).toBe('2024. 12. 31.')
    })

    it('should format Date objects correctly', () => {
      const date = new Date('2024-01-15')
      expect(formatDate(date.toString())).toBe('2024. 01. 15.')
    })

    it('should handle invalid date strings', () => {
      expect(formatDate('invalid-date')).toBe('')
      expect(formatDate('')).toBe('')
    })

    it('should handle undefined and null values', () => {
      expect(formatDate(undefined as unknown as string)).toBe('')
      expect(formatDate(null as unknown as string)).toBe('')
    })

    it('should format dates with time components', () => {
      // Note: ISO timestamps with 'Z' are handled by the underlying Date parser
      const result1 = formatDate('2024-01-15T10:30:00')
      const result2 = formatDate('2024-01-15T23:59:59')

      // Check that the result is a valid date format (or empty if timezone handling differs)
      expect(result1).toMatch(/^\d{4}\. \d{2}\. \d{2}\.$/)
      expect(result2).toMatch(/^\d{4}\. \d{2}\. \d{2}\.$/)
    })
  })
})
