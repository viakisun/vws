import { BankCode, BankCodeUtils } from '$lib/types/bank-codes'
import { toUTC } from '$lib/utils/date-handler'
import { readExcelFile } from '$lib/utils/excel-reader'
import type { BankStatementParseResult, ParsedTransaction } from './types'
import { logger } from '$lib/utils/logger'

// 거래 내역 인터페이스 (하나은행 전용)
interface Transaction {
  no: string
  dateTime: string
  description: string
  requester: string
  deposit: number
  withdrawal: number
  balance: number
  type: string
  branch: string
  note: string
}

/**
 * 엑셀 파일에서 거래 내역 파싱
 * @param fileContent 엑셀 파일 바이너리 데이터
 * @returns Transaction 배열
 */
async function parseHanaBankExcel(fileContent: string): Promise<Transaction[]> {
  try {
    logger.info('🔥 하나은행 엑셀 파일 크기:', fileContent.length, 'bytes')

    // 공통 Excel 파일 읽기 함수 사용
    const rawData = await readExcelFile(fileContent)

    logger.info('🔥🔥🔥 === 하나은행 날짜 필드 디버깅 === 🔥🔥🔥')
    logger.info('🔥 총 행 수:', rawData.length)

    // 헤더 행 확인
    if (rawData.length > 0) {
      logger.info('🔥 헤더 행:', rawData[0])
    }

    // 처음 3개 데이터 행의 모든 필드 확인
    for (let i = 1; i < Math.min(4, rawData.length); i++) {
      const row = rawData[i]
      if (row) {
        logger.info(`행 ${i} 전체 필드:`)
        for (let j = 0; j < Math.min(10, row.length); j++) {
          logger.info(`  [${j}]: "${row[j]}" (${typeof row[j]})`)
        }
        logger.info('---')
      }
    }

    // 거래 내역 파싱
    return parseTransactions(rawData)
  } catch (error) {
    logger.error('엑셀 파싱 오류:', error)
    return []
  }
}

/**
 * 2D 배열 데이터에서 거래 내역 추출
 */
function parseTransactions(rawData: any[][]): Transaction[] {
  const transactions: Transaction[] = []
  let parsedCount = 0
  let skippedCount = 0

  logger.info('🔥🔥🔥 === 하나은행 파싱 시작 === 🔥🔥🔥')
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
          logger.info(`🔥 하나은행 파싱 성공 (행 ${i}):`, {
            no: transaction.no,
            dateTime: transaction.dateTime,
            description: transaction.description,
            deposit: transaction.deposit,
            withdrawal: transaction.withdrawal,
            balance: transaction.balance,
          })
        }
      } else {
        skippedCount++
        if (skippedCount <= 10) {
          logger.info(`🔥 하나은행 행 ${i} 건너뛰기: 형식 불일치 - ${row.slice(0, 3).join('|')}`)
        }
      }
    } catch (error) {
      skippedCount++
      if (skippedCount <= 10) {
        logger.warn(`🔥 하나은행 행 ${i} 파싱 실패:`, error)
      }
    }
  }

  logger.info(
    `🔥🔥🔥 하나은행 파싱 완료: 성공 ${parsedCount}건, 건너뛴 행 ${skippedCount}건 🔥🔥🔥`,
  )
  return transactions
}

/**
 * 한 행을 Transaction 객체로 변환
 */
function parseRow(row: any[], rowIndex: number = 0): Transaction | null {
  // 하나은행 거래 데이터 형식 검증
  // 유효한 거래 데이터인지 확인하는 여러 조건들을 체크

  // 1. 최소 필드 수 확인 (하나은행은 최소 6개 필드 필요)
  if (row.length < 6) {
    return null
  }

  // 2. 헤더 행이나 메타데이터 행 건너뛰기
  const firstCell = String(row[0] || '').trim()
  if (
    firstCell.includes('거래일시') ||
    firstCell.includes('No') ||
    firstCell.includes('계좌번호') ||
    firstCell === ''
  ) {
    return null
  }

  // 3. 날짜 형식 검증 (YYYY/MM/DD 또는 YYYY-MM-DD 형식)
  const dateTime = firstCell
  if (!dateTime || dateTime === 'undefined' || dateTime === 'null') {
    return null
  }

  // 날짜 형식이 올바른지 간단히 확인 (숫자와 / 또는 - 포함)
  if (!/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(dateTime)) {
    return null
  }

  // 4. 금액 필드 검증 (입금 또는 출금 중 하나는 있어야 함)
  const deposit = parseAmount(row[3])
  const withdrawal = parseAmount(row[4])

  if (deposit === 0 && withdrawal === 0) {
    return null // 입금도 출금도 없으면 유효하지 않은 거래
  }

  // 5. 유효한 거래 데이터로 판단되면 파싱
  return {
    no: String(rowIndex + 1), // 행 번호를 No로 사용
    dateTime,
    description: String(row[1] || '').trim(), // 적요
    requester: String(row[2] || '').trim(), // 의뢰인/수취인
    deposit,
    withdrawal,
    balance: parseAmount(row[5]), // 거래후잔액
    type: String(row[6] || '').trim(), // 구분
    branch: String(row[7] || '').trim(), // 거래점
    note: String(row[8] || '').trim(), // 비고
  }
}

