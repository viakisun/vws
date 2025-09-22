import type { BankAccount, Transaction, ExpectedTransaction } from '$lib/stores/funds'
import type { BudgetCategory, BudgetGoal } from '$lib/stores/budget'

export interface FinancialReportData {
  bankAccounts: BankAccount[]
  transactions: Transaction[]
  expectedTransactions: ExpectedTransaction[]
  budgetCategories: BudgetCategory[]
  budgetGoals: BudgetGoal[]
  reportDate: string
  reportPeriod: string
}

export interface ReportSummary {
  totalBalance: number
  totalIncome: number
  totalExpense: number
  netIncome: number
  expectedIncome: number
  expectedExpense: number
  expectedNetIncome: number
  budgetUtilization: number
  goalProgress: number
}

// HTML 보고서 생성
export function generateHTMLReport(data: FinancialReportData): string {
  const summary = calculateSummary(data)

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>재무 보고서 - ${data.reportDate}</title>
	<style>
		body { font-family: 'Malgun Gothic', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
		.container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
		.header { text-align: center; border-bottom: 2px solid #e5e5e5; padding-bottom: 20px; margin-bottom: 30px; }
		.header h1 { color: #333; margin: 0; font-size: 28px; }
		.header p { color: #666; margin: 5px 0 0 0; }
		.summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
		.summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #007bff; }
		.summary-card h3 { margin: 0 0 10px 0; color: #333; font-size: 14px; }
		.summary-card .value { font-size: 24px; font-weight: bold; color: #007bff; }
		.section { margin-bottom: 40px; }
		.section h2 { color: #333; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px; }
		table { width: 100%; border-collapse: collapse; margin-top: 15px; }
		th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e5e5; }
		th { background: #f8f9fa; font-weight: bold; color: #333; }
		.income { color: #28a745; }
		.expense { color: #dc3545; }
		.text-right { text-align: right; }
		.progress-bar { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; }
		.progress-fill { height: 100%; background: #007bff; transition: width 0.3s ease; }
		.progress-fill.warning { background: #ffc107; }
		.progress-fill.danger { background: #dc3545; }
		.footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #666; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>재무 보고서</h1>
			<p>보고서 기간: ${data.reportPeriod} | 생성일: ${new Date().toLocaleDateString('ko-KR')}</p>
		</div>

		<div class="summary">
			<div class="summary-card">
				<h3>총 잔고</h3>
				<div class="value">₩${summary.totalBalance.toLocaleString()}</div>
			</div>
			<div class="summary-card">
				<h3>총 수입</h3>
				<div class="value income">₩${summary.totalIncome.toLocaleString()}</div>
			</div>
			<div class="summary-card">
				<h3>총 지출</h3>
				<div class="value expense">₩${summary.totalExpense.toLocaleString()}</div>
			</div>
			<div class="summary-card">
				<h3>순이익</h3>
				<div class="value ${summary.netIncome >= 0 ? 'income' : 'expense'}">₩${summary.netIncome.toLocaleString()}</div>
			</div>
		</div>

		<div class="section">
			<h2>통장 잔고 현황</h2>
			<table>
				<thead>
					<tr>
						<th>계좌명</th>
						<th>은행</th>
						<th>계좌번호</th>
						<th class="text-right">잔고</th>
					</tr>
				</thead>
				<tbody>
					${data.bankAccounts
            .map(
              account => `
						<tr>
							<td>${account.name}</td>
							<td>${account.bankName || '-'}</td>
							<td>${account.accountNumber}</td>
							<td class="text-right">₩${account.balance.toLocaleString()}</td>
						</tr>
					`
            )
            .join('')}
				</tbody>
			</table>
		</div>

		<div class="section">
			<h2>거래 내역</h2>
			<table>
				<thead>
					<tr>
						<th>날짜</th>
						<th>내용</th>
						<th>분류</th>
						<th class="text-right">금액</th>
						<th>구분</th>
					</tr>
				</thead>
				<tbody>
					${data.transactions
            .map(
              transaction => `
						<tr>
							<td>${new Date(transaction.date).toLocaleDateString('ko-KR')}</td>
							<td>${transaction.description}</td>
							<td>${transaction.category}</td>
							<td class="text-right ${transaction.type === 'income' ? 'income' : 'expense'}">
								${transaction.type === 'income' ? '+' : '-'}₩${transaction.amount.toLocaleString()}
							</td>
							<td>${transaction.type === 'income' ? '수입' : '지출'}</td>
						</tr>
					`
            )
            .join('')}
				</tbody>
			</table>
		</div>

		<div class="section">
			<h2>예산 현황</h2>
			<table>
				<thead>
					<tr>
						<th>카테고리</th>
						<th class="text-right">예산</th>
						<th class="text-right">사용액</th>
						<th class="text-right">사용률</th>
						<th>진행률</th>
					</tr>
				</thead>
				<tbody>
					${data.budgetCategories
            .map(category => {
              const usage = (category.spent / category.amount) * 100
              return `
							<tr>
								<td>${category.name}</td>
								<td class="text-right">₩${category.amount.toLocaleString()}</td>
								<td class="text-right">₩${category.spent.toLocaleString()}</td>
								<td class="text-right">${usage.toFixed(1)}%</td>
								<td>
									<div class="progress-bar">
										<div class="progress-fill ${usage > 100 ? 'danger' : usage > 80 ? 'warning' : ''}" 
											 style="width: ${Math.min(usage, 100)}%"></div>
									</div>
								</td>
							</tr>
						`
            })
            .join('')}
				</tbody>
			</table>
		</div>

		<div class="footer">
			<p>이 보고서는 자동으로 생성되었습니다. | Workstream 재무 관리 시스템</p>
		</div>
	</div>
</body>
</html>
	`
}

// CSV 보고서 생성
export function generateCSVReport(data: FinancialReportData): string {
  const summary = calculateSummary(data)

  let csv = '재무 보고서\n'
  csv += `보고서 기간,${data.reportPeriod}\n`
  csv += `생성일,${new Date().toLocaleDateString('ko-KR')}\n\n`

  // 요약 정보
  csv += '요약 정보\n'
  csv += '항목,금액\n'
  csv += `총 잔고,${summary.totalBalance}\n`
  csv += `총 수입,${summary.totalIncome}\n`
  csv += `총 지출,${summary.totalExpense}\n`
  csv += `순이익,${summary.netIncome}\n\n`

  // 통장 잔고
  csv += '통장 잔고\n'
  csv += '계좌명,은행,계좌번호,잔고\n'
  data.bankAccounts.forEach(account => {
    csv += `${account.name},${account.bankName || ''},${account.accountNumber},${account.balance}\n`
  })
  csv += '\n'

  // 거래 내역
  csv += '거래 내역\n'
  csv += '날짜,내용,분류,금액,구분\n'
  data.transactions.forEach(transaction => {
    csv += `${transaction.date},${transaction.description},${transaction.category},${transaction.amount},${transaction.type === 'income' ? '수입' : '지출'}\n`
  })
  csv += '\n'

  // 예산 현황
  csv += '예산 현황\n'
  csv += '카테고리,예산,사용액,사용률\n'
  data.budgetCategories.forEach(category => {
    const usage = (category.spent / category.amount) * 100
    csv += `${category.name},${category.amount},${category.spent},${usage.toFixed(1)}%\n`
  })

  return csv
}

// 요약 정보 계산
function calculateSummary(data: FinancialReportData): ReportSummary {
  const totalBalance = data.bankAccounts.reduce((sum, account) => sum + account.balance, 0)
  const totalIncome = data.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = data.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  const expectedIncome = data.expectedTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const expectedExpense = data.expectedTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const budgetUtilization =
    data.budgetCategories.length > 0
      ? (data.budgetCategories.reduce(
          (sum, category) => sum + category.spent / category.amount,
          0
        ) /
          data.budgetCategories.length) *
        100
      : 0

  const goalProgress =
    data.budgetGoals.length > 0
      ? (data.budgetGoals.reduce((sum, goal) => sum + goal.currentAmount / goal.targetAmount, 0) /
          data.budgetGoals.length) *
        100
      : 0

  return {
    totalBalance,
    totalIncome,
    totalExpense,
    netIncome: totalIncome - totalExpense,
    expectedIncome,
    expectedExpense,
    expectedNetIncome: expectedIncome - expectedExpense,
    budgetUtilization,
    goalProgress
  }
}

// 보고서 다운로드
export function downloadReport(content: string, filename: string, type: 'html' | 'csv') {
  const mimeType = type === 'html' ? 'text/html' : 'text/csv'
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
