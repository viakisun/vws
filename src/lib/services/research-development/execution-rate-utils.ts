/**
 * Budget Execution Rate Client-Side Utilities
 * 집행율 관련 클라이언트 사이드 유틸리티 (데이터베이스 접근 없음)
 */

/**
 * 집행율 색상 코딩
 */
export function getExecutionRateColor(rate: number): string {
  if (rate <= 30) return 'red' // 낮음
  if (rate <= 70) return 'green' // 적정
  if (rate <= 100) return 'orange' // 주의
  return 'red' // 초과
}

/**
 * 집행율 색상에 따른 CSS 클래스 반환
 */
export function getExecutionRateColorClass(color: string): string {
  switch (color) {
    case 'red':
      return 'bg-red-500'
    case 'green':
      return 'bg-green-500'
    case 'orange':
      return 'bg-orange-500'
    default:
      return 'bg-gray-400'
  }
}

/**
 * 집행율 텍스트 색상 클래스 반환
 */
export function getExecutionRateTextColorClass(color: string): string {
  switch (color) {
    case 'red':
      return 'text-red-600'
    case 'green':
      return 'text-green-600'
    case 'orange':
      return 'text-orange-600'
    default:
      return 'text-gray-600'
  }
}
