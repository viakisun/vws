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
		SearchIcon,
		EditIcon
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
	let isLoadingPayroll = $state(false);
	
	// 급여명세서 작성 모드
	let isPayslipEditMode = $state<boolean>(false);
	let editedPayments = $state<any[]>([]);
	let editedDeductions = $state<any[]>([]);
	
	// 데이터베이스에서 불러온 급여명세서
	let savedPayslip = $state<any>(null);
	let payslipSource = $state<string>(''); // 'current', 'previous', 'default'

	// 직원 목록 로드
	async function loadEmployees() {
		try {
			const response = await fetch('/api/employees');
			const result = await response.json();
			if (result.success) {
				employees = result.data.map((emp: any) => ({
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
		console.log('급여 조회 시작:', { selectedEmployeeId, selectedPeriod });
		
		if (!selectedEmployeeId) {
			alert('직원을 먼저 선택해주세요.');
			return;
		}
		
		isLoadingPayroll = true;
		
		try {
			console.log('급여 데이터 로드 중...');
			await loadEmployeePayrolls(selectedPeriod);
			
			console.log('로드된 급여 데이터:', $employeePayrolls);
			
			// 선택된 직원의 급여 데이터 찾기
			const payroll = $employeePayrolls.find(p => p.employeeId === selectedEmployeeId);
			console.log('찾은 급여 데이터:', payroll);
			
			selectedPayroll = payroll || null;
			
			// 현재 계약 정보도 함께 로드
			await loadCurrentContract(selectedEmployeeId);
			console.log('현재 계약 정보:', currentContract);
			
			if (!selectedPayroll) {
				console.log('해당 기간의 급여 데이터가 없습니다.');
				if (currentContract) {
					console.log('계약 정보가 있습니다. 급여명세서 생성이 가능합니다.');
					alert('해당 기간의 급여 데이터가 없습니다.\n계약 정보를 바탕으로 급여명세서를 생성할 수 있습니다.');
				} else {
					console.log('계약 정보도 없습니다.');
					alert('해당 기간의 급여 데이터와 계약 정보가 모두 없습니다.\n급여 계약을 먼저 등록해주세요.');
				}
			} else {
				console.log('급여 데이터 조회 완료');
			}
			
		} catch (error) {
			console.error('급여 데이터 로드 실패:', error);
			alert('급여 데이터를 불러오는데 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
		} finally {
			isLoadingPayroll = false;
		}
	}

	onMount(async () => {
		await loadEmployees();
		await loadEmployeePayrolls(selectedPeriod);
	});

	// 데이터베이스에서 급여명세서 불러오기
	async function loadPayslipFromDatabase(employeeId: string, period: string) {
		try {
			const response = await fetch(`/api/salary/payslips/employee/${employeeId}?period=${period}`);
			const result = await response.json();
			
			if (result.success) {
				savedPayslip = result.data;
				payslipSource = result.source;
				console.log('급여명세서 불러오기 성공:', result.source, savedPayslip);
				return result.data;
			} else {
				console.error('급여명세서 불러오기 실패:', result.error);
				return null;
			}
		} catch (error) {
			console.error('급여명세서 불러오기 오류:', error);
			return null;
		}
	}

	// 급여명세서를 데이터베이스에 저장
	async function savePayslipToDatabase(payslipData: any) {
		try {
			const response = await fetch('/api/salary/payslips', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payslipData)
			});
			
			const result = await response.json();
			
			if (result.success) {
				console.log('급여명세서 저장 성공:', result.data);
				savedPayslip = result.data;
				return result.data;
			} else {
				console.error('급여명세서 저장 실패:', result.error);
				return null;
			}
		} catch (error) {
			console.error('급여명세서 저장 오류:', error);
			return null;
		}
	}

	// 급여명세서 작성 모드로 전환
	function enterPayslipEditMode() {
		if (!generatedPayslip) return;
		
		isPayslipEditMode = true;
		// 현재 급여명세서 데이터를 편집용으로 복사
		editedPayments = [...generatedPayslip.payments];
		editedDeductions = [...generatedPayslip.deductions];
	}
	
	// 급여명세서 작성 모드 종료
	function exitPayslipEditMode() {
		isPayslipEditMode = false;
		editedPayments = [];
		editedDeductions = [];
	}
	
	// 급여명세서 저장
	async function savePayslip() {
		if (!generatedPayslip) return;
		
		// 편집된 데이터로 급여명세서 업데이트
		generatedPayslip.payments = [...editedPayments];
		generatedPayslip.deductions = [...editedDeductions];
		
		// 총액 재계산
		const totalPayments = editedPayments.reduce((sum, payment) => sum + payment.amount, 0);
		const totalDeductions = editedDeductions.reduce((sum, deduction) => sum + deduction.amount, 0);
		const netSalary = totalPayments - totalDeductions;
		
		generatedPayslip.totals.totalPayments = totalPayments.toString();
		generatedPayslip.totals.totalDeductions = totalDeductions.toString();
		generatedPayslip.totals.netSalary = netSalary.toString();
		
		// 데이터베이스에 저장할 데이터 준비
		const payslipData = {
			employeeId: generatedPayslip.employeeId,
			period: generatedPayslip.period,
			payDate: generatedPayslip.payDate,
			employeeName: generatedPayslip.employeeInfo.name,
			employeeIdNumber: generatedPayslip.employeeInfo.employeeId,
			department: generatedPayslip.employeeInfo.department,
			position: generatedPayslip.employeeInfo.position,
			hireDate: generatedPayslip.employeeInfo.hireDate,
			baseSalary: generatedPayslip.salaryInfo.baseSalary,
			totalPayments: totalPayments,
			totalDeductions: totalDeductions,
			netSalary: netSalary,
			payments: editedPayments,
			deductions: editedDeductions,
			status: 'draft',
			isGenerated: true
		};
		
		// 데이터베이스에 저장
		await savePayslipToDatabase(payslipData);
		
		isPayslipEditMode = false;
	}

	// 급여명세서 생성
	async function generatePayslip() {
		// payroll prop이 있으면 그것을 사용, 없으면 선택된 급여 데이터 사용
		let targetPayroll = payroll || selectedPayroll;
		
		// 급여 데이터가 없지만 직원이 선택된 경우, 데이터베이스에서 먼저 확인
		if (!targetPayroll && selectedEmployeeId) {
			const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
			if (!selectedEmployee) {
				alert('선택된 직원 정보를 찾을 수 없습니다.');
				return;
			}
			
			// 데이터베이스에서 급여명세서 불러오기 시도
			const dbPayslip = await loadPayslipFromDatabase(selectedEmployeeId, selectedPeriod);
			if (dbPayslip) {
				// 데이터베이스에서 불러온 급여명세서를 generatedPayslip으로 설정
				generatedPayslip = {
					id: dbPayslip.id || `payslip_${Date.now()}`,
					employeeId: dbPayslip.employeeId,
					payrollId: `payroll_${Date.now()}`,
					period: dbPayslip.period,
					payDate: dbPayslip.payDate,
					employeeInfo: {
						name: dbPayslip.employeeName,
						employeeId: dbPayslip.employeeIdNumber,
						department: dbPayslip.department,
						position: dbPayslip.position,
						hireDate: dbPayslip.hireDate,
						bankAccount: '123-456-789012',
						bankName: '우리은행'
					},
					salaryInfo: {
						baseSalary: dbPayslip.baseSalary.toString(),
						totalPayments: dbPayslip.totalPayments.toString(),
						totalDeductions: dbPayslip.totalDeductions.toString(),
						netSalary: dbPayslip.netSalary.toString(),
						workingDays: 22,
						actualWorkingDays: 22
					},
					payments: dbPayslip.payments,
					deductions: dbPayslip.deductions,
					totals: {
						totalPayments: dbPayslip.totalPayments.toString(),
						totalDeductions: dbPayslip.totalDeductions.toString(),
						netSalary: dbPayslip.netSalary.toString(),
						taxableIncome: dbPayslip.totalPayments.toString(),
						nonTaxableIncome: '0'
					},
					status: 'generated',
					generatedAt: new Date().toISOString(),
					generatedBy: 'system'
				};
				
				showModal = true;
				return;
			}
			
			// 데이터베이스에 급여명세서가 없는 경우, 현재 계약 정보로 생성
			await loadCurrentContract(selectedEmployeeId);
			
			if (!currentContract) {
				alert('현재 계약 정보를 찾을 수 없습니다.');
				return;
			}
			
			// 가상의 급여 데이터 생성
			targetPayroll = {
				employeeId: selectedEmployeeId,
				employeeName: selectedEmployee.name,
				employeeIdNumber: selectedEmployee.employeeId || selectedEmployee.id,
				department: selectedEmployee.department,
				position: selectedEmployee.position || '연구원',
				hireDate: selectedEmployee.hireDate,
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
			
			// 지급사항 구성 (실제 급여 시스템에 맞게)
			const payments = [
				{ id: 'basic_salary', name: '기본급', amount: baseSalary, type: 'basic', isTaxable: true },
				{ id: 'position_allowance', name: '직책수당', amount: Math.round(baseSalary * 0.1), type: 'allowance', isTaxable: true },
				{ id: 'bonus', name: '상여금', amount: 0, type: 'bonus', isTaxable: true },
				{ id: 'meal_allowance', name: '식대', amount: 300000, type: 'allowance', isTaxable: false },
				{ id: 'vehicle_maintenance', name: '차량유지', amount: 200000, type: 'allowance', isTaxable: false },
				{ id: 'annual_leave_allowance', name: '연차수당', amount: 0, type: 'allowance', isTaxable: true },
				{ id: 'year_end_settlement', name: '연말정산', amount: 0, type: 'settlement', isTaxable: true }
			];
			
			const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
			
			// 공제사항 구성 (실제 급여 시스템에 맞게)
			const deductions = [
				{ id: 'health_insurance', name: '건강보험', rate: 0.034, type: 'insurance', amount: Math.round(totalPayments * 0.034), isMandatory: true },
				{ id: 'long_term_care', name: '장기요양보험', rate: 0.0034, type: 'insurance', amount: Math.round(totalPayments * 0.0034), isMandatory: true },
				{ id: 'national_pension', name: '국민연금', rate: 0.045, type: 'pension', amount: Math.round(totalPayments * 0.045), isMandatory: true },
				{ id: 'employment_insurance', name: '고용보험', rate: 0.008, type: 'insurance', amount: Math.round(totalPayments * 0.008), isMandatory: true },
				{ id: 'income_tax', name: '갑근세', rate: 0.13, type: 'tax', amount: Math.round(totalPayments * 0.13), isMandatory: true },
				{ id: 'local_tax', name: '주민세', rate: 0.013, type: 'tax', amount: Math.round(totalPayments * 0.013), isMandatory: true },
				{ id: 'other', name: '기타', rate: 0, type: 'other', amount: 0, isMandatory: false }
			];
			
			const totalDeductions = deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
			const netSalary = totalPayments - totalDeductions;

			const mockPayslip: Payslip = {
				id: `payslip_${Date.now()}`,
				employeeId: targetPayroll.employeeId,
				payrollId: targetPayroll.payrollId || `payroll_${Date.now()}`,
				period: selectedPeriod,
				payDate: selectedPeriod + '-01', // 월만 표시 (YYYY-MM-01 형식)
				employeeInfo: {
					name: targetPayroll.employeeName,
					employeeId: targetPayroll.employeeIdNumber,
					department: targetPayroll.department,
					position: targetPayroll.position,
					hireDate: targetPayroll.hireDate || '2020-01-01', // 실제 입사일 사용, 없으면 기본값
					bankAccount: '123-456-789012', // TODO: 실제 계좌 정보로 변경
					bankName: '우리은행'
				},
				salaryInfo: {
					baseSalary: baseSalary.toString(),
					totalPayments: totalPayments.toString(),
					totalDeductions: totalDeductions.toString(),
					netSalary: netSalary.toString(),
					workingDays: 22, // TODO: 실제 근무일수로 변경
					actualWorkingDays: 22
				},
				payments: payments,
				deductions: deductions,
				totals: {
					totalPayments: totalPayments.toString(),
					totalDeductions: totalDeductions.toString(),
					netSalary: netSalary.toString(),
					taxableIncome: totalPayments.toString(),
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
			// jsPDF 라이브러리 동적 로드
			const { jsPDF } = await import('jspdf');
			const doc = new jsPDF('p', 'mm', 'a4');
			
			// 폰트 설정 (한글 지원을 위해 기본 폰트 사용)
			doc.setFont('helvetica');
			
			// 페이지 설정
			const pageWidth = 210;
			const pageHeight = 297;
			const margin = 10;
			let yPosition = margin;
			
			// 제목
			doc.setFontSize(20);
			doc.setFont('helvetica', 'bold');
			doc.text('급여명세서', pageWidth / 2, yPosition, { align: 'center' });
			yPosition += 10;
			
			doc.setFontSize(12);
			doc.setFont('helvetica', 'normal');
			doc.text(`${generatedPayslip.period} 지급분`, pageWidth / 2, yPosition, { align: 'center' });
			yPosition += 15;
			
			// 직원 정보
			doc.setFontSize(14);
			doc.setFont('helvetica', 'bold');
			doc.text('직원 정보', margin, yPosition);
			yPosition += 8;
			
			doc.setFontSize(10);
			doc.setFont('helvetica', 'normal');
			doc.text(`성명: ${generatedPayslip.employeeInfo.name}`, margin, yPosition);
			doc.text(`사번: ${generatedPayslip.employeeInfo.employeeId}`, pageWidth / 2, yPosition);
			yPosition += 10;
			
			// 지급 내역
			doc.setFontSize(14);
			doc.setFont('helvetica', 'bold');
			doc.text('지급 내역', margin, yPosition);
			yPosition += 8;
			
			// 지급 내역 테이블
			doc.setFontSize(9);
			doc.setFont('helvetica', 'bold');
			doc.text('구분', margin, yPosition);
			doc.text('항목', margin + 20, yPosition);
			doc.text('금액', margin + 80, yPosition);
			doc.text('비고', margin + 120, yPosition);
			yPosition += 5;
			
			// 구분선
			doc.line(margin, yPosition, pageWidth - margin, yPosition);
			yPosition += 3;
			
			doc.setFont('helvetica', 'normal');
			generatedPayslip.payments.forEach((payment: any) => {
				doc.text('지급', margin, yPosition);
				doc.text(payment.name, margin + 20, yPosition);
				doc.text(formatCurrency(payment.amount), margin + 80, yPosition);
				doc.text(payment.isTaxable ? '과세' : '비과세', margin + 120, yPosition);
				yPosition += 4;
			});
			
			// 지급총액
			yPosition += 2;
			doc.line(margin, yPosition, pageWidth - margin, yPosition);
			yPosition += 3;
			doc.setFont('helvetica', 'bold');
			doc.text('지급총액', margin + 20, yPosition);
			doc.text(formatCurrency(generatedPayslip.totalPayments), margin + 80, yPosition);
			yPosition += 10;
			
			// 공제 내역
			doc.setFontSize(14);
			doc.setFont('helvetica', 'bold');
			doc.text('공제 내역', margin, yPosition);
			yPosition += 8;
			
			// 공제 내역 테이블
			doc.setFontSize(9);
			doc.setFont('helvetica', 'bold');
			doc.text('구분', margin, yPosition);
			doc.text('항목', margin + 20, yPosition);
			doc.text('금액', margin + 80, yPosition);
			doc.text('비고', margin + 120, yPosition);
			yPosition += 5;
			
			// 구분선
			doc.line(margin, yPosition, pageWidth - margin, yPosition);
			yPosition += 3;
			
			doc.setFont('helvetica', 'normal');
			generatedPayslip.deductions.forEach((deduction: any) => {
				doc.text('공제', margin, yPosition);
				doc.text(deduction.name, margin + 20, yPosition);
				doc.text(formatCurrency(deduction.amount), margin + 80, yPosition);
				doc.text(deduction.isMandatory ? '법정' : '임의', margin + 120, yPosition);
				yPosition += 4;
			});
			
			// 공제총액
			yPosition += 2;
			doc.line(margin, yPosition, pageWidth - margin, yPosition);
			yPosition += 3;
			doc.setFont('helvetica', 'bold');
			doc.text('공제총액', margin + 20, yPosition);
			doc.text(formatCurrency(generatedPayslip.totalDeductions), margin + 80, yPosition);
			yPosition += 10;
			
			// 차감지급액
			doc.setFontSize(16);
			doc.setFont('helvetica', 'bold');
			doc.text('차감지급액', pageWidth / 2, yPosition, { align: 'center' });
			yPosition += 5;
			doc.setFontSize(18);
			doc.text(formatCurrency(generatedPayslip.netSalary), pageWidth / 2, yPosition, { align: 'center' });
			
			// 파일명 생성
			const fileName = `급여명세서_${generatedPayslip.employeeInfo.name}_${generatedPayslip.period}.pdf`;
			
			// PDF 다운로드
			doc.save(fileName);
			
		} catch (error) {
			console.error('급여명세서 다운로드 실패:', error);
			alert('급여명세서 다운로드에 실패했습니다. jsPDF 라이브러리가 필요합니다.');
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
					disabled={isLoadingPayroll || !selectedEmployeeId}
					class="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if isLoadingPayroll}
						<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						조회 중...
					{:else}
						<SearchIcon size={16} class="mr-1" />
						급여 조회
					{/if}
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
		{:else if selectedEmployeeId && currentContract}
			<div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
				<h3 class="text-lg font-semibold text-blue-900 mb-2">계약 정보 기반 급여명세서 생성 가능</h3>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
					<div>
						<span class="font-medium text-blue-700">직원명:</span>
						<span class="ml-2 text-blue-900">{employees.find(emp => emp.id === selectedEmployeeId)?.name || '알 수 없음'}</span>
					</div>
					<div>
						<span class="font-medium text-blue-700">계약 유형:</span>
						<span class="ml-2 text-blue-900">{currentContract.contractType}</span>
					</div>
					<div>
						<span class="font-medium text-blue-700">연봉:</span>
						<span class="ml-2 text-blue-900 font-semibold">{formatCurrency(currentContract.annualSalary)}</span>
					</div>
					<div>
						<span class="font-medium text-blue-700">월급:</span>
						<span class="ml-2 text-blue-900 font-semibold">{formatCurrency(Math.round(currentContract.annualSalary / 12))}</span>
					</div>
				</div>
				<p class="text-sm text-blue-700 mt-2">
					💡 해당 기간의 급여 데이터는 없지만, 계약 정보를 바탕으로 급여명세서를 생성할 수 있습니다.
				</p>
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
		disabled={isGenerating || (!payroll && !selectedPayroll && !selectedEmployeeId) || (!payroll && !selectedPayroll && !currentContract)}
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
		
		<button
			onclick={enterPayslipEditMode}
			class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
		>
			<EditIcon size={16} class="mr-1" />
			급여명세서 작성
		</button>
	{/if}
</div>

<!-- 급여명세서 미리보기 모달 -->
{#if showModal && generatedPayslip}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-4 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
			<div class="flex items-center justify-between mb-4">
				<div>
					<h3 class="text-lg font-medium text-gray-900">
						{isPayslipEditMode ? '급여명세서 작성' : '급여명세서 미리보기'}
					</h3>
					{#if payslipSource}
						<p class="text-sm text-gray-500">
							데이터 소스: 
							{#if payslipSource === 'current'}
								<span class="text-green-600">이번달 데이터</span>
							{:else if payslipSource === 'previous'}
								<span class="text-yellow-600">지난달 데이터</span>
							{:else if payslipSource === 'default'}
								<span class="text-blue-600">기본 템플릿</span>
							{/if}
						</p>
					{/if}
				</div>
				<div class="flex items-center space-x-2">
					{#if isPayslipEditMode}
						<button
							onclick={savePayslip}
							class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
						>
							<FileTextIcon size={16} class="mr-1" />
							저장
						</button>
						<button
							onclick={exitPayslipEditMode}
							class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
						>
							취소
						</button>
					{:else}
						<button
							onclick={enterPayslipEditMode}
							class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
						>
							<EditIcon size={16} class="mr-1" />
							급여명세서 작성
						</button>
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
					{/if}
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
					<p class="text-gray-600">{generatedPayslip.period} 지급분</p>
				</div>
				
				<!-- 직원 정보 -->
				<div class="bg-gray-50 p-4 rounded-lg mb-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-3">직원 정보</h3>
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span class="font-medium text-gray-700">성명:</span>
							<span class="ml-2 text-gray-900">{generatedPayslip.employeeInfo.name}</span>
						</div>
						<div>
							<span class="font-medium text-gray-700">사번:</span>
							<span class="ml-2 text-gray-900">{generatedPayslip.employeeInfo.employeeId}</span>
						</div>
					</div>
				</div>

				<!-- 지급 내역 -->
				<div class="mb-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-3">지급 내역</h3>
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
									<td rowspan={(isPayslipEditMode ? editedPayments : generatedPayslip.payments).length + 1} class="border border-gray-200 px-4 py-2 text-sm font-medium text-gray-900">지급</td>
								</tr>
								{#each (isPayslipEditMode ? editedPayments : generatedPayslip.payments) as payment, index}
									<tr>
										<td class="border border-gray-200 px-4 py-2 text-sm text-gray-900">
											{#if isPayslipEditMode}
												<input 
													type="text" 
													bind:value={editedPayments[index].name}
													class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
												/>
											{:else}
												{payment.name}
											{/if}
										</td>
										<td class="border border-gray-200 px-4 py-2 text-sm text-gray-900 text-right">
											{#if isPayslipEditMode}
												<input 
													type="number" 
													bind:value={editedPayments[index].amount}
													class="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
												/>
											{:else}
												{formatCurrency(payment.amount)}
											{/if}
										</td>
										<td class="border border-gray-200 px-4 py-2 text-sm text-gray-500 text-center">
											{#if isPayslipEditMode}
												<select 
													bind:value={editedPayments[index].isTaxable}
													class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
												>
													<option value={true}>과세</option>
													<option value={false}>비과세</option>
												</select>
											{:else}
												{payment.isTaxable ? '과세' : '비과세'}
											{/if}
										</td>
									</tr>
								{/each}
								<tr class="bg-gray-50">
									<td colspan="2" class="border border-gray-200 px-4 py-2 text-sm font-medium text-gray-900">지급총액</td>
									<td class="border border-gray-200 px-4 py-2 text-sm font-bold text-gray-900 text-right">
										{#if isPayslipEditMode}
											{formatCurrency(editedPayments.reduce((sum, payment) => sum + Number(payment.amount), 0))}
										{:else}
											{formatCurrency(generatedPayslip.totals.totalPayments)}
										{/if}
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
								{#each (isPayslipEditMode ? editedDeductions : generatedPayslip.deductions) as deduction, index}
									<tr>
										<td class="border border-gray-200 px-4 py-2 text-sm text-gray-900">공제</td>
										<td class="border border-gray-200 px-4 py-2 text-sm text-gray-900">
											{#if isPayslipEditMode}
												<input 
													type="text" 
													bind:value={editedDeductions[index].name}
													class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
												/>
											{:else}
												{deduction.name}
											{/if}
										</td>
										<td class="border border-gray-200 px-4 py-2 text-sm text-gray-900 text-right">
											{#if isPayslipEditMode}
												<input 
													type="number" 
													bind:value={editedDeductions[index].amount}
													class="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
												/>
											{:else}
												{formatCurrency(deduction.amount)}
											{/if}
										</td>
										<td class="border border-gray-200 px-4 py-2 text-sm text-gray-500 text-center">
											{#if isPayslipEditMode}
												<select 
													bind:value={editedDeductions[index].isMandatory}
													class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
												>
													<option value={true}>법정</option>
													<option value={false}>임의</option>
												</select>
											{:else}
												{deduction.isMandatory ? '법정' : '임의'}
											{/if}
										</td>
									</tr>
								{/each}
								<tr class="bg-gray-50">
									<td colspan="2" class="border border-gray-200 px-4 py-2 text-sm font-medium text-gray-900">공제총액</td>
									<td class="border border-gray-200 px-4 py-2 text-sm font-bold text-gray-900 text-right">
										{#if isPayslipEditMode}
											{formatCurrency(editedDeductions.reduce((sum, deduction) => sum + Number(deduction.amount), 0))}
										{:else}
											{formatCurrency(generatedPayslip.totals.totalDeductions)}
										{/if}
									</td>
									<td class="border border-gray-200 px-4 py-2"></td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				<!-- 차감지급액 -->
				<div class="bg-blue-50 p-6 rounded-lg text-center">
					<h3 class="text-xl font-bold text-blue-900">
						차감지급액: 
						{#if isPayslipEditMode}
							{formatCurrency(editedPayments.reduce((sum, payment) => sum + Number(payment.amount), 0) - editedDeductions.reduce((sum, deduction) => sum + Number(deduction.amount), 0))}
						{:else}
							{formatCurrency(generatedPayslip.totals.netSalary)}
						{/if}
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
	/* A4 세로 모드 프린트 스타일 - 급여명세서만 깔끔하게 출력 */
	@media print {
		/* 브라우저 기본 여백 제거 */
		@page {
			margin: 0 !important;
			padding: 0 !important;
			size: A4 portrait !important;
		}
		
		/* 급여명세서 컨테이너 내부 요소 여백 정리 */
		.payslip-container * {
			margin: 0 !important;
			padding: 0 !important;
		}
		
		/* 급여명세서 컨테이너 내부 요소에 적절한 여백 재적용 */
		.payslip-container > div {
			margin-bottom: 10px !important;
		}
		
		.payslip-container h1 {
			margin-bottom: 15px !important;
		}
		
		.payslip-container h3 {
			margin-bottom: 8px !important;
			margin-top: 15px !important;
		}
		
		.payslip-container table {
			margin-bottom: 15px !important;
		}
		
		/* 테이블 행 간격 줄이기 */
		.payslip-container th,
		.payslip-container td {
			padding: 4px 6px !important;
			border: 1px solid #000 !important;
			text-align: left !important;
			vertical-align: middle !important;
		}
		
		/* 모달 외부 모든 요소 숨기기 */
		body * {
			visibility: hidden !important;
		}
		
		/* 급여명세서 컨테이너만 보이기 */
		.payslip-container,
		.payslip-container * {
			visibility: visible !important;
		}
		
		/* 급여명세서 컨테이너 위치 조정 */
		.payslip-container {
			position: fixed !important;
			left: 0 !important;
			top: 0 !important;
			width: 210mm !important;
			height: 297mm !important;
			margin: 0 !important;
			padding: 10mm !important;
			box-shadow: none !important;
			border: none !important;
			background: white !important;
			font-family: 'Malgun Gothic', '맑은 고딕', sans-serif !important;
			font-size: 11px !important;
			line-height: 1.3 !important;
			color: black !important;
			overflow: visible !important;
		}
		
		/* 제목 스타일 */
		.payslip-container h1 {
			font-size: 28px !important;
			font-weight: bold !important;
			text-align: center !important;
			color: black !important;
		}
		
		.payslip-container h3 {
			font-size: 16px !important;
			font-weight: bold !important;
			color: black !important;
		}
		
		/* 직원 정보 섹션 */
		.payslip-container .bg-gray-50 {
			background-color: #f8f9fa !important;
			border: 1px solid #dee2e6 !important;
			padding: 8px !important;
			margin-bottom: 10px !important;
		}
		
		/* 그리드 레이아웃 */
		.payslip-container .grid {
			display: grid !important;
			gap: 10px !important;
		}
		
		.payslip-container .grid-cols-2 {
			grid-template-columns: 1fr 1fr !important;
		}
		
		.payslip-container .grid-cols-4 {
			grid-template-columns: repeat(4, 1fr) !important;
		}
		
		/* 테이블 스타일 */
		.payslip-container table {
			width: 100% !important;
			border-collapse: collapse !important;
			font-size: 10px !important;
		}
		
		.payslip-container th {
			background-color: #f8f9fa !important;
			font-weight: bold !important;
			text-align: center !important;
		}
		
		/* 텍스트 정렬 */
		.payslip-container .text-center {
			text-align: center !important;
		}
		
		.payslip-container .text-right {
			text-align: right !important;
		}
		
		/* 폰트 굵기 */
		.payslip-container .font-bold {
			font-weight: bold !important;
		}
		
		.payslip-container .font-semibold {
			font-weight: 600 !important;
		}
		
		/* 차감지급액 섹션 */
		.payslip-container .bg-blue-50 {
			background-color: #e3f2fd !important;
			border: 2px solid #1976d2 !important;
			padding: 10px !important;
			margin: 10px 0 !important;
			text-align: center !important;
		}
		
		.payslip-container .bg-blue-50 h3 {
			font-size: 20px !important;
			color: #1976d2 !important;
			margin: 0 !important;
		}
		
		/* 페이지 브레이크 방지 */
		.payslip-container > div {
			page-break-inside: avoid !important;
		}
		
		/* 테이블 행이 페이지를 넘나들지 않도록 */
		.payslip-container tr {
			page-break-inside: avoid !important;
		}
		
		/* 헤더와 푸터 스타일 */
		.payslip-container .border-b-2 {
			border-bottom: 3px solid #000 !important;
			padding-bottom: 15px !important;
			margin-bottom: 20px !important;
		}
		
		.payslip-container .border-t {
			border-top: 1px solid #000 !important;
			padding-top: 15px !important;
			margin-top: 20px !important;
		}
		
		/* 푸터 텍스트 */
		.payslip-container .text-gray-500 {
			color: #666 !important;
			font-size: 10px !important;
		}
		
		/* 금액 표시 강조 */
		.payslip-container .text-lg {
			font-size: 14px !important;
		}
		
		.payslip-container .text-xl {
			font-size: 18px !important;
		}
		
		/* 색상 제거 (흑백 프린트용) */
		.payslip-container .text-green-600,
		.payslip-container .text-red-600,
		.payslip-container .text-blue-900 {
			color: black !important;
		}
	}
</style>
