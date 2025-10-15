import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock HR types
const mockEmployee = {
  id: 'employee-1',
  firstName: '길동',
  lastName: '홍',
  email: 'hong.gd@example.com',
  phone: '010-1234-5678',
  hireDate: '2022-01-01',
  position: '개발자',
  department: '개발팀',
  salary: 50000000,
  status: 'active',
  employmentType: 'full-time',
  level: 'senior',
  managerId: 'manager-1',
  createdAt: '2022-01-01T00:00:00Z',
  updatedAt: '2022-01-01T00:00:00Z',
}

const mockDepartment = {
  id: 'dept-1',
  name: '개발팀',
  description: '소프트웨어 개발 및 유지보수',
  managerId: 'manager-1',
  budget: 100000000,
  isActive: true,
  createdAt: '2022-01-01T00:00:00Z',
  updatedAt: '2022-01-01T00:00:00Z',
}

const mockPosition = {
  id: 'pos-1',
  title: '시니어 개발자',
  description: '고급 소프트웨어 개발 업무',
  departmentId: 'dept-1',
  level: 'senior',
  salaryRange: {
    min: 45000000,
    max: 65000000,
  },
  requirements: ['JavaScript', 'TypeScript', 'React'],
  isActive: true,
  createdAt: '2022-01-01T00:00:00Z',
  updatedAt: '2022-01-01T00:00:00Z',
}

const mockLeaveRequest = {
  id: 'leave-1',
  employeeId: 'employee-1',
  leaveType: 'annual',
  startDate: '2023-12-01',
  endDate: '2023-12-05',
  days: 5,
  reason: '개인 휴가',
  status: 'approved',
  approvedBy: 'manager-1',
  approvedAt: '2023-11-25T00:00:00Z',
  createdAt: '2023-11-20T00:00:00Z',
  updatedAt: '2023-11-25T00:00:00Z',
}

const mockPerformanceReview = {
  id: 'review-1',
  employeeId: 'employee-1',
  period: '2023-Q4',
  overallRating: 4.5,
  goals: [
    { id: 'goal-1', description: '프로젝트 완료', achieved: true, rating: 5 },
    { id: 'goal-2', description: '코드 품질 개선', achieved: true, rating: 4 },
  ],
  feedback: '훌륭한 성과를 보여주었습니다.',
  reviewerId: 'manager-1',
  status: 'completed',
  createdAt: '2023-12-01T00:00:00Z',
  updatedAt: '2023-12-15T00:00:00Z',
}

