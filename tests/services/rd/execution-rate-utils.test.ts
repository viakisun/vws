import * as executionRateUtils from '$lib/services/research-development/execution-rate-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('execution-rate-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getExecutionRateColor', () => {
    it('should return red for rates <= 30%', () => {
      expect(executionRateUtils.getExecutionRateColor(0)).toBe('red')
      expect(executionRateUtils.getExecutionRateColor(15)).toBe('red')
      expect(executionRateUtils.getExecutionRateColor(30)).toBe('red')
    })

    it('should return green for rates > 30% and <= 70%', () => {
      expect(executionRateUtils.getExecutionRateColor(31)).toBe('green')
      expect(executionRateUtils.getExecutionRateColor(50)).toBe('green')
      expect(executionRateUtils.getExecutionRateColor(70)).toBe('green')
    })

    it('should return orange for rates > 70% and <= 100%', () => {
      expect(executionRateUtils.getExecutionRateColor(71)).toBe('orange')
      expect(executionRateUtils.getExecutionRateColor(85)).toBe('orange')
      expect(executionRateUtils.getExecutionRateColor(100)).toBe('orange')
    })

    it('should return red for rates > 100%', () => {
      expect(executionRateUtils.getExecutionRateColor(101)).toBe('red')
      expect(executionRateUtils.getExecutionRateColor(150)).toBe('red')
      expect(executionRateUtils.getExecutionRateColor(200)).toBe('red')
    })

    it('should handle decimal rates', () => {
      expect(executionRateUtils.getExecutionRateColor(29.9)).toBe('red')
      expect(executionRateUtils.getExecutionRateColor(30.1)).toBe('green')
      expect(executionRateUtils.getExecutionRateColor(70.1)).toBe('orange')
      expect(executionRateUtils.getExecutionRateColor(100.1)).toBe('red')
    })

    it('should handle negative rates', () => {
      expect(executionRateUtils.getExecutionRateColor(-10)).toBe('red')
      expect(executionRateUtils.getExecutionRateColor(-50)).toBe('red')
      expect(executionRateUtils.getExecutionRateColor(-100)).toBe('red')
    })

    it('should handle very large rates', () => {
      expect(executionRateUtils.getExecutionRateColor(1000)).toBe('red')
      expect(executionRateUtils.getExecutionRateColor(9999)).toBe('red')
      expect(executionRateUtils.getExecutionRateColor(Infinity)).toBe('red')
    })

    it('should handle NaN rates', () => {
      expect(executionRateUtils.getExecutionRateColor(NaN)).toBe('red')
    })

    it('should handle null and undefined rates', () => {
      expect(executionRateUtils.getExecutionRateColor(null as any)).toBe('red')
      expect(executionRateUtils.getExecutionRateColor(undefined as any)).toBe('red')
    })
  })

  describe('getExecutionRateColorClass', () => {
    it('should return correct CSS classes for each color', () => {
      expect(executionRateUtils.getExecutionRateColorClass('red')).toBe('bg-red-500')
      expect(executionRateUtils.getExecutionRateColorClass('green')).toBe('bg-green-500')
      expect(executionRateUtils.getExecutionRateColorClass('orange')).toBe('bg-orange-500')
      expect(executionRateUtils.getExecutionRateColorClass('gray')).toBe('bg-gray-400')
    })

    it('should return default class for unknown colors', () => {
      expect(executionRateUtils.getExecutionRateColorClass('blue')).toBe('bg-gray-400')
      expect(executionRateUtils.getExecutionRateColorClass('yellow')).toBe('bg-gray-400')
      expect(executionRateUtils.getExecutionRateColorClass('purple')).toBe('bg-gray-400')
      expect(executionRateUtils.getExecutionRateColorClass('')).toBe('bg-gray-400')
    })

    it('should handle case sensitivity', () => {
      expect(executionRateUtils.getExecutionRateColorClass('RED')).toBe('bg-gray-400')
      expect(executionRateUtils.getExecutionRateColorClass('Green')).toBe('bg-gray-400')
      expect(executionRateUtils.getExecutionRateColorClass('ORANGE')).toBe('bg-gray-400')
      expect(executionRateUtils.getExecutionRateColorClass('Gray')).toBe('bg-gray-400')
    })

    it('should handle null and undefined colors', () => {
      expect(executionRateUtils.getExecutionRateColorClass(null as any)).toBe('bg-gray-400')
      expect(executionRateUtils.getExecutionRateColorClass(undefined as any)).toBe('bg-gray-400')
    })

    it('should handle special characters in color names', () => {
      expect(executionRateUtils.getExecutionRateColorClass('red!')).toBe('bg-gray-400')
      expect(executionRateUtils.getExecutionRateColorClass('green@')).toBe('bg-gray-400')
      expect(executionRateUtils.getExecutionRateColorClass('orange#')).toBe('bg-gray-400')
      expect(executionRateUtils.getExecutionRateColorClass('gray$')).toBe('bg-gray-400')
    })
  })

  describe('getExecutionRateTextColorClass', () => {
    it('should return correct text color classes for each color', () => {
      expect(executionRateUtils.getExecutionRateTextColorClass('red')).toBe('text-red-600')
      expect(executionRateUtils.getExecutionRateTextColorClass('green')).toBe('text-green-600')
      expect(executionRateUtils.getExecutionRateTextColorClass('orange')).toBe('text-orange-600')
      expect(executionRateUtils.getExecutionRateTextColorClass('gray')).toBe('text-gray-600')
    })

    it('should return default class for unknown colors', () => {
      expect(executionRateUtils.getExecutionRateTextColorClass('blue')).toBe('text-gray-600')
      expect(executionRateUtils.getExecutionRateTextColorClass('yellow')).toBe('text-gray-600')
      expect(executionRateUtils.getExecutionRateTextColorClass('purple')).toBe('text-gray-600')
      expect(executionRateUtils.getExecutionRateTextColorClass('')).toBe('text-gray-600')
    })

    it('should handle case sensitivity', () => {
      expect(executionRateUtils.getExecutionRateTextColorClass('RED')).toBe('text-gray-600')
      expect(executionRateUtils.getExecutionRateTextColorClass('Green')).toBe('text-gray-600')
      expect(executionRateUtils.getExecutionRateTextColorClass('ORANGE')).toBe('text-gray-600')
      expect(executionRateUtils.getExecutionRateTextColorClass('Gray')).toBe('text-gray-600')
    })

    it('should handle null and undefined colors', () => {
      expect(executionRateUtils.getExecutionRateTextColorClass(null as any)).toBe('text-gray-600')
      expect(executionRateUtils.getExecutionRateTextColorClass(undefined as any)).toBe(
        'text-gray-600',
      )
    })

    it('should handle special characters in color names', () => {
      expect(executionRateUtils.getExecutionRateTextColorClass('red!')).toBe('text-gray-600')
      expect(executionRateUtils.getExecutionRateTextColorClass('green@')).toBe('text-gray-600')
      expect(executionRateUtils.getExecutionRateTextColorClass('orange#')).toBe('text-gray-600')
      expect(executionRateUtils.getExecutionRateTextColorClass('gray$')).toBe('text-gray-600')
    })
  })

  describe('integration tests', () => {
    it('should work together for rate color and CSS classes', () => {
      const rates = [0, 25, 50, 75, 100, 150]
      const expectedColors = ['red', 'red', 'green', 'orange', 'orange', 'red']
      const expectedBgClasses = [
        'bg-red-500',
        'bg-red-500',
        'bg-green-500',
        'bg-orange-500',
        'bg-orange-500',
        'bg-red-500',
      ]
      const expectedTextClasses = [
        'text-red-600',
        'text-red-600',
        'text-green-600',
        'text-orange-600',
        'text-orange-600',
        'text-red-600',
      ]

      rates.forEach((rate, index) => {
        const color = executionRateUtils.getExecutionRateColor(rate)
        const bgClass = executionRateUtils.getExecutionRateColorClass(color)
        const textClass = executionRateUtils.getExecutionRateTextColorClass(color)

        expect(color).toBe(expectedColors[index])
        expect(bgClass).toBe(expectedBgClasses[index])
        expect(textClass).toBe(expectedTextClasses[index])
      })
    })

    it('should handle edge cases consistently', () => {
      const edgeCases = [0, 30, 70, 100, 101, -1, NaN, Infinity]

      edgeCases.forEach((rate) => {
        const color = executionRateUtils.getExecutionRateColor(rate)
        const bgClass = executionRateUtils.getExecutionRateColorClass(color)
        const textClass = executionRateUtils.getExecutionRateTextColorClass(color)

        expect(typeof color).toBe('string')
        expect(typeof bgClass).toBe('string')
        expect(typeof textClass).toBe('string')
        expect(bgClass).toMatch(/^bg-\w+-\d+$/)
        expect(textClass).toMatch(/^text-\w+-\d+$/)
      })
    })

    it('should handle decimal precision consistently', () => {
      const decimalRates = [29.9, 30.1, 70.1, 100.1]

      decimalRates.forEach((rate) => {
        const color = executionRateUtils.getExecutionRateColor(rate)
        const bgClass = executionRateUtils.getExecutionRateColorClass(color)
        const textClass = executionRateUtils.getExecutionRateTextColorClass(color)

        expect(typeof color).toBe('string')
        expect(typeof bgClass).toBe('string')
        expect(typeof textClass).toBe('string')
      })
    })
  })

  describe('performance tests', () => {
    it('should handle large number of calls efficiently', () => {
      const start = performance.now()
      const iterations = 10000

      for (let i = 0; i < iterations; i++) {
        const rate = Math.random() * 200
        const color = executionRateUtils.getExecutionRateColor(rate)
        const bgClass = executionRateUtils.getExecutionRateColorClass(color)
        const textClass = executionRateUtils.getExecutionRateTextColorClass(color)
      }

      const end = performance.now()
      const duration = end - start

      // Should complete 10,000 iterations in less than 100ms
      expect(duration).toBeLessThan(100)
    })

    it('should handle concurrent calls efficiently', () => {
      const start = performance.now()
      const promises = []

      for (let i = 0; i < 1000; i++) {
        promises.push(
          Promise.resolve().then(() => {
            const rate = Math.random() * 200
            const color = executionRateUtils.getExecutionRateColor(rate)
            const bgClass = executionRateUtils.getExecutionRateColorClass(color)
            const textClass = executionRateUtils.getExecutionRateTextColorClass(color)
            return { color, bgClass, textClass }
          }),
        )
      }

      return Promise.all(promises).then((results) => {
        const end = performance.now()
        const duration = end - start

        expect(results).toHaveLength(1000)
        results.forEach((result) => {
          expect(typeof result.color).toBe('string')
          expect(typeof result.bgClass).toBe('string')
          expect(typeof result.textClass).toBe('string')
        })

        // Should complete 1,000 concurrent operations in less than 200ms
        expect(duration).toBeLessThan(200)
      })
    })
  })
})
