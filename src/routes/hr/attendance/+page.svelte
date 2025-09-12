<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { formatDate } from '$lib/utils/format';
	
	import { 
		employees,
		getActiveEmployees
	} from '$lib/stores/hr';
	
	import { 
		attendanceRecords, 
		leaveRequests, 
		leaveBalances,
		leaveTypes,
		addAttendanceRecord,
		updateAttendanceRecord,
		checkIn,
		checkOut,
		requestLeave,
		approveLeaveRequest,
		rejectLeaveRequest,
		calculateMonthlyAttendance,
		getAttendanceByEmployee,
		getLeaveRequestsByEmployee,
		getLeaveBalanceByEmployee,
		type AttendanceRecord,
		type LeaveRequest
	} from '$lib/stores/attendance';

	// 현재 선택된 직원
	let selectedEmployeeId = $state('');
	let currentDate = new Date().toISOString().split('T')[0];
	let selectedMonth = new Date().getMonth() + 1;
	let selectedYear = new Date().getFullYear();

	// 모달 상태
	let isLeaveRequestModalOpen = $state(false);
	let isAttendanceModalOpen = $state(false);
	let selectedAttendanceRecord = $state<AttendanceRecord | null>(null);

	// 휴가 신청 폼
	let leaveRequestForm = $state({
		leaveTypeId: '',
		startDate: '',
		endDate: '',
		reason: ''
	});

	// 근태 기록 폼
	let attendanceForm = $state({
		date: currentDate,
		checkIn: '',
		checkOut: '',
		status: 'present' as AttendanceRecord['status'],
		notes: ''
	});

	// 현재 선택된 직원의 데이터
	let selectedEmployee = $derived($employees.find(emp => emp.id === selectedEmployeeId));
	let employeeAttendance = $derived(getAttendanceByEmployee(selectedEmployeeId, $attendanceRecords));
	let employeeLeaveRequests = $derived(getLeaveRequestsByEmployee(selectedEmployeeId, $leaveRequests));
	let employeeLeaveBalance = $derived(getLeaveBalanceByEmployee(selectedEmployeeId, $leaveBalances));
	let monthlyStats = $derived(calculateMonthlyAttendance(selectedEmployeeId, selectedYear, selectedMonth, $attendanceRecords));

	// 오늘의 근태 기록
	let todayAttendance = $derived(employeeAttendance.find(record => record.date === currentDate));

	// 함수들
	function openLeaveRequestModal() {
		leaveRequestForm = {
			leaveTypeId: '',
			startDate: '',
			endDate: '',
			reason: ''
		};
		isLeaveRequestModalOpen = true;
	}

	function openAttendanceModal(record?: AttendanceRecord) {
		if (record) {
			selectedAttendanceRecord = record;
			attendanceForm = {
				date: record.date,
				checkIn: record.checkIn || '',
				checkOut: record.checkOut || '',
				status: record.status,
				notes: record.notes || ''
			};
		} else {
			selectedAttendanceRecord = null;
			attendanceForm = {
				date: currentDate,
				checkIn: '',
				checkOut: '',
				status: 'present',
				notes: ''
			};
		}
		isAttendanceModalOpen = true;
	}

	function handleLeaveRequest() {
		if (!selectedEmployeeId || !leaveRequestForm.leaveTypeId || !leaveRequestForm.startDate || !leaveRequestForm.endDate) {
			alert('모든 필수 항목을 입력해주세요.');
			return;
		}

		const startDate = new Date(leaveRequestForm.startDate);
		const endDate = new Date(leaveRequestForm.endDate);
		const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

		requestLeave({
			employeeId: selectedEmployeeId,
			leaveTypeId: leaveRequestForm.leaveTypeId,
			startDate: leaveRequestForm.startDate,
			endDate: leaveRequestForm.endDate,
			days,
			reason: leaveRequestForm.reason,
			status: 'pending'
		});

		isLeaveRequestModalOpen = false;
		alert('휴가 신청이 완료되었습니다.');
	}

	function handleAttendanceSubmit() {
		if (!selectedEmployeeId || !attendanceForm.date) {
			alert('직원과 날짜를 선택해주세요.');
			return;
		}

		if (selectedAttendanceRecord) {
			// 기존 기록 수정
			updateAttendanceRecord(selectedAttendanceRecord.id, {
				checkIn: attendanceForm.checkIn,
				checkOut: attendanceForm.checkOut,
				status: attendanceForm.status,
				notes: attendanceForm.notes
			});
		} else {
			// 새 기록 추가
			addAttendanceRecord({
				employeeId: selectedEmployeeId,
				date: attendanceForm.date,
				checkIn: attendanceForm.checkIn,
				checkOut: attendanceForm.checkOut,
				status: attendanceForm.status,
				notes: attendanceForm.notes
			});
		}

		isAttendanceModalOpen = false;
	}

	function handleCheckIn() {
		if (!selectedEmployeeId) {
			alert('직원을 선택해주세요.');
			return;
		}
		checkIn(selectedEmployeeId);
		alert('출근 체크가 완료되었습니다.');
	}

	function handleCheckOut() {
		if (!selectedEmployeeId) {
			alert('직원을 선택해주세요.');
			return;
		}
		checkOut(selectedEmployeeId);
		alert('퇴근 체크가 완료되었습니다.');
	}

	function approveLeave(leaveId: string) {
		approveLeaveRequest(leaveId, 'HR팀');
		alert('휴가가 승인되었습니다.');
	}

	function rejectLeave(leaveId: string) {
		const reason = prompt('거부 사유를 입력해주세요:');
		if (reason) {
			rejectLeaveRequest(leaveId, reason);
			alert('휴가가 거부되었습니다.');
		}
	}

	function getStatusBadgeVariant(status: AttendanceRecord['status']): 'success' | 'warning' | 'danger' | 'secondary' {
		switch (status) {
			case 'present': return 'success';
			case 'late': return 'warning';
			case 'early-leave': return 'warning';
			case 'absent': return 'danger';
			case 'vacation': return 'secondary';
			case 'sick-leave': return 'secondary';
			default: return 'secondary';
		}
	}

	function getStatusText(status: AttendanceRecord['status']): string {
		switch (status) {
			case 'present': return '정상출근';
			case 'late': return '지각';
			case 'early-leave': return '조퇴';
			case 'absent': return '결근';
			case 'vacation': return '휴가';
			case 'sick-leave': return '병가';
			case 'business-trip': return '출장';
			case 'half-day': return '반차';
			default: return status;
		}
	}

	function getLeaveStatusBadgeVariant(status: LeaveRequest['status']): 'warning' | 'success' | 'danger' | 'secondary' {
		switch (status) {
			case 'pending': return 'warning';
			case 'approved': return 'success';
			case 'rejected': return 'danger';
			case 'cancelled': return 'secondary';
			default: return 'secondary';
		}
	}

	function getLeaveStatusText(status: LeaveRequest['status']): string {
		switch (status) {
			case 'pending': return '대기중';
			case 'approved': return '승인';
			case 'rejected': return '거부';
			case 'cancelled': return '취소';
			default: return status;
		}
	}

	function getLeaveTypeName(leaveTypeId: string): string {
		const leaveType = $leaveTypes.find(type => type.id === leaveTypeId);
		return leaveType ? leaveType.name : leaveTypeId;
	}

	onMount(() => {
		// 첫 번째 활성 직원을 기본 선택
		const activeEmployees = getActiveEmployees($employees);
		if (activeEmployees.length > 0) {
			selectedEmployeeId = activeEmployees[0].id;
		}
	});