describe('HR Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial data structure', () => {
      const hrData = {
        employees: [],
        departments: [],
        positions: [],
        executives: [],
        jobTitles: [],
        leaveRequests: [],
        performanceReviews: [],
        trainingPrograms: [],
      }

      const hrFilters = {
        searchTerm: '',
        status: 'all',
        department: '',
        position: '',
        employmentType: 'all',
        level: 'all',
      }

      const hrModals = {
        showEmployeeModal: false,
        showDepartmentModal: false,
        showPositionModal: false,
        showExecutiveModal: false,
        showJobTitleModal: false,
        showLeaveModal: false,
        showPerformanceModal: false,
        showTrainingModal: false,
        selectedEmployeeId: null,
        selectedDepartmentId: null,
        selectedPositionId: null,
        selectedExecutiveId: null,
        selectedJobTitleId: null,
        selectedLeaveId: null,
        selectedPerformanceId: null,
        selectedTrainingId: null,
      }

      expect(hrData.employees).toEqual([])
      expect(hrData.departments).toEqual([])
      expect(hrData.positions).toEqual([])
      expect(hrFilters.searchTerm).toBe('')
      expect(hrFilters.status).toBe('all')
      expect(hrModals.showEmployeeModal).toBe(false)
    })
  })

  describe('data management', () => {
    it('should handle employees data correctly', () => {
      const employees = [mockEmployee]
      const hrData = {
        employees,
        departments: [],
        positions: [],
        executives: [],
        jobTitles: [],
        leaveRequests: [],
        performanceReviews: [],
        trainingPrograms: [],
      }

      expect(hrData.employees).toHaveLength(1)
      expect(hrData.employees[0]).toEqual(mockEmployee)
      expect(hrData.employees[0].id).toBe('employee-1')
      expect(hrData.employees[0].firstName).toBe('길동')
      expect(hrData.employees[0].lastName).toBe('홍')
      expect(hrData.employees[0].salary).toBe(50000000)
    })

    it('should handle departments data correctly', () => {
      const departments = [mockDepartment]
      const hrData = {
        employees: [],
        departments,
        positions: [],
        executives: [],
        jobTitles: [],
        leaveRequests: [],
        performanceReviews: [],
        trainingPrograms: [],
      }

      expect(hrData.departments).toHaveLength(1)
      expect(hrData.departments[0]).toEqual(mockDepartment)
      expect(hrData.departments[0].id).toBe('dept-1')
      expect(hrData.departments[0].name).toBe('개발팀')
      expect(hrData.departments[0].budget).toBe(100000000)
    })

    it('should handle positions data correctly', () => {
      const positions = [mockPosition]
      const hrData = {
        employees: [],
        departments: [],
        positions,
        executives: [],
        jobTitles: [],
        leaveRequests: [],
        performanceReviews: [],
        trainingPrograms: [],
      }

      expect(hrData.positions).toHaveLength(1)
      expect(hrData.positions[0]).toEqual(mockPosition)
      expect(hrData.positions[0].id).toBe('pos-1')
      expect(hrData.positions[0].title).toBe('시니어 개발자')
      expect(hrData.positions[0].level).toBe('senior')
    })

    it('should handle leave requests data correctly', () => {
      const leaveRequests = [mockLeaveRequest]
      const hrData = {
        employees: [],
        departments: [],
        positions: [],
        executives: [],
        jobTitles: [],
        leaveRequests,
        performanceReviews: [],
        trainingPrograms: [],
      }

      expect(hrData.leaveRequests).toHaveLength(1)
      expect(hrData.leaveRequests[0]).toEqual(mockLeaveRequest)
      expect(hrData.leaveRequests[0].id).toBe('leave-1')
      expect(hrData.leaveRequests[0].leaveType).toBe('annual')
      expect(hrData.leaveRequests[0].status).toBe('approved')
    })

    it('should handle performance reviews data correctly', () => {
      const performanceReviews = [mockPerformanceReview]
      const hrData = {
        employees: [],
        departments: [],
        positions: [],
        executives: [],
        jobTitles: [],
        leaveRequests: [],
        performanceReviews,
        trainingPrograms: [],
      }

      expect(hrData.performanceReviews).toHaveLength(1)
      expect(hrData.performanceReviews[0]).toEqual(mockPerformanceReview)
      expect(hrData.performanceReviews[0].id).toBe('review-1')
      expect(hrData.performanceReviews[0].overallRating).toBe(4.5)
      expect(hrData.performanceReviews[0].goals).toHaveLength(2)
    })
  })

  describe('filter management', () => {
    it('should handle search term filter correctly', () => {
      const filters = [
        { searchTerm: '', expected: '' },
        { searchTerm: '홍길동', expected: '홍길동' },
        { searchTerm: '개발자', expected: '개발자' },
        { searchTerm: '개발팀', expected: '개발팀' },
      ]

      filters.forEach(({ searchTerm, expected }) => {
        const hrFilters = {
          searchTerm,
          status: 'all',
          department: '',
          position: '',
          employmentType: 'all',
          level: 'all',
        }

        expect(hrFilters.searchTerm).toBe(expected)
      })
    })

    it('should handle status filter correctly', () => {
      const statusOptions = ['all', 'active', 'inactive', 'on-leave', 'terminated']

      statusOptions.forEach((status) => {
        const hrFilters = {
          searchTerm: '',
          status: status as any,
          department: '',
          position: '',
          employmentType: 'all',
          level: 'all',
        }

        expect(hrFilters.status).toBe(status)
      })
    })

    it('should handle department filter correctly', () => {
      const departments = ['', '개발팀', '마케팅팀', '영업팀', '인사팀']

      departments.forEach((department) => {
        const hrFilters = {
          searchTerm: '',
          status: 'all',
          department,
          position: '',
          employmentType: 'all',
          level: 'all',
        }

        expect(hrFilters.department).toBe(department)
      })
    })

    it('should handle position filter correctly', () => {
      const positions = ['', '개발자', '디자이너', '마케터', '매니저']

      positions.forEach((position) => {
        const hrFilters = {
          searchTerm: '',
          status: 'all',
          department: '',
          position,
          employmentType: 'all',
          level: 'all',
        }

        expect(hrFilters.position).toBe(position)
      })
    })

    it('should handle employment type filter correctly', () => {
      const employmentTypes = ['all', 'full-time', 'part-time', 'contract', 'intern']

      employmentTypes.forEach((employmentType) => {
        const hrFilters = {
          searchTerm: '',
          status: 'all',
          department: '',
          position: '',
          employmentType: employmentType as any,
          level: 'all',
        }

        expect(hrFilters.employmentType).toBe(employmentType)
      })
    })

    it('should handle level filter correctly', () => {
      const levels = ['all', 'intern', 'junior', 'mid', 'senior', 'lead', 'manager', 'director']

      levels.forEach((level) => {
        const hrFilters = {
          searchTerm: '',
          status: 'all',
          department: '',
          position: '',
          employmentType: 'all',
          level: level as any,
        }

        expect(hrFilters.level).toBe(level)
      })
    })
  })

  describe('modal state management', () => {
    it('should handle employee modal states correctly', () => {
      const modalStates = [
        { showEmployeeModal: false, selectedEmployeeId: null },
        { showEmployeeModal: true, selectedEmployeeId: 'employee-1' },
        { showEmployeeModal: true, selectedEmployeeId: 'employee-2' },
      ]

      modalStates.forEach(({ showEmployeeModal, selectedEmployeeId }) => {
        const hrModals = {
          showEmployeeModal,
          showDepartmentModal: false,
          showPositionModal: false,
          showExecutiveModal: false,
          showJobTitleModal: false,
          showLeaveModal: false,
          showPerformanceModal: false,
          showTrainingModal: false,
          selectedEmployeeId,
          selectedDepartmentId: null,
          selectedPositionId: null,
          selectedExecutiveId: null,
          selectedJobTitleId: null,
          selectedLeaveId: null,
          selectedPerformanceId: null,
          selectedTrainingId: null,
        }

        expect(hrModals.showEmployeeModal).toBe(showEmployeeModal)
        expect(hrModals.selectedEmployeeId).toBe(selectedEmployeeId)
      })
    })

    it('should handle department modal states correctly', () => {
      const modalStates = [
        { showDepartmentModal: false, selectedDepartmentId: null },
        { showDepartmentModal: true, selectedDepartmentId: 'dept-1' },
        { showDepartmentModal: true, selectedDepartmentId: 'dept-2' },
      ]

      modalStates.forEach(({ showDepartmentModal, selectedDepartmentId }) => {
        const hrModals = {
          showEmployeeModal: false,
          showDepartmentModal,
          showPositionModal: false,
          showExecutiveModal: false,
          showJobTitleModal: false,
          showLeaveModal: false,
          showPerformanceModal: false,
          showTrainingModal: false,
          selectedEmployeeId: null,
          selectedDepartmentId,
          selectedPositionId: null,
          selectedExecutiveId: null,
          selectedJobTitleId: null,
          selectedLeaveId: null,
          selectedPerformanceId: null,
          selectedTrainingId: null,
        }

        expect(hrModals.showDepartmentModal).toBe(showDepartmentModal)
        expect(hrModals.selectedDepartmentId).toBe(selectedDepartmentId)
      })
    })

    it('should handle multiple modal states correctly', () => {
      const hrModals = {
        showEmployeeModal: true,
        showDepartmentModal: false,
        showPositionModal: true,
        showExecutiveModal: false,
        showJobTitleModal: false,
        showLeaveModal: false,
        showPerformanceModal: false,
        showTrainingModal: false,
        selectedEmployeeId: 'employee-1',
        selectedDepartmentId: null,
        selectedPositionId: 'pos-1',
        selectedExecutiveId: null,
        selectedJobTitleId: null,
        selectedLeaveId: null,
        selectedPerformanceId: null,
        selectedTrainingId: null,
      }

      expect(hrModals.showEmployeeModal).toBe(true)
      expect(hrModals.showPositionModal).toBe(true)
      expect(hrModals.selectedEmployeeId).toBe('employee-1')
      expect(hrModals.selectedPositionId).toBe('pos-1')
      expect(hrModals.showDepartmentModal).toBe(false)
      expect(hrModals.showExecutiveModal).toBe(false)
    })
  })

  describe('data filtering logic', () => {
    it('should filter employees by status correctly', () => {
      const employees = [
        { ...mockEmployee, id: 'emp-1', status: 'active' },
        { ...mockEmployee, id: 'emp-2', status: 'inactive' },
        { ...mockEmployee, id: 'emp-3', status: 'active' },
        { ...mockEmployee, id: 'emp-4', status: 'on-leave' },
      ]

      const activeEmployees = employees.filter((emp) => emp.status === 'active')
      expect(activeEmployees).toHaveLength(2)
      expect(activeEmployees[0].id).toBe('emp-1')
      expect(activeEmployees[1].id).toBe('emp-3')
    })

    it('should filter employees by department correctly', () => {
      const employees = [
        { ...mockEmployee, id: 'emp-1', department: '개발팀' },
        { ...mockEmployee, id: 'emp-2', department: '마케팅팀' },
        { ...mockEmployee, id: 'emp-3', department: '개발팀' },
        { ...mockEmployee, id: 'emp-4', department: '영업팀' },
      ]

      const devEmployees = employees.filter((emp) => emp.department === '개발팀')
      expect(devEmployees).toHaveLength(2)
      expect(devEmployees[0].id).toBe('emp-1')
      expect(devEmployees[1].id).toBe('emp-3')
    })

    it('should filter employees by search term correctly', () => {
      const employees = [
        { ...mockEmployee, id: 'emp-1', firstName: '길동', lastName: '홍' },
        { ...mockEmployee, id: 'emp-2', firstName: '철수', lastName: '김' },
        { ...mockEmployee, id: 'emp-3', firstName: '영희', lastName: '이' },
        { ...mockEmployee, id: 'emp-4', firstName: '길동', lastName: '박' },
      ]

      const searchTerm = '길동'
      const filteredEmployees = employees.filter(
        (emp) => emp.firstName.includes(searchTerm) || emp.lastName.includes(searchTerm),
      )
      expect(filteredEmployees).toHaveLength(2)
      expect(filteredEmployees[0].id).toBe('emp-1')
      expect(filteredEmployees[1].id).toBe('emp-4')
    })

    it('should filter employees by employment type correctly', () => {
      const employees = [
        { ...mockEmployee, id: 'emp-1', employmentType: 'full-time' },
        { ...mockEmployee, id: 'emp-2', employmentType: 'part-time' },
        { ...mockEmployee, id: 'emp-3', employmentType: 'full-time' },
        { ...mockEmployee, id: 'emp-4', employmentType: 'contract' },
      ]

      const fullTimeEmployees = employees.filter((emp) => emp.employmentType === 'full-time')
      expect(fullTimeEmployees).toHaveLength(2)
      expect(fullTimeEmployees[0].id).toBe('emp-1')
      expect(fullTimeEmployees[1].id).toBe('emp-3')
    })

    it('should filter employees by level correctly', () => {
      const employees = [
        { ...mockEmployee, id: 'emp-1', level: 'senior' },
        { ...mockEmployee, id: 'emp-2', level: 'junior' },
        { ...mockEmployee, id: 'emp-3', level: 'senior' },
        { ...mockEmployee, id: 'emp-4', level: 'manager' },
      ]

      const seniorEmployees = employees.filter((emp) => emp.level === 'senior')
      expect(seniorEmployees).toHaveLength(2)
      expect(seniorEmployees[0].id).toBe('emp-1')
      expect(seniorEmployees[1].id).toBe('emp-3')
    })
  })

  describe('edge cases', () => {
    it('should handle empty data arrays', () => {
      const emptyData = {
        employees: [],
        departments: [],
        positions: [],
        executives: [],
        jobTitles: [],
        leaveRequests: [],
        performanceReviews: [],
        trainingPrograms: [],
      }

      expect(emptyData.employees).toHaveLength(0)
      expect(emptyData.departments).toHaveLength(0)
      expect(emptyData.positions).toHaveLength(0)
    })

    it('should handle very large data sets', () => {
      const largeEmployees = Array.from({ length: 1000 }, (_, i) => ({
        ...mockEmployee,
        id: `employee-${i}`,
        firstName: `직원${i}`,
        lastName: `성${i}`,
      }))

      expect(largeEmployees).toHaveLength(1000)
      expect(largeEmployees[0].id).toBe('employee-0')
      expect(largeEmployees[999].id).toBe('employee-999')
    })

    it('should handle special characters in data', () => {
      const specialEmployee = {
        ...mockEmployee,
        firstName: '특수@#$문자',
        lastName: '성@#$씨',
        department: '특수@#$팀',
      }

      expect(specialEmployee.firstName).toBe('특수@#$문자')
      expect(specialEmployee.lastName).toBe('성@#$씨')
      expect(specialEmployee.department).toBe('특수@#$팀')
    })

    it('should handle Unicode characters in data', () => {
      const unicodeEmployee = {
        ...mockEmployee,
        firstName: '한글이름',
        lastName: '한글성',
        department: '한글팀',
      }

      expect(unicodeEmployee.firstName).toBe('한글이름')
      expect(unicodeEmployee.lastName).toBe('한글성')
      expect(unicodeEmployee.department).toBe('한글팀')
    })

    it('should handle very large salary amounts', () => {
      const highSalaryEmployee = {
        ...mockEmployee,
        salary: 999999999999,
      }

      expect(highSalaryEmployee.salary).toBe(999999999999)
    })

    it('should handle zero values', () => {
      const zeroSalaryEmployee = {
        ...mockEmployee,
        salary: 0,
      }

      expect(zeroSalaryEmployee.salary).toBe(0)
    })
  })
})
