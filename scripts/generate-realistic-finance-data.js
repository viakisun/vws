/**
 * 실제 회사 운영과 흡사한 재무 데이터 생성 스크립트
 *
 * 시나리오:
 * - 15명 규모의 회사 (2025년 1월~9월)
 * - 운영자금: 하나은행 계좌
 * - 매출통장: 농협은행 계좌
 * - 대표이사 차입: 4회, 총 5000만원
 * - 월급여, 임대료, 공과금, 마케팅비 등 실제 운영비용
 */

import { query } from '../src/lib/database/connection.ts'

// 날짜 유틸리티 함수
function getDateString(year, month, day) {
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

function getRandomDateInMonth(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const day = Math.floor(Math.random() * daysInMonth) + 1
  return getDateString(year, month, day)
}

// 금액 포맷팅
function formatAmount(amount) {
  return Math.round(amount)
}

async function generateRealisticFinanceData() {
  console.log('🏢 실제 회사 운영 데이터 생성 시작...')

  try {
    // 계좌 정보 조회
    const accountsResult = await query(`
      SELECT a.id, a.name, b.name as bank_name, b.code as bank_code
      FROM finance_accounts a
      JOIN finance_banks b ON a.bank_id = b.id
      ORDER BY a.name
    `)

    const accounts = accountsResult.rows
    const operatingAccount = accounts.find((acc) => acc.bank_code === 'HANA') // 하나은행 운영자금
    const salesAccount = accounts.find((acc) => acc.bank_code === 'NH') // 농협 매출통장

    if (!operatingAccount || !salesAccount) {
      throw new Error('필요한 계좌를 찾을 수 없습니다.')
    }

    console.log(`📊 운영자금 계좌: ${operatingAccount.name}`)
    console.log(`💰 매출통장 계좌: ${salesAccount.name}`)

    // 카테고리 정보 조회
    const categoriesResult = await query(`
      SELECT id, name, type, accounting_code
      FROM finance_categories
      WHERE is_active = true
      ORDER BY type, name
    `)

    const categories = categoriesResult.rows
    const incomeCategories = categories.filter((cat) => cat.type === 'income')
    const expenseCategories = categories.filter((cat) => cat.type === 'expense')
    const transferCategories = categories.filter((cat) => cat.type === 'transfer')

    console.log(`📋 수입 카테고리: ${incomeCategories.length}개`)
    console.log(`📋 지출 카테고리: ${expenseCategories.length}개`)

    // 기존 거래 내역 삭제 (새로운 데이터로 교체)
    console.log('🗑️ 기존 거래 내역 삭제 중...')
    await query('DELETE FROM finance_transactions')
    await query('UPDATE finance_accounts SET balance = 0')

    const transactions = []

    // 2025년 1월~9월 데이터 생성
    for (let month = 1; month <= 9; month++) {
      console.log(`📅 ${month}월 데이터 생성 중...`)

      // === 매출 데이터 (농협 매출통장) ===
      const monthlySales = 15000000 + Math.random() * 5000000 // 월 매출 1500만~2000만원
      transactions.push({
        accountId: salesAccount.id,
        categoryId: incomeCategories.find((cat) => cat.name === '매출')?.id,
        amount: formatAmount(monthlySales),
        type: 'income',
        description: `${month}월 매출`,
        transactionDate: getRandomDateInMonth(2025, month),
        status: 'completed',
      })

      // === 급여 지급 (운영자금에서) ===
      const monthlySalary = 12000000 // 월 급여 1200만원 (15명 × 평균 80만원)
      transactions.push({
        accountId: operatingAccount.id,
        categoryId: expenseCategories.find((cat) => cat.name === '급여')?.id,
        amount: formatAmount(monthlySalary),
        type: 'expense',
        description: `${month}월 급여`,
        transactionDate: getRandomDateInMonth(2025, month),
        status: 'completed',
      })

      // === 임대료 (운영자금에서) ===
      const monthlyRent = 2000000 // 월 임대료 200만원
      transactions.push({
        accountId: operatingAccount.id,
        categoryId: expenseCategories.find((cat) => cat.name === '임대료')?.id,
        amount: formatAmount(monthlyRent),
        type: 'expense',
        description: `${month}월 사무실 임대료`,
        transactionDate: getRandomDateInMonth(2025, month),
        status: 'completed',
      })

      // === 공과금 (운영자금에서) ===
      const monthlyUtilities = 300000 + Math.random() * 200000 // 월 공과금 30만~50만원
      transactions.push({
        accountId: operatingAccount.id,
        categoryId: expenseCategories.find((cat) => cat.name === '공과금')?.id,
        amount: formatAmount(monthlyUtilities),
        type: 'expense',
        description: `${month}월 전기세, 수도세`,
        transactionDate: getRandomDateInMonth(2025, month),
        status: 'completed',
      })

      // === 마케팅비 (운영자금에서) ===
      if (Math.random() > 0.3) {
        // 70% 확률로 마케팅비 발생
        const marketingCost = 500000 + Math.random() * 1000000 // 마케팅비 50만~150만원
        transactions.push({
          accountId: operatingAccount.id,
          categoryId: expenseCategories.find((cat) => cat.name === '마케팅')?.id,
          amount: formatAmount(marketingCost),
          type: 'expense',
          description: `${month}월 마케팅비`,
          transactionDate: getRandomDateInMonth(2025, month),
          status: 'completed',
        })
      }

      // === 운영비 (운영자금에서) ===
      const operatingCost = 800000 + Math.random() * 400000 // 운영비 80만~120만원
      transactions.push({
        accountId: operatingAccount.id,
        categoryId: expenseCategories.find((cat) => cat.name === '운영비')?.id,
        amount: formatAmount(operatingCost),
        type: 'expense',
        description: `${month}월 운영비`,
        transactionDate: getRandomDateInMonth(2025, month),
        status: 'completed',
      })

      // === 매출통장에서 운영자금으로 이체 ===
      // 매출에서 운영비용을 차감한 후 운영자금으로 이체
      const monthlyExpenses = monthlySalary + monthlyRent + monthlyUtilities + operatingCost
      const transferAmount = Math.max(0, monthlySales - monthlyExpenses - 2000000) // 여유자금 200만원 유지

      if (transferAmount > 0) {
        transactions.push({
          accountId: salesAccount.id,
          categoryId: transferCategories.find((cat) => cat.name === '계좌이체')?.id,
          amount: formatAmount(transferAmount),
          type: 'transfer',
          description: `${month}월 운영자금 이체`,
          transactionDate: getRandomDateInMonth(2025, month),
          status: 'completed',
        })

        transactions.push({
          accountId: operatingAccount.id,
          categoryId: transferCategories.find((cat) => cat.name === '계좌이체')?.id,
          amount: formatAmount(transferAmount),
          type: 'transfer',
          description: `${month}월 운영자금 입금`,
          transactionDate: getRandomDateInMonth(2025, month),
          status: 'completed',
        })
      }
    }

    // === 대표이사 차입 (4회, 총 5000만원) ===
    console.log('💳 대표이사 차입 데이터 생성 중...')
    const loanAmounts = [15000000, 12000000, 13000000, 10000000] // 총 5000만원
    const loanMonths = [2, 4, 6, 8] // 2월, 4월, 6월, 8월

    for (let i = 0; i < loanAmounts.length; i++) {
      transactions.push({
        accountId: operatingAccount.id,
        categoryId: incomeCategories.find((cat) => cat.name === '기타수입')?.id,
        amount: formatAmount(loanAmounts[i]),
        type: 'income',
        description: `대표이사 차입 ${i + 1}차`,
        transactionDate: getRandomDateInMonth(2025, loanMonths[i]),
        status: 'completed',
      })
    }

    // === 추가 수입 (투자수익 등) ===
    for (let month = 1; month <= 9; month++) {
      if (Math.random() > 0.7) {
        // 30% 확률로 추가 수입
        const additionalIncome = 1000000 + Math.random() * 2000000 // 추가 수입 100만~300만원
        transactions.push({
          accountId: salesAccount.id,
          categoryId: incomeCategories.find((cat) => cat.name === '투자수익')?.id,
          amount: formatAmount(additionalIncome),
          type: 'income',
          description: `${month}월 투자수익`,
          transactionDate: getRandomDateInMonth(2025, month),
          status: 'completed',
        })
      }
    }

    // === 거래 내역 삽입 ===
    console.log(`💾 ${transactions.length}개 거래 내역 삽입 중...`)

    for (const transaction of transactions) {
      await query(
        `
        INSERT INTO finance_transactions (
          account_id, category_id, amount, type, description,
          transaction_date, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `,
        [
          transaction.accountId,
          transaction.categoryId,
          transaction.amount,
          transaction.type,
          transaction.description,
          transaction.transactionDate,
          transaction.status,
        ],
      )
    }

    // === 계좌 잔액 계산 및 업데이트 ===
    console.log('💰 계좌 잔액 계산 중...')

    for (const account of accounts) {
      const balanceResult = await query(
        `
        SELECT 
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
        FROM finance_transactions 
        WHERE account_id = $1
      `,
        [account.id],
      )

      const totalIncome = parseFloat(balanceResult.rows[0].total_income || 0)
      const totalExpense = parseFloat(balanceResult.rows[0].total_expense || 0)
      const balance = totalIncome - totalExpense

      await query('UPDATE finance_accounts SET balance = $1, updated_at = NOW() WHERE id = $2', [
        balance,
        account.id,
      ])

      console.log(`📊 ${account.name}: ${balance.toLocaleString()}원`)
    }

    // === 결과 요약 ===
    const summaryResult = await query(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
      FROM finance_transactions
    `)

    const summary = summaryResult.rows[0]

    console.log('\n🎉 실제 회사 운영 데이터 생성 완료!')
    console.log(`📊 총 거래 건수: ${summary.total_transactions}건`)
    console.log(`💰 총 수입: ${parseFloat(summary.total_income).toLocaleString()}원`)
    console.log(`💸 총 지출: ${parseFloat(summary.total_expense).toLocaleString()}원`)
    console.log(
      `📈 순이익: ${(parseFloat(summary.total_income) - parseFloat(summary.total_expense)).toLocaleString()}원`,
    )
  } catch (error) {
    console.error('❌ 데이터 생성 실패:', error)
    process.exit(1)
  }
}

// 스크립트 실행
generateRealisticFinanceData()
