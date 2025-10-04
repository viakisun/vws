import { BankCode, BankCodeUtils } from '$lib/types/bank-codes'
import { toUTC } from '$lib/utils/date-handler'
import * as XLSX from 'xlsx'
import type { BankStatementParseResult, ParsedTransaction } from './types'

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
function parseHanaBankExcel(fileContent: string): Transaction[] {
  try {
    console.log('🔥 엑셀 파일 크기:', fileContent.length, 'bytes')

    const workbook = XLSX.read(fileContent, {
      type: 'binary',
      cellDates: false, // 날짜를 문자열로 읽기
      cellNF: false,
      cellStyles: false,
      raw: true, // 원본 값 그대로 읽기
    })

    console.log('🔥 워크북 시트 이름들:', workbook.SheetNames)

    // 첫 번째 시트 가져오기
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // 시트를 2D 배열로 변환 (원본 값 그대로)
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: true, // 원본 값 그대로 읽기
      defval: '', // 빈 셀에 대한 기본값
    })

    console.log('🔥🔥🔥 === 날짜 필드 디버깅 === 🔥🔥🔥')
    console.log('🔥 총 행 수:', rawData.length)

    // 헤더 행 확인
    console.log('🔥 헤더 행:', rawData[0])

    // 처음 3개 데이터 행의 모든 필드 확인
    for (let i = 1; i < Math.min(4, rawData.length); i++) {
      const row = rawData[i]
      if (row) {
        console.log(`행 ${i} 전체 필드:`)
        for (let j = 0; j < Math.min(10, row.length); j++) {
          console.log(`  [${j}]: "${row[j]}" (${typeof row[j]})`)
        }
        console.log('---')
      }
    }

    // 거래 내역 파싱
    return parseTransactions(rawData)
  } catch (error) {
    console.error('엑셀 파싱 오류:', error)
    return []
  }
}

/**
 * 2D 배열 데이터에서 거래 내역 추출
 */
function parseTransactions(rawData: any[][]): Transaction[] {
  const transactions: Transaction[] = []

  // 헤더 행 찾기 (더 유연하게)
  let headerRowIndex = -1
  console.log('🔥 헤더 행 찾기 시작...')

  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const row = rawData[i]
    if (row) {
      const rowStr = row.join('|')
      console.log(`🔥 행 ${i}: ${rowStr}`)

      // 거래일시가 포함된 행을 헤더로 인식
      if (row.some((cell) => String(cell).includes('거래일시'))) {
        headerRowIndex = i
        console.log(`🔥🔥🔥 헤더 행 발견: ${i} 🔥🔥🔥`)
        break
      }
    }
  }

  if (headerRowIndex === -1) {
    console.log('🔥 헤더를 찾을 수 없어서 행 0부터 시작')
    headerRowIndex = -1 // 첫 번째 행부터 시작
  }

  // 헤더 다음 행부터 데이터 파싱
  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i]

    // 빈 행 또는 합계 행 건너뛰기
    if (!row || row.length === 0 || String(row[0]).includes('합')) {
      continue
    }

    // No 필드가 없으면 건너뛰기
    if (!row[0] || row[0] === '') {
      continue
    }

    try {
      const transaction = parseRow(row, i)
      if (transaction) {
        transactions.push(transaction)
      }
    } catch (error) {
      console.warn(`행 ${i} 파싱 실패:`, error)
    }
  }

  return transactions
}

/**
 * 한 행을 Transaction 객체로 변환
 */
function parseRow(row: any[], rowIndex: number = 0): Transaction | null {
  // 최소 필드 수 확인
  if (row.length < 7) {
    console.log(`🔥 행 ${rowIndex}: 필드 수 부족 (${row.length}개)`)
    return null
  }

  // 날짜 필드 처리 (row[0]이 거래일시)
  let dateTime = ''
  if (row[0] && String(row[0]).trim() !== '' && String(row[0]).trim() !== 'undefined') {
    dateTime = String(row[0]).trim()
    console.log(`🔥 행 ${rowIndex}: 날짜 발견 - "${dateTime}" (타입: ${typeof row[0]})`)
  } else {
    console.log(`🔥 행 ${rowIndex}: 날짜 없음 - row[0]="${row[0]}" (타입: ${typeof row[0]})`)
    // 날짜가 없으면 이 행은 건너뛰기
    return null
  }

  return {
    no: '', // No 컬럼이 없으므로 빈 문자열
    dateTime,
    description: String(row[1] || ''), // 적요
    requester: String(row[2] || ''), // 의뢰인/수취인
    deposit: parseAmount(row[3]), // 입금
    withdrawal: parseAmount(row[4]), // 출금
    balance: parseAmount(row[5]), // 거래후잔액
    type: String(row[6] || ''), // 구분
    branch: String(row[7] || ''), // 거래점
    note: String(row[8] || ''), // 비고 (없으면 빈 문자열)
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
export function parseHanaBankStatement(content: string): BankStatementParseResult {
  console.log('🔥🔥🔥 === parseHanaBankStatement 시작 === 🔥🔥🔥')
  console.log('🔥 content 길이:', content.length)

  const transactions: ParsedTransaction[] = []
  const errors: string[] = []

  try {
    console.log('🔥 엑셀 파싱 시작...')
    // 엑셀 파싱
    const excelTransactions = parseHanaBankExcel(content)
    console.log('🔥🔥🔥 엑셀 파싱 완료, 거래 수:', excelTransactions.length, '🔥🔥🔥')

    for (const tx of excelTransactions) {
      try {
        // 날짜 검증 및 변환
        if (!tx.dateTime || tx.dateTime.trim() === '' || tx.dateTime === 'undefined') {
          console.warn(`🔥 거래 건너뛰기: 날짜가 비어있음 (원본: "${tx.dateTime}")`)
          continue // 날짜가 없으면 이 거래는 건너뛰기
        }

        let transactionDate: string
        try {
          transactionDate = toUTC(tx.dateTime)
          console.log(`🔥 날짜 변환 성공: "${tx.dateTime}" -> "${transactionDate}"`)
        } catch (error) {
          console.warn(`🔥 거래 건너뛰기: 날짜 변환 실패 (원본: "${tx.dateTime}", 오류: ${error})`)
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
