<script lang="ts">
	import { onMount } from 'svelte';
	import ThemeCard from '$lib/components/ui/ThemeCard.svelte';
	import ThemeButton from '$lib/components/ui/ThemeButton.svelte';
	import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte';
	import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte';
	import ThemeSectionHeader from '$lib/components/ui/ThemeSectionHeader.svelte';
	import { 
		contracts, 
		filteredContracts,
		contractFilter,
		isLoading,
		error,
		loadContracts,
		updateFilter
	} from '$lib/stores/salary/contract-store';
	import { formatCurrency, formatDate } from '$lib/utils/format';
	import type { SalaryContract } from '$lib/types/salary-contracts';
	import { 
		MagnifyingGlassIcon,
		FunnelIcon,
		CalendarIcon,
		TrendingUpIcon,
		TrendingDownIcon,
		MinusIcon,
		UserIcon,
		BuildingOfficeIcon,
		BriefcaseIcon,
		ClockIcon
	} from 'lucide-svelte';

	let mounted = false;
	let showFilters = false;
	let selectedEmployee: string = '';

	// 직원 목록 (실제로는 API에서 가져와야 함)
	let employees = [
		{ id: '', name: '전체 직원' },
		{ id: '1', name: '김대표 (대표)', department: '대표' },
		{ id: '2', name: '최연구소장 (연구소)', department: '연구소' },
		{ id: '3', name: '이책임연구원 (연구소)', department: '연구소' }
	];

	onMount(async () => {
		mounted = true;
		await loadContracts();
	});

	// 직원별 급여 이력 그룹화
	const salaryHistoryByEmployee = $derived(() => {
		const historyMap: Record<string, SalaryContract[]> = {};
		
		$filteredContracts.forEach(contract => {
			if (!historyMap[contract.employeeId]) {
				historyMap[contract.employeeId] = [];
			}
			historyMap[contract.employeeId].push(contract);
		});

		// 각 직원별로 계약을 시작일 기준으로 정렬
		Object.keys(historyMap).forEach(employeeId => {
			historyMap[employeeId].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
		});

		return historyMap;
	});

	// 선택된 직원의 급여 이력
	const selectedEmployeeHistory = $derived(() => {
		if (!selectedEmployee) return [];
		return salaryHistoryByEmployee[selectedEmployee] || [];
	});

	// 급여 변화 계산
	function calculateSalaryChange(contracts: SalaryContract[], index: number): { change: number; percentage: number; direction: 'up' | 'down' | 'same' } {
		if (index === 0) {
			return { change: 0, percentage: 0, direction: 'same' };
		}

		const currentSalary = contracts[index].annualSalary;
		const previousSalary = contracts[index - 1].annualSalary;
		const change = currentSalary - previousSalary;
		const percentage = previousSalary > 0 ? (change / previousSalary) * 100 : 0;

		return {
			change,
			percentage: Math.abs(percentage),
			direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
		};
	}

	// 계약 유형별 색상
	function getContractTypeColor(type: string): string {
		switch (type) {
			case 'full_time': return 'bg-blue-100 text-blue-800';
			case 'part_time': return 'bg-green-100 text-green-800';
			case 'contract': return 'bg-yellow-100 text-yellow-800';
			case 'intern': return 'bg-purple-100 text-purple-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	// 계약 유형 표시명
	function getContractTypeLabel(type: string): string {
		switch (type) {
			case 'full_time': return '정규직';
			case 'part_time': return '파트타임';
			case 'contract': return '계약직';
			case 'intern': return '인턴';
			default: return type;
		}
	}

	// 상태별 색상
	function getStatusColor(status: string): string {
		switch (status) {
			case 'active': return 'bg-green-100 text-green-800';
			case 'expired': return 'bg-red-100 text-red-800';
			case 'terminated': return 'bg-gray-100 text-gray-800';
			case 'draft': return 'bg-yellow-100 text-yellow-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	// 상태 표시명
	function getStatusLabel(status: string): string {
		switch (status) {
			case 'active': return '진행중';
			case 'expired': return '만료됨';
			case 'terminated': return '종료됨';
			case 'draft': return '임시저장';
			default: return status;
		}
	}

	// 직원 선택
	function selectEmployee(employeeId: string) {
		selectedEmployee = employeeId;
		if (employeeId) {
			updateFilter({ employeeId });
		} else {
			updateFilter({ employeeId: '' });
		}
	}

	// 필터 적용
	function applyFilter() {
		loadContracts($contractFilter);
	}

	// 필터 초기화
	function clearFilters() {
		selectedEmployee = '';
		updateFilter({
			employeeId: '',
			department: '',
			position: '',
			contractType: '',
			status: '',
			startDateFrom: '',
			startDateTo: '',
			search: ''
		});
		loadContracts();
	}
</script>

<div class="space-y-6">
	<!-- 헤더 및 필터 -->
	<ThemeCard class="p-6">
		<div class="flex items-center justify-between mb-4">
			<ThemeSectionHeader title="급여 이력 추적" />
			<div class="flex items-center space-x-3">
				<ThemeButton
					variant="outline"
					size="sm"
					onclick={() => showFilters = !showFilters}
				>
					<FunnelIcon size={16} class="mr-2" />
					필터
				</ThemeButton>
			</div>
		</div>

		<!-- 직원 선택 -->
		<div class="mb-4">
			<label class="block text-sm font-medium text-gray-700 mb-2">직원 선택</label>
			<div class="flex flex-wrap gap-2">
				{#each employees as employee}
					<button
						onclick={() => selectEmployee(employee.id)}
						class="px-4 py-2 rounded-lg border transition-colors {selectedEmployee === employee.id 
							? 'bg-blue-100 border-blue-500 text-blue-700' 
							: 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}"
					>
						{employee.name}
					</button>
				{/each}
			</div>
		</div>

		<!-- 필터 영역 -->
		{#if showFilters}
			<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">부서</label>
					<select
						bind:value={$contractFilter.department}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">전체</option>
						<option value="대표">대표</option>
						<option value="연구소">연구소</option>
						<option value="경영기획팀">경영기획팀</option>
						<option value="부서없음">부서없음</option>
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">계약 유형</label>
					<select
						bind:value={$contractFilter.contractType}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">전체</option>
						<option value="full_time">정규직</option>
						<option value="part_time">파트타임</option>
						<option value="contract">계약직</option>
						<option value="intern">인턴</option>
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">상태</label>
					<select
						bind:value={$contractFilter.status}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">전체</option>
						<option value="active">진행중</option>
						<option value="expired">만료됨</option>
						<option value="terminated">종료됨</option>
						<option value="draft">임시저장</option>
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">시작일 (부터)</label>
					<input
						type="date"
						bind:value={$contractFilter.startDateFrom}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div class="flex items-end space-x-2">
					<ThemeButton
						variant="primary"
						size="sm"
						onclick={applyFilter}
					>
						<MagnifyingGlassIcon size={16} class="mr-1" />
						검색
					</ThemeButton>
					<ThemeButton
						variant="outline"
						size="sm"
						onclick={clearFilters}
					>
						초기화
					</ThemeButton>
				</div>
			</div>
		{/if}
	</ThemeCard>

	<!-- 급여 이력 목록 -->
	{#if $isLoading}
		<div class="flex items-center justify-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<span class="ml-2 text-gray-600">로딩 중...</span>
		</div>
	{:else if $error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4">
			<span class="text-red-800">{$error}</span>
		</div>
	{:else if selectedEmployee && selectedEmployeeHistory.length === 0}
		<div class="text-center py-12">
			<ClockIcon size={48} class="mx-auto text-gray-400 mb-4" />
			<p class="text-gray-500">선택한 직원의 급여 이력이 없습니다.</p>
		</div>
	{:else if !selectedEmployee}
		<div class="text-center py-12">
			<UserIcon size={48} class="mx-auto text-gray-400 mb-4" />
			<p class="text-gray-500">직원을 선택하여 급여 이력을 확인하세요.</p>
		</div>
	{:else}
		<!-- 선택된 직원의 급여 이력 -->
		{#each selectedEmployeeHistory as contract, index}
			<ThemeCard class="p-6">
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<div class="flex items-center space-x-4 mb-4">
							<div class="flex items-center space-x-2">
								<CalendarIcon size={20} class="text-gray-400" />
								<span class="text-lg font-semibold text-gray-900">
									{formatDate(contract.startDate)} ~ {contract.endDate ? formatDate(contract.endDate) : '무기한'}
								</span>
							</div>
							<ThemeBadge class={getContractTypeColor(contract.contractType)}>
								{getContractTypeLabel(contract.contractType)}
							</ThemeBadge>
							<ThemeBadge class={getStatusColor(contract.status)}>
								{getStatusLabel(contract.status)}
							</ThemeBadge>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div class="space-y-2">
								<div class="text-sm text-gray-500">연봉</div>
								<div class="text-2xl font-bold text-gray-900">{formatCurrency(contract.annualSalary)}</div>
							</div>
							<div class="space-y-2">
								<div class="text-sm text-gray-500">월급</div>
								<div class="text-xl font-semibold text-gray-900">{formatCurrency(contract.monthlySalary)}</div>
							</div>
							<div class="space-y-2">
								<div class="text-sm text-gray-500">급여 변화</div>
								{#if index > 0}
									{@const change = calculateSalaryChange(selectedEmployeeHistory, index)}
									<div class="flex items-center space-x-2">
										{#if change.direction === 'up'}
											<TrendingUpIcon size={20} class="text-green-500" />
											<span class="text-green-600 font-semibold">
												+{formatCurrency(change.change)} (+{change.percentage.toFixed(1)}%)
											</span>
										{:else if change.direction === 'down'}
											<TrendingDownIcon size={20} class="text-red-500" />
											<span class="text-red-600 font-semibold">
												-{formatCurrency(Math.abs(change.change))} (-{change.percentage.toFixed(1)}%)
											</span>
										{:else}
											<MinusIcon size={20} class="text-gray-500" />
											<span class="text-gray-500 font-semibold">변화 없음</span>
										{/if}
									</div>
								{:else}
									<span class="text-gray-500 font-semibold">첫 계약</span>
								{/if}
							</div>
						</div>

						{#if contract.notes}
							<div class="mt-4 p-3 bg-gray-50 rounded-lg">
								<div class="text-sm text-gray-600">
									<strong>비고:</strong> {contract.notes}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</ThemeCard>
		{/each}

		<!-- 급여 변화 요약 -->
		{#if selectedEmployeeHistory.length > 1}
			<ThemeCard class="p-6">
				<ThemeSectionHeader title="급여 변화 요약" />
				<div class="mt-4 space-y-4">
					{@const firstContract = selectedEmployeeHistory[0]}
					{@const lastContract = selectedEmployeeHistory[selectedEmployeeHistory.length - 1]}
					{@const totalChange = lastContract.annualSalary - firstContract.annualSalary}
					{@const totalPercentage = firstContract.annualSalary > 0 ? (totalChange / firstContract.annualSalary) * 100 : 0}
					
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div class="text-center p-4 bg-gray-50 rounded-lg">
							<div class="text-sm text-gray-600">첫 계약 연봉</div>
							<div class="text-xl font-bold text-gray-900">{formatCurrency(firstContract.annualSalary)}</div>
							<div class="text-xs text-gray-500">{formatDate(firstContract.startDate)}</div>
						</div>
						<div class="text-center p-4 bg-gray-50 rounded-lg">
							<div class="text-sm text-gray-600">현재 연봉</div>
							<div class="text-xl font-bold text-gray-900">{formatCurrency(lastContract.annualSalary)}</div>
							<div class="text-xs text-gray-500">{formatDate(lastContract.startDate)}</div>
						</div>
						<div class="text-center p-4 bg-gray-50 rounded-lg">
							<div class="text-sm text-gray-600">총 변화</div>
							<div class="flex items-center justify-center space-x-1">
								{#if totalChange > 0}
									<TrendingUpIcon size={20} class="text-green-500" />
									<span class="text-xl font-bold text-green-600">
										+{formatCurrency(totalChange)}
									</span>
								{:else if totalChange < 0}
									<TrendingDownIcon size={20} class="text-red-500" />
									<span class="text-xl font-bold text-red-600">
										-{formatCurrency(Math.abs(totalChange))}
									</span>
								{:else}
									<MinusIcon size={20} class="text-gray-500" />
									<span class="text-xl font-bold text-gray-500">변화 없음</span>
								{/if}
							</div>
							<div class="text-xs text-gray-500">
								{totalChange > 0 ? '+' : ''}{totalPercentage.toFixed(1)}%
							</div>
						</div>
					</div>
				</div>
			</ThemeCard>
		{/if}
	{/if}
</div>
