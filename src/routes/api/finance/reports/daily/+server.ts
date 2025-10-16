import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// ============================================================================
// Types
// ============================================================================

interface DailyReportRow {
  id: string
  report_date: string
  status: string
  opening_balance: string | number
  closing_balance: string | number
  total_inflow: string | number
  total_outflow: string | number
  net_flow: string | number
  transaction_count: number
  account_summaries: unknown
  category_summaries: unknown
  alerts: unknown
  notes: string
  generated_at: string
  generated_by: string
  created_at: string
  updated_at: string
}

interface TransactionRow {
  id: string
  account_id: string
  category_id: string
  amount: string | number
  type: string
  status: string
  transaction_date: string
  category_name: string
  category_type: string
  account_name: string
}

interface AccountRow {
  id: string
  name: string
  balance: string | number
}

interface CategorySummary {
  inflow: number
  outflow: number
  count: number
}

interface AccountSummary {
  accountId: string
  accountName: string
  balance: number
}

interface Alert {
  type: string
  severity: string
  message: string
}

interface DailyReportData {
  openingBalance: number
  closingBalance: number
  totalInflow: number
  totalOutflow: number
  netFlow: number
  transactionCount: number
  accountSummaries: AccountSummary[]
  categorySummaries: Record<string, CategorySummary>
  alerts: Alert[]
  notes: string
}

