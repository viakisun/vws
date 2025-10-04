import { BankCode, BankCodeUtils } from '$lib/types/bank-codes'
import { toUTC } from '$lib/utils/date-handler'
import { readExcelFile } from '$lib/utils/excel-reader'
import type { BankStatementParseResult, ParsedTransaction } from './types'

// 거래 내역 인터페이스 (전북은행 전용)
interface JeonbukTransaction {
  transactionDate: string // 거래일자
  transactionTime: string // 거래시간
  withdrawalAmount: number // 출금금액
  depositAmount: number // 입금금액
  balance: number // 거래후잔액
  description: string // 적요
  handlingBank: string // 취급은행(지점)
}

/**
 * 엑셀 파일에서 전북은행 거래 내역 파싱
 * @param fileContent 엑셀 파일 바이너리 데이터
 * @returns JeonbukTransaction 배열
 */
async function parseJeonbukBankExcel(fileContent: string): Promise<JeonbukTransaction[]> {
  try {
    console.log('🔥 전북은행 엑셀 파일 크기:', fileContent.length, 'bytes')

    // 공통 Excel 파일 읽기 함수 사용
    const rawData = await readExcelFile(fileContent)

    console.log('🔥🔥🔥 === 전북은행 날짜 필드 디버깅 === 🔥🔥🔥')
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
    console.error('전북은행 엑셀 파싱 오류:', error)
    return []
  }
}

/**
 * 2D 배열 데이터에서 거래 내역 추출
 */
function parseTransactions(rawData: any[][]): JeonbukTransaction[] {
  const transactions: JeonbukTransaction[] = []

  // 헤더 행 찾기
  let headerRowIndex = -1
  console.log('🔥 전북은행 헤더 행 찾기 시작...')

  for (let i = 0; i < Math.min(15, rawData.length); i++) {
    const row = rawData[i]
    if (row) {
      const rowStr = row.join('|')
      console.log(`🔥 행 ${i}: ${rowStr}`)

      // 전북은행 헤더 특징: "거래일자"와 "출금금액"이 포함된 행
      if (
        row.some((cell) => String(cell).includes('거래일자')) &&
        row.some((cell) => String(cell).includes('출금금액'))
      ) {
        headerRowIndex = i
        console.log(`🔥🔥🔥 전북은행 헤더 행 발견: ${i} 🔥🔥🔥`)
        break
      }
    }
  }

  if (headerRowIndex === -1) {
    console.log('🔥 전북은행 헤더를 찾을 수 없어서 행 8부터 시작 (임시)')
    headerRowIndex = 8 // 임시로 8번째 행부터 시작
  }

  // 헤더 다음 행부터 데이터 파싱
  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i]

    // 빈 행 또는 합계 행 건너뛰기
    if (
      !row ||
      row.length === 0 ||
      String(row[0]).includes('합') ||
      String(row[0]).includes('소계') ||
      String(row[0]).includes('출금건수') ||
      String(row[0]).includes('입금건수') ||
      String(row[0]).includes('출금합계') ||
      String(row[0]).includes('입금합계')
    ) {
      continue
    }

    // 거래일자 필드가 없으면 건너뛰기
    if (!row[1] || row[1] === '') {
      continue
    }

    try {
      const transaction = parseRow(row, i)
      if (transaction) {
        transactions.push(transaction)
      }
    } catch (error) {
      console.warn(`전북은행 행 ${i} 파싱 실패:`, error)
    }
  }

  return transactions
}

/**
 * 한 행을 JeonbukTransaction 객체로 변환
 * 컬럼 순서: 거래일자, 거래시간, 출금금액, 입금금액, 거래후잔액, 적요, 취급은행(지점)
 */
