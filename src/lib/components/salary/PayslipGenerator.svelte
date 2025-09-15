<script lang="ts">
	import { onMount } from 'svelte';
	import {
		payslips,
		loadPayslips,
		isLoading as isLoadingPayslips,
		error as payslipsError,
		generatePayslip as savePayslipToDatabase
	} from '$lib/stores/salary/salary-store';
	import {
		employees as employeeStore,
		loadEmployees,
		isLoading as isLoadingEmployees,
		error as employeesError
	} from '$lib/stores/hr/employee-store';
	import {
		currentSalaryInfo,
		loadEmployeeSalaryInfo,
		isLoading as isLoadingContracts,
		error as contractsError
	} from '$lib/stores/salary/contract-store';
	import { formatCurrency, formatDate } from '$lib/utils/format';
	import ThemeButton from '$lib/components/ui/ThemeButton.svelte';
	import ThemeModal from '$lib/components/ui/ThemeModal.svelte';
	import ThemeSectionHeader from '$lib/components/ui/ThemeSectionHeader.svelte';
	import type { Payslip } from '$lib/types/salary';
	import {
		FileTextIcon,
		DollarSignIcon,
		CalendarIcon,
		UserIcon,
		DownloadIcon,
		PrinterIcon,
		EditIcon,
		SaveIcon,
		XIcon,
		PlusIcon,
		AlertCircleIcon,
		CheckCircleIcon
	} from 'lucide-svelte';

	let { payroll = undefined }: { payroll?: any } = $props(); // 외부에서 주입될 급여 데이터 (예: 급여 이력에서 클릭 시)

	let isGenerating = $state(false);
	let generatedPayslip = $state<Payslip | null>(null);
	let showModal = $state(false);
	let selectedPayroll = $state<Payslip | null>(null);
	let employeeList = $state<any[]>([]);
	let selectedEmployeeId = $state('');
	
	// 급여명세서 목록
	let payslipList = $state<any[]>([]);
	let isLoadingPayslipList = $state(false);
	let currentContract = $state<any>(null);
	let isLoadingPayroll = $state(false);
	
	// 급여명세서 작성 모드
	let isPayslipEditMode = $state<boolean>(false);
	let editedPayments = $state<any[]>([]);
	let editedDeductions = $state<any[]>([]);
	
	// 데이터베이스에서 불러온 급여명세서
	let savedPayslip = $state<any>(null);
	let payslipSource = $state<string>(''); // 'current', 'previous', 'default'

	// 급여명세서 목록 로드
	async function loadPayslipList() {
		if (!selectedEmployeeId) {
			payslipList = [];
			return;
		}

		isLoadingPayslipList = true;
		try {
			const response = await fetch(`/api/salary/payslips/employee/${selectedEmployeeId}`);
			const result = await response.json();
			
			if (result.success && result.data) {
				// 최신순으로 정렬 (created_at 기준)
				payslipList = result.data.sort((a: any, b: any) => 
					new Date(b.created_at || b.period).getTime() - new Date(a.created_at || a.period).getTime()
				);
			} else {
				payslipList = [];
			}
		} catch (error) {
			console.error('급여명세서 목록 로드 실패:', error);
			payslipList = [];
		} finally {
			isLoadingPayslipList = false;
		}
	}

	// 직원 목록 로드
	async function loadEmployeeList() {
		try {
			const response = await fetch('/api/employees');
			const result = await response.json();
			if (result.success) {
				employeeList = result.data.map((emp: any) => ({
					id: emp.id,
					employeeId: emp.employee_id,
					name: `${emp.last_name}${emp.first_name} (${emp.position})`,
					department: emp.department || '부서없음',
					position: emp.position,
					hireDate: emp.hire_date
				}));
			}
		} catch (error) {
			console.error('직원 목록 로드 실패:', error);
		}
	}


	// 급여명세서 모달 열기
	function openPayslipModal(payslip: any) {
		selectedPayroll = payslip;
		showModal = true;
	}

	// 급여명세서 생성
	async function generatePayslip() {
		if (!selectedEmployeeId) {
			alert('직원을 선택해주세요.');
			return;
		}

		// 계약 정보 로드
		await loadEmployeeSalaryInfo(selectedEmployeeId);
		
		// currentSalaryInfo에서 현재 계약 정보 가져오기
		const salaryInfo = $currentSalaryInfo;
		if (!salaryInfo || !salaryInfo.currentContract) {
			alert('계약 정보를 찾을 수 없습니다.');
			return;
		}
		
		currentContract = salaryInfo.currentContract;

		isGenerating = true;
		try {
			// 현재 계약 정보를 기반으로 mock Payslip 생성
			const now = new Date();
			const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
			
			const mockPayslip: Payslip = {
				id: `payslip_${Date.now()}`,
				employeeId: currentContract.employeeId,
				payrollId: `payroll_${Date.now()}`,
				period: currentPeriod,
				payDate: new Date().toISOString().split('T')[0],
				employeeInfo: {
					name: currentContract.employeeName,
					employeeId: currentContract.employeeIdNumber,
					department: currentContract.department,
					position: currentContract.position,
					hireDate: currentContract.hireDate || new Date().toISOString().split('T')[0],
				},
				salaryInfo: {
					baseSalary: currentContract.monthlySalary,
					positionAllowance: 0,
					bonus: 0,
					mealAllowance: 0,
					vehicleMaintenance: 0,
					annualLeaveAllowance: 0,
					yearEndSettlement: 0,
				},
				allowances: [
					{ id: 'basic_salary', name: '기본급', type: 'basic', amount: currentContract.monthlySalary, isTaxable: true },
					{ id: 'position_allowance', name: '직책수당', type: 'allowance', amount: 0, isTaxable: true },
					{ id: 'bonus', name: '상여금', type: 'bonus', amount: 0, isTaxable: true },
					{ id: 'meal_allowance', name: '식대', type: 'allowance', amount: 100000, isTaxable: false },
					{ id: 'vehicle_maintenance', name: '차량유지', type: 'allowance', amount: 200000, isTaxable: false },
					{ id: 'annual_leave_allowance', name: '연차수당', type: 'allowance', amount: 0, isTaxable: true },
					{ id: 'year_end_settlement', name: '연말정산', type: 'settlement', amount: 0, isTaxable: true },
				],
				deductions: [
					{ id: 'health_insurance', name: '건강보험', rate: 0.034, type: 'insurance', amount: 0, isMandatory: true },
					{ id: 'long_term_care', name: '장기요양보험', rate: 0.0034, type: 'insurance', amount: 0, isMandatory: true },
					{ id: 'national_pension', name: '국민연금', rate: 0.045, type: 'pension', amount: 0, isMandatory: true },
					{ id: 'employment_insurance', name: '고용보험', rate: 0.008, type: 'insurance', amount: 0, isMandatory: true },
					{ id: 'income_tax', name: '갑근세', rate: 0.13, type: 'tax', amount: 0, isMandatory: true },
					{ id: 'local_tax', name: '주민세', rate: 0.013, type: 'tax', amount: 0, isMandatory: true },
					{ id: 'other', name: '기타', rate: 0, type: 'other', amount: 0, isMandatory: false },
				],
				status: 'draft',
				isGenerated: true
			};

			generatedPayslip = mockPayslip;
			showModal = true;
		} catch (error) {
			console.error('급여명세서 생성 실패:', error);
			alert('급여명세서 생성에 실패했습니다.');
		} finally {
			isGenerating = false;
		}
	}

	// 재직기간 계산
	function getEmploymentPeriod(hireDate: string) {
		if (!hireDate) return null;
		
		const hire = new Date(hireDate);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - hire.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		const diffMonths = Math.floor(diffDays / 30);
		const diffYears = Math.floor(diffMonths / 12);
		
		if (diffYears > 0) {
			return `${diffYears}년 ${diffMonths % 12}개월`;
		} else {
			return `${diffMonths}개월`;
		}
	}

	// 누락된 급여명세서 기간 계산
	function getMissingPayslipPeriods(hireDate: string, payslips: any[]) {
		if (!hireDate) return [];
		
		const hire = new Date(hireDate);
		const now = new Date();
		const missingPeriods = [];
		
		// 입사일부터 현재까지의 모든 월 계산
		let current = new Date(hire.getFullYear(), hire.getMonth(), 1);
		const end = new Date(now.getFullYear(), now.getMonth(), 1);
		
		while (current <= end) {
			const period = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
			const hasPayslip = payslips.some(p => p.period === period);
			
			if (!hasPayslip) {
				missingPeriods.push({
					period,
					year: current.getFullYear(),
					month: current.getMonth() + 1,
					label: `${current.getFullYear()}년 ${current.getMonth() + 1}월`
				});
			}
			
			current.setMonth(current.getMonth() + 1);
		}
		
		return missingPeriods.slice(-6); // 최근 6개월만 표시
	}

	onMount(async () => {
		await loadEmployeeList();
		await loadPayslips();
	});
