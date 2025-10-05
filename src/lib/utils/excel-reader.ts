import * as XLSX from 'xlsx'
import type { WorkBook, ParsingOptions } from 'xlsx'
import { sanitizeExcelData, validateExcelSecurity, withTimeout } from './security/excel-security'
import { logger } from './logger'

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Excel 셀 데이터 타입 (문자열, 숫자, 날짜, 불린 등)
 */
export type ExcelCellValue = string | number | Date | boolean | null

/**
 * Excel 시트 데이터 (2차원 배열)
 */
export type ExcelSheetData = ExcelCellValue[][]

/**
 * Excel 파일 읽기 결과
 */
export interface ExcelReadResult {
  /** 파싱된 데이터 */
  data: ExcelSheetData
  /** 읽은 시트 이름 */
  sheetName: string
  /** 데이터 행 수 */
  rowCount: number
  /** 데이터 열 수 */
  columnCount: number
}

/**
 * Excel 보안 검증 결과
 */
interface SecurityValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Excel 파일 파싱 설정 (보안 강화)
 */
const EXCEL_PARSE_OPTIONS: ParsingOptions = {
  type: 'buffer',
  cellDates: true,
  raw: false,
  cellFormula: false, // 🔒 수식 비활성화 (보안)
  cellStyles: false, // 🔒 스타일 비활성화 (성능)
  bookProps: false, // 🔒 문서 속성 비활성화 (보안)
  bookSheets: false, // 🔒 시트 정보 최소화 (성능)
} as const

/**
 * Excel 시트를 JSON으로 변환할 때 설정
 */
const SHEET_TO_JSON_OPTIONS = {
  header: 1,
  defval: '',
} as const

/**
 * 에러 메시지 상수
 */
const ERROR_MESSAGES = {
  SECURITY_VALIDATION_FAILED: '보안 검증 실패',
  SIZE_VALIDATION_FAILED: '데이터 크기 검증 실패',
  NO_WORKSHEET_FOUND: '워크시트를 찾을 수 없습니다',
  PARSE_FAILED: 'Excel 파일 파싱 실패',
  READ_FAILED: 'Excel 파일 읽기 실패',
} as const

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 보안 검증 수행 및 에러 처리
 * @param buffer - Excel 파일 버퍼
 * @param data - 파싱된 데이터 (선택사항)
 * @throws {Error} 보안 검증 실패 시
 */
function performSecurityValidation(buffer: Buffer, data?: ExcelSheetData): void {
  const securityCheck: SecurityValidationResult = validateExcelSecurity(buffer, data as any[][])

  if (!securityCheck.isValid) {
    const errorMessage = `${ERROR_MESSAGES.SECURITY_VALIDATION_FAILED}: ${securityCheck.errors.join(', ')}`
    logger.error('Excel 보안 검증 실패', { errors: securityCheck.errors })
    throw new Error(errorMessage)
  }

  if (securityCheck.warnings.length > 0) {
    logger.warn('Excel 보안 경고', { warnings: securityCheck.warnings })
  }
}

/**
 * 워크북에서 첫 번째 시트 이름 추출
 * @param workbook - Excel 워크북
 * @returns 시트 이름
 * @throws {Error} 시트가 없을 경우
 */
function getFirstSheetName(workbook: WorkBook): string {
  const sheetName = workbook.SheetNames[0]

  if (!sheetName) {
    logger.error('Excel 시트 없음', { sheetNames: workbook.SheetNames })
    throw new Error(ERROR_MESSAGES.NO_WORKSHEET_FOUND)
  }

  return sheetName
}

/**
 * 워크시트를 2차원 배열로 변환
 * @param workbook - Excel 워크북
 * @param sheetName - 시트 이름
 * @returns 2차원 배열 데이터
 */
function convertSheetToArray(workbook: WorkBook, sheetName: string): ExcelSheetData {
  const worksheet = workbook.Sheets[sheetName]
  const jsonData = XLSX.utils.sheet_to_json(worksheet, SHEET_TO_JSON_OPTIONS)
  return jsonData as ExcelSheetData
}

/**
 * 데이터의 행/열 개수 계산
 * @param data - 2차원 배열 데이터
 * @returns 행/열 개수
 */
function calculateDataDimensions(data: ExcelSheetData): {
  rowCount: number
  columnCount: number
} {
  const rowCount = data.length
  const columnCount = rowCount > 0 ? Math.max(...data.map((row) => row.length)) : 0

  return { rowCount, columnCount }
}

/**
 * Excel 파일 파싱 (내부 함수)
 * @param buffer - Excel 파일 버퍼
 * @returns 파싱된 데이터
 * @throws {Error} 파싱 실패 시
 */
