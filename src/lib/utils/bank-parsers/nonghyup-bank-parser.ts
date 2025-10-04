import { BankCode, BankCodeUtils } from '$lib/types/bank-codes'
import { toUTC } from '$lib/utils/date-handler'
import * as XLSX from 'xlsx'
import type { BankStatementParseResult, ParsedTransaction } from './types'

// 거래 내역 인터페이스 (농협은행 전용)
interface NonghyupTransaction {
  id: string // 구분
  transactionDate: string // 거래일자
  withdrawalAmount: number // 출금금액(원)
  depositAmount: number // 입금금액(원)
  balance: number // 거래 후 잔액(원)
  description: string // 거래내용
  counterparty: string // 거래기록사항
  branch: string // 거래점
  transactionTime: string // 거래시간
  transferMemo: string // 이체메모
}

/**
 * 엑셀 파일에서 농협은행 거래 내역 파싱
 * @param fileContent 엑셀 파일 바이너리 데이터
 * @returns NonghyupTransaction 배열
 */
function parseNonghyupBankExcel(fileContent: string): NonghyupTransaction[] {
  try {
    console.log('🔥 농협 엑셀 파일 크기:', fileContent.length, 'bytes')

    const workbook = XLSX.read(fileContent, {
      type: 'binary',
      cellDates: false, // 날짜를 문자열로 읽기
      cellNF: false,
      cellStyles: false,
      raw: true, // 원본 값 그대로 읽기
    })

    console.log('🔥 농협 워크북 시트 이름들:', workbook.SheetNames)

    // 첫 번째 시트 가져오기
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // 시트를 2D 배열로 변환 (원본 값 그대로)
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: true, // 원본 값 그대로 읽기
      defval: '', // 빈 셀에 대한 기본값
    })

    console.log('🔥🔥🔥 === 농협 날짜 필드 디버깅 === 🔥🔥🔥')
    console.log('🔥 총 행 수:', rawData.length)

    // 헤더 행 확인
    console.log('🔥 헤더 행:', rawData[0])

    // 처음 3개 데이터 행의 모든 필드 확인
    for (let i = 1; i < Math.min(4, rawData.length); i++) {
      const row = rawData[i]
      if (row) {
        console.log(`행 ${i} 전체 필드:`)
        for (let j = 0; j < Math.min(12, row.length); j++) {
          console.log(`  [${j}]: "${row[j]}" (${typeof row[j]})`)
        }
        console.log('---')
      }
    }

    // 거래 내역 파싱
    return parseTransactions(rawData)
  } catch (error) {
    console.error('농협 엑셀 파싱 오류:', error)
    return []
  }
}

/**
 * 2D 배열 데이터에서 거래 내역 추출
 */
function parseTransactions(rawData: any[][]): NonghyupTransaction[] {
  const transactions: NonghyupTransaction[] = []

  // 헤더 행 찾기
  let headerRowIndex = -1
  console.log('🔥 농협 헤더 행 찾기 시작...')

  for (let i = 0; i < Math.min(15, rawData.length); i++) {
    const row = rawData[i]
    if (row) {
      const rowStr = row.join('|')
      console.log(`🔥 행 ${i}: ${rowStr}`)

      // 농협은행 헤더 특징: "거래일자"와 "출금금액"이 포함된 행
      if (
        row.some((cell) => String(cell).includes('거래일자')) &&
        row.some((cell) => String(cell).includes('출금금액'))
      ) {
        headerRowIndex = i
        console.log(`🔥🔥🔥 농협 헤더 행 발견: ${i} 🔥🔥🔥`)
        break
      }
    }
  }

  if (headerRowIndex === -1) {
    console.log('🔥 농협 헤더를 찾을 수 없어서 행 10부터 시작 (임시)')
    headerRowIndex = 10 // 임시로 10번째 행부터 시작
  }

  // 헤더 다음 행부터 데이터 파싱
  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i]

    // 빈 행 또는 합계 행 건너뛰기
    if (
      !row ||
      row.length === 0 ||
      String(row[0]).includes('합') ||
      String(row[0]).includes('소계')
    ) {
      continue
    }

    // 구분 필드가 없으면 건너뛰기
    if (!row[0] || row[0] === '') {
      continue
    }

    try {
      const transaction = parseRow(row, i)
      if (transaction) {
        transactions.push(transaction)
      }
    } catch (error) {
      console.warn(`농협 행 ${i} 파싱 실패:`, error)
    }
  }

  return transactions
}

