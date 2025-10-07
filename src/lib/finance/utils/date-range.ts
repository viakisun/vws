import { getCurrentUTC } from '$lib/utils/date-handler'

export type DateRangePreset = '1D' | '1W' | '1M' | '3M' | 'ALL'

/**
 * 날짜 범위 프리셋에 따른 from/to 날짜 계산
 */
export function getDateRangePreset(range: DateRangePreset): { from: string; to: string } {
  const now = new Date()
  const to = getCurrentUTC()
  let from: string

  switch (range) {
    case '1D':
      from = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
      break
    case '1W':
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      break
    case '1M':
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      break
    case '3M':
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
      break
    case 'ALL':
      from = '2020-01-01T00:00:00.000Z'
      break
  }

  return { from, to }
}