</script>

{#if !payroll}
	<!-- 직원 선택 및 급여명세서 목록 -->
	<div class="space-y-6">
		<!-- 직원 선택 -->
		<div class="max-w-md">
			<label for="employee-select" class="block text-sm font-medium text-gray-700 mb-2">직원 선택</label>
			<select
				id="employee-select"
				bind:value={selectedEmployeeId}
				onchange={loadPayslipList}
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				<option value="">직원을 선택하세요</option>
				{#each employeeList as employee}
					<option value={employee.id}>{employee.name}</option>
				{/each}
			</select>
		</div>

		{#if selectedEmployeeId}
			{@const selectedEmployee = employeeList.find(emp => emp.id === selectedEmployeeId)}
			{@const missingPeriods = getMissingPayslipPeriods(selectedEmployee?.hireDate, payslipList)}
			
			<!-- 누락된 급여명세서 안내 카드 -->
			{#if missingPeriods.length > 0}
				<div class="bg-amber-50 border border-amber-200 rounded-lg p-6">
					<div class="flex items-start">
						<AlertCircleIcon size={24} class="text-amber-600 mr-3 mt-0.5" />
						<div class="flex-1">
							<h3 class="text-lg font-semibold text-amber-800 mb-2">급여명세서 작성 필요</h3>
							<p class="text-amber-700 mb-4">
								{selectedEmployee?.name}님의 재직기간({getEmploymentPeriod(selectedEmployee?.hireDate)}) 중 
								다음 기간의 급여명세서가 누락되었습니다:
							</p>
							<div class="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
								{#each missingPeriods as period}
									<div class="bg-white border border-amber-200 rounded-md px-3 py-2 text-sm">
										<span class="font-medium text-amber-800">{period.label}</span>
									</div>
								{/each}
							</div>
							<ThemeButton 
								variant="outline" 
								onclick={generatePayslip}
								disabled={isGenerating}
								class="border-amber-300 text-amber-700 hover:bg-amber-100"
							>
								{#if isGenerating}
									<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600 mr-2"></div>
								{/if}
								<PlusIcon size={16} class="mr-1" />
								급여명세서 작성
							</ThemeButton>
						</div>
					</div>
				</div>
			{/if}

			<!-- 급여명세서 목록 -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200">
				<div class="px-6 py-4 border-b border-gray-200">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-semibold text-gray-900">급여명세서 목록</h3>
						<ThemeButton 
							variant="outline" 
							size="sm"
							onclick={generatePayslip}
							disabled={isGenerating}
						>
							<PlusIcon size={16} class="mr-1" />
							새 명세서 작성
						</ThemeButton>
					</div>
				</div>
				
				{#if isLoadingPayslipList}
					<div class="flex items-center justify-center py-12">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						<span class="ml-2 text-gray-600">로딩 중...</span>
					</div>
				{:else if payslipList.length === 0}
					<div class="text-center py-12">
						<FileTextIcon size={48} class="mx-auto text-gray-400 mb-4" />
						<p class="text-gray-500 mb-4">급여명세서가 없습니다.</p>
						<ThemeButton 
							variant="outline"
							onclick={generatePayslip}
							disabled={isGenerating}
						>
							<PlusIcon size={16} class="mr-1" />
							첫 급여명세서 작성
						</ThemeButton>
					</div>
				{:else}
					<div class="divide-y divide-gray-200">
						{#each payslipList as payslip}
							<div class="px-6 py-4 hover:bg-gray-50">
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<div class="flex items-center space-x-4">
											<div>
												<p class="text-sm font-medium text-gray-900">
													{payslip.period || '기간 미지정'}
												</p>
												<p class="text-sm text-gray-500">
													지급일: {payslip.pay_date ? formatDate(payslip.pay_date) : '미지정'}
												</p>
											</div>
											<div class="text-right">
												<p class="text-sm font-medium text-gray-900">
													{formatCurrency(payslip.net_salary || payslip.total_amount || 0)}
												</p>
												<p class="text-sm text-gray-500">
													상태: {payslip.status || '미지정'}
												</p>
											</div>
										</div>
									</div>
									<div class="flex items-center space-x-2">
										<ThemeButton 
											variant="outline" 
											size="sm" 
											onclick={() => openPayslipModal(payslip)}
										>
											<PrinterIcon size={16} class="mr-1" />
											출력
										</ThemeButton>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{:else}
	<!-- payroll prop이 있는 경우 (급여 이력에서 클릭한 경우) -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<div>
				<h3 class="text-lg font-semibold text-gray-900">급여명세서</h3>
				<p class="text-sm text-gray-500">
					{payroll.employeeInfo?.name || payroll.employeeName} - {payroll.period}
				</p>
			</div>
			<ThemeButton onclick={() => openPayslipModal(payroll)}>
				<PrinterIcon size={16} class="mr-1" />
				출력
			</ThemeButton>
		</div>
	</div>
{/if}

<!-- 급여명세서 모달 -->
<ThemeModal bind:open={showModal} size="xl">
	<div class="p-6">
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-xl font-semibold text-gray-900">급여명세서</h2>
			<div class="flex items-center space-x-2">
				<ThemeButton variant="outline" size="sm">
					<DownloadIcon size={16} class="mr-1" />
					다운로드
				</ThemeButton>
				<ThemeButton variant="outline" size="sm">
					<PrinterIcon size={16} class="mr-1" />
					인쇄
				</ThemeButton>
				<button
					onclick={() => showModal = false}
					class="p-2 text-gray-400 hover:text-gray-600"
				>
					<XIcon size={20} />
				</button>
			</div>
		</div>

		{#if selectedPayroll || generatedPayslip}
			{@const payslip = selectedPayroll || generatedPayslip}
			<div class="payslip-container bg-white border border-gray-200 rounded-lg p-8">
				<!-- 급여명세서 내용 -->
				<div class="text-center mb-8">
					<h1 class="text-2xl font-bold text-gray-900 mb-2">급여명세서</h1>
					<p class="text-gray-600">{payslip.period} 급여</p>
				</div>

				<!-- 직원 정보 -->
				<div class="grid grid-cols-2 gap-6 mb-8">
					<div>
						<h3 class="text-lg font-semibold text-gray-900 mb-4">직원 정보</h3>
						<div class="space-y-2">
							<div class="flex justify-between">
								<span class="text-gray-600">성명:</span>
								<span class="font-medium">{payslip.employeeInfo?.name || payslip.employeeName}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">사번:</span>
								<span class="font-medium">{payslip.employeeInfo?.employeeId || payslip.employeeIdNumber}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">부서:</span>
								<span class="font-medium">{payslip.employeeInfo?.department || payslip.department}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">직위:</span>
								<span class="font-medium">{payslip.employeeInfo?.position || payslip.position}</span>
							</div>
						</div>
					</div>
					<div>
						<h3 class="text-lg font-semibold text-gray-900 mb-4">급여 정보</h3>
						<div class="space-y-2">
							<div class="flex justify-between">
								<span class="text-gray-600">지급일:</span>
								<span class="font-medium">{formatDate(payslip.payDate)}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">지급기간:</span>
								<span class="font-medium">{payslip.period}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">상태:</span>
								<span class="font-medium">{payslip.status}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- 급여 상세 -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
					<!-- 지급사항 -->
					<div>
						<h3 class="text-lg font-semibold text-gray-900 mb-4">지급사항</h3>
						<div class="space-y-2">
							{#each payslip.allowances || [] as allowance}
								<div class="flex justify-between">
									<span class="text-gray-600">{allowance.name}:</span>
									<span class="font-medium">{formatCurrency(allowance.amount)}</span>
								</div>
							{/each}
							<div class="border-t pt-2 mt-4">
								<div class="flex justify-between font-semibold text-lg">
									<span>지급 총액:</span>
									<span>{formatCurrency(payslip.allowances?.reduce((sum, a) => sum + a.amount, 0) || 0)}</span>
								</div>
							</div>
						</div>
					</div>

					<!-- 공제사항 -->
					<div>
						<h3 class="text-lg font-semibold text-gray-900 mb-4">공제사항</h3>
						<div class="space-y-2">
							{#each payslip.deductions || [] as deduction}
								<div class="flex justify-between">
									<span class="text-gray-600">{deduction.name}:</span>
									<span class="font-medium">{formatCurrency(deduction.amount)}</span>
								</div>
							{/each}
							<div class="border-t pt-2 mt-4">
								<div class="flex justify-between font-semibold text-lg">
									<span>공제 총액:</span>
									<span>{formatCurrency(payslip.deductions?.reduce((sum, d) => sum + d.amount, 0) || 0)}</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- 실지급액 -->
				<div class="border-t-2 border-gray-300 pt-6 mt-8">
					<div class="text-center">
						<div class="text-2xl font-bold text-gray-900">
							실지급액: {formatCurrency(payslip.netSalary || payslip.net_salary || 0)}
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</ThemeModal>

<style>
	@media print {
		.payslip-container {
			margin: 0;
			padding: 20px;
			box-shadow: none;
			border: none;
		}
		
		.payslip-container * {
			color: black !important;
		}
	}
</style>