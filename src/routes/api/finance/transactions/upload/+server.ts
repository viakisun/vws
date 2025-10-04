import { query } from '$lib/database/connection'
import { parseBankStatement } from '$lib/utils/bank-parser'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// POST: 거래내역 파일 업로드
export const POST: RequestHandler = async ({ request }) => {
  try {
    logger.info('=== 업로드 요청 시작 ===')
    logger.info('Content-Type:', request.headers.get('content-type'))
    logger.info('Content-Length:', request.headers.get('content-length'))
    
    // UTF-8 인코딩을 명시적으로 설정
    const formData = await request.formData()
    
    // 파일명 UTF-8 디코딩 확인
    const file = formData.get('file') as File
    if (file) {
      logger.info('원본 파일명 (raw):', file.name)
      logger.info('파일명 바이트 길이:', new TextEncoder().encode(file.name).length)
      logger.info('파일명 UTF-8 디코딩:', decodeURIComponent(encodeURIComponent(file.name)))
    }
    
    // FormData 내용 로깅
    logger.info('FormData keys:', Array.from(formData.keys()))
    logger.info('FormData entries:')
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        logger.info(`  ${key}: File(${value.name}, ${value.size} bytes)`)
      } else {
        logger.info(`  ${key}: ${value}`)
      }
    }
    
    const replaceExisting = formData.get('replaceExisting') === 'true'
    const accountId = formData.get('accountId') as string

    logger.info(`파일 정보: ${file ? `${file.name}, ${file.size} bytes` : 'null'}`)
    logger.info(`replaceExisting: ${replaceExisting}`)
    logger.info(`accountId: ${accountId}`)

    if (!file) {
      logger.error('파일이 업로드되지 않았습니다.')
      return json({ success: false, message: '파일이 업로드되지 않았습니다.' }, { status: 400 })
    }

    const fileName = file.name
    const fileExtension = fileName.split('.').pop()?.toLowerCase()

    logger.info(`파일 업로드 시작: ${fileName}, 크기: ${file.size} bytes`)
    logger.info(`파일 확장자: ${fileExtension}`)

    let fileContent: string
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // 엑셀 파일의 경우 바이너리로 읽기
      const arrayBuffer = await file.arrayBuffer()
      fileContent = Buffer.from(arrayBuffer).toString('binary')
      logger.info(`엑셀 파일 바이너리 크기: ${fileContent.length} bytes`)
    } else {
      // 텍스트 파일의 경우 텍스트로 읽기
      fileContent = await file.text()
      logger.info(`텍스트 파일 내용 미리보기 (처음 500자): ${fileContent.substring(0, 500)}`)
      logger.info(`텍스트 파일 내용 크기: ${fileContent.length}자`)
      logger.info(`텍스트 파일 라인 수: ${fileContent.split('\n').length}`)
    }

    // 파일 파싱
    const { bankName, accountNumber, transactions, errors: parseErrors } = parseBankStatement(
      fileContent,
      fileName,
    )

    logger.info(`파싱 결과: 은행=${bankName}, 계좌=${accountNumber}, 거래수=${transactions.length}, 오류수=${parseErrors.length}`)
    logger.info(`파싱된 거래 목록 (처음 5건):`, transactions.slice(0, 5))
    
    if (parseErrors.length > 0) {
      logger.error(`파싱 오류 상세:`, parseErrors)
      return json({ success: false, message: '파일 파싱 오류', errors: parseErrors }, { status: 400 })
    }
    
    if (transactions.length === 0) {
      logger.warn('파싱된 거래가 없습니다. 파일 내용을 확인해주세요.')
      return json({ success: false, message: '파싱된 거래가 없습니다', errors: ['파일에서 유효한 거래 데이터를 찾을 수 없습니다.'] }, { status: 400 })
    }

    // 거래 유효성 검사는 파싱 단계에서 이미 수행됨

    // 계좌 찾기 또는 생성
    let targetAccountId: string
    
    if (accountId) {
      // 특정 계좌 ID가 제공된 경우
      const targetAccount = await query('SELECT id, account_number FROM finance_accounts WHERE id = $1', [accountId])
      if (targetAccount.rows.length === 0) {
        return json({ success: false, message: '지정된 계좌를 찾을 수 없습니다.' }, { status: 404 })
      }
      targetAccountId = targetAccount.rows[0].id
      logger.info(`지정된 계좌 사용: ${targetAccount.rows[0].account_number} (ID: ${targetAccountId})`)
             } else {
               // 자동 계좌 감지 (하이픈 제거된 계좌번호로 검색)
               const cleanAccountNumber = accountNumber.replace(/-/g, '')
               const existingAccount = await query('SELECT id FROM finance_accounts WHERE account_number = $1', [
                 cleanAccountNumber,
               ])

      if (existingAccount.rows.length > 0) {
        targetAccountId = existingAccount.rows[0].id
        logger.info(`기존 계좌 사용: ${bankName} - ${accountNumber} (ID: ${targetAccountId})`)
      } else {
        // 새 계좌 생성
        const bankResult = await query('SELECT id FROM finance_banks WHERE name = $1', [bankName])
        if (bankResult.rows.length === 0) {
          return json({ success: false, message: `은행 정보를 찾을 수 없습니다: ${bankName}` }, { status: 400 })
        }

        const bankId = bankResult.rows[0].id
               const cleanAccountNumber = accountNumber.replace(/-/g, '')
               const newAccount = await query(
                 'INSERT INTO finance_accounts (name, account_number, bank_id, account_type, balance, is_primary) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                 [`${bankName} ${cleanAccountNumber}`, cleanAccountNumber, bankId, 'checking', 0, false],
               )
        targetAccountId = newAccount.rows[0].id
        logger.info(`새 계좌 생성: ${bankName} - ${accountNumber} (ID: ${targetAccountId})`)
      }
    }

    let insertedCount = 0
    let skippedCount = 0
    const transactionErrors: string[] = []

    // 기존 거래내역 삭제 (선택사항)
    if (replaceExisting) {
      await query('DELETE FROM finance_transactions WHERE account_id = $1', [targetAccountId])
      logger.info(`기존 거래내역 삭제 완료 (계좌 ID: ${targetAccountId})`)
    }

    // 거래내역 삽입
    for (const transaction of transactions) {
      try {
        // 중복 거래 확인
        const duplicateCheck = await query(
          'SELECT id FROM finance_transactions WHERE account_id = $1 AND transaction_date = $2 AND description = $3',
          [
            targetAccountId,
            transaction.transactionDate,
            transaction.description,
          ],
        )

        if (duplicateCheck.rows.length > 0) {
          skippedCount++
          continue
        }

        // 카테고리 ID 결정 (categoryCode 기반)
        let categoryId: string | null = null
        
        if (transaction.categoryCode) {
          // 파싱된 카테고리 코드로 카테고리 찾기
          const categoryResult = await query(
            'SELECT id FROM finance_categories WHERE name = $1',
            [transaction.categoryCode],
          )
          categoryId = categoryResult.rows[0]?.id || null
        }

        // 카테고리를 찾지 못한 경우, 입금/출금에 따라 기본 카테고리 설정
        if (!categoryId) {
          if (transaction.deposits && transaction.deposits > 0) {
            const incomeCategory = await query(
              "SELECT id FROM finance_categories WHERE name = '기타수입' AND type = 'income'",
            )
            categoryId = incomeCategory.rows[0]?.id || null
          } else {
            const expenseCategory = await query(
              "SELECT id FROM finance_categories WHERE name = '기타지출' AND type = 'expense'",
            )
            categoryId = expenseCategory.rows[0]?.id || null
          }
        }

        // 최종적으로도 categoryId가 null이면 오류 발생
        if (!categoryId) {
          throw new Error('기본 카테고리를 찾을 수 없습니다.')
        }

        // 디버깅: 이티컴파니 거래 로깅
        if (transaction.description && transaction.description.includes('이티컴파니')) {
          logger.info('=== API에서 이티컴파니 거래 디버깅 ===')
          logger.info('transaction.counterparty:', transaction.counterparty)
          logger.info('transaction.deposits:', transaction.deposits)
          logger.info('transaction.withdrawals:', transaction.withdrawals)
          logger.info('transaction.balance:', transaction.balance)
        }

        // 거래내역 삽입 (새로운 스키마)
        await query(
          `
          INSERT INTO finance_transactions (
            account_id, category_id, amount, type, description, transaction_date, 
            counterparty, deposits, withdrawals, balance
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `,
          [
            targetAccountId,
            categoryId,
            // amount는 입금이 있으면 양수, 출금만 있으면 음수
            transaction.deposits && transaction.deposits > 0 
              ? transaction.deposits 
              : (transaction.withdrawals && transaction.withdrawals > 0 ? -transaction.withdrawals : 0),
            // type은 입금이 있으면 income, 아니면 expense
            transaction.deposits && transaction.deposits > 0 ? 'income' : 'expense',
            transaction.description,
            transaction.transactionDate,
            transaction.counterparty || transaction.description, // 의뢰인/수취인 (기본값: 설명)
            transaction.deposits || 0, // 입금
            transaction.withdrawals || 0, // 출금
            transaction.balance || 0, // 거래후잔액
          ],
        )
        insertedCount++
      } catch (txError: any) {
        transactionErrors.push(
          `거래 삽입 오류 (${transaction.transactionDate}, ${transaction.description}): ${txError.message}`,
        )
        // 임시로 거래 삽입 오류 로그 비활성화 (디버깅용)
        // logger.error(`거래 삽입 오류: ${txError.message}`, { transaction, accountId: targetAccountId })
      }
    }


    return json({
      success: true,
      message: '거래내역 업로드 및 처리 완료',
      accountId: targetAccountId,
      bankName,
      accountNumber,
      totalTransactions: transactions.length,
      insertedCount,
      skippedCount,
      errors: transactionErrors,
    })
  } catch (error: any) {
    logger.error('파일 업로드 API 오류:', error)
    return json({ success: false, message: '서버 오류 발생', error: error.message }, { status: 500 })
  }
}

// GET: 지원 은행 목록 반환
export const GET: RequestHandler = async () => {
  try {
    const supportedBanks = [
      {
        name: '하나은행',
        format: 'No,거래일시,적요,의뢰인/수취인,입금,출금,거래후잔액,구분,거래점,거래특이사항',
        accountNumber: '711-910019-07604',
      },
      {
        name: '농협은행',
        format: '번호,입금일시,출금금액,입금금액,거래후잔액,적요,거래점명,거래점코드,통장메모',
        accountNumber: '301-0294-9098-71',
      },
    ]
    return json({ success: true, supportedBanks })
  } catch (error: any) {
    logger.error('지원 은행 목록 조회 오류:', error)
    return json({ success: false, message: '서버 오류 발생', error: error.message }, { status: 500 })
  }
}
