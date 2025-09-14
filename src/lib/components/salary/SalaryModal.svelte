<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { 
		SalaryStructure, 
		Allowance, 
		Deduction,
		AllowanceType,
		DeductionType 
	} from '$lib/types/salary';
	import { 
		XIcon, 
		SaveIcon, 
		PlusIcon, 
		TrashIcon,
		DollarSignIcon,
		CalculatorIcon,
		InfoIcon
	} from 'lucide-svelte';

	interface Props {
		open: boolean;
		employee?: {
			id: string;
			name: string;
			employeeId: string;
			department: string;
			position: string;
		} | null;
		salaryStructure?: SalaryStructure | null;
		loading?: boolean;
	}

	let { open, employee = null, salaryStructure = null, loading = false }: Props = $props();

	const dispatch = createEventDispatcher<{
		close: void;
		save: SalaryStructure;
	}>();

	// 폼 데이터
	let formData = $state<Partial<SalaryStructure>>({
		employeeId: '',
		baseSalary: 0,
		allowances: [],
		deductions: [],
		totalAllowances: 0,
		totalDeductions: 0,
		netSalary: 0,
		effectiveDate: new Date().toISOString().split('T')[0],
		status: 'active'
	});

	// 수당/공제 옵션
	const allowanceTypes: { value: AllowanceType; label: string }[] = [
		{ value: 'housing', label: '주거비' },
		{ value: 'transport', label: '교통비' },
		{ value: 'meal', label: '식비' },
		{ value: 'overtime', label: '초과근무수당' },
		{ value: 'bonus', label: '상여금' },
		{ value: 'incentive', label: '인센티브' },
		{ value: 'holiday', label: '휴일수당' },
		{ value: 'night_shift', label: '야간수당' },
		{ value: 'weekend', label: '주말수당' },
		{ value: 'performance', label: '성과급' },
		{ value: 'special', label: '특별수당' },
		{ value: 'other', label: '기타' }
	];

	const deductionTypes: { value: DeductionType; label: string }[] = [
		{ value: 'income_tax', label: '소득세' },
		{ value: 'local_tax', label: '지방소득세' },
		{ value: 'national_pension', label: '국민연금' },
		{ value: 'health_insurance', label: '건강보험' },
		{ value: 'employment_insurance', label: '고용보험' },
		{ value: 'long_term_care', label: '장기요양보험' },
		{ value: 'meal_deduction', label: '식대 공제' },
		{ value: 'transport_deduction', label: '교통비 공제' },
		{ value: 'loan', label: '대출' },
		{ value: 'advance', label: '선급금' },
		{ value: 'penalty', label: '벌금' },
		{ value: 'other', label: '기타' }
	];

	// 수당 추가
	function addAllowance() {
		if (!formData.allowances) formData.allowances = [];
		formData.allowances.push({
			id: `allowance_${Date.now()}`,
			type: 'other',
			name: '',
			amount: 0,
			isTaxable: true,
			isRegular: true,
			description: ''
		});
		calculateTotals();
	}

	// 수당 제거
	function removeAllowance(index: number) {
		if (formData.allowances) {
			formData.allowances.splice(index, 1);
			calculateTotals();
		}
	}

	// 공제 추가
	function addDeduction() {
		if (!formData.deductions) formData.deductions = [];
		formData.deductions.push({
			id: `deduction_${Date.now()}`,
			type: 'other',
			name: '',
			amount: 0,
			isMandatory: false,
			description: ''
		});
		calculateTotals();
	}

	// 공제 제거
	function removeDeduction(index: number) {
		if (formData.deductions) {
			formData.deductions.splice(index, 1);
			calculateTotals();
		}
	}

	// 총액 계산
	function calculateTotals() {
		const totalAllowances = formData.allowances?.reduce((sum, allowance) => sum + allowance.amount, 0) || 0;
		const totalDeductions = formData.deductions?.reduce((sum, deduction) => sum + deduction.amount, 0) || 0;
		const netSalary = (formData.baseSalary || 0) + totalAllowances - totalDeductions;

		formData.totalAllowances = totalAllowances;
		formData.totalDeductions = totalDeductions;
		formData.netSalary = netSalary;
	}

	// 직원 데이터가 변경될 때 폼 데이터 초기화
	$effect(() => {
		if (employee) {
			formData.employeeId = employee.id;
		}

		if (salaryStructure) {
			formData = {
				...salaryStructure,
				allowances: salaryStructure.allowances || [],
				deductions: salaryStructure.deductions || []
			};
		} else if (employee) {
			// 새 급여 구조 생성
			formData = {
				employeeId: employee.id,
				baseSalary: 0,
				allowances: [],
				deductions: [],
				totalAllowances: 0,
				totalDeductions: 0,
				netSalary: 0,
				effectiveDate: new Date().toISOString().split('T')[0],
				status: 'active'
			};
		}
	});

	// 수당/공제 변경 시 자동 계산
	$effect(() => {
		calculateTotals();
	});

	// 폼 유효성 검사
	function validateForm(): boolean {
		if (!formData.employeeId) {
			alert('직원을 선택해주세요.');
			return false;
		}

		if (!formData.baseSalary || formData.baseSalary <= 0) {
			alert('기본급을 입력해주세요.');
			return false;
		}

		if (!formData.effectiveDate) {
			alert('적용 시작일을 선택해주세요.');
			return false;
		}

		return true;
	}

	// 저장 버튼 클릭
	function handleSave() {
		if (!validateForm()) return;

		const salaryData: SalaryStructure = {
			...formData,
			id: salaryStructure?.id || `salary_${Date.now()}`,
			createdAt: salaryStructure?.createdAt || new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			createdBy: 'current_user' // TODO: 실제 사용자 ID로 변경
		} as SalaryStructure;

		dispatch('save', salaryData);
	}

	// 닫기 버튼 클릭
	function handleClose() {
		dispatch('close');
	}
