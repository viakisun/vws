import { describe, it, expect } from 'vitest'
import { formatKRW, pct } from './format'

describe('format utils', () => {
  it('formats KRW without decimals', () => {
    const out = formatKRW(1234567)
    expect(out).toMatch(/1,234,567/)
  })
  it('formats percentage with rounding', () => {
    expect(pct(72.4)).toBe('72%')
    expect(pct(72.6)).toBe('73%')
  })
})
