<script lang="ts">
	import { onMount } from 'svelte';
import { 
	payslips,
	filteredSalaryHistory,
	selectedEmployee,
	loadPayslips,
	loadSalaryHistory,
	isLoading,
	error
} from '$lib/stores/salary/salary-store';
	import { formatCurrency, formatDate } from '$lib/utils/format';
	import { 
		SearchIcon, 
		FilterIcon, 
		DownloadIcon, 
		EyeIcon,
		CalendarIcon,
		DollarSignIcon,
		FileTextIcon,
		TrendingUpIcon,
		TrendingDownIcon,
		MinusIcon
	} from '@lucide/svelte';

	// 검색 및 필터 상태
	let searchQuery = $state('');
	let selectedPeriod = $state('');
	let selectedStatus = $state('');
	let sortBy = $state('period');
	let sortOrder = $state('desc');

	// 모달 상태
	let showDetailsModal = $state(false);
	let selectedPayroll = $state(null);

	// 기간 옵션 생성
	const periodOptions = $derived(() => {
		const periods = new Set();
		$payslips.forEach(payslip => {
			const period = payslip.period; // YYYY-MM 형식
			periods.add(period);
		});
		return Array.from(periods).sort().reverse();
	});

	// 필터링된 급여 이력
	const filteredHistory = $derived(() => {
		let filtered = [...$payslips];

		// 검색 필터
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(payroll => 
				payroll.employeeName.toLowerCase().includes(query) ||
				payroll.employeeIdNumber.toLowerCase().includes(query) ||
				payroll.department.toLowerCase().includes(query) ||
				payroll.position.toLowerCase().includes(query)
			);
		}

		// 기간 필터
		if (selectedPeriod) {
			filtered = filtered.filter(payroll => 
				payroll.payDate.startsWith(selectedPeriod)
			);
		}

		// 상태 필터
		if (selectedStatus) {
			filtered = filtered.filter(payroll => 
				payroll.status === selectedStatus
			);
		}

		// 정렬
		filtered.sort((a, b) => {
			let aValue, bValue;
			
			switch (sortBy) {
				case 'name':
					aValue = a.employeeName;
					bValue = b.employeeName;
					break;
				case 'department':
					aValue = a.department;
					bValue = b.department;
					break;
				case 'grossSalary':
					aValue = a.grossSalary;
					bValue = b.grossSalary;
					break;
				case 'netSalary':
					aValue = a.netSalary;
					bValue = b.netSalary;
					break;
				case 'period':
				default:
					aValue = a.payDate;
					bValue = b.payDate;
					break;
			}

			if (typeof aValue === 'string' && typeof bValue === 'string') {
				return sortOrder === 'asc' 
					? aValue.localeCompare(bValue)
					: bValue.localeCompare(aValue);
			}

			if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
			if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
			return 0;
		});

		return filtered;
	});

	// 통계 계산
	const statistics = $derived(() => {
		const total = filteredHistory.length;
		const totalGrossSalary = filteredHistory.reduce((sum, payroll) => sum + payroll.grossSalary, 0);
		const totalNetSalary = filteredHistory.reduce((sum, payroll) => sum + payroll.netSalary, 0);
		const totalDeductions = filteredHistory.reduce((sum, payroll) => sum + payroll.totalDeductions, 0);
		const averageGrossSalary = total > 0 ? totalGrossSalary / total : 0;
		const averageNetSalary = total > 0 ? totalNetSalary / total : 0;

		return {
			total,
			totalGrossSalary,
			totalNetSalary,
			totalDeductions,
			averageGrossSalary,
			averageNetSalary
		};
	});

	onMount(async () => {
		await loadPayslips();
		await loadSalaryHistory();
	});

	// 급여 상세 정보 보기
	function viewPayrollDetails(payroll: any) {
		selectedPayroll = payroll;
		showDetailsModal = true;
	}

	// 정렬 변경
	function handleSort(field: string) {
		if (sortBy === field) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = field;
			sortOrder = 'desc';
		}
	}

	// 급여명세서 다운로드
	async function downloadPayslip(payroll: any) {
		// 급여명세서 다운로드 기능은 PayslipGenerator에서 구현됨
	}

	// 상태별 색상 반환
	function getStatusColor(status: string): string {
		switch (status) {
			case 'pending': return 'text-yellow-600 bg-yellow-100';
			case 'calculated': return 'text-blue-600 bg-blue-100';
			case 'approved': return 'text-green-600 bg-green-100';
			case 'paid': return 'text-purple-600 bg-purple-100';
			case 'error': return 'text-red-600 bg-red-100';
			default: return 'text-gray-600 bg-gray-100';
		}
	}

	// 상태별 라벨 반환
	function getStatusLabel(status: string): string {
		switch (status) {
			case 'pending': return '대기중';
			case 'calculated': return '계산완료';
			case 'approved': return '승인완료';
			case 'paid': return '지급완료';
			case 'error': return '오류';
			default: return '알수없음';
		}
	}

	// 변화율 아이콘 반환
	function getChangeIcon(change: number) {
		if (change > 0) return TrendingUpIcon;
		if (change < 0) return TrendingDownIcon;
		return MinusIcon;
	}

	// 변화율 색상 반환
	function getChangeColor(change: number): string {
		if (change > 0) return 'text-green-600';
		if (change < 0) return 'text-red-600';
		return 'text-gray-600';
	}
