<script lang="ts">
	import type { BudgetSummary } from '$lib/types/project-budget'
	import { DollarSignIcon } from '@lucide/svelte'
	import { formatDateForDisplay } from '$lib/utils/date-handler'
	
	let { projectId, compact = false } = $props<{
		projectId: string;
		compact?: boolean;
	}>()
	
	// 예산 데이터 상태
	let budgetSummary = $state<BudgetSummary | null>(null)
	let loading = $state(true)
	let error = $state<string | null>(null)
	
	// 예산 데이터 로드
	async function loadBudgetSummary() {
		if (!projectId) return
		
		try {
			loading = true
			error = null
			
			const response = await fetch(`/api/project-management/projects/${projectId}/annual-budgets`)
			const result = await response.json()
			
			if (result.success && result.data?.summary) {
				budgetSummary = result.data.summary
			} else {
				budgetSummary = null
			}
		} catch (err) {
			console.error('예산 요약 로드 실패:', err)
			error = '예산 정보를 불러올 수 없습니다.'
		} finally {
			loading = false
		}
	}
	
	// 프로젝트 ID 변경 시 데이터 로드
	$effect(() => {
		if (projectId) {
			loadBudgetSummary()
		}
	})
	
	// 숫자 포맷팅 (더 정확하게)
	function formatCurrency(amount: number): string {
		if (amount >= 100000000) {
			const billions = amount / 100000000
			return billions % 1 === 0 ? `${billions}억원` : `${billions.toFixed(1)}억원`
		} else if (amount >= 10000000) {
			const tenMillions = amount / 10000000
			return tenMillions % 1 === 0 ? `${tenMillions}천만원` : `${tenMillions.toFixed(1)}천만원`
		} else if (amount >= 10000) {
			const tenThousands = amount / 10000
			return tenThousands % 1 === 0 ? `${tenThousands}만원` : `${tenThousands.toFixed(1)}만원`
		} else {
			return `${amount.toLocaleString()}원`
		}
	}
	
	// 비율 색상
	function getRatioColor(ratio: number): string {
		if (ratio >= 70) return 'text-green-600'
		if (ratio >= 50) return 'text-blue-600'
		if (ratio >= 30) return 'text-orange-600'
		return 'text-red-600'
	}
</script>

