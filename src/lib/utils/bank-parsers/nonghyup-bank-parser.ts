import { BankCode, BankCodeUtils } from '$lib/types/bank-codes'
import { toUTC } from '$lib/utils/date-handler'
import { readExcelFile } from '$lib/utils/excel-reader'
import type { BankStatementParseResult, ParsedTransaction } from './types'
import { logger } from '$lib/utils/logger'

// 거래 내역 인터페이스 (농협은행 전용)
interface NonghyupTransaction {
  id: string // 번호
  transactionDate: string // 거래일시
  withdrawalAmount: number // 출금금액
  depositAmount: number // 입금금액
  balance: number // 거래후잔액
  description: string // 거래내용
  counterparty: string // 거래기록사항
  branch: string // 거래점
  transactionTime: string // 거래시간
  transferMemo: string // 이체메모
}

/**
 * Excel 파일에서 농협은행 거래 내역 파싱
 * @param fileContent Excel 파일 바이너리 데이터
 * @returns NonghyupTransaction 배열
 */
async function parseNonghyupBankExcel(fileContent: string): Promise<NonghyupTransaction[]> {
  try {
    logger.info('🔥 농협 Excel 파일 크기:', fileContent.length, 'bytes')

    // Excel 파일 읽기
    const rawData = await readExcelFile(fileContent)
    logger.info('🔥 총 행 수:', rawData.length)

    // 처음 3개 행 확인
    for (let i = 0; i < Math.min(3, rawData.length); i++) {
      const row = rawData[i]
      if (row) {
        logger.info(`🔥 행 ${i}: ${row.slice(0, 5).join('|')}`)
      }
    }

    // 거래 내역 파싱
    return parseTransactions(rawData)
  } catch (error) {
    logger.error('농협 Excel 파싱 오류:', error)
    return []
  }
}

/**
 * Excel 행 데이터에서 거래 내역 추출
 */
function parseTransactions(rawData: any[][]): NonghyupTransaction[] {
  const transactions: NonghyupTransaction[] = []
  let parsedCount = 0
  let skippedCount = 0

  logger.info('🔥🔥🔥 === 농협은행 파싱 시작 === 🔥🔥🔥')
  logger.info('🔥 총 행 수:', rawData.length)

  // 모든 행을 순회하면서 유효한 거래 데이터 찾기
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i]

    // 빈 행 건너뛰기
    if (!row || row.length === 0) {
      continue
    }

    try {
      const transaction = parseRow(row, i)
      if (transaction) {
        transactions.push(transaction)
        parsedCount++
        if (parsedCount <= 5) {
          logger.info(`🔥 농협은행 파싱 성공 (행 ${i}):`, {
            id: transaction.id,
            transactionDate: transaction.transactionDate,
            description: transaction.description,
            depositAmount: transaction.depositAmount,
            withdrawalAmount: transaction.withdrawalAmount,
            balance: transaction.balance,
          })
        }
      } else {
        skippedCount++
        if (skippedCount <= 10) {
          logger.info(`🔥 농협은행 행 ${i} 건너뛰기: 형식 불일치 - ${row.slice(0, 3).join('|')}`)
        }
      }
    } catch (error) {
      skippedCount++
      if (skippedCount <= 10) {
        logger.warn(`🔥 농협은행 행 ${i} 파싱 실패:`, error)
      }
    }
  }

  logger.info(
    `🔥🔥🔥 농협은행 파싱 완료: 성공 ${parsedCount}건, 건너뛴 행 ${skippedCount}건 🔥🔥🔥`,
  )
  return transactions
}

/**
 * 한 행을 NonghyupTransaction 객체로 변환
 * Excel 형식: 번호,거래일시,출금금액,입금금액,거래후잔액,거래내용,거래기록사항,거래점,거래시간,이체메모
 */
function parseRow(row: any[], rowIndex: number = 0): NonghyupTransaction | null {
  // 농협은행 거래 데이터 형식 검증

  // 1. 최소 필드 수 확인 (농협은 최소 6개 필드 필요)
  if (row.length < 6) {
    return null
  }

  // 2. 헤더 행이나 메타데이터 행 건너뛰기
  const firstField = String(row[0] || '').trim()
  if (
    firstField.includes('번호') ||
    firstField.includes('거래일시') ||
    firstField.includes('계좌번호') ||
    firstField === ''
  ) {
    return null
  }

  // 3. 거래일시 필드 검증 (row[1])
  const transactionDate = String(row[1] || '').trim()
  if (!transactionDate || transactionDate === 'undefined' || transactionDate === 'null') {
    return null
  }

  // 날짜 형식이 올바른지 간단히 확인 (숫자와 / 또는 - 포함)
  if (!/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(transactionDate)) {
    return null
  }

  // 4. 금액 필드 검증 (입금 또는 출금 중 하나는 있어야 함)
  const depositAmount = parseAmount(row[3])
  const withdrawalAmount = parseAmount(row[2])

  if (depositAmount === 0 && withdrawalAmount === 0) {
    return null // 입금도 출금도 없으면 유효하지 않은 거래
  }

  // 5. 유효한 거래 데이터로 판단되면 파싱
  return {
    id: String(row[0] || ''), // 번호
    transactionDate, // 거래일시
    withdrawalAmount, // 출금금액
    depositAmount, // 입금금액
    balance: parseAmount(row[4]), // 거래후잔액
    description: String(row[5] || '').trim(), // 거래내용
    counterparty: String(row[6] || '').trim(), // 거래기록사항
    branch: String(row[7] || '').trim(), // 거래점
    transactionTime: String(row[8] || '').trim(), // 거래시간
    transferMemo: String(row[9] || '').trim(), // 이체메모
  }
}