</script>

<div class="space-y-6">
	<!-- 헤더 -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold text-gray-900">직원별 급여 이력</h2>
			<p class="mt-1 text-sm text-gray-500">전체 직원의 급여 지급 이력 및 상세 정보</p>
		</div>
		<div class="flex items-center space-x-3">
			<button class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
				<DownloadIcon size={16} class="mr-2" />
				엑셀 다운로드
			</button>
			<button class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
				급여 계산
			</button>
		</div>
	</div>

	<!-- 통계 카드 -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">총 급여 건수</p>
					<p class="text-2xl font-bold text-gray-900">{$statistics.total}건</p>
				</div>
				<div class="p-2 bg-blue-100 rounded-full">
					<FileTextIcon size={20} class="text-blue-600" />
				</div>
			</div>
		</div>

		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">총 지급액</p>
					<p class="text-2xl font-bold text-gray-900">
						{formatCurrency($statistics.totalGrossSalary)}
					</p>
				</div>
				<div class="p-2 bg-green-100 rounded-full">
					<DollarSignIcon size={20} class="text-green-600" />
				</div>
			</div>
		</div>

		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">총 실지급액</p>
					<p class="text-2xl font-bold text-gray-900">
						{formatCurrency($statistics.totalNetSalary)}
					</p>
				</div>
				<div class="p-2 bg-purple-100 rounded-full">
					<TrendingUpIcon size={20} class="text-purple-600" />
				</div>
			</div>
		</div>

		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">평균 급여</p>
					<p class="text-2xl font-bold text-gray-900">
						{formatCurrency($statistics.averageGrossSalary)}
					</p>
				</div>
				<div class="p-2 bg-yellow-100 rounded-full">
					<CalendarIcon size={20} class="text-yellow-600" />
				</div>
			</div>
		</div>
	</div>

	<!-- 검색 및 필터 -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<div class="relative">
				<SearchIcon size={20} class="absolute left-3 top-3 text-gray-400" />
				<input
					type="text"
					placeholder="직원명, 사번, 부서로 검색..."
					bind:value={searchQuery}
					class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				/>
			</div>

			<div class="relative">
				<CalendarIcon size={20} class="absolute left-3 top-3 text-gray-400" />
				<select
					bind:value={selectedPeriod}
					class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				>
					<option value="">전체 기간</option>
					{#each periodOptions as period}
						<option value={period}>{period}</option>
					{/each}
				</select>
			</div>

			<div class="relative">
				<FilterIcon size={20} class="absolute left-3 top-3 text-gray-400" />
				<select
					bind:value={selectedStatus}
					class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				>
					<option value="">전체 상태</option>
					<option value="pending">대기중</option>
					<option value="calculated">계산완료</option>
					<option value="approved">승인완료</option>
					<option value="paid">지급완료</option>
					<option value="error">오류</option>
				</select>
			</div>

			<div class="flex items-center space-x-2">
				<button 
					onclick={() => handleSort('period')}
					class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					기간 {sortBy === 'period' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
				</button>
				<button 
					onclick={() => handleSort('netSalary')}
					class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					급여 {sortBy === 'netSalary' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
				</button>
			</div>
		</div>
	</div>

	<!-- 급여 이력 테이블 -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							직원 정보
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							부서/직위
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							지급 기간
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							기본급
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							수당
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							공제
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							실지급액
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							상태
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							작업
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each filteredHistory as payroll}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center">
									<div class="flex-shrink-0 h-10 w-10">
										<div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
											<span class="text-sm font-medium text-blue-600">
												{payroll.employeeName.charAt(0)}
											</span>
										</div>
									</div>
									<div class="ml-4">
										<div class="text-sm font-medium text-gray-900">
											{payroll.employeeName}
										</div>
										<div class="text-sm text-gray-500">
											{payroll.employeeIdNumber}
										</div>
									</div>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-900">{payroll.department}</div>
								<div class="text-sm text-gray-500">{payroll.position}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{formatDate(payroll.payDate)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
								{formatCurrency(payroll.baseSalary)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">
								+{formatCurrency(payroll.totalAllowances)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">
								-{formatCurrency(payroll.totalDeductions)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm font-medium text-gray-900">
									{formatCurrency(payroll.netSalary)}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(payroll.status)}">
									{getStatusLabel(payroll.status)}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
								<div class="flex items-center space-x-2">
									<button
										onclick={() => viewPayrollDetails(payroll)}
										class="text-blue-600 hover:text-blue-900"
									>
										<EyeIcon size={16} />
									</button>
									<button
										onclick={() => downloadPayslip(payroll)}
										class="text-green-600 hover:text-green-900"
									>
										<DownloadIcon size={16} />
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- 결과가 없을 때 -->
		{#if filteredHistory.length === 0}
			<div class="text-center py-12">
				<FileTextIcon size={48} class="mx-auto text-gray-400" />
				<h3 class="mt-2 text-sm font-medium text-gray-900">급여 이력이 없습니다</h3>
				<p class="mt-1 text-sm text-gray-500">검색 조건을 변경하거나 급여를 계산해보세요.</p>
			</div>
		{/if}
	</div>
</div>

<!-- 급여 상세 정보 모달 -->
{#if showDetailsModal && selectedPayroll}
	<!-- 모달 구현 (별도 컴포넌트로 분리 가능) -->
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
			<div class="mt-3">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-medium text-gray-900">급여 상세 정보</h3>
					<button
						onclick={() => showDetailsModal = false}
						class="text-gray-400 hover:text-gray-600"
						aria-label="모달 닫기"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>
				
				<div class="space-y-4">
					<!-- 기본 정보 -->
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700">직원명</label>
							<p class="mt-1 text-sm text-gray-900">{selectedPayroll.employeeInfo.name}</p>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700">사번</label>
							<p class="mt-1 text-sm text-gray-900">{selectedPayroll.employeeInfo.employeeId}</p>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700">부서</label>
							<p class="mt-1 text-sm text-gray-900">{selectedPayroll.employeeInfo.department}</p>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700">직위</label>
							<p class="mt-1 text-sm text-gray-900">{selectedPayroll.employeeInfo.position}</p>
						</div>
					</div>

					<!-- 급여 정보 -->
					<div class="border-t pt-4">
						<h4 class="text-md font-medium text-gray-900 mb-3">급여 내역</h4>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700">기본급</label>
								<p class="mt-1 text-sm text-gray-900">{formatCurrency(selectedPayroll.salaryInfo.baseSalary)}</p>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700">총 수당</label>
								<p class="mt-1 text-sm text-green-600">{formatCurrency(selectedPayroll.totals.totalAllowances)}</p>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700">총 공제</label>
								<p class="mt-1 text-sm text-red-600">{formatCurrency(selectedPayroll.totals.totalDeductions)}</p>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700">실지급액</label>
								<p class="mt-1 text-lg font-bold text-gray-900">{formatCurrency(selectedPayroll.totals.netSalary)}</p>
							</div>
						</div>
					</div>

					<!-- 액션 버튼 -->
					<div class="flex justify-end space-x-3 pt-4 border-t">
						<button
							onclick={() => showDetailsModal = false}
							class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
						>
							닫기
						</button>
						<button
							onclick={() => downloadPayslip(selectedPayroll)}
							class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
						>
							급여명세서 다운로드
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