</script>

{#if open}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-4 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-2xl font-bold text-gray-900">
					{salaryStructure ? '급여 구조 수정' : '새 급여 구조 추가'}
				</h2>
				<button
					onclick={handleClose}
					class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
				>
					<XIcon size={20} />
				</button>
			</div>

			{#if employee}
				<!-- 직원 정보 -->
				<div class="bg-blue-50 p-4 rounded-lg mb-6">
					<h3 class="text-lg font-semibold text-blue-900 mb-2">직원 정보</h3>
					<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
						<div>
							<span class="font-medium text-blue-800">이름:</span>
							<span class="ml-2 text-blue-700">{employee.name}</span>
						</div>
						<div>
							<span class="font-medium text-blue-800">사번:</span>
							<span class="ml-2 text-blue-700">{employee.employeeId}</span>
						</div>
						<div>
							<span class="font-medium text-blue-800">부서:</span>
							<span class="ml-2 text-blue-700">{employee.department}</span>
						</div>
						<div>
							<span class="font-medium text-blue-800">직위:</span>
							<span class="ml-2 text-blue-700">{employee.position}</span>
						</div>
					</div>
				</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); handleSave(); }} class="space-y-6">
				<!-- 기본 급여 정보 -->
				<div class="bg-gray-50 p-4 rounded-lg">
					<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
						<DollarSignIcon size={20} class="mr-2" />
						기본 급여 정보
					</h3>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label for="baseSalary" class="block text-sm font-medium text-gray-700 mb-2">기본급 *</label>
							<input
								id="baseSalary"
								type="number"
								bind:value={formData.baseSalary}
								min="0"
								step="1000"
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<div>
							<label for="effectiveDate" class="block text-sm font-medium text-gray-700 mb-2">적용 시작일 *</label>
							<input
								id="effectiveDate"
								type="date"
								bind:value={formData.effectiveDate}
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<div>
							<label for="endDate" class="block text-sm font-medium text-gray-700 mb-2">적용 종료일</label>
							<input
								id="endDate"
								type="date"
								bind:value={formData.endDate}
								class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
					</div>
				</div>

				<!-- 수당 관리 -->
				<div class="bg-gray-50 p-4 rounded-lg">
					<div class="flex items-center justify-between mb-4">
						<h3 class="text-lg font-semibold text-gray-900 flex items-center">
							<PlusIcon size={20} class="mr-2" />
							수당 관리
						</h3>
						<button
							type="button"
							onclick={addAllowance}
							class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
						>
							<PlusIcon size={16} class="mr-1" />
							수당 추가
						</button>
					</div>

					<div class="space-y-3">
						{#each formData.allowances || [] as allowance, index}
							<div class="flex items-center space-x-3 p-3 bg-white rounded-lg border">
								<div class="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
									<div>
										<select
											bind:value={allowance.type}
											class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										>
											{#each allowanceTypes as option}
												<option value={option.value}>{option.label}</option>
											{/each}
										</select>
									</div>
									<div>
										<input
											type="text"
											bind:value={allowance.name}
											placeholder="수당명"
											class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>
									<div>
										<input
											type="number"
											bind:value={allowance.amount}
											min="0"
											step="1000"
											placeholder="금액"
											class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>
									<div class="flex items-center space-x-2">
										<label class="flex items-center">
											<input
												type="checkbox"
												bind:checked={allowance.isTaxable}
												class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
											/>
											<span class="ml-2 text-sm text-gray-700">과세</span>
										</label>
										<label class="flex items-center">
											<input
												type="checkbox"
												bind:checked={allowance.isRegular}
												class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
											/>
											<span class="ml-2 text-sm text-gray-700">정기</span>
										</label>
									</div>
								</div>
								<button
									type="button"
									onclick={() => removeAllowance(index)}
									class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
								>
									<TrashIcon size={16} />
								</button>
							</div>
						{/each}
					</div>
				</div>

				<!-- 공제 관리 -->
				<div class="bg-gray-50 p-4 rounded-lg">
					<div class="flex items-center justify-between mb-4">
						<h3 class="text-lg font-semibold text-gray-900 flex items-center">
							<CalculatorIcon size={20} class="mr-2" />
							공제 관리
						</h3>
						<button
							type="button"
							onclick={addDeduction}
							class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
						>
							<PlusIcon size={16} class="mr-1" />
							공제 추가
						</button>
					</div>

					<div class="space-y-3">
						{#each formData.deductions || [] as deduction, index}
							<div class="flex items-center space-x-3 p-3 bg-white rounded-lg border">
								<div class="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
									<div>
										<select
											bind:value={deduction.type}
											class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										>
											{#each deductionTypes as option}
												<option value={option.value}>{option.label}</option>
											{/each}
										</select>
									</div>
									<div>
										<input
											type="text"
											bind:value={deduction.name}
											placeholder="공제명"
											class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>
									<div>
										<input
											type="number"
											bind:value={deduction.amount}
											min="0"
											step="1000"
											placeholder="금액"
											class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>
									<div class="flex items-center">
										<label class="flex items-center">
											<input
												type="checkbox"
												bind:checked={deduction.isMandatory}
												class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
											/>
											<span class="ml-2 text-sm text-gray-700">법정공제</span>
										</label>
									</div>
								</div>
								<button
									type="button"
									onclick={() => removeDeduction(index)}
									class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
								>
									<TrashIcon size={16} />
								</button>
							</div>
						{/each}
					</div>
				</div>

				<!-- 급여 요약 -->
				<div class="bg-blue-50 p-4 rounded-lg">
					<h3 class="text-lg font-semibold text-blue-900 mb-4 flex items-center">
						<InfoIcon size={20} class="mr-2" />
						급여 요약
					</h3>
					<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div class="text-center">
							<p class="text-sm text-blue-700">기본급</p>
							<p class="text-lg font-bold text-blue-900">
								{new Intl.NumberFormat('ko-KR').format(formData.baseSalary || 0)}원
							</p>
						</div>
						<div class="text-center">
							<p class="text-sm text-green-700">총 수당</p>
							<p class="text-lg font-bold text-green-600">
								+{new Intl.NumberFormat('ko-KR').format(formData.totalAllowances || 0)}원
							</p>
						</div>
						<div class="text-center">
							<p class="text-sm text-red-700">총 공제</p>
							<p class="text-lg font-bold text-red-600">
								-{new Intl.NumberFormat('ko-KR').format(formData.totalDeductions || 0)}원
							</p>
						</div>
						<div class="text-center">
							<p class="text-sm text-gray-700">실지급액</p>
							<p class="text-xl font-bold text-gray-900">
								{new Intl.NumberFormat('ko-KR').format(formData.netSalary || 0)}원
							</p>
						</div>
					</div>
				</div>

				<!-- 버튼 영역 -->
				<div class="flex justify-end space-x-3 pt-6 border-t">
					<button
						type="button"
						onclick={handleClose}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
						disabled={loading}
					>
						취소
					</button>
					<button
						type="submit"
						class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
						disabled={loading}
					>
						{#if loading}
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
						{:else}
							<SaveIcon size={16} class="mr-2" />
						{/if}
						{salaryStructure ? '수정' : '저장'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
