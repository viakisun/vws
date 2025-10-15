/**
 * HR 관련 테스트 데이터 Fixtures
 */

export const HR_FIXTURES = {
  /**
   * 직원 테스트 데이터
   */
  employees: {
    active: {
      id: 'employee-active-123',
      employee_id: 'EMP001',
      first_name: '홍',
      last_name: '길동',
      email: 'hong@company.com',
      phone: '010-1234-5678',
      department: '개발팀',
      position: '시니어 개발자',
      hire_date: '2023-01-15',
      status: 'active',
      salary: 60000000,
      work_type: 'full_time',
      company_code: 'DEFAULT',
      created_at: '2023-01-15T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
    inactive: {
      id: 'employee-inactive-123',
      employee_id: 'EMP002',
      first_name: '김',
      last_name: '철수',
      email: 'kim@company.com',
      phone: '010-2345-6789',
      department: '마케팅팀',
      position: '마케팅 매니저',
      hire_date: '2022-06-01',
      status: 'inactive',
      salary: 50000000,
      work_type: 'full_time',
      company_code: 'DEFAULT',
      created_at: '2022-06-01T00:00:00.000Z',
      updated_at: '2024-12-31T00:00:00.000Z',
    },
    contractor: {
      id: 'employee-contractor-123',
      employee_id: 'CON001',
      first_name: '이',
      last_name: '영희',
      email: 'lee@contractor.com',
      phone: '010-3456-7890',
      department: '디자인팀',
      position: 'UI/UX 디자이너',
      hire_date: '2024-03-01',
      status: 'active',
      salary: 45000000,
      work_type: 'contract',
      company_code: 'DEFAULT',
      created_at: '2024-03-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
    partTime: {
      id: 'employee-parttime-123',
      employee_id: 'PT001',
      first_name: '박',
      last_name: '민수',
      email: 'park@company.com',
      phone: '010-4567-8901',
      department: '고객지원팀',
      position: '고객지원 담당자',
      hire_date: '2024-09-01',
      status: 'active',
      salary: 25000000,
      work_type: 'part_time',
      company_code: 'DEFAULT',
      created_at: '2024-09-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
  },

  /**
   * 출퇴근 테스트 데이터
   */
  attendance: {
    normal: {
      id: 'attendance-normal-123',
      employee_id: 'employee-active-123',
      date: '2025-01-15',
      check_in: '2025-01-15T09:00:00.000Z',
      check_out: '2025-01-15T18:00:00.000Z',
      work_hours: 8,
      overtime_hours: 0,
      status: 'present',
      notes: '',
      created_at: '2025-01-15T00:00:00.000Z',
      updated_at: '2025-01-15T00:00:00.000Z',
    },
    overtime: {
      id: 'attendance-overtime-123',
      employee_id: 'employee-active-123',
      date: '2025-01-16',
      check_in: '2025-01-16T09:00:00.000Z',
      check_out: '2025-01-16T20:00:00.000Z',
      work_hours: 10,
      overtime_hours: 2,
      status: 'present',
      notes: '프로젝트 마감으로 인한 야근',
      created_at: '2025-01-16T00:00:00.000Z',
      updated_at: '2025-01-16T00:00:00.000Z',
    },
    late: {
      id: 'attendance-late-123',
      employee_id: 'employee-active-123',
      date: '2025-01-17',
      check_in: '2025-01-17T10:30:00.000Z',
      check_out: '2025-01-17T18:30:00.000Z',
      work_hours: 7.5,
      overtime_hours: 0,
      status: 'late',
      notes: '교통 지연으로 인한 지각',
      created_at: '2025-01-17T00:00:00.000Z',
      updated_at: '2025-01-17T00:00:00.000Z',
    },
    absent: {
      id: 'attendance-absent-123',
      employee_id: 'employee-active-123',
      date: '2025-01-18',
      check_in: null,
      check_out: null,
      work_hours: 0,
      overtime_hours: 0,
      status: 'absent',
      notes: '무단 결근',
      created_at: '2025-01-18T00:00:00.000Z',
      updated_at: '2025-01-18T00:00:00.000Z',
    },
    halfDay: {
      id: 'attendance-halfday-123',
      employee_id: 'employee-active-123',
      date: '2025-01-19',
      check_in: '2025-01-19T09:00:00.000Z',
      check_out: '2025-01-19T13:00:00.000Z',
      work_hours: 4,
      overtime_hours: 0,
      status: 'half_day',
      notes: '오전 반차 사용',
      created_at: '2025-01-19T00:00:00.000Z',
      updated_at: '2025-01-19T00:00:00.000Z',
    },
  },

  /**
   * 휴가 테스트 데이터
   */
  leaves: {
    annual: {
      id: 'leave-annual-123',
      employee_id: 'employee-active-123',
      type: 'annual',
      start_date: '2025-02-01',
      end_date: '2025-02-03',
      days: 3,
      reason: '개인 휴가',
      status: 'approved',
      approved_by: 'manager-123',
      approved_at: '2025-01-20T00:00:00.000Z',
      created_at: '2025-01-15T00:00:00.000Z',
      updated_at: '2025-01-20T00:00:00.000Z',
    },
    sick: {
      id: 'leave-sick-123',
      employee_id: 'employee-active-123',
      type: 'sick',
      start_date: '2025-01-20',
      end_date: '2025-01-21',
      days: 2,
      reason: '감기로 인한 병가',
      status: 'approved',
      approved_by: 'manager-123',
      approved_at: '2025-01-20T00:00:00.000Z',
      created_at: '2025-01-20T00:00:00.000Z',
      updated_at: '2025-01-20T00:00:00.000Z',
    },
    pending: {
      id: 'leave-pending-123',
      employee_id: 'employee-active-123',
      type: 'annual',
      start_date: '2025-03-01',
      end_date: '2025-03-05',
      days: 5,
      reason: '가족 여행',
      status: 'pending',
      approved_by: null,
      approved_at: null,
      created_at: '2025-01-15T00:00:00.000Z',
      updated_at: '2025-01-15T00:00:00.000Z',
    },
    rejected: {
      id: 'leave-rejected-123',
      employee_id: 'employee-active-123',
      type: 'annual',
      start_date: '2025-01-25',
      end_date: '2025-01-30',
      days: 6,
      reason: '장기 휴가 신청',
      status: 'rejected',
      approved_by: 'manager-123',
      approved_at: '2025-01-18T00:00:00.000Z',
      rejection_reason: '업무 일정상 불가',
      created_at: '2025-01-15T00:00:00.000Z',
      updated_at: '2025-01-18T00:00:00.000Z',
    },
    halfDay: {
      id: 'leave-halfday-123',
      employee_id: 'employee-active-123',
      type: 'half_annual',
      start_date: '2025-01-22',
      end_date: '2025-01-22',
      days: 0.5,
      reason: '오후 반차',
      status: 'approved',
      approved_by: 'manager-123',
      approved_at: '2025-01-20T00:00:00.000Z',
      created_at: '2025-01-20T00:00:00.000Z',
      updated_at: '2025-01-20T00:00:00.000Z',
    },
  },

  /**
   * 계약 테스트 데이터
   */
  contracts: {
    fullTime: {
      id: 'contract-fulltime-123',
      employee_id: 'employee-active-123',
      type: 'full_time',
      start_date: '2023-01-15',
      end_date: null,
      salary: 60000000,
      position: '시니어 개발자',
      department: '개발팀',
      work_hours: 40,
      probation_period: 90,
      status: 'active',
      created_at: '2023-01-15T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
    partTime: {
      id: 'contract-parttime-123',
      employee_id: 'employee-parttime-123',
      type: 'part_time',
      start_date: '2024-09-01',
      end_date: '2025-08-31',
      salary: 25000000,
      position: '고객지원 담당자',
      department: '고객지원팀',
      work_hours: 20,
      probation_period: 30,
      status: 'active',
      created_at: '2024-09-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
    contract: {
      id: 'contract-contract-123',
      employee_id: 'employee-contractor-123',
      type: 'contract',
      start_date: '2024-03-01',
      end_date: '2025-02-28',
      salary: 45000000,
      position: 'UI/UX 디자이너',
      department: '디자인팀',
      work_hours: 40,
      probation_period: 0,
      status: 'active',
      created_at: '2024-03-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
    expired: {
      id: 'contract-expired-123',
      employee_id: 'employee-inactive-123',
      type: 'full_time',
      start_date: '2022-06-01',
      end_date: '2024-12-31',
      salary: 50000000,
      position: '마케팅 매니저',
      department: '마케팅팀',
      work_hours: 40,
      probation_period: 90,
      status: 'expired',
      created_at: '2022-06-01T00:00:00.000Z',
      updated_at: '2024-12-31T00:00:00.000Z',
    },
  },

  /**
   * 급여명세서 테스트 데이터
   */
  payslips: {
    current: {
      id: 'payslip-current-123',
      employee_id: 'employee-active-123',
      period: '2025-01',
      pay_period_start: '2025-01-01',
      pay_period_end: '2025-01-31',
      base_salary: 5000000,
      overtime_pay: 500000,
      bonus: 1000000,
      total_payments: 6500000,
      income_tax: 650000,
      national_pension: 195000,
      health_insurance: 97500,
      employment_insurance: 32500,
      long_term_care_insurance: 48750,
      total_deductions: 1020750,
      net_salary: 5479250,
      is_generated: true,
      created_at: '2025-02-01T00:00:00.000Z',
      updated_at: '2025-02-01T00:00:00.000Z',
    },
    previous: {
      id: 'payslip-previous-123',
      employee_id: 'employee-active-123',
      period: '2024-12',
      pay_period_start: '2024-12-01',
      pay_period_end: '2024-12-31',
      base_salary: 5000000,
      overtime_pay: 300000,
      bonus: 0,
      total_payments: 5300000,
      income_tax: 530000,
      national_pension: 159000,
      health_insurance: 79500,
      employment_insurance: 26500,
      long_term_care_insurance: 39750,
      total_deductions: 834750,
      net_salary: 4465250,
      is_generated: true,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
    draft: {
      id: 'payslip-draft-123',
      employee_id: 'employee-active-123',
      period: '2025-02',
      pay_period_start: '2025-02-01',
      pay_period_end: '2025-02-28',
      base_salary: 5000000,
      overtime_pay: 0,
      bonus: 0,
      total_payments: 5000000,
      income_tax: 500000,
      national_pension: 150000,
      health_insurance: 75000,
      employment_insurance: 25000,
      long_term_care_insurance: 37500,
      total_deductions: 787500,
      net_salary: 4212500,
      is_generated: false,
      created_at: '2025-02-28T00:00:00.000Z',
      updated_at: '2025-02-28T00:00:00.000Z',
    },
  },

  /**
   * HR 통계 테스트 데이터
   */
  stats: {
    monthly: {
      total_employees: 50,
      active_employees: 45,
      inactive_employees: 5,
      new_hires: 3,
      resignations: 2,
      attendance_rate: 95.5,
      average_work_hours: 8.2,
      overtime_hours: 120,
      leave_requests: 15,
      approved_leaves: 12,
      pending_leaves: 3,
      total_salary_cost: 250000000,
      average_salary: 5555555,
    },
    quarterly: {
      total_employees: 52,
      active_employees: 47,
      inactive_employees: 5,
      new_hires: 8,
      resignations: 6,
      attendance_rate: 94.2,
      average_work_hours: 8.1,
      overtime_hours: 350,
      leave_requests: 45,
      approved_leaves: 38,
      pending_leaves: 7,
      total_salary_cost: 780000000,
      average_salary: 5531914,
    },
  },

  /**
   * 휴가 캘린더 테스트 데이터
   */
  leaveCalendar: {
    events: [
      {
        id: 'leave-event-123',
        employee_id: 'employee-active-123',
        employee_name: '홍길동',
        type: 'annual',
        start_date: '2025-02-01',
        end_date: '2025-02-03',
        status: 'approved',
        reason: '개인 휴가',
      },
      {
        id: 'leave-event-124',
        employee_id: 'employee-contractor-123',
        employee_name: '이영희',
        type: 'sick',
        start_date: '2025-01-25',
        end_date: '2025-01-26',
        status: 'approved',
        reason: '병가',
      },
      {
        id: 'leave-event-125',
        employee_id: 'employee-active-123',
        employee_name: '홍길동',
        type: 'annual',
        start_date: '2025-03-01',
        end_date: '2025-03-05',
        status: 'pending',
        reason: '가족 여행',
      },
    ],
    conflicts: [
      {
        date: '2025-02-15',
        conflicting_employees: ['employee-active-123', 'employee-contractor-123'],
        reason: '동시 휴가 신청',
      },
    ],
  },

  /**
   * 에러 시나리오 테스트 데이터
   */
  errors: {
    validation: {
      missingRequired: {
        employee_id: '',
        first_name: '',
        last_name: '',
        email: '',
        department: '',
      },
      invalidFormat: {
        email: 'invalid-email',
        phone: 'invalid-phone',
        employee_id: 'invalid-id',
      },
      duplicateEmail: {
        email: 'hong@company.com',
      },
    },
    businessLogic: {
      invalidLeaveDate: {
        start_date: '2025-01-01',
        end_date: '2024-12-31', // 시작일보다 이른 종료일
      },
      excessiveLeave: {
        days: 30, // 연차 한도를 초과
      },
      invalidAttendance: {
        check_out: '2025-01-15T08:00:00.000Z', // 체크인보다 이른 체크아웃
        check_in: '2025-01-15T09:00:00.000Z',
      },
    },
    notFound: {
      employeeId: 'non-existent-employee',
      attendanceId: 'non-existent-attendance',
      leaveId: 'non-existent-leave',
      contractId: 'non-existent-contract',
    },
  },

  /**
   * 검색 및 필터링 테스트 데이터
   */
  search: {
    queries: {
      name: '홍길동',
      email: 'hong@company.com',
      employeeId: 'EMP001',
      department: '개발팀',
      position: '시니어 개발자',
    },
    filters: {
      status: ['active', 'inactive'],
      department: ['개발팀', '마케팅팀'],
      workType: ['full_time', 'part_time'],
      dateRange: {
        start: '2025-01-01',
        end: '2025-01-31',
      },
      salaryRange: {
        min: 40000000,
        max: 70000000,
      },
    },
    sortOptions: {
      name: 'asc',
      hire_date: 'desc',
      salary: 'desc',
      created_at: 'desc',
    },
  },
} as const

// 개별 mock 객체들 export
export const mockAttendance = HR_FIXTURES.attendance.normal
export const mockEmployee = HR_FIXTURES.employees.active

/**
 * 테스트용 배열 데이터 생성 헬퍼
 */
export const createHRTestArrays = {
  employees: (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      ...HR_FIXTURES.employees.active,
      id: `employee-${i + 1}`,
      employee_id: `EMP${String(i + 1).padStart(3, '0')}`,
      first_name: ['김', '이', '박', '최', '정'][i % 5],
      last_name: ['철수', '영희', '민수', '지영', '현우'][i % 5],
      email: `employee${i + 1}@company.com`,
      department: ['개발팀', '마케팅팀', '디자인팀', '고객지원팀'][i % 4],
      salary: 40000000 + i * 5000000,
    })),

  attendance: (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      ...HR_FIXTURES.attendance.normal,
      id: `attendance-${i + 1}`,
      date: `2025-01-${String(i + 1).padStart(2, '0')}`,
      check_in: `2025-01-${String(i + 1).padStart(2, '0')}T09:00:00.000Z`,
      check_out: `2025-01-${String(i + 1).padStart(2, '0')}T18:00:00.000Z`,
    })),

  leaves: (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      ...HR_FIXTURES.leaves.annual,
      id: `leave-${i + 1}`,
      start_date: `2025-02-${String(i + 1).padStart(2, '0')}`,
      end_date: `2025-02-${String(i + 3).padStart(2, '0')}`,
      days: i + 1,
      reason: `테스트 휴가 ${i + 1}`,
    })),
}