function parseExcelFileSync(buffer: Buffer): ExcelSheetData {
  try {
    // 워크북 읽기
    const workbook: WorkBook = XLSX.read(buffer, EXCEL_PARSE_OPTIONS)

    // 첫 번째 시트 가져오기
    const sheetName = getFirstSheetName(workbook)

    // 시트 데이터를 배열로 변환
    const jsonData = convertSheetToArray(workbook, sheetName)

    // 🔒 3단계: 데이터 크기 재검증
    performSecurityValidation(buffer, jsonData)

    // 🔒 4단계: 수식 무력화 및 데이터 정제
    const sanitizedData = sanitizeExcelData(jsonData as any[][])

    logger.info('Excel 파일 파싱 성공', {
      sheetName,
      rowCount: sanitizedData.length,
      columnCount: sanitizedData[0]?.length || 0,
    })

    return sanitizedData as ExcelSheetData
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('Excel 파일 파싱 실패', { error: errorMessage })
    throw new Error(`${ERROR_MESSAGES.PARSE_FAILED}: ${errorMessage}`)
  }
}

/**
 * Excel 파일 파싱 (비동기 래퍼)
 * @param buffer - Excel 파일 버퍼
 * @returns 파싱된 데이터
 */
function parseExcelFile(buffer: Buffer): Promise<ExcelSheetData> {
  return Promise.resolve(parseExcelFileSync(buffer))
}

// ============================================================================
// Public API
// ============================================================================

/**
 * 안전한 Excel 파일 읽기 함수 (보안 검증 포함)
 *
 * 이 함수는 다음 보안 단계를 거칩니다:
 * 1. 파일 크기 및 구조 검증
 * 2. 타임아웃을 통한 파싱 시간 제한
 * 3. 수식 비활성화 및 데이터 정제
 * 4. 데이터 크기 재검증
 *
 * @param fileContent - Excel 파일의 바이너리 데이터 (binary string)
 * @returns 2D 배열 (행별 셀 데이터)
 * @throws {Error} 보안 검증 실패 또는 파싱 오류 시
 *
 * @example
 * ```typescript
 * const binaryData = await file.text()
 * const data = await readExcelFile(binaryData)
 * console.log(data[0]) // 첫 번째 행 출력
 * ```
 */
export async function readExcelFile(fileContent: string): Promise<ExcelSheetData> {
  try {
    // 바이너리 문자열을 Buffer로 변환
    const buffer = Buffer.from(fileContent, 'binary')

    // 🔒 1단계: 보안 검증 (파일 크기, 구조 등)
    performSecurityValidation(buffer)

    // 🔒 2단계: 타임아웃과 함께 파싱 실행 (DoS 방지)
    const data: ExcelSheetData = await withTimeout(parseExcelFile(buffer))

    return data
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('Excel 파일 읽기 실패', { error: errorMessage })
    throw new Error(`${ERROR_MESSAGES.READ_FAILED}: ${errorMessage}`)
  }
}

/**
 * Excel 파일 읽기 (상세 정보 포함)
 *
 * readExcelFile과 동일하지만 추가 메타데이터를 반환합니다.
 *
 * @param fileContent - Excel 파일의 바이너리 데이터
 * @returns Excel 파일 읽기 결과 (데이터 + 메타정보)
 * @throws {Error} 보안 검증 실패 또는 파싱 오류 시
 *
 * @example
 * ```typescript
 * const result = await readExcelFileWithMetadata(binaryData)
 * console.log(`시트: ${result.sheetName}, 행: ${result.rowCount}`)
 * ```
 */
export async function readExcelFileWithMetadata(fileContent: string): Promise<ExcelReadResult> {
  try {
    const buffer = Buffer.from(fileContent, 'binary')

    // 보안 검증
    performSecurityValidation(buffer)

    // 워크북 읽기 (시트명 추출용)
    const workbook: WorkBook = XLSX.read(buffer, EXCEL_PARSE_OPTIONS)
    const sheetName = getFirstSheetName(workbook)

    // 데이터 파싱
    const data: ExcelSheetData = await withTimeout(parseExcelFile(buffer))

    // 메타데이터 계산
    const { rowCount, columnCount } = calculateDataDimensions(data)

    logger.info('Excel 파일 메타데이터 포함 읽기 성공', {
      sheetName,
      rowCount,
      columnCount,
    })

    return {
      data,
      sheetName,
      rowCount,
      columnCount,
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('Excel 파일 메타데이터 읽기 실패', { error: errorMessage })
    throw new Error(`${ERROR_MESSAGES.READ_FAILED}: ${errorMessage}`)
  }
}