function parseRow(row: any[], rowIndex: number = 0): JeonbukTransaction | null {
  // 최소 필드 수 확인
  if (row.length < 6) {
    console.log(`🔥 전북은행 행 ${rowIndex}: 필드 수 부족 (${row.length}개)`)
    return null
  }

  // 거래일자 필드 처리 (row[1])
  let transactionDate = ''
  if (row[1] && String(row[1]).trim() !== '' && String(row[1]).trim() !== 'undefined') {
    transactionDate = String(row[1]).trim()
    console.log(
      `🔥 전북은행 행 ${rowIndex}: 날짜 발견 - "${transactionDate}" (타입: ${typeof row[1]})`,
    )
  } else {
    console.log(
      `🔥 전북은행 행 ${rowIndex}: 날짜 없음 - row[1]="${row[1]}" (타입: ${typeof row[1]})`,
    )
    return null
  }

  return {
    transactionDate, // 거래일자 (row[1])
    transactionTime: String(row[2] || ''), // 거래시간 (row[2])
    withdrawalAmount: parseAmount(row[3]), // 출금금액 (row[3])
    depositAmount: parseAmount(row[4]), // 입금금액 (row[4])
    balance: parseAmount(row[5]), // 거래후잔액 (row[5])
    description: String(row[6] || ''), // 적요 (row[6])
    handlingBank: String(row[7] || ''), // 취급은행(지점) (row[7])
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
 * 전북은행 거래내역 파싱 (엑셀 파일)
 */
export async function parseJeonbukBankStatement(
  content: string,
): Promise<BankStatementParseResult> {
  console.log('🔥🔥🔥 === parseJeonbukBankStatement 시작 === 🔥🔥🔥')
  console.log('🔥 content 길이:', content.length)

  const transactions: ParsedTransaction[] = []
  const errors: string[] = []

  try {
    console.log('🔥 전북은행 엑셀 파싱 시작...')
    // 엑셀 파싱
    const excelTransactions = await parseJeonbukBankExcel(content)
    console.log('🔥🔥🔥 전북은행 엑셀 파싱 완료, 거래 수:', excelTransactions.length, '🔥🔥🔥')

    for (const tx of excelTransactions) {
      try {
        // 날짜 검증 및 변환
        if (
          !tx.transactionDate ||
          tx.transactionDate.trim() === '' ||
          tx.transactionDate === 'undefined'
        ) {
          console.warn(`🔥 전북은행 거래 건너뛰기: 날짜가 비어있음 (원본: "${tx.transactionDate}")`)
          continue // 날짜가 없으면 이 거래는 건너뛰기
        }

        let transactionDate: string
        try {
          // 전북은행은 날짜와 시간을 조합해야 함
          // 날짜: "YYYY.MM.DD", 시간: "HH:MM:SS"
          let dateTimeStr = tx.transactionDate

          // 시간이 있으면 조합
          if (tx.transactionTime && tx.transactionTime.trim() !== '') {
            dateTimeStr = `${tx.transactionDate} ${tx.transactionTime}`
            console.log(
              `🔥 전북은행 날짜+시간 조합: "${tx.transactionDate}" + "${tx.transactionTime}" = "${dateTimeStr}"`,
            )
          } else {
            // 시간이 없으면 자정으로 설정
            dateTimeStr = `${tx.transactionDate} 00:00:00`
            console.log(`🔥 전북은행 날짜만: "${tx.transactionDate}" -> "${dateTimeStr}"`)
          }

          // YYYY.MM.DD HH:MM:SS 형식을 YYYY-MM-DD HH:MM:SS로 변환
          const normalizedDateTime = dateTimeStr.replace(/\./g, '-')
          transactionDate = toUTC(normalizedDateTime)
          console.log(`🔥 전북은행 날짜 변환 성공: "${normalizedDateTime}" -> "${transactionDate}"`)
        } catch (error) {
          console.warn(
            `🔥 전북은행 거래 건너뛰기: 날짜 변환 실패 (원본: "${tx.transactionDate}", 오류: ${error})`,
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
        } else if (tx.description.includes('보조금') || tx.description.includes('지원금')) {
          categoryCode = '보조금'
        } else if (tx.description.includes('이자') || tx.description.includes('수익')) {
          categoryCode = '금융수익'
        }

        // 상대방 정보 추출 (적요에서 추출하거나 취급은행 정보 활용)
        let counterparty = tx.description
        if (tx.handlingBank && tx.handlingBank.trim() !== '') {
          // 취급은행 정보가 있으면 함께 사용
          counterparty = `${tx.description} (${tx.handlingBank})`
        }

        const parsedTransaction: ParsedTransaction = {
          transactionDate,
          description: tx.description || '거래내역',
          counterparty,
          deposits: tx.depositAmount > 0 ? tx.depositAmount : undefined,
          withdrawals: tx.withdrawalAmount > 0 ? tx.withdrawalAmount : undefined,
          balance: tx.balance,
          bankCode: BankCode.JEONBUK,
          categoryCode,
        }

        transactions.push(parsedTransaction)
      } catch (e: any) {
        errors.push(`전북은행 거래 파싱 오류: ${e.message}`)
      }
    }
  } catch (e: any) {
    errors.push(`전북은행 파일 파싱 오류: ${e.message}`)
  }

  return {
    bankCode: BankCode.JEONBUK,
    bankName: BankCodeUtils.getBankName(BankCode.JEONBUK),
    accountNumber: 'unknown',
    transactions,
    errors,
  }
}
