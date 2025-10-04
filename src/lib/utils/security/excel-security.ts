/**
 * Excel 파일 보안 검증 유틸리티
 * xlsx 라이브러리 사용 시 보안 취약점 대응
 */

// 보안 설정 상수
export const EXCEL_SECURITY_CONFIG = {
  MAX_FILE_SIZE: parseInt(process.env.EXCEL_MAX_FILE_SIZE || '10485760'), // 10MB
  MAX_ROWS: parseInt(process.env.EXCEL_MAX_ROWS || '10000'),
  MAX_COLS: parseInt(process.env.EXCEL_MAX_COLS || '100'),
  PARSE_TIMEOUT: parseInt(process.env.EXCEL_PARSE_TIMEOUT || '30000'), // 30초
  SECURITY_LEVEL: process.env.EXCEL_SECURITY_LEVEL || 'strict' as 'strict' | 'moderate' | 'lenient'
}

// Excel 파일 매직바이트 검증
export function validateExcelMagicBytes(buffer: Buffer): boolean {
  // .xls 파일 시그니처 (BIFF 형식)
  const xlsSignature1 = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])
  const xlsSignature2 = Buffer.from([0x09, 0x08, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00])
  
  // .xlsx 파일 시그니처 (ZIP 기반)
  const xlsxSignature = Buffer.from([0x50, 0x4B, 0x03, 0x04]) // PK..
  
  if (buffer.length < 4) return false
  
  // .xls 검증 (8바이트 필요)
  if (buffer.length >= 8) {
    if (buffer.subarray(0, 8).equals(xlsSignature1) || buffer.subarray(0, 8).equals(xlsSignature2)) {
      return true
    }
  }
  
  // .xlsx 검증 (4바이트 필요)
  if (buffer.subarray(0, 4).equals(xlsxSignature)) {
    return true
  }
  
  return false
}

// 파일 크기 검증
export function validateFileSize(buffer: Buffer): boolean {
  return buffer.length <= EXCEL_SECURITY_CONFIG.MAX_FILE_SIZE
}

// Excel 데이터 크기 검증
export function validateExcelDataSize(data: any[][]): boolean {
  if (!data || data.length === 0) return true
  
  const rowCount = data.length
  const maxColCount = Math.max(...data.map(row => row ? row.length : 0))
  
  return rowCount <= EXCEL_SECURITY_CONFIG.MAX_ROWS && 
         maxColCount <= EXCEL_SECURITY_CONFIG.MAX_COLS
}

// 수식 무력화 (모든 수식을 값으로 변환)
export function sanitizeExcelData(data: any[][]): any[][] {
  return data.map(row => 
    row.map(cell => {
      if (cell === null || cell === undefined) return ''
      
      // 문자열인 경우 수식 패턴 검사
      if (typeof cell === 'string') {
        // =로 시작하는 수식 제거하고 값만 반환
        if (cell.startsWith('=')) {
          console.log(`🔥 수식 무력화: "${cell}" -> ""`)
          return ''
        }
        
        // 위험한 함수명이 포함된 경우 제거
        const dangerousFunctions = ['EXEC', 'SHELL', 'CMD', 'EVAL', 'FUNCTION']
        if (dangerousFunctions.some(func => cell.toUpperCase().includes(func))) {
          console.log(`🔥 위험한 함수 감지 및 제거: "${cell}"`)
          return ''
        }
      }
      
      return cell
    })
  )
}

// 매크로 탐지 (기본적인 패턴 검사)
export function detectMacros(data: any[][]): boolean {
  const macroPatterns = [
    'AUTO_OPEN', 'WORKBOOK_OPEN', 'AUTO_CLOSE', 'WORKBOOK_CLOSE',
    'WORKSHEET_ACTIVATE', 'WORKSHEET_DEACTIVATE', 'WORKSHEET_CHANGE',
    'VB', 'VBA', 'MACRO', 'SUB ', 'FUNCTION '
  ]
  
  for (const row of data) {
    if (!row) continue
    
    for (const cell of row) {
      if (typeof cell === 'string') {
        const upperCell = cell.toUpperCase()
        // 정확한 매크로 패턴만 감지 (부분 문자열이 아닌)
        if (macroPatterns.some(pattern => {
          if (pattern.endsWith(' ')) {
            // 공백으로 끝나는 패턴은 단어 경계 확인
            return upperCell.includes(pattern) && 
                   (upperCell.indexOf(pattern) === 0 || 
                    upperCell[upperCell.indexOf(pattern) - 1] === ' ' ||
                    upperCell[upperCell.indexOf(pattern) - 1] === '(')
          } else {
            // 일반 패턴은 부분 문자열 검사
            return upperCell.includes(pattern)
          }
        })) {
          console.log(`🔥 매크로 패턴 감지: "${cell}"`)
          return true
        }
      }
    }
  }
  
  return false
}

// 압축 폭탄 방어 (ZIP 엔트리 수 검사)
export function validateZipStructure(buffer: Buffer): boolean {
  try {
    // .xlsx는 ZIP 기반이므로 ZIP 헤더 검사
    if (buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4B, 0x03, 0x04]))) {
      // 간단한 ZIP 엔트리 수 검사 (중앙 디렉토리 헤더 개수)
      let entryCount = 0
      let offset = 0
      
      // 중앙 디렉토리 시그니처 찾기 (0x02014B50)
      while (offset < buffer.length - 4) {
        if (buffer.subarray(offset, offset + 4).equals(Buffer.from([0x50, 0x4B, 0x01, 0x02]))) {
          entryCount++
          if (entryCount > 1000) { // 최대 1000개 엔트리 허용
            console.log(`🔥 압축 폭탄 감지: ${entryCount}개 엔트리`)
            return false
          }
        }
        offset++
      }
    }
    
    return true
  } catch (error) {
    console.log('🔥 ZIP 구조 검증 실패:', error)
    return false
  }
}

// 종합 보안 검증
export function validateExcelSecurity(buffer: Buffer, data?: any[][]): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  // 1. 파일 크기 검증
  if (!validateFileSize(buffer)) {
    errors.push(`파일 크기가 너무 큽니다 (${buffer.length} bytes > ${EXCEL_SECURITY_CONFIG.MAX_FILE_SIZE} bytes)`)
  }
  
  // 2. 매직바이트 검증
  if (!validateExcelMagicBytes(buffer)) {
    errors.push('유효하지 않은 Excel 파일 형식입니다')
  }
  
  // 3. ZIP 구조 검증 (.xlsx인 경우)
  if (!validateZipStructure(buffer)) {
    errors.push('압축 폭탄 공격이 감지되었습니다')
  }
  
  // 4. 데이터 크기 검증
  if (data && !validateExcelDataSize(data)) {
    errors.push(`데이터 크기가 너무 큽니다 (${data.length}행 > ${EXCEL_SECURITY_CONFIG.MAX_ROWS}행)`)
  }
  
  // 5. 매크로 탐지
  if (data && detectMacros(data)) {
    if (EXCEL_SECURITY_CONFIG.SECURITY_LEVEL === 'strict') {
      errors.push('매크로가 포함된 파일은 허용되지 않습니다')
    } else {
      warnings.push('매크로가 포함된 파일이 감지되었습니다')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// 파싱 타임아웃 래퍼
export async function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number = EXCEL_SECURITY_CONFIG.PARSE_TIMEOUT
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`파싱 타임아웃 (${timeoutMs}ms)`)), timeoutMs)
  })
  
  return Promise.race([promise, timeoutPromise])
}
