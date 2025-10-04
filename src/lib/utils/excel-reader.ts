import * as XLSX from 'xlsx'
import { sanitizeExcelData, validateExcelSecurity, withTimeout } from './security/excel-security'

/**
 * 안전한 Excel 파일 읽기 함수 (보안 검증 포함)
 * @param fileContent Excel 파일의 바이너리 데이터
 * @returns 2D 배열 (행별 셀 데이터)
 */
export async function readExcelFile(fileContent: string): Promise<any[][]> {
  try {
    const buffer = Buffer.from(fileContent, 'binary')

    // 🔒 1단계: 보안 검증
    const securityCheck = validateExcelSecurity(buffer)

    if (!securityCheck.isValid) {
      throw new Error(`보안 검증 실패: ${securityCheck.errors.join(', ')}`)
    }

    if (securityCheck.warnings.length > 0) {
      console.warn('🔥 보안 경고:', securityCheck.warnings.join(', '))
    }

    // 🔒 2단계: 타임아웃과 함께 파싱 실행
    return await withTimeout(parseExcelFile(buffer))
  } catch (error: any) {
    throw new Error(`Excel 파일 읽기 실패: ${error.message}`)
  }
}

async function parseExcelFile(buffer: Buffer): Promise<any[][]> {
  try {
    // xlsx 라이브러리로 Excel 파일 읽기 시도
    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellDates: true,
      raw: false,
      cellFormula: false, // 🔒 수식 비활성화
      cellStyles: false, // 🔒 스타일 비활성화
      bookProps: false, // 🔒 문서 속성 비활성화
      bookSheets: false, // 🔒 시트 정보 최소화
    })
    const sheetName = workbook.SheetNames[0]

    if (!sheetName) {
      throw new Error('워크시트를 찾을 수 없습니다.')
    }

    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

    // 🔒 3단계: 데이터 크기 재검증
    const securityCheck = validateExcelSecurity(buffer, jsonData as any[][])
    if (!securityCheck.isValid) {
      throw new Error(`데이터 크기 검증 실패: ${securityCheck.errors.join(', ')}`)
    }

    // 🔒 4단계: 수식 무력화
    const sanitizedData = sanitizeExcelData(jsonData as any[][])

    return sanitizedData as any[][]
  } catch (xlsxError: any) {
    throw new Error(`Excel 파일 읽기 실패: ${xlsxError.message}`)
  }
}