{#if loading}
	<div class="flex items-center justify-center py-4">
		<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
		<span class="ml-2 text-sm text-gray-500">예산 로딩 중...</span>
	</div>
{:else if error}
	<div class="py-2 text-sm text-gray-500 text-center">
		{error}
	</div>
{:else if budgetSummary}
	{#if compact}
		<!-- 연차별 사업비 구성 표 -->
		<div class="space-y-4">
			<!-- 전체 사업비 헤더 -->
			<div class="text-center">
				<div class="text-xl font-bold text-gray-900">
					{formatCurrency(budgetSummary.totalBudget)}
				</div>
				<div class="text-sm text-gray-600">{budgetSummary.totalYears}년차 전체 사업비</div>
			</div>
			
			<!-- 연차별 예산 구성 표 -->
			{#await fetch(`/api/project-management/projects/${projectId}/annual-budgets`).then(res => res.json())}
				<div class="text-center py-4">
					<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
					<p class="text-sm text-gray-500 mt-2">연차별 데이터 로딩 중...</p>
				</div>
			{:then result}
				{#if result.success && result.data?.budgets}
					<div class="overflow-x-auto">
						<table class="w-full text-sm border border-gray-200 rounded-lg">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-3 py-2 text-left font-medium text-gray-700 border-b">연차</th>
									<th class="px-3 py-2 text-center font-medium text-gray-700 border-b">사업기간</th>
									<th class="px-3 py-2 text-right font-medium text-green-700 border-b">지원금(현금)</th>
									<th class="px-3 py-2 text-right font-medium text-orange-700 border-b">기업부담금(현금)</th>
									<th class="px-3 py-2 text-right font-medium text-purple-700 border-b">기업부담금(현물)</th>
									<th class="px-3 py-2 text-right font-medium text-blue-700 border-b">합계 현금</th>
									<th class="px-3 py-2 text-right font-medium text-purple-700 border-b">합계 현물</th>
									<th class="px-3 py-2 text-right font-medium text-gray-900 border-b">총 합계</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200">
								{#each result.data.budgets as budget}
									<tr class="hover:bg-gray-50">
										<td class="px-3 py-2 font-medium text-gray-900">{budget.year}차년도</td>
										<td class="px-3 py-2 text-center text-gray-700 text-xs">
											{#if budget.startDate && budget.endDate}
												{formatDateForDisplay(budget.startDate, 'ISO')} ~ {formatDateForDisplay(budget.endDate, 'ISO')}
											{:else}
												미정
											{/if}
										</td>
										<td class="px-3 py-2 text-right text-green-800">{formatCurrency(budget.governmentFunding)}</td>
										<td class="px-3 py-2 text-right text-orange-800">{formatCurrency(budget.companyCash)}</td>
										<td class="px-3 py-2 text-right text-purple-800">{formatCurrency(budget.companyInKind)}</td>
										<td class="px-3 py-2 text-right text-blue-800 font-medium">{formatCurrency(budget.totalCash)}</td>
										<td class="px-3 py-2 text-right text-purple-800 font-medium">{formatCurrency(budget.totalInKind)}</td>
										<td class="px-3 py-2 text-right text-gray-900 font-bold">{formatCurrency(budget.yearlyTotal)}</td>
									</tr>
								{/each}
								<!-- 총합계 행 -->
								<tr class="bg-blue-50 font-bold">
									<td class="px-3 py-2 text-gray-900">총계</td>
									<td class="px-3 py-2 text-center text-gray-700 text-xs">
										{#if result.data.budgets.length > 0}
											{@const firstBudget = result.data.budgets[0]}
											{@const lastBudget = result.data.budgets[result.data.budgets.length - 1]}
											{#if firstBudget.startDate && lastBudget.endDate}
												{formatDateForDisplay(firstBudget.startDate, 'ISO')} ~ {formatDateForDisplay(lastBudget.endDate, 'ISO')}
											{:else}
												전체 기간
											{/if}
										{:else}
											전체 기간
										{/if}
									</td>
									<td class="px-3 py-2 text-right text-green-800">{formatCurrency(budgetSummary.totalGovernmentFunding)}</td>
									<td class="px-3 py-2 text-right text-orange-800">{formatCurrency(budgetSummary.totalCompanyCash)}</td>
									<td class="px-3 py-2 text-right text-purple-800">{formatCurrency(budgetSummary.totalCompanyInKind)}</td>
									<td class="px-3 py-2 text-right text-blue-800">{formatCurrency(budgetSummary.totalCash)}</td>
									<td class="px-3 py-2 text-right text-purple-800">{formatCurrency(budgetSummary.totalInKind)}</td>
									<td class="px-3 py-2 text-right text-gray-900">{formatCurrency(budgetSummary.totalBudget)}</td>
								</tr>
							</tbody>
						</table>
					</div>
					
					<!-- 비율 요약 -->
					<div class="grid grid-cols-2 gap-3 text-xs text-center mt-3">
						<div class="p-2 bg-green-50 rounded">
							<span class="text-green-700">지원금 비율: {budgetSummary.governmentFundingRatio.toFixed(1)}%</span>
						</div>
						<div class="p-2 bg-orange-50 rounded">
							<span class="text-orange-700">기업부담 비율: {budgetSummary.companyBurdenRatio.toFixed(1)}%</span>
						</div>
					</div>
				{:else}
					<div class="text-center py-4 text-gray-500">
						<p class="text-sm">연차별 예산 데이터가 없습니다.</p>
					</div>
				{/if}
			{:catch error}
				<div class="text-center py-4 text-red-500">
					<p class="text-sm">연차별 데이터를 불러올 수 없습니다.</p>
				</div>
			{/await}
		</div>
	{:else}
		<!-- 상세한 예산 요약 -->
		<div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
			<div class="flex items-center justify-between mb-3">
				<div class="flex items-center">
					<DollarSignIcon class="w-5 h-5 text-blue-600 mr-2" />
					<h4 class="font-semibold text-blue-900">예산 구조</h4>
				</div>
				<span class="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded">
					{budgetSummary.totalYears}년차 사업
				</span>
			</div>
			
			<!-- 총 사업비 -->
			<div class="mb-4 text-center">
				<div class="text-2xl font-bold text-blue-900">
					{formatCurrency(budgetSummary.totalBudget)}
				</div>
				<div class="text-sm text-blue-600">전체 사업비</div>
			</div>
			
			<!-- 자금 구조 -->
			<div class="grid grid-cols-2 gap-4 mb-4">
				<div class="text-center">
					<div class="text-lg font-semibold text-green-700">
						{formatCurrency(budgetSummary.totalGovernmentFunding)}
					</div>
					<div class="text-xs text-green-600">
						지원금 ({budgetSummary.governmentFundingRatio.toFixed(1)}%)
					</div>
				</div>
				<div class="text-center">
					<div class="text-lg font-semibold text-orange-700">
						{formatCurrency(budgetSummary.totalCompanyCash + budgetSummary.totalCompanyInKind)}
					</div>
					<div class="text-xs text-orange-600">
						기업부담금 ({budgetSummary.companyBurdenRatio.toFixed(1)}%)
					</div>
				</div>
			</div>
			
			<!-- 현금/현물 구조 -->
			<div class="grid grid-cols-2 gap-4 pt-3 border-t border-blue-200">
				<div class="text-center">
					<div class="text-sm font-medium text-blue-700">
						{formatCurrency(budgetSummary.totalCash)}
					</div>
					<div class="text-xs text-blue-600">
						현금 ({budgetSummary.cashRatio.toFixed(1)}%)
					</div>
				</div>
				<div class="text-center">
					<div class="text-sm font-medium text-purple-700">
						{formatCurrency(budgetSummary.totalInKind)}
					</div>
					<div class="text-xs text-purple-600">
						현물 ({budgetSummary.inKindRatio.toFixed(1)}%)
					</div>
				</div>
			</div>
			
			<!-- 세부 기업부담금 구조 -->
			{#if budgetSummary.totalCompanyCash > 0 || budgetSummary.totalCompanyInKind > 0}
				<div class="mt-3 pt-3 border-t border-blue-200">
					<div class="text-xs text-blue-600 mb-2">기업부담금 상세</div>
					<div class="grid grid-cols-2 gap-2 text-xs">
						<div class="flex justify-between">
							<span class="text-gray-600">현금:</span>
							<span class="font-medium">{formatCurrency(budgetSummary.totalCompanyCash)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">현물:</span>
							<span class="font-medium">{formatCurrency(budgetSummary.totalCompanyInKind)}</span>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
{:else}
	<div class="py-4 text-center">
		<div class="text-sm text-gray-500 mb-2">예산이 설정되지 않았습니다</div>
		<div class="text-xs text-gray-400">프로젝트 상세에서 예산을 설정해주세요</div>
	</div>
{/if}