interface DailyReport extends DailyReportData {
  id: string
  reportDate: string
  status: string
  generatedAt: string
  generatedBy: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_GENERATED_BY = 'system'
const ALERT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * DB row를 DailyReport 객체로 변환
 */
function mapRowToDailyReport(row: DailyReportRow): DailyReport {
  return {
    id: row.id,
    reportDate: row.report_date,
    status: row.status,
    openingBalance: parseFloat(String(row.opening_balance)),
    closingBalance: parseFloat(String(row.closing_balance)),
    totalInflow: parseFloat(String(row.total_inflow)),
    totalOutflow: parseFloat(String(row.total_outflow)),
    netFlow: parseFloat(String(row.net_flow)),
    transactionCount: row.transaction_count,
    accountSummaries: row.account_summaries as AccountSummary[],
    categorySummaries: row.category_summaries as Record<string, CategorySummary>,
    alerts: row.alerts as Alert[],
    notes: row.notes,
    generatedAt: row.generated_at,
    generatedBy: row.generated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * 에러 응답 생성
 */
function errorResponse(message: string, status: number) {
  return json({ success: false, error: message }, { status })
}

/**
 * 날짜 문자열 포맷 (YYYY-MM-DD)
 */
function formatDateString(date?: string | Date): string {
  if (date) {
    return new Date(date).toISOString().split('T')[0]
  }
  return new Date().toISOString().split('T')[0]
}

/**
 * 전일 날짜 계산
 */
function getPreviousDate(date: string): string {
  const targetDate = new Date(date)
  targetDate.setDate(targetDate.getDate() - 1)
  return targetDate.toISOString().split('T')[0]
}

/**
 * 자금일보 존재 여부 확인
 */
async function reportExists(date: string): Promise<boolean> {
  try {
    const result = await query<{ id: string }>(
      'SELECT id FROM finance_daily_reports WHERE report_date = $1',
      [date],
    )
    return result.rows.length > 0
  } catch {
    return false
  }
}

// ============================================================================
// Data Generation Functions
// ============================================================================

/**
 * 전일 종료 잔액 조회 (당일 시작 잔액)
 */
async function getOpeningBalance(date: string): Promise<number> {
  const previousDate = getPreviousDate(date)
  const result = await query<{ closing_balance: string | number }>(
    'SELECT closing_balance FROM finance_daily_reports WHERE report_date = $1',
    [previousDate],
  )

  return result.rows.length > 0 ? parseFloat(String(result.rows[0].closing_balance)) : 0
}

/**
 * 당일 거래 내역 조회
 */
async function getDailyTransactions(date: string) {
  return await query<TransactionRow>(
    `SELECT
       t.*,
       c.name as category_name,
       c.type as category_type,
       a.name as account_name
     FROM finance_transactions t
     LEFT JOIN finance_categories c ON t.category_id = c.id
     LEFT JOIN finance_accounts a ON t.account_id = a.id
     WHERE t.transaction_date = $1 AND t.status = 'completed'`,
    [date],
  )
}

/**
 * 활성 계좌 목록 조회
 */
async function getActiveAccounts() {
  return await query<AccountRow>(
    "SELECT id, name, balance FROM finance_accounts WHERE status = 'active'",
  )
}

/**
 * 카테고리별 수입/지출 요약 계산
 */
function calculateCategorySummaries(transactions: TransactionRow[]): {
  totalInflow: number
  totalOutflow: number
  categorySummaries: Record<string, CategorySummary>
} {
  let totalInflow = 0
  let totalOutflow = 0
  const categorySummaries: Record<string, CategorySummary> = {}

  for (const transaction of transactions) {
    const amount = parseFloat(String(transaction.amount))
    const categoryName = transaction.category_name || '기타'

    // 카테고리 초기화
    if (!categorySummaries[categoryName]) {
      categorySummaries[categoryName] = { inflow: 0, outflow: 0, count: 0 }
    }

    // 수입/지출 분류
    if (transaction.type === 'income') {
      totalInflow += amount
      categorySummaries[categoryName].inflow += amount
      categorySummaries[categoryName].count += 1
    } else if (transaction.type === 'expense') {
      totalOutflow += amount
      categorySummaries[categoryName].outflow += amount
      categorySummaries[categoryName].count += 1
    }
  }

  return { totalInflow, totalOutflow, categorySummaries }
}

/**
 * 계좌별 요약 생성
 */
function createAccountSummaries(accounts: AccountRow[]): AccountSummary[] {
  return accounts.map((account) => ({
    accountId: account.id,
    accountName: account.name,
    balance: parseFloat(String(account.balance)),
  }))
}

/**
 * 알림 생성
 */
function generateAlerts(netFlow: number, totalInflow: number, totalOutflow: number): Alert[] {
  const alerts: Alert[] = []

  // 마이너스 현금흐름 경고
  if (netFlow < 0) {
    alerts.push({
      type: 'negative_cash_flow',
      severity: ALERT_SEVERITY.MEDIUM,
      message: `당일 현금흐름이 마이너스입니다. (₩${Math.abs(netFlow).toLocaleString()})`,
    })
  }

  // 지출 과다 경고
  if (totalOutflow > totalInflow * 2) {
    alerts.push({
      type: 'high_expense_ratio',
      severity: ALERT_SEVERITY.HIGH,
      message: '지출이 수입의 2배를 초과했습니다.',
    })
  }

  return alerts
}

/**
 * 자금일보 데이터 생성
 */
async function generateDailyReportData(date: string): Promise<DailyReportData> {
  // 1. 시작 잔액 조회 (전일 종료 잔액)
  const openingBalance = await getOpeningBalance(date)

  // 2. 당일 거래 내역 조회
  const transactionsResult = await getDailyTransactions(date)
  const transactions = transactionsResult.rows

  // 3. 카테고리별 수입/지출 계산
  const { totalInflow, totalOutflow, categorySummaries } = calculateCategorySummaries(transactions)

  // 4. 순 현금흐름 및 종료 잔액 계산
  const netFlow = totalInflow - totalOutflow
  const closingBalance = openingBalance + netFlow

  // 5. 계좌별 요약 생성
  const accountsResult = await getActiveAccounts()
  const accountSummaries = createAccountSummaries(accountsResult.rows)

  // 6. 알림 생성
  const alerts = generateAlerts(netFlow, totalInflow, totalOutflow)

  return {
    openingBalance,
    closingBalance,
    totalInflow,
    totalOutflow,
    netFlow,
    transactionCount: transactions.length,
    accountSummaries,
    categorySummaries,
    alerts,
    notes: `자동 생성된 ${date} 자금일보`,
  }
}

// ============================================================================
// Request Handlers
// ============================================================================

/**
 * 자금일보 조회 API
 * GET /api/finance/reports/daily?date=2025-01-01
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    const date = formatDateString(url.searchParams.get('date') || undefined)

    // 자금일보 조회
    const result = await query<DailyReportRow>(
      'SELECT id, report_date, total_income, total_expense, balance, created_at::text as created_at, updated_at::text as updated_at FROM finance_daily_reports WHERE report_date = $1',
      [date],
    )

    if (result.rows.length === 0) {
      return errorResponse('해당 날짜의 자금일보가 없습니다.', 404)
    }

    const report = mapRowToDailyReport(result.rows[0])

    return json({
      success: true,
      data: report,
      message: '자금일보를 조회했습니다.',
    })
  } catch (error) {
    logger.error('자금일보 조회 실패:', error)
    return errorResponse('자금일보를 조회할 수 없습니다.', 500)
  }
}

/**
 * 자금일보 생성 API
 * POST /api/finance/reports/daily
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json()
    const date = formatDateString(body.date)

    // 중복 확인
    if (await reportExists(date)) {
      return errorResponse('해당 날짜의 자금일보가 이미 존재합니다.', 400)
    }

    // 자금일보 데이터 생성
    const reportData = await generateDailyReportData(date)

    // DB 저장
    const result = await query<DailyReportRow>(
      `INSERT INTO finance_daily_reports (
         report_date, status, opening_balance, closing_balance,
         total_inflow, total_outflow, net_flow, transaction_count,
         account_summaries, category_summaries, alerts, notes,
         generated_at, generated_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING 
         id,
         report_date,
         status,
         opening_balance,
         closing_balance,
         total_inflow,
         total_outflow,
         net_flow,
         transaction_count,
         account_summaries,
         category_summaries,
         alerts,
         notes,
         generated_at,
         generated_by,
         created_at::text,
         updated_at::text`,
      [
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
        DEFAULT_GENERATED_BY,
      ],
    )

    const report = mapRowToDailyReport(result.rows[0])

    return json({
      success: true,
      data: report,
      message: '자금일보가 성공적으로 생성되었습니다.',
    })
  } catch (error) {
    logger.error('자금일보 생성 실패:', error)
    return errorResponse('자금일보 생성에 실패했습니다.', 500)
  }
}
