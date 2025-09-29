import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 자금일보 생성/조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0]

    // 기존 자금일보 조회
    const existingReport = await query(
      'SELECT * FROM finance_daily_reports WHERE report_date = $1',
      [date],
    )

    if (existingReport.rows.length > 0) {
      const report = existingReport.rows[0]
      return json({
        success: true,
        data: {
          id: report.id,
          reportDate: report.report_date,
          status: report.status,
          openingBalance: parseFloat(report.opening_balance),
          closingBalance: parseFloat(report.closing_balance),
          totalInflow: parseFloat(report.total_inflow),
          totalOutflow: parseFloat(report.total_outflow),
          netFlow: parseFloat(report.net_flow),
          transactionCount: report.transaction_count,
          accountSummaries: report.account_summaries,
          categorySummaries: report.category_summaries,
          alerts: report.alerts,
          notes: report.notes,
          generatedAt: report.generated_at,
          generatedBy: report.generated_by,
          createdAt: report.created_at,
          updatedAt: report.updated_at,
        },
        message: '자금일보를 조회했습니다.',
      })
    }

    return json(
      {
        success: false,
        error: '해당 날짜의 자금일보가 없습니다.',
      },
      { status: 404 },
    )
  } catch (error) {
    console.error('자금일보 조회 실패:', error)
    return json(
      {
        success: false,
        error: '자금일보를 조회할 수 없습니다.',
      },
      { status: 500 },
    )
  }
}

// 자금일보 생성
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json()
    const date = body.date || new Date().toISOString().split('T')[0]

    // 기존 자금일보가 있는지 확인
    const existingReport = await query(
      'SELECT id FROM finance_daily_reports WHERE report_date = $1',
      [date],
    )

    if (existingReport.rows.length > 0) {
      return json(
        {
          success: false,
          error: '해당 날짜의 자금일보가 이미 존재합니다.',
        },
        { status: 400 },
      )
    }

    // 자금일보 데이터 생성
    const reportData = await generateDailyReportData(date)

    // 자금일보 저장
    const queryText = `
      INSERT INTO finance_daily_reports (
        report_date, status, opening_balance, closing_balance,
        total_inflow, total_outflow, net_flow, transaction_count,
        account_summaries, category_summaries, alerts, notes,
        generated_at, generated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `

    const params = [
      date,
      'completed',
      reportData.openingBalance,
      reportData.closingBalance,
      reportData.totalInflow,
      reportData.totalOutflow,
      reportData.netFlow,
      reportData.transactionCount,
      JSON.stringify(reportData.accountSummaries),
      JSON.stringify(reportData.categorySummaries),
      JSON.stringify(reportData.alerts),
      reportData.notes,
      new Date().toISOString(),
      'system',
    ]

    const result = await query(queryText, params)
    const report = result.rows[0]

    return json({
      success: true,
      data: {
        id: report.id,
        reportDate: report.report_date,
        status: report.status,
        openingBalance: parseFloat(report.opening_balance),
        closingBalance: parseFloat(report.closing_balance),
        totalInflow: parseFloat(report.total_inflow),
        totalOutflow: parseFloat(report.total_outflow),
        netFlow: parseFloat(report.net_flow),
        transactionCount: report.transaction_count,
        accountSummaries: report.account_summaries,
        categorySummaries: report.category_summaries,
        alerts: report.alerts,
        notes: report.notes,
        generatedAt: report.generated_at,
        generatedBy: report.generated_by,
        createdAt: report.created_at,
        updatedAt: report.updated_at,
      },
      message: '자금일보가 성공적으로 생성되었습니다.',
    })
  } catch (error) {
    console.error('자금일보 생성 실패:', error)
    return json(
      {
        success: false,
        error: '자금일보 생성에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

// 자금일보 데이터 생성 헬퍼 함수
async function generateDailyReportData(date: string) {
  // 전일 종료 잔액 (시작 잔액)
  const previousDay = new Date(date)
  previousDay.setDate(previousDay.getDate() - 1)
  const previousDate = previousDay.toISOString().split('T')[0]

  const previousReport = await query(
    'SELECT closing_balance FROM finance_daily_reports WHERE report_date = $1',
    [previousDate],
  )

  const openingBalance =
    previousReport.rows.length > 0 ? parseFloat(previousReport.rows[0].closing_balance) : 0

  // 당일 거래 내역
  const transactions = await query(
    `
    SELECT
      t.*,
      c.name as category_name,
      c.type as category_type,
      a.name as account_name
    FROM finance_transactions t
    LEFT JOIN finance_categories c ON t.category_id = c.id
    LEFT JOIN finance_accounts a ON t.account_id = a.id
    WHERE t.transaction_date = $1 AND t.status = 'completed'
    `,
    [date],
  )

  // 수입/지출 계산
  let totalInflow = 0
  let totalOutflow = 0
  const categorySummaries: Record<string, { inflow: number; outflow: number; count: number }> = {}

  for (const transaction of transactions.rows) {
    const amount = parseFloat(transaction.amount)
    const categoryName = transaction.category_name || '기타'

    if (transaction.type === 'income') {
      totalInflow += amount
      if (!categorySummaries[categoryName]) {
        categorySummaries[categoryName] = { inflow: 0, outflow: 0, count: 0 }
      }
      categorySummaries[categoryName].inflow += amount
      categorySummaries[categoryName].count += 1
    } else if (transaction.type === 'expense') {
      totalOutflow += amount
      if (!categorySummaries[categoryName]) {
        categorySummaries[categoryName] = { inflow: 0, outflow: 0, count: 0 }
      }
      categorySummaries[categoryName].outflow += amount
      categorySummaries[categoryName].count += 1
    }
  }

  const netFlow = totalInflow - totalOutflow
  const closingBalance = openingBalance + netFlow

  // 계좌별 요약
  const accounts = await query(
    "SELECT id, name, balance FROM finance_accounts WHERE status = 'active'",
  )

  const accountSummaries = accounts.rows.map((account: any) => ({
    accountId: account.id,
    accountName: account.name,
    balance: parseFloat(account.balance),
  }))

  // 알림 생성
  const alerts: Array<{ type: string; severity: string; message: string }> = []
  if (netFlow < 0) {
    alerts.push({
      type: 'negative_cash_flow',
      severity: 'medium',
      message: `당일 현금흐름이 마이너스입니다. (₩${Math.abs(netFlow).toLocaleString()})`,
    })
  }

  if (totalOutflow > totalInflow * 2) {
    alerts.push({
      type: 'high_expense_ratio',
      severity: 'high',
      message: `지출이 수입의 2배를 초과했습니다.`,
    })
  }

  return {
    openingBalance,
    closingBalance,
    totalInflow,
    totalOutflow,
    netFlow,
    transactionCount: transactions.rows.length,
    accountSummaries,
    categorySummaries,
    alerts,
    notes: `자동 생성된 ${date} 자금일보`,
  }
}
