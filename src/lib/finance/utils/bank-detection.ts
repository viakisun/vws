import { logger } from '$lib/utils/logger'

/**
 * 파일명에서 은행명 감지
 */
export function detectBankFromFileName(fileName: string): string {
  logger.info('=== 은행 감지 디버깅 ===')
  logger.info('원본 파일명:', fileName)
  logger.info('파일명 타입:', typeof fileName)
  logger.info('파일명 길이:', fileName.length)

  const fileNameLower = fileName.toLowerCase()
  logger.info('소문자 변환:', fileNameLower)

  // 공백 제거하여 검색
  const cleanFileName = fileNameLower.replace(/\s+/g, '')
  logger.info('공백 제거:', cleanFileName)

  const hasHana1 = fileNameLower.includes('하나')
  const hasHana2 = fileNameLower.includes('hana')
  const hasHana3 = cleanFileName.includes('하나')
  const hasHana4 = cleanFileName.includes('hana')

  logger.info('하나 포함 체크:', { hasHana1, hasHana2, hasHana3, hasHana4 })

  if (hasHana1 || hasHana2 || hasHana3 || hasHana4) {
    logger.info('결과: 하나은행')
    return '하나은행'
  } else if (
    fileNameLower.includes('농협') ||
    fileNameLower.includes('nonghyup') ||
    cleanFileName.includes('농협') ||
    cleanFileName.includes('nonghyup')
  ) {
    logger.info('결과: 농협은행')
    return '농협은행'
  }
  logger.info('결과: 알 수 없음')
  return '알 수 없음'
}

/**
 * 파일명에서 계좌번호 추출 (하이픈 포함/미포함 모두 처리)
 */
export function extractAccountNumber(fileName: string): string | null {
  const accountNumberMatch = fileName.match(/(\d{3}-?\d{3,6}-?\d{3,6}|\d{11,14})/)
  return accountNumberMatch ? accountNumberMatch[0] : null
}

/**
 * 계좌번호 정규화 (하이픈 제거)
 */
export function normalizeAccountNumber(accountNumber: string): string {
  return accountNumber.replace(/-/g, '')
}
