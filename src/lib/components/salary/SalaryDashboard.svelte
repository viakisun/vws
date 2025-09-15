<script lang="ts">
	import { onMount } from 'svelte';
	import { 
		salaryStatistics, 
		departmentSalaryStats, 
		currentPeriod,
		loadPayrolls,
		loadEmployeePayrolls,
		isLoading,
		error
	} from '$lib/stores/salary/salary-store';
	import { 
		formatCurrency, 
		formatPercentage
	} from '$lib/utils/format';
	import { 
		TrendingUpIcon, 
		TrendingDownIcon, 
		DollarSignIcon, 
		UsersIcon, 
		CalendarIcon,
		FileTextIcon,
		CheckCircleIcon,
		ClockIcon,
		AlertCircleIcon
	} from 'lucide-svelte';

	let mounted = false;

	onMount(async () => {
		mounted = true;
		await loadPayrolls();
		await loadEmployeePayrolls();
	});

	// 상태별 색상 반환
	function getStatusColor(status: string): string {
		switch (status) {
			case 'draft': return 'text-gray-600 bg-gray-100';
			case 'calculated': return 'text-blue-600 bg-blue-100';
			case 'approved': return 'text-green-600 bg-green-100';
			case 'paid': return 'text-purple-600 bg-purple-100';
			case 'cancelled': return 'text-red-600 bg-red-100';
			default: return 'text-gray-600 bg-gray-100';
		}
	}

	// 상태별 아이콘 반환
	function getStatusIcon(status: string) {
		switch (status) {
			case 'draft': return ClockIcon;
			case 'calculated': return FileTextIcon;
			case 'approved': return CheckCircleIcon;
			case 'paid': return DollarSignIcon;
			case 'cancelled': return AlertCircleIcon;
			default: return ClockIcon;
		}
	}

	// 변화율 계산
	function calculateChangeRate(current: number, previous: number): number {
		if (previous === 0) return current > 0 ? 100 : 0;
		return ((current - previous) / previous) * 100;
	}
</script>

