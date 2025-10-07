import { BankCode, BankCodeUtils } from '$lib/types/bank-codes'
import { toUTC } from '$lib/utils/date-handler'
import { readExcelFile } from '$lib/utils/excel-reader'
import type { BankStatementParseResult, ParsedTransaction } from './types'

// 거래 내역 인터페이스 (전북은행 전용)
interface JeonbukTransaction {
  id: string // 거래 ID
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

    // 모든 행의 필드 확인 (디버깅용)
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i]
      if (row && row.some((cell) => cell && String(cell).trim() !== '')) {
        console.log(`🔥🔥🔥 행 ${i} 전체 필드:`)
        for (let j = 0; j < Math.min(15, row.length); j++) {
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

  let parsedCount = 0
  let skippedCount = 0

  console.log('🔥🔥🔥 === 전북은행 파싱 시작 === 🔥🔥🔥')
  console.log('🔥 총 행 수:', rawData.length)

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
          console.log(`🔥 전북은행 파싱 성공 (행 ${i}):`, {
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
          console.log(`🔥 전북은행 행 ${i} 건너뛰기: 형식 불일치 - ${row.slice(0, 3).join('|')}`)
        }
      }
    } catch (error) {
      skippedCount++
      if (skippedCount <= 10) {
        console.warn(`🔥 전북은행 행 ${i} 파싱 실패:`, error)
      }
    }
  }

  console.log(
    `🔥🔥🔥 전북은행 파싱 완료: 성공 ${parsedCount}건, 건너뛴 행 ${skippedCount}건 🔥🔥🔥`,
  )

  return transactions
}

/**
 * 한 행을 JeonbukTransaction 객체로 변환
 * 컬럼 순서: 거래일자, 거래시간, 출금금액, 입금금액, 거래후잔액, 적요, 취급은행(지점)
 */
function parseRow(row: any[], rowIndex: number = 0): JeonbukTransaction | null {
  // 전북은행 거래 데이터 형식 검증
  // 실제 구조: row[0]=빈칸, row[1]=거래일자, row[2]=거래시간, row[3]=출금, row[4]=입금, row[5]=잔액, row[6]=적요, row[7]=취급은행

  // 1. 최소 필드 수 확인 (8개 컬럼 필요)
  if (row.length < 8) {
    return null
  }

  // 2. 헤더 행이나 메타데이터 행 건너뛰기
  const firstCell = String(row[0] || '').trim()
  const secondCell = String(row[1] || '').trim()

  if (
    firstCell.includes('거래일자') ||
    firstCell.includes('No') ||
    firstCell.includes('계좌번호') ||
    firstCell.includes('예금거래내역조회') ||
    firstCell.includes('상세정보') ||
    firstCell.includes('예금주명') ||
    firstCell.includes('계좌명') ||
    secondCell.includes('거래일자') ||
    secondCell.includes('거래시간') ||
    secondCell.includes('조회기준일시') ||
    secondCell.includes('조회기간') ||
    secondCell.includes('예금거래내역조회') ||
    secondCell.includes('상세정보')
  ) {
    return null
  }

  // 3. 거래일자 필드 검증 (row[1] - B열)
  const transactionDate = String(row[1] || '').trim()
  if (!transactionDate || transactionDate === 'undefined' || transactionDate === 'null') {
    return null
  }

  // 날짜 형식이 올바른지 확인 (YYYY.MM.DD 형식)
  if (!/^\d{4}\.\d{1,2}\.\d{1,2}$/.test(transactionDate)) {
    return null
  }

  // 4. 거래시간 필드 검증 (row[2] - C열)
  const transactionTime = String(row[2] || '').trim()
  if (!transactionTime || transactionTime === 'undefined' || transactionTime === 'null') {
    return null
  }

  // 시간 형식이 올바른지 확인 (HH:MM:SS 형식)
  if (!/^\d{1,2}:\d{2}:\d{2}$/.test(transactionTime)) {
    return null
  }

  // 5. 금액 필드 검증
  // 전북은행 컬럼 순서: row[0]=빈칸, row[1]=거래일자, row[2]=거래시간, row[3]=출금, row[4]=입금, row[5]=잔액, row[6]=적요, row[7]=취급은행
  const withdrawalAmount = parseAmount(row[3]) // 출금금액 (row[3] - D열)
  const depositAmount = parseAmount(row[4]) // 입금금액 (row[4] - E열)
  const balance = parseAmount(row[5]) // 거래후잔액 (row[5] - F열)
  const description = String(row[6] || '').trim() // 적요 (row[6] - G열)
  const handlingBank = String(row[7] || '').trim() // 취급은행(지점) (row[7] - H열)

  // 6. 유효한 거래 데이터인지 확인
  if (depositAmount === 0 && withdrawalAmount === 0) {
    return null // 입금도 출금도 없으면 유효하지 않은 거래
  }

  // 7. 유효한 거래 데이터로 판단되면 파싱
  return {
    id: String(rowIndex + 1), // 행 번호를 ID로 사용
    transactionDate, // 거래일자 (row[1])
    transactionTime, // 거래시간 (row[2])
    withdrawalAmount, // 출금금액 (row[3])
    depositAmount, // 입금금액 (row[4])
    balance, // 거래후잔액 (row[5])
    description, // 적요 (row[6])
    handlingBank, // 취급은행(지점) (row[7])
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
