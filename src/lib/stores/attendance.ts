import { writable } from 'svelte/store';

// 근태 기록
export interface AttendanceRecord {
	id: string;
	employeeId: string;
	date: string;
	checkIn?: string; // HH:MM 형식
	checkOut?: string; // HH:MM 형식
	workHours?: number; // 실제 근무시간 (시간)
	overtimeHours?: number; // 연장근무시간 (시간)
	status: 'present' | 'absent' | 'late' | 'early-leave' | 'half-day' | 'vacation' | 'sick-leave' | 'business-trip';
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

// 휴가 유형
export interface LeaveType {
	id: string;
	name: string;
	code: string; // 'annual', 'sick', 'personal', 'maternity', 'paternity', 'bereavement'
	description: string;
	maxDaysPerYear?: number;
	requiresApproval: boolean;
	requiresDocument: boolean;
	canCarryOver: boolean;
	maxCarryOverDays?: number;
	isPaid: boolean;
	color: string; // UI 표시용 색상
	createdAt: string;
}

// 휴가 신청
export interface LeaveRequest {
	id: string;
	employeeId: string;
	leaveTypeId: string;
	startDate: string;
	endDate: string;
	days: number;
	reason: string;
	status: 'pending' | 'approved' | 'rejected' | 'cancelled';
	requestedAt: string;
	approvedBy?: string;
	approvedAt?: string;
	rejectionReason?: string;
	documentUrl?: string;
	notes?: string;
}

// 휴가 잔여일수
export interface LeaveBalance {
	id: string;
	employeeId: string;
	year: number;
	leaveTypeId: string;
	totalDays: number; // 총 부여일수
	usedDays: number; // 사용일수
	remainingDays: number; // 잔여일수
	carriedOverDays: number; // 이월일수
	createdAt: string;
	updatedAt: string;
}

// 교대/스케줄
export interface WorkSchedule {
	id: string;
	employeeId: string;
	date: string;
	shiftType: 'day' | 'night' | 'evening' | 'flexible';
	startTime: string; // HH:MM
	endTime: string; // HH:MM
	workHours: number;
	notes?: string;
	createdAt: string;
}

// 초기 데이터
const initialLeaveTypes: LeaveType[] = [
	{
		id: 'leave-1',
		name: '연차휴가',
		code: 'annual',
		description: '연간 유급휴가',
		maxDaysPerYear: 15,
		requiresApproval: true,
		requiresDocument: false,
		canCarryOver: true,
		maxCarryOverDays: 5,
		isPaid: true,
		color: '#3B82F6',
		createdAt: '2023-01-01T00:00:00Z'
	},
	{
		id: 'leave-2',
		name: '병가',
		code: 'sick',
		description: '질병으로 인한 휴가',
		maxDaysPerYear: 10,
		requiresApproval: true,
		requiresDocument: true,
		canCarryOver: false,
		isPaid: true,
		color: '#EF4444',
		createdAt: '2023-01-01T00:00:00Z'
	},
	{
		id: 'leave-3',
		name: '개인사정휴가',
		code: 'personal',
		description: '개인적인 사정으로 인한 휴가',
		maxDaysPerYear: 5,
		requiresApproval: true,
		requiresDocument: false,
		canCarryOver: false,
		isPaid: false,
		color: '#F59E0B',
		createdAt: '2023-01-01T00:00:00Z'
	},
	{
		id: 'leave-4',
		name: '출산휴가',
		code: 'maternity',
		description: '출산으로 인한 휴가',
		maxDaysPerYear: 90,
		requiresApproval: true,
		requiresDocument: true,
		canCarryOver: false,
		isPaid: true,
		color: '#EC4899',
		createdAt: '2023-01-01T00:00:00Z'
	},
	{
		id: 'leave-5',
		name: '경조사휴가',
		code: 'bereavement',
		description: '경조사로 인한 휴가',
		maxDaysPerYear: 3,
		requiresApproval: true,
		requiresDocument: false,
		canCarryOver: false,
		isPaid: true,
		color: '#6B7280',
		createdAt: '2023-01-01T00:00:00Z'
	}
];

const initialAttendanceRecords: AttendanceRecord[] = [
	{
		id: 'attendance-1',
		employeeId: 'emp-1',
		date: '2024-01-15',
		checkIn: '09:00',
		checkOut: '18:00',
		workHours: 8,
		overtimeHours: 0,
		status: 'present',
		createdAt: '2024-01-15T09:00:00Z',
		updatedAt: '2024-01-15T18:00:00Z'
	},
	{
		id: 'attendance-2',
		employeeId: 'emp-1',
		date: '2024-01-16',
		checkIn: '09:15',
		checkOut: '18:30',
		workHours: 8.25,
		overtimeHours: 0.25,
		status: 'late',
		notes: '지각 15분',
		createdAt: '2024-01-16T09:15:00Z',
		updatedAt: '2024-01-16T18:30:00Z'
	},
	{
		id: 'attendance-3',
		employeeId: 'emp-2',
		date: '2024-01-15',
		checkIn: '09:00',
		checkOut: '17:30',
		workHours: 7.5,
		overtimeHours: 0,
		status: 'early-leave',
		notes: '조퇴 30분',
		createdAt: '2024-01-15T09:00:00Z',
		updatedAt: '2024-01-15T17:30:00Z'
	}
];

const initialLeaveRequests: LeaveRequest[] = [
	{
		id: 'leave-req-1',
		employeeId: 'emp-1',
		leaveTypeId: 'leave-1',
		startDate: '2024-02-01',
		endDate: '2024-02-03',
		days: 3,
		reason: '가족 여행',
		status: 'approved',
		requestedAt: '2024-01-20T10:00:00Z',
		approvedBy: 'emp-3',
		approvedAt: '2024-01-21T14:00:00Z'
	},
	{
		id: 'leave-req-2',
		employeeId: 'emp-2',
		leaveTypeId: 'leave-2',
		startDate: '2024-01-25',
		endDate: '2024-01-25',
		days: 1,
		reason: '감기로 인한 휴가',
		status: 'pending',
		requestedAt: '2024-01-24T16:00:00Z'
	}
];

const initialLeaveBalances: LeaveBalance[] = [
	{
		id: 'balance-1',
		employeeId: 'emp-1',
		year: 2024,
		leaveTypeId: 'leave-1',
		totalDays: 15,
		usedDays: 3,
		remainingDays: 12,
		carriedOverDays: 2,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-20T00:00:00Z'
	},
	{
		id: 'balance-2',
		employeeId: 'emp-2',
		year: 2024,
		leaveTypeId: 'leave-1',
		totalDays: 15,
		usedDays: 5,
		remainingDays: 10,
		carriedOverDays: 0,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-15T00:00:00Z'
	}
];

const initialWorkSchedules: WorkSchedule[] = [
	{
		id: 'schedule-1',
		employeeId: 'emp-1',
		date: '2024-01-15',
		shiftType: 'day',
		startTime: '09:00',
		endTime: '18:00',
		workHours: 8,
		createdAt: '2024-01-15T00:00:00Z'
	}
];

// 스토어 생성
export const leaveTypes = writable<LeaveType[]>(initialLeaveTypes);
export const attendanceRecords = writable<AttendanceRecord[]>(initialAttendanceRecords);
export const leaveRequests = writable<LeaveRequest[]>(initialLeaveRequests);
export const leaveBalances = writable<LeaveBalance[]>(initialLeaveBalances);
export const workSchedules = writable<WorkSchedule[]>(initialWorkSchedules);

// 근태 기록 관리 함수들
export function addAttendanceRecord(record: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>) {
	const newRecord: AttendanceRecord = {
		...record,
		id: `attendance-${Date.now()}`,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	attendanceRecords.update(current => [...current, newRecord]);
}

export function updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>) {
	attendanceRecords.update(current =>
		current.map(record => 
			record.id === id 
				? { ...record, ...updates, updatedAt: new Date().toISOString() }
				: record
		)
	);
}

export function checkIn(employeeId: string, time?: string) {
	const now = time || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
	const today = new Date().toISOString().split('T')[0];
	
	// 오늘의 근태 기록이 있는지 확인
	let existingRecord: any = null;
	attendanceRecords.subscribe(records => {
		existingRecord = records.find(record => record.employeeId === employeeId && record.date === today);
	});

	if (existingRecord) {
		// 기존 기록 업데이트
		attendanceRecords.update(current =>
			current.map(record => 
				record.employeeId === employeeId && record.date === today
					? { ...record, checkIn: now, status: 'present', updatedAt: new Date().toISOString() }
					: record
			)
		);
	} else {
		// 새 기록 생성
		addAttendanceRecord({
			employeeId,
			date: today,
			checkIn: now,
			status: 'present' as const
		});
	}
}

export function checkOut(employeeId: string, time?: string) {
	const now = time || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
	const today = new Date().toISOString().split('T')[0];
	
	attendanceRecords.update(current =>
		current.map(record => {
			if (record.employeeId === employeeId && record.date === today) {
				const checkInTime = record.checkIn;
				if (checkInTime) {
					const workHours = calculateWorkHours(checkInTime, now);
					const overtimeHours = Math.max(0, workHours - 8);
					
					return {
						...record,
						checkOut: now,
						workHours,
						overtimeHours,
						updatedAt: new Date().toISOString()
					};
				}
			}
			return record;
		})
	);
}

// 휴가 유형 관리 함수들
export function addLeaveType(leaveType: Omit<LeaveType, 'id' | 'createdAt'>) {
	const newLeaveType: LeaveType = {
		...leaveType,
		id: `leave-${Date.now()}`,
		createdAt: new Date().toISOString()
	};
	leaveTypes.update(current => [...current, newLeaveType]);
}

export function updateLeaveType(id: string, updates: Partial<LeaveType>) {
	leaveTypes.update(current =>
		current.map(leaveType => leaveType.id === id ? { ...leaveType, ...updates } : leaveType)
	);
}

// 휴가 신청 관리 함수들
export function requestLeave(request: Omit<LeaveRequest, 'id' | 'requestedAt'>) {
	const newRequest: LeaveRequest = {
		...request,
		id: `leave-req-${Date.now()}`,
		requestedAt: new Date().toISOString()
	};
	leaveRequests.update(current => [...current, newRequest]);
}

export function approveLeaveRequest(id: string, approvedBy: string) {
	leaveRequests.update(current =>
		current.map(request => 
			request.id === id 
				? { 
					...request, 
					status: 'approved', 
					approvedBy, 
					approvedAt: new Date().toISOString() 
				}
				: request
		)
	);
}

export function rejectLeaveRequest(id: string, rejectionReason: string) {
	leaveRequests.update(current =>
		current.map(request => 
			request.id === id 
				? { 
					...request, 
					status: 'rejected', 
					rejectionReason 
				}
				: request
		)
	);
}

// 휴가 잔여일수 관리 함수들
export function updateLeaveBalance(employeeId: string, leaveTypeId: string, year: number, usedDays: number) {
	leaveBalances.update(current =>
		current.map(balance => {
			if (balance.employeeId === employeeId && balance.leaveTypeId === leaveTypeId && balance.year === year) {
				const newUsedDays = balance.usedDays + usedDays;
				const newRemainingDays = balance.totalDays - newUsedDays;
				
				return {
					...balance,
					usedDays: newUsedDays,
					remainingDays: newRemainingDays,
					updatedAt: new Date().toISOString()
				};
			}
			return balance;
		})
	);
}

export function initializeLeaveBalance(employeeId: string, year: number) {
	const currentYear = new Date().getFullYear();
	if (year !== currentYear) return;

	leaveTypes.subscribe(types => {
		leaveBalances.update(current => {
			const existingBalances = current.filter(balance => 
				balance.employeeId === employeeId && balance.year === year
			);

			const newBalances = types
				.filter(type => !existingBalances.some(balance => balance.leaveTypeId === type.id))
				.map(type => ({
					id: `balance-${Date.now()}-${Math.random()}`,
					employeeId,
					year,
					leaveTypeId: type.id,
					totalDays: type.maxDaysPerYear || 0,
					usedDays: 0,
					remainingDays: type.maxDaysPerYear || 0,
					carriedOverDays: 0,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				}));

			return [...current, ...newBalances];
		});
	});
}

// 교대/스케줄 관리 함수들
export function addWorkSchedule(schedule: Omit<WorkSchedule, 'id' | 'createdAt'>) {
	const newSchedule: WorkSchedule = {
		...schedule,
		id: `schedule-${Date.now()}`,
		createdAt: new Date().toISOString()
	};
	workSchedules.update(current => [...current, newSchedule]);
}

// 유틸리티 함수들
export function calculateWorkHours(checkIn: string, checkOut: string): number {
	const [checkInHour, checkInMinute] = checkIn.split(':').map(Number);
	const [checkOutHour, checkOutMinute] = checkOut.split(':').map(Number);
	
	const checkInMinutes = checkInHour * 60 + checkInMinute;
	const checkOutMinutes = checkOutHour * 60 + checkOutMinute;
	
	const workMinutes = checkOutMinutes - checkInMinutes;
	return Math.round((workMinutes / 60) * 100) / 100; // 소수점 둘째 자리까지
}

export function getAttendanceByEmployee(employeeId: string, records: AttendanceRecord[]): AttendanceRecord[] {
	return records.filter(record => record.employeeId === employeeId);
}

export function getAttendanceByDateRange(startDate: string, endDate: string, records: AttendanceRecord[]): AttendanceRecord[] {
	return records.filter(record => record.date >= startDate && record.date <= endDate);
}

export function getLeaveRequestsByEmployee(employeeId: string, requests: LeaveRequest[]): LeaveRequest[] {
	return requests.filter(request => request.employeeId === employeeId);
}

export function getLeaveBalanceByEmployee(employeeId: string, balances: LeaveBalance[]): LeaveBalance[] {
	return balances.filter(balance => balance.employeeId === employeeId);
}

export function calculateMonthlyAttendance(employeeId: string, year: number, month: number, records: AttendanceRecord[]): {
	totalDays: number;
	presentDays: number;
	absentDays: number;
	lateDays: number;
	totalWorkHours: number;
	totalOvertimeHours: number;
} {
	const monthRecords = records.filter(record => {
		const recordDate = new Date(record.date);
		return record.employeeId === employeeId && 
			   recordDate.getFullYear() === year && 
			   recordDate.getMonth() === month - 1;
	});

	const totalDays = monthRecords.length;
	const presentDays = monthRecords.filter(record => record.status === 'present').length;
	const absentDays = monthRecords.filter(record => record.status === 'absent').length;
	const lateDays = monthRecords.filter(record => record.status === 'late').length;
	const totalWorkHours = monthRecords.reduce((sum, record) => sum + (record.workHours || 0), 0);
	const totalOvertimeHours = monthRecords.reduce((sum, record) => sum + (record.overtimeHours || 0), 0);

	return {
		totalDays,
		presentDays,
		absentDays,
		lateDays,
		totalWorkHours,
		totalOvertimeHours
	};
}