<div class="space-y-6">
	<!-- 페이지 헤더 -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">급여 관리</h1>
			<p class="mt-2 text-gray-600">전체 직원 급여 현황 및 관리</p>
		</div>
		<div class="flex items-center space-x-4">
			<div class="text-sm text-gray-500">
				<CalendarIcon size={16} class="inline mr-1" />
				현재 기간: {$currentPeriod}
			</div>
		</div>
	</div>

	<!-- 로딩 및 에러 상태 -->
	{#if !mounted}
		<div class="flex items-center justify-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<span class="ml-2 text-gray-600">급여 데이터를 불러오는 중...</span>
		</div>
	{:else if $error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4">
			<div class="flex items-center">
				<AlertCircleIcon size={20} class="text-red-600 mr-2" />
				<span class="text-red-800">{$error}</span>
			</div>
		</div>
	{:else}
		<!-- 급여 현황 카드들 -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			<!-- 이번달 급여 지급 예정액 -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">이번달 급여 지급 예정액</p>
						<p class="text-2xl font-bold text-gray-900">
							{formatCurrency($salaryStatistics.currentMonth.totalNetSalary)}
						</p>
						<div class="flex items-center mt-2">
							{#if $salaryStatistics.changes.netSalaryChange > 0}
								<TrendingUpIcon size={16} class="text-green-500 mr-1" />
								<span class="text-sm text-green-600">
									+{formatCurrency($salaryStatistics.changes.netSalaryChange)}
								</span>
							{:else if $salaryStatistics.changes.netSalaryChange < 0}
								<TrendingDownIcon size={16} class="text-red-500 mr-1" />
								<span class="text-sm text-red-600">
									{formatCurrency($salaryStatistics.changes.netSalaryChange)}
								</span>
							{:else}
								<span class="text-sm text-gray-500">변화 없음</span>
							{/if}
							<span class="text-sm text-gray-500 ml-1">
								(지난달 대비)
							</span>
						</div>
					</div>
					<div class="p-3 bg-blue-100 rounded-full">
						<DollarSignIcon size={24} class="text-blue-600" />
					</div>
				</div>
			</div>

			<!-- 총 직원 수 -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">총 직원 수</p>
						<p class="text-2xl font-bold text-gray-900">
							{$salaryStatistics.currentMonth.totalEmployees}명
						</p>
						<div class="flex items-center mt-2">
							{#if $salaryStatistics.changes.employeeChange > 0}
								<TrendingUpIcon size={16} class="text-green-500 mr-1" />
								<span class="text-sm text-green-600">
									+{$salaryStatistics.changes.employeeChange}명
								</span>
							{:else if $salaryStatistics.changes.employeeChange < 0}
								<TrendingDownIcon size={16} class="text-red-500 mr-1" />
								<span class="text-sm text-red-600">
									{$salaryStatistics.changes.employeeChange}명
								</span>
							{:else}
								<span class="text-sm text-gray-500">변화 없음</span>
							{/if}
							<span class="text-sm text-gray-500 ml-1">
								(지난달 대비)
							</span>
						</div>
					</div>
					<div class="p-3 bg-green-100 rounded-full">
						<UsersIcon size={24} class="text-green-600" />
					</div>
				</div>
			</div>

			<!-- 총 지급액 -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">총 지급액</p>
						<p class="text-2xl font-bold text-gray-900">
							{formatCurrency($salaryStatistics.currentMonth.totalGrossSalary)}
						</p>
						<div class="flex items-center mt-2">
							{#if $salaryStatistics.changes.salaryChange > 0}
								<TrendingUpIcon size={16} class="text-green-500 mr-1" />
								<span class="text-sm text-green-600">
									+{formatCurrency($salaryStatistics.changes.salaryChange)}
								</span>
							{:else if $salaryStatistics.changes.salaryChange < 0}
								<TrendingDownIcon size={16} class="text-red-500 mr-1" />
								<span class="text-sm text-red-600">
									{formatCurrency($salaryStatistics.changes.salaryChange)}
								</span>
							{:else}
								<span class="text-sm text-gray-500">변화 없음</span>
							{/if}
							<span class="text-sm text-gray-500 ml-1">
								(지난달 대비)
							</span>
						</div>
					</div>
					<div class="p-3 bg-purple-100 rounded-full">
						<FileTextIcon size={24} class="text-purple-600" />
					</div>
				</div>
			</div>

			<!-- 급여 상태 -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">급여 상태</p>
						<div class="mt-2">
							<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {getStatusColor($salaryStatistics.currentMonth.status)}">
								<svelte:component this={getStatusIcon($salaryStatistics.currentMonth.status)} size={14} class="mr-1" />
								{#if $salaryStatistics.currentMonth.status === 'draft'} 초안
								{:else if $salaryStatistics.currentMonth.status === 'calculated'} 계산 완료
								{:else if $salaryStatistics.currentMonth.status === 'approved'} 승인 완료
								{:else if $salaryStatistics.currentMonth.status === 'paid'} 지급 완료
								{:else if $salaryStatistics.currentMonth.status === 'cancelled'} 취소됨
								{:else} 알 수 없음
								{/if}
							</span>
						</div>
					</div>
					<div class="p-3 bg-yellow-100 rounded-full">
						<CalendarIcon size={24} class="text-yellow-600" />
					</div>
				</div>
			</div>
		</div>

		<!-- 부서별 급여 통계 -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- 부서별 급여 현황 -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">부서별 급여 현황</h3>
				<div class="space-y-4">
					{#each Object.entries($departmentSalaryStats) as [department, stats]}
						<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
							<div class="flex-1">
								<div class="flex items-center justify-between">
									<h4 class="font-medium text-gray-900">{department}</h4>
									<span class="text-sm text-gray-500">{stats.employeeCount}명</span>
								</div>
								<div class="mt-1 grid grid-cols-2 gap-4 text-sm">
									<div>
										<span class="text-gray-500">평균 급여:</span>
										<span class="font-medium text-gray-900 ml-1">
											{formatCurrency(stats.averageGrossSalary)}
										</span>
									</div>
									<div>
										<span class="text-gray-500">총 지급액:</span>
										<span class="font-medium text-gray-900 ml-1">
											{formatCurrency(stats.totalGrossSalary)}
										</span>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- 급여 구성 비율 -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">급여 구성 비율</h3>
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-600">총 지급액</span>
						<span class="font-medium text-gray-900">
							{formatCurrency($salaryStatistics.currentMonth.totalGrossSalary)}
						</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-600">총 공제액</span>
						<span class="font-medium text-red-600">
							{formatCurrency($salaryStatistics.currentMonth.totalDeductions)}
						</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-600">실지급액</span>
						<span class="font-medium text-green-600">
							{formatCurrency($salaryStatistics.currentMonth.totalNetSalary)}
						</span>
					</div>
					
					<!-- 공제율 표시 -->
					<div class="mt-4">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-gray-600">공제율</span>
							<span class="text-sm font-medium text-gray-900">
								{formatPercentage(
									$salaryStatistics.currentMonth.totalGrossSalary > 0 
										? ($salaryStatistics.currentMonth.totalDeductions / $salaryStatistics.currentMonth.totalGrossSalary) * 100
										: 0
								)}
							</span>
						</div>
						<div class="w-full bg-gray-200 rounded-full h-2">
							<div 
								class="bg-red-500 h-2 rounded-full transition-all duration-300"
								style="width: {Math.min(
									$salaryStatistics.currentMonth.totalGrossSalary > 0 
										? ($salaryStatistics.currentMonth.totalDeductions / $salaryStatistics.currentMonth.totalGrossSalary) * 100
										: 0, 100
								)}%"
							></div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- 최근 급여 이력 -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold text-gray-900">최근 급여 이력</h3>
				<button class="text-sm text-blue-600 hover:text-blue-800 font-medium">
					전체 보기
				</button>
			</div>
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								기간
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								직원 수
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								총 지급액
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								실지급액
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								상태
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						<!-- 현재 기간 -->
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
								{$salaryStatistics.currentPeriod}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{$salaryStatistics.currentMonth.totalEmployees}명
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{formatCurrency($salaryStatistics.currentMonth.totalGrossSalary)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{formatCurrency($salaryStatistics.currentMonth.totalNetSalary)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor($salaryStatistics.currentMonth.status)}">
									{#if $salaryStatistics.currentMonth.status === 'draft'} 초안
									{:else if $salaryStatistics.currentMonth.status === 'calculated'} 계산 완료
									{:else if $salaryStatistics.currentMonth.status === 'approved'} 승인 완료
									{:else if $salaryStatistics.currentMonth.status === 'paid'} 지급 완료
									{:else if $salaryStatistics.currentMonth.status === 'cancelled'} 취소됨
									{:else} 알 수 없음
									{/if}
								</span>
							</td>
						</tr>
						<!-- 이전 기간 -->
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
								{$salaryStatistics.previousPeriod}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{$salaryStatistics.previousMonth.totalEmployees}명
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{formatCurrency($salaryStatistics.previousMonth.totalGrossSalary)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{formatCurrency($salaryStatistics.previousMonth.totalNetSalary)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor($salaryStatistics.previousMonth.status)}">
									{#if $salaryStatistics.previousMonth.status === 'draft'} 초안
									{:else if $salaryStatistics.previousMonth.status === 'calculated'} 계산 완료
									{:else if $salaryStatistics.previousMonth.status === 'approved'} 승인 완료
									{:else if $salaryStatistics.previousMonth.status === 'paid'} 지급 완료
									{:else if $salaryStatistics.previousMonth.status === 'cancelled'} 취소됨
									{:else} 알 수 없음
									{/if}
								</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
