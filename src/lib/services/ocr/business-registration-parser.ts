import type { TextractResult } from './textract-client'
import { extractPattern, extractPatternsFromLines, findTextNearKeyword } from './textract-client'

export interface BusinessRegistrationData {
  companyName: string | null
  businessNumber: string | null
  representativeName: string | null
  businessAddress: string | null
  businessType: string | null
  businessCategory: string | null
  establishmentDate: string | null
  isCorporation: boolean
  confidence: number
  rawText: string
}

/**
 * 사업자등록증에서 정보 추출
 */
export function parseBusinessRegistration(
  textractResult: TextractResult
): BusinessRegistrationData {
  const { text, lines, averageConfidence } = textractResult

  // 사업자번호 추출: 123-45-67890 형식
  const businessNumber = extractBusinessNumber(lines, text)

  // 상호명/법인명 추출
  const companyName = extractCompanyName(lines)

  // 대표자명 추출
  const representativeName = extractRepresentativeName(lines)

  // 사업장 주소 추출
  const businessAddress = extractBusinessAddress(lines)

  // 업태 추출
  const businessType = extractBusinessType(lines)

  // 종목 추출
  const businessCategory = extractBusinessCategory(lines)

  // 개업일자 추출
  const establishmentDate = extractEstablishmentDate(lines, text)

  // 법인 여부 판단
  const isCorporation = checkIsCorporation(lines, companyName)

  return {
    companyName,
    businessNumber,
    representativeName,
    businessAddress,
    businessType,
    businessCategory,
    establishmentDate,
    isCorporation,
    confidence: averageConfidence,
    rawText: text,
  }
}

/**
 * 사업자번호 추출
 */
function extractBusinessNumber(lines: string[], text: string): string | null {
  // 패턴: 123-45-67890
  const pattern = /\d{3}-\d{2}-\d{5}/
  const fromText = extractPattern(text, pattern)
  if (fromText) return fromText

  // 라인별로 찾기
  const fromLines = extractPatternsFromLines(lines, pattern)
  return fromLines.length > 0 ? fromLines[0] : null
}

/**
 * 상호명/법인명 추출
 */
function extractCompanyName(lines: string[]): string | null {
  // "상호", "법인명", "상 호" 키워드 찾기
  const keywords = ['법인명', '상호', '상 호', '회사명']

  for (const keyword of keywords) {
    const result = findTextNearKeyword(lines, keyword, 2)
    if (result && result.length > 1) {
      // 괄호나 특수문자 제거
      return result.replace(/[()[\]]/g, '').trim()
    }
  }

  // 키워드 없이 법인/회사 패턴 찾기
  for (const line of lines) {
    if (
      (line.includes('주식회사') ||
        line.includes('(주)') ||
        line.includes('유한회사') ||
        line.includes('(유)')) &&
      line.length < 50
    ) {
      return line.trim()
    }
  }

  return null
}

/**
 * 대표자명 추출
 */
function extractRepresentativeName(lines: string[]): string | null {
  const keywords = ['대표자', '대표', '성명', '대 표 자']

  for (const keyword of keywords) {
    const result = findTextNearKeyword(lines, keyword, 2)
    if (result && result.length >= 2 && result.length <= 20) {
      // 한글 이름만 추출
      const nameMatch = result.match(/[가-힣]{2,4}/)
      if (nameMatch) {
        return nameMatch[0]
      }
      return result
    }
  }

  return null
}

/**
 * 사업장 주소 추출
 */
function extractBusinessAddress(lines: string[]): string | null {
  const keywords = ['사업장소재지', '소재지', '주소', '사업장 소재지']

  for (const keyword of keywords) {
    const result = findTextNearKeyword(lines, keyword, 3)
    if (result && result.length > 5) {
      return result
    }
  }

  // 주소 패턴으로 찾기 (시/도로 시작)
  for (const line of lines) {
    if (
      /^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)/.test(
        line
      )
    ) {
      return line
    }
  }

  return null
}

/**
 * 업태 추출
 */
function extractBusinessType(lines: string[]): string | null {
  const keywords = ['업태', '업 태']

  for (const keyword of keywords) {
    const result = findTextNearKeyword(lines, keyword, 1)
    if (result && result.length > 0 && result.length < 50) {
      // 쉼표로 구분된 경우 분리
      return result.split(',')[0].trim()
    }
  }

  return null
}

/**
 * 종목 추출
 */
function extractBusinessCategory(lines: string[]): string | null {
  const keywords = ['종목', '종 목']

  for (const keyword of keywords) {
    const result = findTextNearKeyword(lines, keyword, 1)
    if (result && result.length > 0 && result.length < 100) {
      return result
    }
  }

  return null
}

/**
 * 개업일자 추출
 */
function extractEstablishmentDate(lines: string[], text: string): string | null {
  const keywords = ['개업', '개 업']

  // 키워드 근처에서 날짜 찾기
  for (const keyword of keywords) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(keyword)) {
        // 다음 몇 라인에서 날짜 패턴 찾기
        for (let j = 0; j <= 2 && i + j < lines.length; j++) {
          const dateStr = extractDatePattern(lines[i + j])
          if (dateStr) return dateStr
        }
      }
    }
  }

  // 전체 텍스트에서 날짜 패턴 찾기
  return extractDatePattern(text)
}

/**
 * 날짜 패턴 추출 (YYYY-MM-DD, YYYY.MM.DD, YYYY년 MM월 DD일 등)
 */
function extractDatePattern(text: string): string | null {
  // YYYY-MM-DD
  let match = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
  }

  // YYYY.MM.DD
  match = text.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/)
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
  }

  // YYYY년 MM월 DD일
  match = text.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/)
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
  }

  // YYYYMMDD
  match = text.match(/(\d{4})(\d{2})(\d{2})/)
  if (match) {
    const year = parseInt(match[1])
    const month = parseInt(match[2])
    const day = parseInt(match[3])
    // 유효한 날짜인지 확인
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${match[1]}-${match[2]}-${match[3]}`
    }
  }

  return null
}

/**
 * 법인 여부 체크
 */
function checkIsCorporation(lines: string[], companyName: string | null): boolean {
  // 회사명에 법인 키워드 포함 여부
  if (companyName) {
    if (
      companyName.includes('주식회사') ||
      companyName.includes('(주)') ||
      companyName.includes('유한회사') ||
      companyName.includes('(유)') ||
      companyName.includes('㈜')
    ) {
      return true
    }
  }

  // 텍스트에서 법인 키워드 찾기
  const text = lines.join(' ')
  if (text.includes('법인') && !text.includes('개인')) {
    return true
  }

  return false
}

