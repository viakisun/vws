<script lang="ts">
	import { onMount } from 'svelte';
	import type { Payslip, EmployeePayroll } from '$lib/types/salary';
	import { formatCurrency, formatDate } from '$lib/utils/format';
	import { 
		employeePayrolls,
		loadEmployeePayrolls
	} from '$lib/stores/salary/salary-store';
	import { 
		DownloadIcon, 
		FileTextIcon, 
		CalendarIcon,
		UserIcon,
		DollarSignIcon,
		PrinterIcon,
		EyeIcon,
		SearchIcon
	} from 'lucide-svelte';

	interface Props {
		payroll?: EmployeePayroll;
		showPreview?: boolean;
	}

	let { payroll, showPreview = false }: Props = $props();

	let isGenerating = $state(false);
	let generatedPayslip = $state<Payslip | null>(null);
	let showModal = $state(false);
	let selectedPayroll = $state<EmployeePayroll | null>(null);
	let employees = $state<any[]>([]);
	let selectedEmployeeId = $state('');
	// 현재 월을 기본값으로 설정
	let selectedPeriod = $state(new Date().toISOString().slice(0, 7)); // YYYY-MM 형식
	let currentContract = $state<any>(null);

	// 직원 목록 로드
	async function loadEmployees() {
		try {
			const response = await fetch('/api/employees');
			const result = await response.json();
			if (result.success) {
				employees = result.data.map((emp: any) => ({
					id: emp.id,
					name: `${emp.last_name}${emp.first_name} (${emp.position})`,
					department: emp.department || '부서없음'
				}));
			}
		} catch (error) {
			console.error('직원 목록 로드 실패:', error);
		}
	}

	// 현재 계약 정보 로드
	async function loadCurrentContract(employeeId: string) {
		try {
			const response = await fetch(`/api/salary/contracts/employee/${employeeId}`);
			const result = await response.json();
			if (result.success && result.data.currentContract) {
				currentContract = result.data.currentContract;
			} else {
				currentContract = null;
			}
		} catch (error) {
			console.error('현재 계약 정보 로드 실패:', error);
			currentContract = null;
		}
	}

	// 급여 데이터 로드
	async function loadPayrollData() {
		if (!selectedEmployeeId) return;
		
		try {
			await loadEmployeePayrolls(selectedPeriod);
			// 선택된 직원의 급여 데이터 찾기
			const payroll = $employeePayrolls.find(p => p.employeeId === selectedEmployeeId);
			selectedPayroll = payroll || null;
			// 현재 계약 정보도 함께 로드
			await loadCurrentContract(selectedEmployeeId);
		} catch (error) {
			console.error('급여 데이터 로드 실패:', error);
		}
	}

	onMount(async () => {
		await loadEmployees();
		await loadEmployeePayrolls(selectedPeriod);
	});

	// 급여명세서 생성
	async function generatePayslip() {
		// payroll prop이 있으면 그것을 사용, 없으면 선택된 급여 데이터 사용
		let targetPayroll = payroll || selectedPayroll;
		
		// 급여 데이터가 없지만 직원이 선택된 경우, 현재 계약 정보로 생성
		if (!targetPayroll && selectedEmployeeId) {
			// 현재 계약 정보 로드
			await loadCurrentContract(selectedEmployeeId);
			
			if (!currentContract) {
				alert('현재 계약 정보를 찾을 수 없습니다.');
				return;
			}
			
			// 선택된 직원 정보 가져오기
			const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
			if (!selectedEmployee) {
				alert('선택된 직원 정보를 찾을 수 없습니다.');
				return;
			}
			
			// 가상의 급여 데이터 생성
			targetPayroll = {
				employeeId: selectedEmployeeId,
				employeeName: selectedEmployee.name,
				employeeIdNumber: selectedEmployee.id,
				department: selectedEmployee.department,
				position: selectedEmployee.name.split('(')[1]?.replace(')', '') || '연구원',
				baseSalary: currentContract.monthlySalary.toString(),
				payrollId: `payroll_${Date.now()}`,
				payDate: new Date().toISOString()
			};
		}
		
		if (!targetPayroll) {
			alert('급여 데이터를 선택해주세요.');
			return;
		}

		// 현재 계약 정보가 없으면 로드
		if (!currentContract && targetPayroll.employeeId) {
			await loadCurrentContract(targetPayroll.employeeId);
		}

		isGenerating = true;
		try {
			// 현재 계약 정보를 기반으로 급여명세서 생성
			const baseSalary = currentContract ? currentContract.monthlySalary : targetPayroll.baseSalary;
			const allowances = currentContract ? [
				{ id: 'housing', name: '주거비', type: 'housing', amount: 500000, isRegular: true, isTaxable: false },
				{ id: 'transport', name: '교통비', type: 'transport', amount: 200000, isRegular: true, isTaxable: false },
				{ id: 'meal', name: '식비', type: 'meal', amount: 300000, isRegular: true, isTaxable: false }
			] : targetPayroll.allowances;
			
			const totalAllowances = allowances.reduce((sum, allowance) => sum + allowance.amount, 0);
			const grossSalary = baseSalary + totalAllowances;
			
			// 공제 계산 (간단한 예시)
			const deductions = [
				{ id: 'income_tax', name: '소득세', rate: 0.13, type: 'income_tax', amount: Math.round(grossSalary * 0.13), isMandatory: true },
				{ id: 'local_tax', name: '지방소득세', rate: 0.013, type: 'local_tax', amount: Math.round(grossSalary * 0.013), isMandatory: true },
				{ id: 'national_pension', name: '국민연금', rate: 0.045, type: 'national_pension', amount: Math.round(grossSalary * 0.045), isMandatory: true },
				{ id: 'health_insurance', name: '건강보험', rate: 0.034, type: 'health_insurance', amount: Math.round(grossSalary * 0.034), isMandatory: true },
				{ id: 'employment_insurance', name: '고용보험', rate: 0.008, type: 'employment_insurance', amount: Math.round(grossSalary * 0.008), isMandatory: true },
				{ id: 'long_term_care', name: '장기요양보험', rate: 0.0034, type: 'long_term_care', amount: Math.round(grossSalary * 0.0034), isMandatory: true }
			];
			
			const totalDeductions = deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
			const netSalary = grossSalary - totalDeductions;

			const mockPayslip: Payslip = {
				id: `payslip_${Date.now()}`,
				employeeId: targetPayroll.employeeId,
				payrollId: targetPayroll.payrollId || `payroll_${Date.now()}`,
				period: selectedPeriod,
				payDate: new Date().toISOString(),
				employeeInfo: {
					name: targetPayroll.employeeName,
					employeeId: targetPayroll.employeeIdNumber,
					department: targetPayroll.department,
					position: targetPayroll.position,
					hireDate: '2020-01-01', // TODO: 실제 입사일로 변경
					bankAccount: '123-456-789012', // TODO: 실제 계좌 정보로 변경
					bankName: '우리은행'
				},
				salaryInfo: {
					baseSalary: baseSalary.toString(),
					totalAllowances: totalAllowances.toString(),
					totalDeductions: totalDeductions.toString(),
					grossSalary: grossSalary.toString(),
					netSalary: netSalary.toString(),
					workingDays: 22, // TODO: 실제 근무일수로 변경
					actualWorkingDays: 22
				},
				allowances: allowances,
				deductions: deductions,
				totals: {
					grossSalary: grossSalary.toString(),
					totalAllowances: totalAllowances.toString(),
					totalDeductions: totalDeductions.toString(),
					netSalary: netSalary.toString(),
					taxableIncome: grossSalary.toString(),
					nonTaxableIncome: '0'
				},
				status: 'generated',
				generatedAt: new Date().toISOString(),
				generatedBy: 'system'
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

	// 급여명세서 다운로드 (PDF)
	async function downloadPayslip() {
		if (!generatedPayslip) return;

		try {
			// TODO: 실제 PDF 생성 로직 구현
			// 현재는 HTML을 새 창에서 열어서 인쇄 가능하게 함
			const printWindow = window.open('', '_blank');
			if (printWindow) {
				printWindow.document.write(generatePayslipHTML(generatedPayslip));
				printWindow.document.close();
				printWindow.print();
			}
		} catch (error) {
			console.error('급여명세서 다운로드 실패:', error);
			alert('급여명세서 다운로드에 실패했습니다.');
		}
	}

	// 급여명세서 HTML 생성
	function generatePayslipHTML(payslip: Payslip): string {
		return `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<title>급여명세서 - ${payslip.employeeInfo.name}</title>
				<style>
					body { font-family: 'Malgun Gothic', sans-serif; margin: 0; padding: 20px; }
					.payslip { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; }
					.header { background: #f8f9fa; padding: 20px; text-align: center; border-bottom: 2px solid #007bff; }
					.content { padding: 20px; }
					.employee-info { background: #e9ecef; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
					.salary-section { margin-bottom: 20px; }
					.salary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
					.salary-table th, .salary-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
					.salary-table th { background: #f8f9fa; font-weight: bold; }
					.total-section { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: right; }
					.text-right { text-align: right; }
					.text-center { text-align: center; }
					.bold { font-weight: bold; }
					.footer { background: #f8f9fa; padding: 15px; text-align: center; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
					@media print { body { margin: 0; } .payslip { border: none; } }
				</style>
			</head>
			<body>
				<div class="payslip">
					<div class="header">
						<h1>급여명세서</h1>
						<p>${formatDate(payslip.payDate)} 지급분</p>
					</div>
					
					<div class="content">
						<div class="employee-info">
							<h3>직원 정보</h3>
							<table class="salary-table">
								<tr><td>성명</td><td>${payslip.employeeInfo.name}</td><td>사번</td><td>${payslip.employeeInfo.employeeId}</td></tr>
								<tr><td>부서</td><td>${payslip.employeeInfo.department}</td><td>직위</td><td>${payslip.employeeInfo.position}</td></tr>
								<tr><td>입사일</td><td>${formatDate(payslip.employeeInfo.hireDate)}</td><td>지급일</td><td>${formatDate(payslip.payDate)}</td></tr>
							</table>
						</div>

						<div class="salary-section">
							<h3>급여 내역</h3>
							<table class="salary-table">
								<thead>
									<tr>
										<th>구분</th>
										<th>항목</th>
										<th>금액</th>
										<th>비고</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td rowspan="${payslip.allowances.length + 1}" class="bold">지급</td>
										<td>기본급</td>
										<td class="text-right">${formatCurrency(payslip.salaryInfo.baseSalary)}</td>
										<td></td>
									</tr>
									${payslip.allowances.map(allowance => `
										<tr>
											<td>${allowance.name}</td>
											<td class="text-right">${formatCurrency(allowance.amount)}</td>
											<td>${allowance.isTaxable ? '과세' : '비과세'}</td>
										</tr>
									`).join('')}
									<tr class="bold">
										<td>지급액 계</td>
										<td class="text-right">${formatCurrency(payslip.totals.grossSalary)}</td>
										<td></td>
									</tr>
								</tbody>
							</table>
						</div>

						<div class="salary-section">
							<h3>공제 내역</h3>
							<table class="salary-table">
								<thead>
									<tr>
										<th>구분</th>
										<th>항목</th>
										<th>금액</th>
										<th>비고</th>
									</tr>
								</thead>
								<tbody>
									${payslip.deductions.map(deduction => `
										<tr>
											<td>공제</td>
											<td>${deduction.name}</td>
											<td class="text-right">${formatCurrency(deduction.amount)}</td>
											<td>${deduction.isMandatory ? '법정' : '임의'}</td>
										</tr>
									`).join('')}
									<tr class="bold">
										<td>공제액 계</td>
										<td class="text-right">${formatCurrency(payslip.totals.totalDeductions)}</td>
										<td></td>
									</tr>
								</tbody>
							</table>
						</div>

						<div class="total-section">
							<h3>실지급액: ${formatCurrency(payslip.totals.netSalary)}</h3>
						</div>
					</div>

					<div class="footer">
						<p>본 급여명세서는 전자문서로 생성되었으며, 출력일시: ${new Date().toLocaleString('ko-KR')}</p>
					</div>
				</div>
			</body>
			</html>
		`;
	}

	// 미리보기 보기
	function openPreview() {
		if (!generatedPayslip) {
			generatePayslip();
		} else {
			showModal = true;
		}
	}
</script>

{#if !payroll}
	<!-- 직원 선택 UI (payroll prop이 없는 경우) -->
	<div class="space-y-4">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">직원 선택</label>
				<select
					bind:value={selectedEmployeeId}
					onchange={loadPayrollData}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="">직원을 선택하세요</option>
					{#each employees as employee}
						<option value={employee.id}>{employee.name}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">급여 기간</label>
				<input
					type="month"
					bind:value={selectedPeriod}
					onchange={loadPayrollData}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div class="flex items-end">
				<button
					onclick={loadPayrollData}
					class="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<SearchIcon size={16} class="mr-1" />
					급여 조회
				</button>
			</div>
		</div>

		{#if selectedPayroll}
			<div class="bg-gray-50 p-4 rounded-lg">
				<h3 class="text-lg font-semibold text-gray-900 mb-2">선택된 급여 정보</h3>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
					<div>
						<span class="font-medium text-gray-700">직원명:</span>
						<span class="ml-2 text-gray-900">{selectedPayroll.employeeName}</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">부서:</span>
						<span class="ml-2 text-gray-900">{selectedPayroll.department}</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">지급일:</span>
						<span class="ml-2 text-gray-900">{formatDate(selectedPayroll.payDate)}</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">실지급액:</span>
						<span class="ml-2 text-gray-900 font-semibold">{formatCurrency(selectedPayroll.netSalary)}</span>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}

<div class="flex items-center space-x-2 mt-4">
	{#if showPreview}
		<button
			onclick={openPreview}
			class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
		>
			<EyeIcon size={16} class="mr-1" />
			미리보기
		</button>
	{/if}
	
	<button
		onclick={() => {
			console.log('명세서 생성 버튼 클릭됨');
			console.log('payroll:', payroll);
			console.log('selectedPayroll:', selectedPayroll);
			console.log('selectedEmployeeId:', selectedEmployeeId);
			console.log('currentContract:', currentContract);
			generatePayslip();
		}}
		disabled={isGenerating || (!payroll && !selectedPayroll && !selectedEmployeeId)}
		class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
	>
		{#if isGenerating}
			<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
		{:else}
			<FileTextIcon size={16} class="mr-1" />
		{/if}
		명세서 생성
	</button>

	{#if generatedPayslip}
		<button
			onclick={downloadPayslip}
			class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
		>
			<DownloadIcon size={16} class="mr-1" />
			다운로드
		</button>
	{/if}
</div>

<!-- 급여명세서 미리보기 모달 -->
{#if showModal && generatedPayslip}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-4 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-medium text-gray-900">급여명세서 미리보기</h3>
				<div class="flex items-center space-x-2">
					<button
						onclick={() => window.print()}
						class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
					>
						<PrinterIcon size={16} class="mr-1" />
						프린트
					</button>
					<button
						onclick={downloadPayslip}
						class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
					>
						<DownloadIcon size={16} class="mr-1" />
						다운로드
					</button>
					<button
						onclick={() => showModal = false}
						class="text-gray-400 hover:text-gray-600"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>
			</div>
			
			<div class="border rounded-lg p-6 bg-white payslip-container">
				<!-- 급여명세서 헤더 -->
				<div class="text-center mb-6 pb-4 border-b-2 border-blue-600">
					<h1 class="text-2xl font-bold text-gray-900">급여명세서</h1>
					<p class="text-gray-600">{formatDate(generatedPayslip.payDate)} 지급분</p>
				</div>
				
				<!-- 직원 정보 -->
				<div class="bg-gray-50 p-4 rounded-lg mb-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-3">직원 정보</h3>
					<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
						<div>
							<span class="font-medium text-gray-700">성명:</span>
							<span class="ml-2 text-gray-900">{generatedPayslip.employeeInfo.name}</span>
						</div>
						<div>
							<span class="font-medium text-gray-700">사번:</span>
							<span class="ml-2 text-gray-900">{generatedPayslip.employeeInfo.employeeId}</span>
						</div>
						<div>
							<span class="font-medium text-gray-700">부서:</span>
							<span class="ml-2 text-gray-900">{generatedPayslip.employeeInfo.department}</span>
						</div>
						<div>
							<span class="font-medium text-gray-700">직위:</span>
							<span class="ml-2 text-gray-900">{generatedPayslip.employeeInfo.position}</span>
						</div>
						<div>
							<span class="font-medium text-gray-700">입사일:</span>
							<span class="ml-2 text-gray-900">{formatDate(generatedPayslip.employeeInfo.hireDate)}</span>
						</div>
						<div>
							<span class="font-medium text-gray-700">지급일:</span>
							<span class="ml-2 text-gray-900">{formatDate(generatedPayslip.payDate)}</span>
						</div>
					</div>
				</div>

				<!-- 급여 내역 -->
				<div class="mb-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-3">급여 내역</h3>
					<div class="overflow-x-auto">
						<table class="min-w-full border border-gray-200 rounded-lg">
							<thead class="bg-gray-50">
								<tr>
									<th class="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">구분</th>
									<th class="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">항목</th>
									<th class="border border-gray-200 px-4 py-2 text-right text-sm font-medium text-gray-700">금액</th>
									<th class="border border-gray-200 px-4 py-2 text-center text-sm font-medium text-gray-700">비고</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td rowspan={generatedPayslip.allowances.length + 1} class="border border-gray-200 px-4 py-2 text-sm font-medium text-gray-900">지급</td>
									<td class="border border-gray-200 px-4 py-2 text-sm text-gray-900">기본급</td>
									<td class="border border-gray-200 px-4 py-2 text-sm text-gray-900 text-right">
										{formatCurrency(generatedPayslip.salaryInfo.baseSalary)}
									</td>
									<td class="border border-gray-200 px-4 py-2 text-sm text-gray-500 text-center">-</td>
								</tr>
								{#each generatedPayslip.allowances as allowance}
									<tr>
										<td class="border border-gray-200 px-4 py-2 text-sm text-gray-900">{allowance.name}</td>
										<td class="border border-gray-200 px-4 py-2 text-sm text-gray-900 text-right">
											{formatCurrency(allowance.amount)}
										</td>
										<td class="border border-gray-200 px-4 py-2 text-sm text-gray-500 text-center">
											{allowance.isTaxable ? '과세' : '비과세'}
										</td>
									</tr>
								{/each}
								<tr class="bg-gray-50">
									<td colspan="2" class="border border-gray-200 px-4 py-2 text-sm font-medium text-gray-900">지급액 계</td>
									<td class="border border-gray-200 px-4 py-2 text-sm font-bold text-gray-900 text-right">
										{formatCurrency(generatedPayslip.totals.grossSalary)}
									</td>
									<td class="border border-gray-200 px-4 py-2"></td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				<!-- 공제 내역 -->
				<div class="mb-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-3">공제 내역</h3>
					<div class="overflow-x-auto">
						<table class="min-w-full border border-gray-200 rounded-lg">
							<thead class="bg-gray-50">
								<tr>
									<th class="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">구분</th>
									<th class="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">항목</th>
									<th class="border border-gray-200 px-4 py-2 text-right text-sm font-medium text-gray-700">금액</th>
									<th class="border border-gray-200 px-4 py-2 text-center text-sm font-medium text-gray-700">비고</th>
								</tr>
							</thead>
							<tbody>
								{#each generatedPayslip.deductions as deduction}
									<tr>
										<td class="border border-gray-200 px-4 py-2 text-sm text-gray-900">공제</td>
										<td class="border border-gray-200 px-4 py-2 text-sm text-gray-900">{deduction.name}</td>
										<td class="border border-gray-200 px-4 py-2 text-sm text-gray-900 text-right">
											{formatCurrency(deduction.amount)}
										</td>
										<td class="border border-gray-200 px-4 py-2 text-sm text-gray-500 text-center">
											{deduction.isMandatory ? '법정' : '임의'}
										</td>
									</tr>
								{/each}
								<tr class="bg-gray-50">
									<td colspan="2" class="border border-gray-200 px-4 py-2 text-sm font-medium text-gray-900">공제액 계</td>
									<td class="border border-gray-200 px-4 py-2 text-sm font-bold text-gray-900 text-right">
										{formatCurrency(generatedPayslip.totals.totalDeductions)}
									</td>
									<td class="border border-gray-200 px-4 py-2"></td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				<!-- 실지급액 -->
				<div class="bg-blue-50 p-6 rounded-lg text-center">
					<h3 class="text-xl font-bold text-blue-900">
						실지급액: {formatCurrency(generatedPayslip.totals.netSalary)}
					</h3>
				</div>

				<!-- 푸터 -->
				<div class="mt-6 pt-4 border-t text-center text-sm text-gray-500">
					<p>본 급여명세서는 전자문서로 생성되었으며, 출력일시: {new Date().toLocaleString('ko-KR')}</p>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* A4 세로 모드 프린트 스타일 */
	@media print {
		.payslip-container {
			width: 210mm !important;
			height: 297mm !important;
			margin: 0 !important;
			padding: 15mm !important;
			box-shadow: none !important;
			border: none !important;
			background: white !important;
			font-size: 12px !important;
			line-height: 1.4 !important;
		}
		
		.payslip-container h1 {
			font-size: 24px !important;
			margin-bottom: 10px !important;
		}
		
		.payslip-container h3 {
			font-size: 16px !important;
			margin-bottom: 8px !important;
		}
		
		.payslip-container .grid {
			display: grid !important;
		}
		
		.payslip-container table {
			width: 100% !important;
			border-collapse: collapse !important;
			font-size: 11px !important;
		}
		
		.payslip-container th,
		.payslip-container td {
			padding: 6px 8px !important;
			border: 1px solid #000 !important;
		}
		
		.payslip-container .bg-gray-50 {
			background-color: #f9fafb !important;
		}
		
		.payslip-container .text-center {
			text-align: center !important;
		}
		
		.payslip-container .text-right {
			text-align: right !important;
		}
		
		.payslip-container .font-bold {
			font-weight: bold !important;
		}
		
		.payslip-container .font-semibold {
			font-weight: 600 !important;
		}
		
		/* 페이지 브레이크 방지 */
		.payslip-container > div {
			page-break-inside: avoid !important;
		}
		
		/* 헤더와 푸터 고정 */
		.payslip-container .border-b-2 {
			border-bottom: 2px solid #000 !important;
		}
		
		.payslip-container .border-t {
			border-top: 1px solid #000 !important;
		}
	}
</style>
