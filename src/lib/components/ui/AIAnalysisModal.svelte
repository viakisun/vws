<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Badge from './Badge.svelte';
	import type { AIAnalysisResponse } from '$lib/utils/ai-analysis';

	const dispatch = createEventDispatcher();

	let { 
		isOpen = $bindable(false),
		analysisResult = null,
		isLoading = false
	} = $props<{ 
		isOpen?: boolean;
		analysisResult?: AIAnalysisResponse | null;
		isLoading?: boolean;
	}>();

	function closeModal() {
		isOpen = false;
		dispatch('close');
	}

	function getRiskLevelColor(riskLevel: string) {
		switch (riskLevel) {
			case 'low': return 'success';
			case 'medium': return 'warning';
			case 'high': return 'danger';
			default: return 'secondary';
		}
	}

	function getHealthColor(score: number) {
		if (score >= 80) return 'text-green-600';
		if (score >= 60) return 'text-yellow-600';
		return 'text-red-600';
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<div class="absolute inset-0 bg-black/40" role="button" tabindex="0" onclick={closeModal} onkeydown={(e) => (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') && closeModal()}></div>
		<div class="relative w-full max-w-6xl mx-4 rounded-xl bg-white shadow-lg border border-gray-200" role="dialog" aria-modal="true">
			<div class="p-6 max-w-4xl">
				<div class="flex justify-between items-center mb-6">
					<h2 class="text-2xl font-semibold">AI 재무 분석 결과</h2>
					<button 
						onclick={closeModal}
						class="text-gray-400 hover:text-gray-600"
						aria-label="닫기"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>

		{#if isLoading}
			<div class="flex items-center justify-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
				<span class="ml-3 text-lg">AI 분석 중...</span>
			</div>
		{:else if analysisResult}
			<div class="space-y-6">
				<!-- 요약 -->
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 class="text-lg font-semibold text-blue-900 mb-2">분석 요약</h3>
					<p class="text-blue-800">{analysisResult.summary}</p>
				</div>

				<!-- 핵심 지표 -->
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<div class="bg-white border rounded-lg p-4">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-gray-600">현금흐름 건강도</p>
								<p class="text-2xl font-bold {getHealthColor(analysisResult.metrics.cashFlowHealth)}">
									{analysisResult.metrics.cashFlowHealth}%
								</p>
							</div>
							<div class="p-2 bg-blue-100 rounded-full">
								<svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
								</svg>
							</div>
						</div>
					</div>

					<div class="bg-white border rounded-lg p-4">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-gray-600">지출 비율</p>
								<p class="text-2xl font-bold text-gray-900">
									{(analysisResult.metrics.expenseRatio * 100).toFixed(1)}%
								</p>
							</div>
							<div class="p-2 bg-red-100 rounded-full">
								<svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path>
								</svg>
							</div>
						</div>
					</div>

					<div class="bg-white border rounded-lg p-4">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-gray-600">수입 안정성</p>
								<p class="text-2xl font-bold {getHealthColor(analysisResult.metrics.incomeStability)}">
									{analysisResult.metrics.incomeStability}%
								</p>
							</div>
							<div class="p-2 bg-green-100 rounded-full">
								<svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
								</svg>
							</div>
						</div>
					</div>

					<div class="bg-white border rounded-lg p-4">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-gray-600">위험도</p>
								<div class="mt-1">
									<Badge variant={getRiskLevelColor(analysisResult.metrics.riskLevel)}>
										{analysisResult.metrics.riskLevel === 'low' ? '낮음' : 
										 analysisResult.metrics.riskLevel === 'medium' ? '보통' : '높음'}
									</Badge>
								</div>
							</div>
							<div class="p-2 bg-gray-100 rounded-full">
								<svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
								</svg>
							</div>
						</div>
					</div>
				</div>

				<!-- 인사이트 -->
				<div class="bg-white border rounded-lg p-6">
					<h3 class="text-lg font-semibold mb-4">주요 인사이트</h3>
					<ul class="space-y-2">
						{#each analysisResult.insights as insight}
							<li class="flex items-start">
								<svg class="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
								</svg>
								<span class="text-gray-700">{insight}</span>
							</li>
						{/each}
					</ul>
				</div>

				<!-- 권장사항 -->
				<div class="bg-white border rounded-lg p-6">
					<h3 class="text-lg font-semibold mb-4">권장사항</h3>
					<ul class="space-y-2">
						{#each analysisResult.recommendations as recommendation}
							<li class="flex items-start">
								<svg class="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
								<span class="text-gray-700">{recommendation}</span>
							</li>
						{/each}
					</ul>
				</div>

				<!-- 위험요소 -->
				{#if analysisResult.riskFactors.length > 0}
					<div class="bg-red-50 border border-red-200 rounded-lg p-6">
						<h3 class="text-lg font-semibold text-red-900 mb-4">주의사항</h3>
						<ul class="space-y-2">
							{#each analysisResult.riskFactors as risk}
								<li class="flex items-start">
									<svg class="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
									</svg>
									<span class="text-red-800">{risk}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- 예측 -->
				{#if analysisResult.forecast}
					<div class="bg-white border rounded-lg p-6">
						<h3 class="text-lg font-semibold mb-4">현금흐름 예측</h3>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<h4 class="font-medium text-gray-900 mb-3">다음 달</h4>
								<div class="space-y-2">
									<div class="flex justify-between">
										<span class="text-gray-600">예상 수입:</span>
										<span class="font-medium">₩{analysisResult.forecast.nextMonth.expectedIncome.toLocaleString()}</span>
									</div>
									<div class="flex justify-between">
										<span class="text-gray-600">예상 지출:</span>
										<span class="font-medium">₩{analysisResult.forecast.nextMonth.expectedExpense.toLocaleString()}</span>
									</div>
									<div class="flex justify-between border-t pt-2">
										<span class="text-gray-600">순현금흐름:</span>
										<span class="font-medium {analysisResult.forecast.nextMonth.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}">
											₩{analysisResult.forecast.nextMonth.netCashFlow.toLocaleString()}
										</span>
									</div>
								</div>
							</div>
							<div>
								<h4 class="font-medium text-gray-900 mb-3">다음 분기</h4>
								<div class="space-y-2">
									<div class="flex justify-between">
										<span class="text-gray-600">예상 수입:</span>
										<span class="font-medium">₩{analysisResult.forecast.nextQuarter.expectedIncome.toLocaleString()}</span>
									</div>
									<div class="flex justify-between">
										<span class="text-gray-600">예상 지출:</span>
										<span class="font-medium">₩{analysisResult.forecast.nextQuarter.expectedExpense.toLocaleString()}</span>
									</div>
									<div class="flex justify-between border-t pt-2">
										<span class="text-gray-600">순현금흐름:</span>
										<span class="font-medium {analysisResult.forecast.nextQuarter.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}">
											₩{analysisResult.forecast.nextQuarter.netCashFlow.toLocaleString()}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}
			</div>
		</div>
	</div>
{/if}
