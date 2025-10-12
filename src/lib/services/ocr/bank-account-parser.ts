import type { TextractResult } from './textract-client'
import { extractPatternsFromLines } from './textract-client'

export interface BankAccountData {
  bankName: string | null
  accountNumber: string | null
  accountHolder: string | null
  confidence: number
  rawText: string
}

/**
 * 통장사본에서 정보 추출
 */
export function parseBankAccount(textractResult: TextractResult): BankAccountData {
  const { text, lines, averageConfidence } = textractResult

  // 은행명 추출
  const bankName = extractBankName(lines, text)

  // 계좌번호 추출
  const accountNumber = extractAccountNumber(lines, text)

  // 예금주명 추출
  const accountHolder = extractAccountHolder(lines, bankName)

  return {
    bankName,
    accountNumber,
    accountHolder,
    confidence: averageConfidence,
    rawText: text,
  }
}

/**
 * 은행명 추출
 */
function extractBankName(lines: string[], text: string): string | null {
  const bankKeywords = [
    { pattern: /KB국민은행|국민은행|KB은행/, name: '국민은행' },
    { pattern: /신한은행|신한/, name: '신한은행' },
    { pattern: /우리은행|우리/, name: '우리은행' },
    { pattern: /하나은행|하나/, name: '하나은행' },
    { pattern: /NH농협은행|농협은행|농협|NH은행/, name: '농협은행' },
    { pattern: /기업은행|IBK/, name: '기업은행' },
    { pattern: /SC제일은행|제일은행/, name: 'SC제일은행' },
    { pattern: /씨티은행|한국씨티은행/, name: '씨티은행' },
    { pattern: /카카오뱅크/, name: '카카오뱅크' },
    { pattern: /케이뱅크|K뱅크/, name: '케이뱅크' },
    { pattern: /토스뱅크/, name: '토스뱅크' },
    { pattern: /대구은행/, name: '대구은행' },
    { pattern: /부산은행/, name: '부산은행' },
    { pattern: /광주은행/, name: '광주은행' },
    { pattern: /제주은행/, name: '제주은행' },
    { pattern: /전북은행/, name: '전북은행' },
    { pattern: /경남은행/, name: '경남은행' },
    { pattern: /수협은행|수협/, name: '수협은행' },
    { pattern: /새마을금고|MG새마을금고/, name: '새마을금고' },
    { pattern: /신협|신용협동조합/, name: '신협' },
    { pattern: /우체국|우체국예금/, name: '우체국' },
    { pattern: /산업은행/, name: '산업은행' },
    { pattern: /수출입은행/, name: '수출입은행' },
  ]

  // 전체 텍스트에서 은행명 찾기
  for (const bank of bankKeywords) {
    if (bank.pattern.test(text)) {
      return bank.name
    }
  }

  // 각 라인에서 은행명 찾기
  for (const line of lines) {
    for (const bank of bankKeywords) {
      if (bank.pattern.test(line)) {
        return bank.name
      }
    }
  }

  return null
}

/**
 * 계좌번호 추출
 */
function extractAccountNumber(lines: string[], text: string): string | null {
  // 다양한 계좌번호 패턴
  const accountPatterns = [
    /\d{3}-\d{2,6}-\d{4,8}/, // 일반적인 형식: 123-456-7890
    /\d{4}-\d{2,6}-\d{4,8}/, // 4자리로 시작: 1234-56-7890
    /\d{6}-\d{2}-\d{6}/, // 기업은행: 123456-12-123456
    /\d{3}-\d{6}-\d{5}/, // 3-6-5 형식
    /\d{4}-\d{4}-\d{4}/, // 4-4-4 형식
    /\d{11,14}/, // 하이픈 없는 긴 숫자 (11-14자리)
  ]

  // 전체 텍스트에서 계좌번호 찾기
  for (const pattern of accountPatterns) {
    const match = text.match(pattern)
    if (match) {
      const number = match[0]
      // 너무 규칙적인 패턴은 제외 (000-00-0000 등)
      if (!isInvalidAccountNumber(number)) {
        return number
      }
    }
  }

  // 각 라인에서 찾기
  for (const line of lines) {
    // "계좌번호", "account", "계좌" 키워드가 있는 라인 우선
    if (line.includes('계좌') || line.includes('account') || line.includes('Account')) {
      for (const pattern of accountPatterns) {
        const matches = extractPatternsFromLines([line], pattern)
        if (matches.length > 0 && !isInvalidAccountNumber(matches[0])) {
          return matches[0]
        }
      }
    }
  }

  // 키워드 없이 찾기
  for (const pattern of accountPatterns) {
    const matches = extractPatternsFromLines(lines, pattern)
    if (matches.length > 0 && !isInvalidAccountNumber(matches[0])) {
      return matches[0]
    }
  }

  return null
}

/**
 * 유효하지 않은 계좌번호인지 체크
 */
function isInvalidAccountNumber(number: string): boolean {
  // 모두 같은 숫자
  if (/^(\d)\1+$/.test(number.replace(/-/g, ''))) {
    return true
  }

  // 연속된 숫자 (123456789 등)
  const digits = number.replace(/-/g, '')
  if (/^(0123456789|123456789|987654321)/.test(digits)) {
    return true
  }

  return false
}

/**
 * 예금주명 추출
 */
function extractAccountHolder(lines: string[], bankName: string | null): string | null {
  // "예금주", "소유자", "이름" 키워드 찾기
  const keywords = ['예금주', '소유자', '성명', '이 름', '명의']

  for (const keyword of keywords) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.includes(keyword)) {
        // 같은 라인에서 찾기
        const parts = line.split(keyword)
        if (parts.length > 1) {
          const nameMatch = parts[1].trim().match(/[가-힣]{2,10}/)
          if (nameMatch) {
            return nameMatch[0]
          }
        }

        // 다음 라인에서 찾기
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim()
          const nameMatch = nextLine.match(/[가-힣]{2,10}/)
          if (nameMatch) {
            return nameMatch[0]
          }
        }
      }
    }
  }

  // 키워드 없이 상단에서 한글 이름 찾기 (보통 통장사본 상단에 이름)
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim()
    // 은행명이 아니고, 짧은 한글 이름
    if (bankName && line.includes(bankName)) {
      continue
    }

    const nameMatch = line.match(/^[가-힣]{2,4}$/)
    if (nameMatch) {
      return nameMatch[0]
    }
  }

  // 괄호 안의 이름 찾기: (홍길동)
  for (const line of lines) {
    const nameMatch = line.match(/\(([가-힣]{2,4})\)/)
    if (nameMatch) {
      return nameMatch[1]
    }
  }

  return null
}

