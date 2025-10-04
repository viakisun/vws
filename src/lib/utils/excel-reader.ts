import * as ExcelJS from 'exceljs'
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
    console.log('🔥 Excel 파일 보안 검증 시작...')
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
    console.error('🔥🔥🔥 Excel 파일 읽기 중 오류 발생:', error)
    throw new Error(`Excel 파일 읽기 실패: ${error.message}`)
  }
}

async function parseExcelFile(buffer: Buffer): Promise<any[][]> {
  try {
    // 먼저 xlsx 라이브러리로 .xls 파일 시도
    console.log('🔥 xlsx 라이브러리로 .xls 파일 읽기 시도...')
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

    console.log(`🔥 xlsx 라이브러리로 성공적으로 읽음: ${jsonData.length}행`)

    // 🔒 3단계: 데이터 크기 재검증
    const securityCheck = validateExcelSecurity(buffer, jsonData as any[][])
    if (!securityCheck.isValid) {
      throw new Error(`데이터 크기 검증 실패: ${securityCheck.errors.join(', ')}`)
    }

    // 🔒 4단계: 수식 무력화
    const sanitizedData = sanitizeExcelData(jsonData as any[][])

    return sanitizedData as any[][]
  } catch (xlsxError: any) {
    console.log('🔥 xlsx 라이브러리 실패, exceljs로 .xlsx 시도:', xlsxError.message)

    try {
      // exceljs로 .xlsx 파일 시도
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer as any)

      const worksheet = workbook.worksheets[0]
      if (!worksheet) {
        throw new Error('워크시트를 찾을 수 없습니다.')
      }

      // 시트를 2D 배열로 변환
      const rawData: any[][] = []
      worksheet.eachRow((row, rowNumber) => {
        const rowData: any[] = []
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          // 셀 값을 원본 형태로 가져오기
          if (cell.value === null || cell.value === undefined) {
            rowData[colNumber - 1] = ''
          } else if (typeof cell.value === 'object' && 'text' in cell.value) {
            // Rich text인 경우
            rowData[colNumber - 1] = cell.value.text
          } else {
            rowData[colNumber - 1] = cell.value
          }
        })
        rawData.push(rowData)
      })

      console.log(`🔥 exceljs로 성공적으로 읽음: ${rawData.length}행`)

      // 🔒 데이터 크기 재검증 및 수식 무력화
      const securityCheck = validateExcelSecurity(buffer, rawData)
      if (!securityCheck.isValid) {
        throw new Error(`데이터 크기 검증 실패: ${securityCheck.errors.join(', ')}`)
      }

      const sanitizedData = sanitizeExcelData(rawData)
      return sanitizedData
    } catch (exceljsError: any) {
      console.log('🔥 exceljs도 실패, CSV 형식으로 시도:', exceljsError.message)

      // 마지막으로 CSV/TSV 형식으로 시도
      const textContent = buffer.toString('utf-8')
      const lines = textContent
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      if (lines.length === 0) {
        throw new Error('파일 내용이 비어있습니다.')
      }

      // 구분자 자동 감지 (탭, 쉼표, 공백)
      let delimiter = ','
      if (lines[0].includes('\t')) {
        delimiter = '\t'
      } else if (lines[0].includes(' ')) {
        // 공백으로 구분된 경우 (여러 공백을 하나의 구분자로 처리)
        delimiter = ' '
      }

      const csvData = lines.map((line) => {
        if (delimiter === ' ') {
          return line.split(/\s+/).map((cell) => cell.trim())
        }
        return line.split(delimiter).map((cell) => cell.trim())
      })

      console.log(`🔥 CSV 형식으로 읽음: ${csvData.length}행`)

      // 🔒 CSV 데이터도 보안 검증 및 수식 무력화
      const securityCheck = validateExcelSecurity(buffer, csvData)
      if (!securityCheck.isValid) {
        throw new Error(`CSV 데이터 크기 검증 실패: ${securityCheck.errors.join(', ')}`)
      }

      const sanitizedData = sanitizeExcelData(csvData)
      return sanitizedData
    }
  }
}
