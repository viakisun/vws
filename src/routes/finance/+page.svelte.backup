<script lang="ts">
	import { onMount } from 'svelte';
	import ThemeCard from '$lib/components/ui/ThemeCard.svelte';
	import ThemeButton from '$lib/components/ui/ThemeButton.svelte';
	import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte';
	import ThemePageHeader from '$lib/components/ui/ThemePageHeader.svelte';
	import ThemeSectionHeader from '$lib/components/ui/ThemeSectionHeader.svelte';
	import ThemeStatCard from '$lib/components/ui/ThemeStatCard.svelte';
	import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte';
	import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte';
	import TransactionModal from '$lib/components/ui/TransactionModal.svelte';
	import TransactionEditModal from '$lib/components/ui/TransactionEditModal.svelte';
	import BankAccountModal from '$lib/components/ui/BankAccountModal.svelte';
	import AIAnalysisModal from '$lib/components/ui/AIAnalysisModal.svelte';
	import SimpleChart from '$lib/components/ui/SimpleChart.svelte';
	import BudgetModal from '$lib/components/ui/BudgetModal.svelte';
	import NotificationPanel from '$lib/components/ui/NotificationPanel.svelte';
	import { 
		BanknoteIcon, 
		TrendingUpIcon, 
		TrendingDownIcon, 
		DollarSignIcon,
		PlusIcon,
		FileTextIcon,
		DownloadIcon,
		UploadIcon,
		BrainIcon,
		BarChart3Icon,
		PieChartIcon
	} from 'lucide-svelte';
	import { formatCurrency, formatDate } from '$lib/utils/format';
	import { 
		bankAccounts, 
		transactions, 
		expectedTransactions, 
		addExpectedTransaction,
		addTransaction,
		updateTransaction,
		deleteTransaction,
		addBankAccount,
		updateBankAccount,
		deleteBankAccount,
		exportForAIAnalysis,
		type BankAccount,
		type Transaction,
		type ExpectedTransaction
	} from '$lib/stores/funds';
	import { 
		generateAnalysisPrompt, 
		analyzeCosts, 
		predictCashFlow, 
		assessRisk,
		type AIAnalysisRequest,
		type AIAnalysisResponse
	} from '$lib/utils/ai-analysis';
	import { 
		budgetCategories, 
		budgetGoals, 
		addBudgetCategory, 
		updateBudgetCategory, 
		deleteBudgetCategory,
		addBudgetGoal, 
		updateBudgetGoal, 
		deleteBudgetGoal,
		calculateBudgetUsage,
		calculateGoalProgress,
		type BudgetCategory,
		type BudgetGoal
	} from '$lib/stores/budget';
	import { 
		generateHTMLReport, 
		generateCSVReport, 
		downloadReport,
		type FinancialReportData
	} from '$lib/utils/report-generator';
	import {
		checkBudgetOverage,
		checkGoalDeadlines,
		checkLowBalance,
		checkFundsReportDeadline,
		notifications,
		notificationSettings
	} from '$lib/stores/notifications';
	import {
		createBackup,
		downloadBackup,
		autoBackup,
		loadAutoBackup,
		readBackupFile,
		getRestoreConfirmMessage,
		getBackupStats,
		type BackupData
	} from '$lib/utils/backup';

	let currentTime = new Date();
	let inputDeadline = new Date();
	inputDeadline.setHours(10, 30, 0, 0);

	let isInputClosed = currentTime > inputDeadline;
	let isModalOpen = false;
	let isTransactionModalOpen = false;
	let isAccountModalOpen = false;
	let isBudgetModalOpen = false;
	let isAIModalOpen = false;
	let aiAnalysisResult: AIAnalysisResponse | null = null;
	let isAILoading = false;
	let selectedTransaction: Transaction | null = null;
	let selectedAccount: BankAccount | null = null;
	let selectedBudgetItem: BudgetCategory | BudgetGoal | null = null;
	let budgetModalType: 'category' | 'goal' = 'category';

	let totalBalance = 0;
	let totalIncome = 0;
	let totalExpense = 0;
	let expectedIncome = 0;
	let expectedExpense = 0;

	// 차트 데이터
	let expenseChartData: Array<{ label: string; value: number; color?: string }> = [];
	let incomeChartData: Array<{ label: string; value: number; color?: string }> = [];
	let monthlyTrendData: Array<{ label: string; value: number; color?: string }> = [];

	$: {
		bankAccounts.subscribe(accounts => {
			totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
		})();
		
		transactions.subscribe(trans => {
			totalIncome = trans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
			totalExpense = trans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
			
			// 지출 차트 데이터 생성
			const expenseCategories: { [key: string]: number } = {};
			trans.filter(t => t.type === 'expense').forEach(transaction => {
				expenseCategories[transaction.category] = (expenseCategories[transaction.category] || 0) + transaction.amount;
			});
			expenseChartData = Object.entries(expenseCategories)
				.map(([label, value]) => ({ label, value }))
				.sort((a, b) => b.value - a.value)
				.slice(0, 5);

			// 수입 차트 데이터 생성
			const incomeCategories: { [key: string]: number } = {};
			trans.filter(t => t.type === 'income').forEach(transaction => {
				incomeCategories[transaction.category] = (incomeCategories[transaction.category] || 0) + transaction.amount;
			});
			incomeChartData = Object.entries(incomeCategories)
				.map(([label, value]) => ({ label, value }))
				.sort((a, b) => b.value - a.value)
				.slice(0, 5);

			// 월별 트렌드 데이터 생성
			const monthlyData: { [key: string]: number } = {};
			trans.forEach(transaction => {
				const month = transaction.date.substring(0, 7); // YYYY-MM
				monthlyData[month] = (monthlyData[month] || 0) + transaction.amount;
			});
			monthlyTrendData = Object.entries(monthlyData)
				.map(([label, value]) => ({ label, value }))
				.sort((a, b) => a.label.localeCompare(b.label))
				.slice(-6); // 최근 6개월
		})();
		
		expectedTransactions.subscribe(expected => {
			expectedIncome = expected.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
			expectedExpense = expected.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
		})();
	}

	onMount(() => {
		const timer = setInterval(() => {
			currentTime = new Date();
			isInputClosed = currentTime > inputDeadline;
		}, 1000);

		// 초기 알림 체크
		runNotificationChecks();

		// 초기 자동 백업
		performAutoBackup();

		// 주기적 알림 체크 (5분마다)
		const notificationTimer = setInterval(runNotificationChecks, 5 * 60 * 1000);

		// 주기적 자동 백업 (30분마다)
		const backupTimer = setInterval(performAutoBackup, 30 * 60 * 1000);

		return () => {
			clearInterval(timer);
			clearInterval(notificationTimer);
			clearInterval(backupTimer);
		};
	});

	function openAddExpectedTransactionModal() {
		isModalOpen = true;
	}

	function handleTransactionSubmit(event: CustomEvent) {
		const transactionData = event.detail;
		addExpectedTransaction(transactionData);
	}

	function openAddTransactionModal() {
		selectedTransaction = null;
		isTransactionModalOpen = true;
	}

	function openEditTransactionModal(transaction: Transaction) {
		selectedTransaction = transaction;
		isTransactionModalOpen = true;
	}

	function handleTransactionEditSubmit(event: CustomEvent) {
		const transactionData = event.detail;
		if (selectedTransaction) {
			updateTransaction(transactionData);
		} else {
			addTransaction(transactionData);
		}
	}

	function confirmDeleteTransaction(transaction: Transaction) {
		if (confirm(`"${transaction.description}" 거래를 삭제하시겠습니까?`)) {
			deleteTransaction(transaction.id);
		}
	}

	function openAddAccountModal() {
		selectedAccount = null;
		isAccountModalOpen = true;
	}

	function openEditAccountModal(account: BankAccount) {
		selectedAccount = account;
		isAccountModalOpen = true;
	}

	function handleAccountSubmit(event: CustomEvent) {
		const accountData = event.detail;
		if (selectedAccount) {
			updateBankAccount(accountData);
		} else {
			addBankAccount(accountData);
		}
	}

	function confirmDeleteAccount(account: BankAccount) {
		if (confirm(`"${account.name}" 계좌를 삭제하시겠습니까?`)) {
			deleteBankAccount(account.id);
		}
	}

	function openAddBudgetCategoryModal() {
		selectedBudgetItem = null;
		budgetModalType = 'category';
		isBudgetModalOpen = true;
	}

	function openAddBudgetGoalModal() {
		selectedBudgetItem = null;
		budgetModalType = 'goal';
		isBudgetModalOpen = true;
	}

	function openEditBudgetCategoryModal(category: BudgetCategory) {
		selectedBudgetItem = category;
		budgetModalType = 'category';
		isBudgetModalOpen = true;
	}

	function openEditBudgetGoalModal(goal: BudgetGoal) {
		selectedBudgetItem = goal;
		budgetModalType = 'goal';
		isBudgetModalOpen = true;
	}

	function handleBudgetSubmit(event: CustomEvent) {
		const budgetData = event.detail;
		if (budgetModalType === 'category') {
			if (selectedBudgetItem) {
				updateBudgetCategory(budgetData);
			} else {
				addBudgetCategory(budgetData);
			}
		} else {
			if (selectedBudgetItem) {
				updateBudgetGoal(budgetData);
			} else {
				addBudgetGoal(budgetData);
			}
		}
	}

	function confirmDeleteBudgetCategory(category: BudgetCategory) {
		if (confirm(`"${category.name}" 예산 카테고리를 삭제하시겠습니까?`)) {
			deleteBudgetCategory(category.id);
		}
	}

	function confirmDeleteBudgetGoal(goal: BudgetGoal) {
		if (confirm(`"${goal.name}" 예산 목표를 삭제하시겠습니까?`)) {
			deleteBudgetGoal(goal.id);
		}
	}

	function exportFundsReport() {
		const data = exportForAIAnalysis();
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `funds-report-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function generateHTMLFinancialReport() {
		const reportData: FinancialReportData = {
			bankAccounts: $bankAccounts,
			transactions: $transactions,
			expectedTransactions: $expectedTransactions,
			budgetCategories: $budgetCategories,
			budgetGoals: $budgetGoals,
			reportDate: new Date().toISOString().split('T')[0],
			reportPeriod: `${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월`
		};

		const htmlReport = generateHTMLReport(reportData);
		const filename = `financial-report-${reportData.reportDate}.html`;
		downloadReport(htmlReport, filename, 'html');
	}

	function generateCSVFinancialReport() {
		const reportData: FinancialReportData = {
			bankAccounts: $bankAccounts,
			transactions: $transactions,
			expectedTransactions: $expectedTransactions,
			budgetCategories: $budgetCategories,
			budgetGoals: $budgetGoals,
			reportDate: new Date().toISOString().split('T')[0],
			reportPeriod: `${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월`
		};

		const csvReport = generateCSVReport(reportData);
		const filename = `financial-report-${reportData.reportDate}.csv`;
		downloadReport(csvReport, filename, 'csv');
	}

	function runNotificationChecks() {
		checkBudgetOverage($budgetCategories);
		checkGoalDeadlines($budgetGoals);
		checkLowBalance($bankAccounts, $transactions);
		checkFundsReportDeadline();
	}

	function createDataBackup() {
		const backupData = createBackup(
			$bankAccounts,
			$transactions,
			$expectedTransactions,
			$budgetCategories,
			$budgetGoals,
			$notifications,
			$notificationSettings
		);
		downloadBackup(backupData);
	}

	function handleBackupRestore(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (!file) return;

		readBackupFile(file)
			.then(backupData => {
				const confirmMessage = getRestoreConfirmMessage(backupData);
				if (confirm(confirmMessage)) {
					restoreFromBackup(backupData);
				}
			})
			.catch(error => {
				alert(`백업 복원 실패: ${error.message}`);
			})
			.finally(() => {
				// 파일 입력 초기화
				input.value = '';
			});
	}

	function restoreFromBackup(backupData: BackupData) {
		try {
			// 스토어 업데이트
			bankAccounts.set(backupData.data.bankAccounts);
			transactions.set(backupData.data.transactions);
			expectedTransactions.set(backupData.data.expectedTransactions);
			budgetCategories.set(backupData.data.budgetCategories);
			budgetGoals.set(backupData.data.budgetGoals);
			notifications.set(backupData.data.notifications);
			notificationSettings.set(backupData.data.notificationSettings);

			alert('백업이 성공적으로 복원되었습니다.');
		} catch (error) {
			alert(`백업 복원 중 오류가 발생했습니다: ${(error as Error).message}`);
		}
	}

	function performAutoBackup() {
		autoBackup(
			$bankAccounts,
			$transactions,
			$expectedTransactions,
			$budgetCategories,
			$budgetGoals,
			$notifications,
			$notificationSettings
		);
	}

	async function analyzeWithAI() {
		const data = exportForAIAnalysis();
		const analysisRequest: AIAnalysisRequest = {
			...data,
			analysisType: 'cost_analysis'
		};

		isAILoading = true;
		isAIModalOpen = true;

		try {
			// 실제 AI API 호출 대신 로컬 분석 수행
			await new Promise(resolve => setTimeout(resolve, 2000)); // 시뮬레이션

			// 로컬 분석 결과 생성
			const costAnalysis = analyzeCosts(data.transactions);
			const cashFlowPrediction = predictCashFlow(data.bankAccounts, data.expectedTransactions);
			const riskAssessment = assessRisk(data.bankAccounts, data.transactions, data.expectedTransactions);

			// AI 분석 결과 생성
			aiAnalysisResult = {
				analysisType: 'cost_analysis',
				summary: `현재 자금 상황을 분석한 결과, 총 ${data.summary.totalBalance.toLocaleString()}원의 현금을 보유하고 있으며, 월 평균 ${(data.summary.totalExpense / 12).toLocaleString()}원의 지출이 발생하고 있습니다.`,
				insights: [
					`상위 지출 항목: ${costAnalysis.topExpenses[0]?.category || 'N/A'} (${costAnalysis.topExpenses[0]?.percentage.toFixed(1) || 0}%)`,
					`현금 보유량: ${(data.summary.totalBalance / (data.summary.totalExpense / 12)).toFixed(1)}개월 운영비`,
					`예상 현금흐름: 다음 달 ${cashFlowPrediction[0]?.endingBalance.toLocaleString() || 0}원 예상`
				],
				recommendations: [
					'주요 지출 항목의 비용 최적화 검토',
					'예상 수입의 확실성 확보를 위한 계약 관리 강화',
					'현금 보유량 유지를 위한 수입원 다각화'
				],
				riskFactors: riskAssessment.riskFactors,
				metrics: {
					cashFlowHealth: Math.max(0, 100 - riskAssessment.riskScore),
					expenseRatio: data.summary.totalExpense / (data.summary.totalIncome || 1),
					incomeStability: 75, // 계산된 값으로 대체 가능
					riskLevel: riskAssessment.riskLevel
				},
				forecast: {
					nextMonth: {
						expectedIncome: cashFlowPrediction[0]?.expectedIncome || 0,
						expectedExpense: cashFlowPrediction[0]?.expectedExpense || 0,
						netCashFlow: (cashFlowPrediction[0]?.expectedIncome || 0) - (cashFlowPrediction[0]?.expectedExpense || 0)
					},
					nextQuarter: {
						expectedIncome: cashFlowPrediction.slice(0, 3).reduce((sum, p) => sum + p.expectedIncome, 0),
						expectedExpense: cashFlowPrediction.slice(0, 3).reduce((sum, p) => sum + p.expectedExpense, 0),
						netCashFlow: cashFlowPrediction.slice(0, 3).reduce((sum, p) => sum + p.expectedIncome - p.expectedExpense, 0)
					}
				}
			};
		} catch (error) {
			console.error('AI 분석 중 오류 발생:', error);
			alert('AI 분석 중 오류가 발생했습니다.');
		} finally {
			isAILoading = false;
		}
	}
</script>

<div class="max-w-7xl mx-auto px-4 py-8 space-y-6">
	<!-- 헤더 -->
	<ThemePageHeader 
		title="재무/회계 관리"
		subtitle="자금 일보 및 재무 현황 관리"
	/>
	
	<div class="flex justify-end items-center gap-3 mb-6">
		<NotificationPanel />
		
		<div class="relative group">
			<ThemeButton variant="primary" class="flex items-center gap-2">
				<FileTextIcon size={16} />
				보고서 생성
			</ThemeButton>
			<div class="absolute right-0 mt-2 w-48 rounded-md shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10" style="background: var(--color-surface); border-color: var(--color-border);">
				<div class="py-1">
					<button 
						onclick={generateHTMLFinancialReport}
						class="block w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-opacity"
						style="color: var(--color-text);"
					>
						HTML 보고서
					</button>
					<button 
						onclick={generateCSVFinancialReport}
						class="block w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-opacity"
						style="color: var(--color-text);"
					>
						CSV 보고서
					</button>
					<button 
						onclick={exportFundsReport}
						class="block w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-opacity"
						style="color: var(--color-text);"
					>
						JSON 데이터
					</button>
					<div class="my-1" style="border-top: 1px solid var(--color-border);"></div>
					<button 
						onclick={createDataBackup}
						class="block w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-opacity"
						style="color: var(--color-text);"
					>
						<DownloadIcon size={14} class="inline mr-2" />
						데이터 백업
					</button>
					<label class="block w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-opacity cursor-pointer" style="color: var(--color-text);">
						<UploadIcon size={14} class="inline mr-2" />
						데이터 복원
						<input 
							type="file" 
							accept=".json" 
							onchange={handleBackupRestore}
							class="hidden"
						/>
					</label>
				</div>
			</div>
		</div>
		
		<ThemeButton 
			variant="success"
			onclick={analyzeWithAI}
			class="flex items-center gap-2"
		>
			<BrainIcon size={16} />
			AI 분석
		</ThemeButton>
	</div>

	<!-- 입력 마감 안내 -->
	{#if isInputClosed}
		<ThemeCard variant="elevated" class="p-4" style="background: var(--color-error-light); border-color: var(--color-error);">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5" style="color: var(--color-error);" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
					</svg>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium" style="color: var(--color-error);">입력 마감</h3>
					<div class="mt-2 text-sm" style="color: var(--color-error-dark);">
						<p>오전 10시 30분 입력 마감 시간이 지났습니다. 내일 오전 10시 30분까지 입력해주세요.</p>
					</div>
				</div>
			</div>
		</ThemeCard>
	{:else}
		<ThemeCard variant="elevated" class="p-4" style="background: var(--color-warning-light); border-color: var(--color-warning);">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5" style="color: var(--color-warning);" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
					</svg>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium" style="color: var(--color-warning);">입력 마감 안내</h3>
					<div class="mt-2 text-sm" style="color: var(--color-warning-dark);">
						<p>오전 10시 30분까지 자금 일보 입력을 완료해주세요. 남은 시간: <span class="font-mono font-bold">{Math.max(0, Math.floor((inputDeadline.getTime() - currentTime.getTime()) / 1000 / 60))}분</span></p>
					</div>
				</div>
			</div>
		</ThemeCard>
	{/if}

	<!-- 자금 현황 요약 -->
	<ThemeGrid cols={1} gap={6} class="md:grid-cols-4">
		<ThemeStatCard
			title="총 통장 잔고"
			value={formatCurrency(totalBalance)}
			icon={BanknoteIcon}
			color="blue"
		/>
		<ThemeStatCard
			title="실제 수입"
			value={formatCurrency(totalIncome)}
			icon={TrendingUpIcon}
			color="green"
		/>
		<ThemeStatCard
			title="실제 지출"
			value={formatCurrency(totalExpense)}
			icon={TrendingDownIcon}
			color="red"
		/>
		<ThemeStatCard
			title="순이익"
			value={formatCurrency(totalIncome - totalExpense)}
			icon={DollarSignIcon}
			color={totalIncome - totalExpense >= 0 ? 'green' : 'red'}
		/>
	</ThemeGrid>

	<!-- 통장 잔고 상세 -->
	<ThemeCard variant="elevated" class="p-6">
		<div class="flex justify-between items-center mb-4">
			<h2 class="text-xl font-semibold" style="color: var(--color-text);">통장 잔고</h2>
			<ThemeButton 
				variant="primary" 
				size="sm"
				onclick={openAddAccountModal}
				class="flex items-center gap-2"
			>
				<PlusIcon size={16} />
				계좌 추가
			</ThemeButton>
		</div>
		<ThemeSpacer size={4}>
			<div class="space-y-3">
				{#each $bankAccounts as account}
					<div class="flex justify-between items-center p-4 rounded-lg group transition-all duration-200 hover:scale-[1.02]" style="background: var(--color-surface-elevated);">
						<div>
							<h3 class="font-medium" style="color: var(--color-text);">{account.name}</h3>
							<p class="text-sm" style="color: var(--color-text-secondary);">{account.accountNumber}</p>
							{#if account.bankName}
								<p class="text-xs" style="color: var(--color-text-muted);">{account.bankName}</p>
							{/if}
						</div>
						<div class="flex items-center space-x-2">
							<div class="text-right">
								<p class="text-lg font-semibold" style="color: var(--color-text);">{formatCurrency(account.balance)}</p>
							</div>
							<div class="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
								<ThemeButton 
									variant="ghost" 
									size="sm"
									onclick={() => openEditAccountModal(account)}
									class="p-1"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
									</svg>
								</ThemeButton>
								<ThemeButton 
									variant="ghost" 
									size="sm"
									onclick={() => confirmDeleteAccount(account)}
									class="p-1 text-red-600 hover:text-red-700"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
									</svg>
								</ThemeButton>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</ThemeSpacer>
	</ThemeCard>

	<!-- 거래 내역 -->
	<ThemeCard variant="elevated" class="p-6">
		<div class="flex justify-between items-center mb-4">
			<h2 class="text-xl font-semibold" style="color: var(--color-text);">거래 내역</h2>
			<ThemeButton 
				variant="primary" 
				size="sm"
				onclick={openAddTransactionModal}
				class="flex items-center gap-2"
			>
				<PlusIcon size={16} />
				거래 추가
			</ThemeButton>
		</div>
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y" style="border-color: var(--color-border);">
				<thead style="background: var(--color-surface-elevated);">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--color-text-secondary);">날짜</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--color-text-secondary);">내용</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--color-text-secondary);">분류</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--color-text-secondary);">금액</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--color-text-secondary);">구분</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--color-text-secondary);">액션</th>
					</tr>
				</thead>
				<tbody class="divide-y" style="background: var(--color-surface); border-color: var(--color-border);">
					{#each $transactions as transaction}
						<tr class="group hover:opacity-80 transition-opacity">
							<td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--color-text);">
								{formatDate(transaction.date)}
							</td>
							<td class="px-6 py-4 text-sm" style="color: var(--color-text);">{transaction.description}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--color-text-secondary);">{transaction.category}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium" style="color: {transaction.type === 'income' ? 'var(--color-success)' : 'var(--color-error)'};">
								{transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<ThemeBadge variant={transaction.type === 'income' ? 'success' : 'error'}>
									{transaction.type === 'income' ? '수입' : '지출'}
								</ThemeBadge>
							</td>
							<td class="px-6 py-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
								<div class="flex space-x-1">
									<ThemeButton 
										variant="ghost" 
										size="sm"
										onclick={() => openEditTransactionModal(transaction)}
										class="p-1"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
										</svg>
									</ThemeButton>
									<ThemeButton 
										variant="ghost" 
										size="sm"
										onclick={() => confirmDeleteTransaction(transaction)}
										class="p-1 text-red-600 hover:text-red-700"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
										</svg>
									</ThemeButton>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</ThemeCard>

	<!-- 예상 거래 내역 -->
	<ThemeCard variant="elevated" class="p-6">
		<div class="flex justify-between items-center mb-4">
			<h2 class="text-xl font-semibold" style="color: var(--color-text);">예상 거래 내역</h2>
			{#if !isInputClosed}
				<ThemeButton 
					variant="success" 
					size="sm"
					onclick={openAddExpectedTransactionModal}
					class="flex items-center gap-2"
				>
					<PlusIcon size={16} />
					예상 거래 추가
				</ThemeButton>
			{/if}
		</div>
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y" style="border-color: var(--color-border);">
				<thead style="background: var(--color-surface-elevated);">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--color-text-secondary);">예상일</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--color-text-secondary);">내용</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--color-text-secondary);">분류</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--color-text-secondary);">금액</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--color-text-secondary);">구분</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: var(--color-text-secondary);">상태</th>
					</tr>
				</thead>
				<tbody class="divide-y" style="background: var(--color-surface); border-color: var(--color-border);">
					{#each $expectedTransactions as transaction}
						<tr class="hover:opacity-80 transition-opacity">
							<td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--color-text);">
								{formatDate(transaction.date)}
							</td>
							<td class="px-6 py-4 text-sm" style="color: var(--color-text);">{transaction.description}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--color-text-secondary);">{transaction.category}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium" style="color: {transaction.type === 'income' ? 'var(--color-success)' : 'var(--color-error)'};">
								{transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<ThemeBadge variant={transaction.type === 'income' ? 'success' : 'error'}>
									{transaction.type === 'income' ? '수입' : '지출'}
								</ThemeBadge>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<ThemeBadge variant={transaction.status === 'confirmed' ? 'success' : transaction.status === 'cancelled' ? 'error' : 'warning'}>
									{transaction.status === 'confirmed' ? '확정' : transaction.status === 'cancelled' ? '취소' : '대기'}
								</ThemeBadge>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</ThemeCard>

	<!-- 예상 현황 요약 -->
	<ThemeGrid cols={1} gap={6} class="md:grid-cols-2">
		<ThemeStatCard
			title="예상 수입"
			value={formatCurrency(expectedIncome)}
			icon={TrendingUpIcon}
			color="green"
		/>
		<ThemeStatCard
			title="예상 지출"
			value={formatCurrency(expectedExpense)}
			icon={TrendingDownIcon}
			color="red"
		/>
	</ThemeGrid>

	<!-- 차트 및 분석 섹션 -->
	<ThemeGrid cols={1} gap={6} class="lg:grid-cols-2">
		<!-- 지출 분석 차트 -->
		<ThemeCard variant="elevated" class="p-6">
			<h2 class="text-xl font-semibold mb-4" style="color: var(--color-text);">지출 분석</h2>
			{#if expenseChartData.length > 0}
				<SimpleChart data={expenseChartData} type="pie" height={250} />
			{:else}
				<div class="flex items-center justify-center h-64" style="color: var(--color-text-secondary);">
					<div class="text-center">
						<svg class="w-12 h-12 mx-auto mb-2" style="color: var(--color-text-muted);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
						</svg>
						<p>지출 데이터가 없습니다</p>
					</div>
				</div>
			{/if}
		</ThemeCard>

		<!-- 수입 분석 차트 -->
		<ThemeCard variant="elevated" class="p-6">
			<h2 class="text-xl font-semibold mb-4" style="color: var(--color-text);">수입 분석</h2>
			{#if incomeChartData.length > 0}
				<SimpleChart data={incomeChartData} type="pie" height={250} />
			{:else}
				<div class="flex items-center justify-center h-64" style="color: var(--color-text-secondary);">
					<div class="text-center">
						<svg class="w-12 h-12 mx-auto mb-2" style="color: var(--color-text-muted);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
						</svg>
						<p>수입 데이터가 없습니다</p>
					</div>
				</div>
			{/if}
		</ThemeCard>
	</ThemeGrid>

	<!-- 월별 트렌드 차트 -->
	<ThemeCard variant="elevated" class="p-6">
		<h2 class="text-xl font-semibold mb-4" style="color: var(--color-text);">월별 거래 트렌드</h2>
		{#if monthlyTrendData.length > 0}
			<SimpleChart data={monthlyTrendData} type="bar" height={200} />
		{:else}
			<div class="flex items-center justify-center h-48" style="color: var(--color-text-secondary);">
				<div class="text-center">
					<svg class="w-12 h-12 mx-auto mb-2" style="color: var(--color-text-muted);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
					</svg>
					<p>트렌드 데이터가 없습니다</p>
				</div>
			</div>
		{/if}
	</ThemeCard>

	<!-- 예산 관리 섹션 -->
	<ThemeGrid cols={1} gap={6} class="lg:grid-cols-2">
		<!-- 예산 카테고리 -->
		<ThemeCard variant="elevated" class="p-6">
			<div class="flex justify-between items-center mb-4">
				<h2 class="text-xl font-semibold" style="color: var(--color-text);">예산 카테고리</h2>
				<ThemeButton 
					variant="primary" 
					size="sm"
					onclick={openAddBudgetCategoryModal}
					class="flex items-center gap-2"
				>
					<PlusIcon size={16} />
					카테고리 추가
				</ThemeButton>
			</div>
			<ThemeSpacer size={4}>
				<div class="space-y-4">
					{#each $budgetCategories as category}
						{@const usage = calculateBudgetUsage(category)}
						<div class="p-4 rounded-lg transition-all duration-200 hover:scale-[1.02]" style="background: var(--color-surface-elevated); border: 1px solid var(--color-border);">
							<div class="flex justify-between items-start mb-2">
								<div>
									<h3 class="font-medium" style="color: var(--color-text);">{category.name}</h3>
									<p class="text-sm" style="color: var(--color-text-secondary);">
										{formatCurrency(category.spent)} / {formatCurrency(category.amount)}
									</p>
								</div>
								<div class="flex space-x-1">
									<ThemeButton 
										variant="ghost" 
										size="sm"
										onclick={() => openEditBudgetCategoryModal(category)}
										class="p-1"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
										</svg>
									</ThemeButton>
									<ThemeButton 
										variant="ghost" 
										size="sm"
										onclick={() => confirmDeleteBudgetCategory(category)}
										class="p-1 text-red-600 hover:text-red-700"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
										</svg>
									</ThemeButton>
								</div>
							</div>
							<div class="w-full rounded-full h-2" style="background: var(--color-border);">
								<div 
									class="h-2 rounded-full transition-all duration-300"
									style="width: {Math.min(usage, 100)}%; background: {usage > 100 ? 'var(--color-error)' : usage > 80 ? 'var(--color-warning)' : 'var(--color-success)'};"
								></div>
							</div>
							<div class="flex justify-between items-center mt-2">
								<span class="text-sm" style="color: var(--color-text-secondary);">{usage.toFixed(1)}%</span>
								<ThemeBadge variant={usage > 100 ? 'error' : usage > 80 ? 'warning' : 'success'}>
									{usage > 100 ? '초과' : usage > 80 ? '주의' : '정상'}
								</ThemeBadge>
							</div>
						</div>
					{/each}
				</div>
			</ThemeSpacer>
		</ThemeCard>

		<!-- 예산 목표 -->
		<ThemeCard variant="elevated" class="p-6">
			<div class="flex justify-between items-center mb-4">
				<h2 class="text-xl font-semibold" style="color: var(--color-text);">예산 목표</h2>
				<ThemeButton 
					variant="success" 
					size="sm"
					onclick={openAddBudgetGoalModal}
					class="flex items-center gap-2"
				>
					<PlusIcon size={16} />
					목표 추가
				</ThemeButton>
			</div>
			<ThemeSpacer size={4}>
				<div class="space-y-4">
					{#each $budgetGoals as goal}
						{@const progress = calculateGoalProgress(goal)}
						<div class="p-4 rounded-lg transition-all duration-200 hover:scale-[1.02]" style="background: var(--color-surface-elevated); border: 1px solid var(--color-border);">
							<div class="flex justify-between items-start mb-2">
								<div>
									<h3 class="font-medium" style="color: var(--color-text);">{goal.name}</h3>
									<p class="text-sm" style="color: var(--color-text-secondary);">
										{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
									</p>
									<p class="text-xs" style="color: var(--color-text-muted);">마감: {formatDate(goal.deadline)}</p>
								</div>
								<div class="flex space-x-1">
									<ThemeButton 
										variant="ghost" 
										size="sm"
										onclick={() => openEditBudgetGoalModal(goal)}
										class="p-1"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
										</svg>
									</ThemeButton>
									<ThemeButton 
										variant="ghost" 
										size="sm"
										onclick={() => confirmDeleteBudgetGoal(goal)}
										class="p-1 text-red-600 hover:text-red-700"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
										</svg>
									</ThemeButton>
								</div>
							</div>
							<div class="w-full rounded-full h-2" style="background: var(--color-border);">
								<div 
									class="h-2 rounded-full transition-all duration-300"
									style="width: {Math.min(progress, 100)}%; background: {progress >= 100 ? 'var(--color-success)' : progress >= 75 ? 'var(--color-primary)' : 'var(--color-warning)'};"
								></div>
							</div>
							<div class="flex justify-between items-center mt-2">
								<span class="text-sm" style="color: var(--color-text-secondary);">{progress.toFixed(1)}%</span>
								<ThemeBadge variant={goal.status === 'completed' ? 'success' : goal.status === 'paused' ? 'warning' : 'primary'}>
									{goal.status === 'completed' ? '완료' : goal.status === 'paused' ? '일시정지' : '진행중'}
								</ThemeBadge>
							</div>
						</div>
					{/each}
				</div>
			</ThemeSpacer>
		</ThemeCard>
	</ThemeGrid>
</div>

<!-- 예상 거래 추가 모달 -->
<TransactionModal 
	bind:isOpen={isModalOpen}
	on:submit={handleTransactionSubmit}
/>

<!-- 실제 거래 추가/수정 모달 -->
<TransactionEditModal 
	bind:isOpen={isTransactionModalOpen}
	transaction={selectedTransaction}
	bankAccounts={$bankAccounts}
	on:submit={handleTransactionEditSubmit}
/>

<!-- 계좌 추가/수정 모달 -->
<BankAccountModal 
	bind:isOpen={isAccountModalOpen}
	account={selectedAccount}
	on:submit={handleAccountSubmit}
/>

<!-- 예산 관리 모달 -->
<BudgetModal 
	bind:isOpen={isBudgetModalOpen}
	budgetItem={selectedBudgetItem}
	type={budgetModalType}
	on:submit={handleBudgetSubmit}
/>

<!-- AI 분석 결과 모달 -->
<AIAnalysisModal 
	bind:isOpen={isAIModalOpen}
	analysisResult={aiAnalysisResult}
	isLoading={isAILoading}
/>


