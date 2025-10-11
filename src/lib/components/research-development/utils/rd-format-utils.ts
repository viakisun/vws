/**
 * RD 모듈 전용 포맷팅 유틸리티
 * 
 * 연구개발(RD) 모듈에서 사용하는 통일된 포맷팅 함수들
 */

/**
 * RD 모듈 전용 금액 포맷팅
 * - 원 단위
 * - 세자리 수 콤마
 * - 단위 표시 없음
 * 
 * @example
 * formatRDCurrency(100000000) // "100,000,000"
 * formatRDCurrency(0) // "0"
 * formatRDCurrency(null) // "0"
 */
export function formatRDCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '0'

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numAmount)) return '0'

  return Math.floor(numAmount).toLocaleString('ko-KR')
}