/**
 * 금액 문자열을 정수로 변환 (소수점 제거)
 */
function parseAmount(value: any): number {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  // 이미 숫자인 경우
  if (typeof value === 'number') {
    return Math.round(value)
  }

  // 문자열인 경우 쉼표 제거하고 파싱
  const cleaned = String(value).replace(/,/g, '').trim()
  const num = parseFloat(cleaned)

  return isNaN(num) ? 0 : Math.round(num)
}

/**
 * 농협은행 거래내역 파싱 (CSV 파일)
 */
export async function parseNonghyupBankStatement(
  content: string,
): Promise<BankStatementParseResult> {
  logger.info('🔥🔥🔥 === parseNonghyupBankStatement 시작 === 🔥🔥🔥')
  logger.info('🔥 content 길이:', content.length)

  const transactions: ParsedTransaction[] = []
  const errors: string[] = []

  try {
    logger.info('🔥 농협 Excel 파싱 시작...')
    // Excel 파싱
    const csvTransactions = await parseNonghyupBankExcel(content)
    logger.info('🔥🔥🔥 농협 Excel 파싱 완료, 거래 수:', csvTransactions.length, '🔥🔥🔥')

    for (const tx of csvTransactions) {
      try {
        // 날짜 검증 및 변환
        if (
          !tx.transactionDate ||
          tx.transactionDate.trim() === '' ||
          tx.transactionDate === 'undefined'
        ) {
          logger.warn(`🔥 농협 거래 건너뛰기: 날짜가 비어있음 (원본: "${tx.transactionDate}")`)
          continue // 날짜가 없으면 이 거래는 건너뛰기
        }

        let transactionDate: string
        try {
          // 농협은 거래일자와 거래시간이 분리되어 있음 - 결합 필요
          const normalizedDate = tx.transactionDate.replace(/\//g, '-')
          const timePart = tx.transactionTime || '00:00:00'
          const combinedDateTime = `${normalizedDate} ${timePart}`
          transactionDate = toUTC(combinedDateTime)
          logger.info(`🔥 농협 날짜+시간 변환 성공: "${combinedDateTime}" -> "${transactionDate}"`)
        } catch (error) {
          logger.warn(
            `🔥 농협 거래 건너뛰기: 날짜 변환 실패 (원본: "${tx.transactionDate}", 오류: ${error})`,
          )
          continue // 날짜 변환 실패시 이 거래는 건너뛰기
        }

        // 카테고리 코드 결정 (거래 설명 기반)
        let categoryCode: string = '기타지출'
        if (tx.depositAmount > 0) {
          categoryCode = '기타수입'
        } else if (tx.description.includes('급여') || tx.description.includes('임금')) {
          categoryCode = '급여'
        } else if (tx.description.includes('임대') || tx.description.includes('월세')) {
          categoryCode = '임대료'
        } else if (
          tx.description.includes('전기') ||
          tx.description.includes('가스') ||
          tx.description.includes('수도')
        ) {
          categoryCode = '공과금'
        } else if (tx.description.includes('광고') || tx.description.includes('마케팅')) {
          categoryCode = '마케팅'
        } else if (tx.description.includes('이체') || tx.description.includes('송금')) {
          categoryCode = '계좌이체'
        }

        const parsedTransaction: ParsedTransaction = {
          transactionDate,
          description: tx.description || '거래내역',
          counterparty: tx.counterparty || tx.description,
          deposits: tx.depositAmount > 0 ? tx.depositAmount : undefined,
          withdrawals: tx.withdrawalAmount > 0 ? tx.withdrawalAmount : undefined,
          balance: tx.balance,
          bankCode: BankCode.NONGHYUP,
          categoryCode,
        }

        transactions.push(parsedTransaction)
      } catch (e: any) {
        errors.push(`농협 거래 ${tx.id} 파싱 오류: ${e.message}`)
      }
    }
  } catch (e: any) {
    errors.push(`농협 파일 파싱 오류: ${e.message}`)
  }

  return {
    bankCode: BankCode.NONGHYUP,
    bankName: BankCodeUtils.getBankName(BankCode.NONGHYUP),
    accountNumber: 'unknown',
    transactions,
    errors,
  }
}
