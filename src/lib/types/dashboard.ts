// Dashboard Types

export interface AttendanceRecord {
  id?: string
  employee_id?: string
  employee_name?: string
  date: string
  check_in_time?: string
  check_out_time?: string
  total_work_hours?: string | number
  overtime_hours?: number
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'holiday'
  notes?: string
}

export interface AttendanceStats {
  totalDays: number
  workDays: number
  totalWorkHours: number
  totalOvertimeHours: number
  lateDays: number
  earlyLeaveDays: number
  absentDays: number
}

export interface AttendanceData {
  today?: {
    check_in_time?: string
    check_out_time?: string
    break_start_time?: string
    break_end_time?: string
    total_work_hours: number
    overtime_hours: number
    status: string
    notes?: string
  }
  week?: AttendanceRecord[]
  month?: AttendanceRecord[]
  stats?: AttendanceStats
}

export interface LeaveBalance {
  annual: {
    total: number
    used: number
    remaining: number
  }
  sick: {
    total: number
    used: number
    remaining: number
  }
  // Legacy flat structure (for backward compatibility)
  total_annual_leave?: number
  used_annual_leave?: number
  remaining_annual_leave?: number
  total_sick_leave?: number
  used_sick_leave?: number
  remaining_sick_leave?: number
}

export interface LeaveRequest {
  id: string
  employee_id: string
  employee_name: string
  department?: string
  position?: string
  leave_type: string
  start_date: string
  end_date: string
  days: number
  status: 'pending' | 'approved' | 'rejected'
  reason?: string
  created_at: string
  approver_name?: string
}

export interface MonthlyStats {
  month: number
  approved: number
  pending: number
  rejected: number
}

export interface MonthlyLeaveStats {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  approvedDays: number
}

export interface LeaveStats {
  totalRequests?: number
  pendingRequests?: number
  approvedRequests?: number
  rejectedRequests?: number
  departmentStats?: Array<{
    department: string
    count: number
    total_employees?: number
    used_annual_days?: number
    used_sick_days?: number
  }>
  monthlyStats?: Array<{
    month: number
    count: number
    annual_days?: number
    sick_days?: number
  }>
}

export interface LeaveData {
  balance?: LeaveBalance
  requests?: LeaveRequest[]
  monthlyStats?: MonthlyLeaveStats
  stats?: LeaveStats
  userInfo?: {
    name: string
    department: string
    position: string
  }
}

export interface JobPosting {
  id: string
  title: string
  department: string
  position?: string
  employmentType: string
  status: 'published' | 'draft' | 'closed' | 'cancelled'
  description?: string
  requirements?: string | string[]
  location?: string
  salary?: string
  createdAt: string
  updatedAt?: string
}

export interface PayslipData {
  id: string
  employee_id: string
  employee_name: string
  month: string
  year: number
  basic_salary: number
  overtime_pay: number
  bonus: number
  deductions: number
  net_salary: number
  payment_date?: string
  status: 'paid' | 'pending' | 'processing'
}