</script>

<div class="min-h-screen bg-gray-50 p-6">
	<div class="max-w-7xl mx-auto">
		<!-- 헤더 -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900">근태 관리</h1>
			<p class="text-gray-600 mt-1">직원의 출퇴근 기록 및 휴가 신청을 관리합니다</p>
		</div>

		<!-- 직원 선택 -->
		<Card class="mb-6">
			<div class="p-6">
				<div class="flex items-center space-x-4">
					<label class="text-sm font-medium text-gray-700">직원 선택:</label>
					<select
						bind:value={selectedEmployeeId}
						class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">직원을 선택하세요</option>
						{#each getActiveEmployees($employees) as employee}
							<option value={employee.id}>{employee.name} ({employee.employeeId})</option>
						{/each}
					</select>
				</div>
			</div>
		</Card>

		{#if selectedEmployee}
			<!-- 오늘의 출퇴근 -->
			<Card class="mb-6">
				<div class="p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">오늘의 출퇴근</h3>
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-4">
							<div>
								<p class="text-sm text-gray-600">출근시간</p>
								<p class="text-lg font-semibold">{todayAttendance?.checkIn || '미체크'}</p>
							</div>
							<div>
								<p class="text-sm text-gray-600">퇴근시간</p>
								<p class="text-lg font-semibold">{todayAttendance?.checkOut || '미체크'}</p>
							</div>
							<div>
								<p class="text-sm text-gray-600">근무시간</p>
								<p class="text-lg font-semibold">{todayAttendance?.workHours || 0}시간</p>
							</div>
						</div>
						<div class="flex space-x-2">
							<button
								onclick={handleCheckIn}
								disabled={!!todayAttendance?.checkIn}
								class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
							>
								출근 체크
							</button>
							<button
								onclick={handleCheckOut}
								disabled={!todayAttendance?.checkIn || !!todayAttendance?.checkOut}
								class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
							>
								퇴근 체크
							</button>
						</div>
					</div>
				</div>
			</Card>

			<!-- 월별 통계 -->
			<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
				<Card>
					<div class="p-6">
						<div class="flex items-center">
							<div class="p-3 rounded-full bg-green-100">
								<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-gray-600">정상출근</p>
								<p class="text-2xl font-bold text-gray-900">{monthlyStats.presentDays}</p>
							</div>
						</div>
					</div>
				</Card>

				<Card>
					<div class="p-6">
						<div class="flex items-center">
							<div class="p-3 rounded-full bg-yellow-100">
								<svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-gray-600">지각</p>
								<p class="text-2xl font-bold text-gray-900">{monthlyStats.lateDays}</p>
							</div>
						</div>
					</div>
				</Card>

				<Card>
					<div class="p-6">
						<div class="flex items-center">
							<div class="p-3 rounded-full bg-red-100">
								<svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
								</svg>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-gray-600">결근</p>
								<p class="text-2xl font-bold text-gray-900">{monthlyStats.absentDays}</p>
							</div>
						</div>
					</div>
				</Card>

				<Card>
					<div class="p-6">
						<div class="flex items-center">
							<div class="p-3 rounded-full bg-blue-100">
								<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-gray-600">총 근무시간</p>
								<p class="text-2xl font-bold text-gray-900">{monthlyStats.totalWorkHours}시간</p>
							</div>
						</div>
					</div>
				</Card>
			</div>

			<!-- 근태 기록 및 휴가 관리 -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- 근태 기록 -->
				<Card>
					<div class="p-6">
						<div class="flex justify-between items-center mb-4">
							<h3 class="text-lg font-semibold text-gray-900">근태 기록</h3>
							<button
								onclick={() => openAttendanceModal()}
								class="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
							>
								기록 추가
							</button>
						</div>
						<div class="space-y-3">
							{#each employeeAttendance.slice(0, 10) as record}
								<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
									<div class="flex items-center space-x-3">
										<div>
											<p class="text-sm font-medium text-gray-900">{formatDate(record.date)}</p>
											<p class="text-xs text-gray-500">
												{record.checkIn || '미체크'} - {record.checkOut || '미체크'}
											</p>
										</div>
									</div>
									<div class="flex items-center space-x-2">
										<Badge variant={getStatusBadgeVariant(record.status)}>
											{getStatusText(record.status)}
										</Badge>
										<button
											onclick={() => openAttendanceModal(record)}
											class="text-blue-600 hover:text-blue-900 text-sm"
										>
											수정
										</button>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</Card>

				<!-- 휴가 관리 -->
				<Card>
					<div class="p-6">
						<div class="flex justify-between items-center mb-4">
							<h3 class="text-lg font-semibold text-gray-900">휴가 관리</h3>
							<button
								onclick={openLeaveRequestModal}
								class="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
							>
								휴가 신청
							</button>
						</div>
						
						<!-- 휴가 잔여일수 -->
						<div class="mb-4">
							<h4 class="text-sm font-medium text-gray-700 mb-2">잔여 휴가</h4>
							<div class="space-y-2">
								{#each employeeLeaveBalance as balance}
									<div class="flex justify-between items-center">
										<span class="text-sm text-gray-600">
											{$leaveTypes.find(type => type.id === balance.leaveTypeId)?.name || balance.leaveTypeId}
										</span>
										<span class="text-sm font-medium text-gray-900">
											{balance.remainingDays}일
										</span>
									</div>
								{/each}
							</div>
						</div>

						<!-- 휴가 신청 내역 -->
						<div>
							<h4 class="text-sm font-medium text-gray-700 mb-2">신청 내역</h4>
							<div class="space-y-3">
								{#each employeeLeaveRequests.slice(0, 5) as request}
									<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
										<div>
											<p class="text-sm font-medium text-gray-900">
												{getLeaveTypeName(request.leaveTypeId)} ({request.days}일)
											</p>
											<p class="text-xs text-gray-500">
												{formatDate(request.startDate)} - {formatDate(request.endDate)}
											</p>
										</div>
										<div class="flex items-center space-x-2">
											<Badge variant={getLeaveStatusBadgeVariant(request.status)}>
												{getLeaveStatusText(request.status)}
											</Badge>
											{#if request.status === 'pending'}
												<div class="flex space-x-1">
													<button
														onclick={() => approveLeave(request.id)}
														class="text-green-600 hover:text-green-900 text-xs"
													>
														승인
													</button>
													<button
														onclick={() => rejectLeave(request.id)}
														class="text-red-600 hover:text-red-900 text-xs"
													>
														거부
													</button>
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</Card>
			</div>
		{:else}
			<Card>
				<div class="p-12 text-center">
					<svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
					</svg>
					<h3 class="text-lg font-medium text-gray-900 mb-2">직원을 선택하세요</h3>
					<p class="text-gray-500">근태 관리를 위해 직원을 선택해주세요.</p>
				</div>
			</Card>
		{/if}

		<!-- 휴가 신청 모달 -->
		<Modal bind:open={isLeaveRequestModalOpen}>
			<div class="p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">휴가 신청</h3>
				<form onsubmit={(e) => { e.preventDefault(); handleLeaveRequest(); }}>
					<div class="space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">휴가 유형 *</label>
							<select
								bind:value={leaveRequestForm.leaveTypeId}
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="">휴가 유형을 선택하세요</option>
								{#each $leaveTypes as leaveType}
									<option value={leaveType.id}>{leaveType.name}</option>
								{/each}
							</select>
						</div>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">시작일 *</label>
								<input
									type="date"
									bind:value={leaveRequestForm.startDate}
									required
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">종료일 *</label>
								<input
									type="date"
									bind:value={leaveRequestForm.endDate}
									required
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">사유</label>
							<textarea
								bind:value={leaveRequestForm.reason}
								rows="3"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="휴가 신청 사유를 입력하세요"
							></textarea>
						</div>
					</div>
					
					<div class="flex justify-end space-x-3 mt-6">
						<button
							type="button"
							onclick={() => isLeaveRequestModalOpen = false}
							class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
						>
							취소
						</button>
						<button
							type="submit"
							class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
						>
							신청
						</button>
					</div>
				</form>
			</div>
		</Modal>

		<!-- 근태 기록 모달 -->
		<Modal bind:open={isAttendanceModalOpen}>
			<div class="p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">
					{selectedAttendanceRecord ? '근태 기록 수정' : '근태 기록 추가'}
				</h3>
				<form onsubmit={(e) => { e.preventDefault(); handleAttendanceSubmit(); }}>
					<div class="space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">날짜 *</label>
							<input
								type="date"
								bind:value={attendanceForm.date}
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">출근시간</label>
								<input
									type="time"
									bind:value={attendanceForm.checkIn}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">퇴근시간</label>
								<input
									type="time"
									bind:value={attendanceForm.checkOut}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">상태 *</label>
							<select
								bind:value={attendanceForm.status}
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="present">정상출근</option>
								<option value="late">지각</option>
								<option value="early-leave">조퇴</option>
								<option value="absent">결근</option>
								<option value="vacation">휴가</option>
								<option value="sick-leave">병가</option>
								<option value="business-trip">출장</option>
								<option value="half-day">반차</option>
							</select>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">비고</label>
							<textarea
								bind:value={attendanceForm.notes}
								rows="3"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="추가 사항을 입력하세요"
							></textarea>
						</div>
					</div>
					
					<div class="flex justify-end space-x-3 mt-6">
						<button
							type="button"
							onclick={() => isAttendanceModalOpen = false}
							class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
						>
							취소
						</button>
						<button
							type="submit"
							class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
						>
							{selectedAttendanceRecord ? '수정' : '추가'}
						</button>
					</div>
				</form>
			</div>
		</Modal>
	</div>
</div>
