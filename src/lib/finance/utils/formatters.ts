// 자금일보 시스템 포맷터 유틸리티

/**
 * 금액을 한국 원화 형식으로 포맷팅
 */
export function formatCurrency(amount: number, showSymbol: boolean = true): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '₩0' : '0'
  }

  const formatted = Math.abs(amount).toLocaleString('ko-KR')
  const sign = amount < 0 ? '-' : ''
  const symbol = showSymbol ? '₩' : ''

  return `${sign}${symbol}${formatted}`
}

/**
 * 금액을 정확한 형식으로 포맷팅 (원 단위까지 표시)
 */
export function formatAmount(amount: number): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0원'
  }

  const absAmount = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  const formatted = absAmount.toLocaleString('ko-KR')

  return `${sign}${formatted}원`
}

/**
 * 날짜를 한국 형식으로 포맷팅
 */
export function formatDate(
  date: string | Date,
  format: 'short' | 'long' | 'time' | 'datetime' = 'short',
): string {
  if (!date) return ''

  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  switch (format) {
    case 'long':
      return `${year}년 ${month}월 ${day}일`
    case 'time':
      return `${year}-${month}-${day} ${hours}:${minutes}`
    case 'datetime':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    default:
      return `${year}-${month}-${day}`
  }
}

/**
 * 상대적 시간 포맷팅 (몇 일 전, 몇 시간 전 등)
 */
export function formatRelativeTime(date: string | Date): string {
  if (!date) return ''

  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffDays > 0) {
    return `${diffDays}일 전`
  } else if (diffHours > 0) {
    return `${diffHours}시간 전`
  } else if (diffMinutes > 0) {
    return `${diffMinutes}분 전`
  } else {
    return '방금 전'
  }
}

/**
 * 퍼센트 포맷팅
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%'
  }

  return `${value.toFixed(decimals)}%`
}

/**
 * 숫자를 한국어 형식으로 포맷팅
 */
export function formatNumber(value: number): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0'
  }

  return value.toLocaleString('ko-KR')
}

/**
 * 계좌 번호 포맷팅 (하이픈 제거하여 일관성 있게 표시)
 */
export function formatAccountNumber(accountNumber: string): string {
  if (!accountNumber) return ''

  // 숫자만 추출하고 하이픈 제거
  const numbers = accountNumber.replace(/\D/g, '')

  // 하이픈 없이 숫자만 반환
  return numbers
}

/**
 * 전화번호 포맷팅
 */
export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return ''

  const numbers = phoneNumber.replace(/\D/g, '')

  if (numbers.length === 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
  } else if (numbers.length === 10) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
  } else {
    return phoneNumber
  }
}

/**
 * 파일 크기 포맷팅
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 거래 타입을 한국어로 변환
 */
export function formatTransactionType(type: string): string {
  const typeMap: Record<string, string> = {
    income: '수입',
    expense: '지출',
    transfer: '이체',
    adjustment: '조정',
  }

  return typeMap[type] || type
}

/**
 * 계좌 타입을 한국어로 변환
 */
export function formatAccountType(type: string): string {
  const typeMap: Record<string, string> = {
    checking: '입출금',
    savings: '예금',
    business: '사업자',
    investment: '투자',
  }

  return typeMap[type] || type
}

/**
 * 계좌 상태를 한국어로 변환
 */
export function formatAccountStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: '활성',
    inactive: '비활성',
    suspended: '정지',
    closed: '폐쇄',
  }

  return statusMap[status] || status
}

/**
 * 거래 상태를 한국어로 변환
 */
export function formatTransactionStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '대기',
    completed: '완료',
    cancelled: '취소',
    failed: '실패',
  }

  return statusMap[status] || status
}