/**
 * 금액 문자열을 숫자로 변환
 */
function parseAmount(value: any): number {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  // 이미 숫자인 경우
  if (typeof value === 'number') {
    return value
  }

  // 문자열인 경우 쉼표 제거하고 파싱
  const cleaned = String(value).replace(/,/g, '').trim()
  const num = parseFloat(cleaned)

  return isNaN(num) ? 0 : num
}

/**
 * 하나은행 거래내역 파싱 (엑셀 파일)
 */
export async function parseHanaBankStatement(content: string): Promise<BankStatementParseResult> {
  logger.info('🔥🔥🔥 === parseHanaBankStatement 시작 === 🔥🔥🔥')
  logger.info('🔥 content 길이:', content.length)

  const transactions: ParsedTransaction[] = []
  const errors: string[] = []

  try {
    logger.info('🔥 엑셀 파싱 시작...')
    // 엑셀 파싱
    const excelTransactions = await parseHanaBankExcel(content)
    logger.info('🔥🔥🔥 엑셀 파싱 완료, 거래 수:', excelTransactions.length, '🔥🔥🔥')

    for (const tx of excelTransactions) {
      try {
        // 날짜 검증 및 변환
        if (!tx.dateTime || tx.dateTime.trim() === '' || tx.dateTime === 'undefined') {
          logger.warn(`🔥 거래 건너뛰기: 날짜가 비어있음 (원본: "${tx.dateTime}")`)
          continue // 날짜가 없으면 이 거래는 건너뛰기
        }

        let transactionDate: string
        try {
          transactionDate = toUTC(tx.dateTime)
          logger.info(`🔥 날짜 변환 성공: "${tx.dateTime}" -> "${transactionDate}"`)
        } catch (error) {
          logger.warn(`🔥 거래 건너뛰기: 날짜 변환 실패 (원본: "${tx.dateTime}", 오류: ${error})`)
          continue // 날짜 변환 실패시 이 거래는 건너뛰기
        }

        // 카테고리 코드 결정 (거래 설명 기반)
        let categoryCode: string = '기타지출'
        if (tx.deposit > 0) {
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
          counterparty: tx.requester || tx.description,
          deposits: tx.deposit > 0 ? tx.deposit : undefined,
          withdrawals: tx.withdrawal > 0 ? tx.withdrawal : undefined,
          balance: tx.balance,
          bankCode: BankCode.HANA,
          categoryCode,
        }

        transactions.push(parsedTransaction)
      } catch (e: any) {
        errors.push(`거래 ${tx.no} 파싱 오류: ${e.message}`)
      }
    }
  } catch (e: any) {
    errors.push(`파일 파싱 오류: ${e.message}`)
  }

  return {
    bankCode: BankCode.HANA,
    bankName: BankCodeUtils.getBankName(BankCode.HANA),
    accountNumber: 'unknown',
    transactions,
    errors,
  }
}

/**
 * 통계 계산
 */
export function calculateStatistics(transactions: Transaction[]) {
  const totalDeposit = transactions.reduce((sum, t) => sum + t.deposit, 0)
  const totalWithdrawal = transactions.reduce((sum, t) => sum + t.withdrawal, 0)
  const finalBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance : 0

  return {
    totalDeposit,
    totalWithdrawal,
    netChange: totalDeposit - totalWithdrawal,
    finalBalance,
    transactionCount: transactions.length,
  }
}

/**
 * 월별 통계 계산
 */
export function getMonthlyStatistics(transactions: Transaction[]) {
  const monthlyData = new Map<
    string,
    {
      deposit: number
      withdrawal: number
      count: number
    }
  >()

  transactions.forEach((t) => {
    if (!t.dateTime) return

    // YYYY-MM 형식으로 월 추출
    const month = t.dateTime.substring(0, 7)

    if (!monthlyData.has(month)) {
      monthlyData.set(month, { deposit: 0, withdrawal: 0, count: 0 })
    }

    const stats = monthlyData.get(month)!
    stats.deposit += t.deposit
    stats.withdrawal += t.withdrawal
    stats.count += 1
  })

  return Array.from(monthlyData.entries()).map(([month, stats]) => ({
    month,
    ...stats,
  }))
}

/**
 * 거래 유형별 통계
 */
export function getTransactionTypeStatistics(transactions: Transaction[]) {
  const typeData = new Map<
    string,
    {
      deposit: number
      withdrawal: number
      count: number
    }
  >()

  transactions.forEach((t) => {
    const type = t.type || '기타'

    if (!typeData.has(type)) {
      typeData.set(type, { deposit: 0, withdrawal: 0, count: 0 })
    }

    const stats = typeData.get(type)!
    stats.deposit += t.deposit
    stats.withdrawal += t.withdrawal
    stats.count += 1
  })

  return Array.from(typeData.entries())
    .map(([type, stats]) => ({
      type,
      ...stats,
    }))
    .sort((a, b) => b.deposit + b.withdrawal - (a.deposit + a.withdrawal))
}