/**
 * 한 행을 NonghyupTransaction 객체로 변환
 * 컬럼 순서: 구분, 거래일자, 출금금액, 입금금액, 거래후잔액, 거래내용, 거래기록사항, 거래점, 거래시간, 이체메모
 */
function parseRow(row: any[], rowIndex: number = 0): NonghyupTransaction | null {
  // 최소 필드 수 확인
  if (row.length < 6) {
    console.log(`🔥 농협 행 ${rowIndex}: 필드 수 부족 (${row.length}개)`)
    return null
  }

  // 거래일자 필드 처리 (row[1])
  let transactionDate = ''
  if (row[1] && String(row[1]).trim() !== '' && String(row[1]).trim() !== 'undefined') {
    transactionDate = String(row[1]).trim()
    console.log(`🔥 농협 행 ${rowIndex}: 날짜 발견 - "${transactionDate}" (타입: ${typeof row[1]})`)
  } else {
    console.log(`🔥 농협 행 ${rowIndex}: 날짜 없음 - row[1]="${row[1]}" (타입: ${typeof row[1]})`)
    return null
  }

  return {
    id: String(row[0] || ''), // 구분
    transactionDate, // 거래일자
    withdrawalAmount: parseAmount(row[2]), // 출금금액(원)
    depositAmount: parseAmount(row[3]), // 입금금액(원)
    balance: parseAmount(row[4]), // 거래 후 잔액(원)
    description: String(row[5] || ''), // 거래내용
    counterparty: String(row[6] || ''), // 거래기록사항
    branch: String(row[7] || ''), // 거래점
    transactionTime: String(row[8] || ''), // 거래시간
    transferMemo: String(row[9] || ''), // 이체메모
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
 * 농협은행 거래내역 파싱 (엑셀 파일)
 */
export function parseNonghyupBankStatement(content: string): BankStatementParseResult {
  console.log('🔥🔥🔥 === parseNonghyupBankStatement 시작 === 🔥🔥🔥')
  console.log('🔥 content 길이:', content.length)

  const transactions: ParsedTransaction[] = []
  const errors: string[] = []

  try {
    console.log('🔥 농협 엑셀 파싱 시작...')
    // 엑셀 파싱
    const excelTransactions = parseNonghyupBankExcel(content)
    console.log('🔥🔥🔥 농협 엑셀 파싱 완료, 거래 수:', excelTransactions.length, '🔥🔥🔥')

    for (const tx of excelTransactions) {
      try {
        // 날짜 검증 및 변환
        if (
          !tx.transactionDate ||
          tx.transactionDate.trim() === '' ||
          tx.transactionDate === 'undefined'
        ) {
          console.warn(`🔥 농협 거래 건너뛰기: 날짜가 비어있음 (원본: "${tx.transactionDate}")`)
          continue // 날짜가 없으면 이 거래는 건너뛰기
        }

        let transactionDate: string
        try {
          // 농협은 날짜와 시간을 조합해야 함
          // 날짜: "YYYY/MM/DD", 시간: "HH:MM:SS"
          let dateTimeStr = tx.transactionDate

          // 시간이 있으면 조합
          if (tx.transactionTime && tx.transactionTime.trim() !== '') {
            dateTimeStr = `${tx.transactionDate} ${tx.transactionTime}`
            console.log(
              `🔥 농협 날짜+시간 조합: "${tx.transactionDate}" + "${tx.transactionTime}" = "${dateTimeStr}"`,
            )
          } else {
            // 시간이 없으면 자정으로 설정
            dateTimeStr = `${tx.transactionDate} 00:00:00`
            console.log(`🔥 농협 날짜만: "${tx.transactionDate}" -> "${dateTimeStr}"`)
          }

          // YYYY/MM/DD HH:MM:SS 형식을 YYYY-MM-DD HH:MM:SS로 변환
          const normalizedDateTime = dateTimeStr.replace(/\//g, '-')
          transactionDate = toUTC(normalizedDateTime)
          console.log(`🔥 농협 날짜 변환 성공: "${normalizedDateTime}" -> "${transactionDate}"`)
        } catch (error) {
          console.warn(
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
