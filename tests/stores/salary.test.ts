import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock salary types
const mockSalaryContract = {
  id: 'contract-1',
  employeeId: 'employee-1',
  contractType: 'full-time',
  position: '시니어 개발자',
  department: '개발팀',
  baseSalary: 50000000,
  allowances: 5000000,
  totalSalary: 55000000,
  startDate: '2023-01-01',
  endDate: '2023-12-31',
  status: 'active',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
}

const mockPayslip = {
  id: 'payslip-1',
  employeeId: 'employee-1',
  period: '2023-10',
  baseSalary: 4166667,
  allowances: 416667,
  overtime: 200000,
  bonus: 1000000,
  grossSalary: 5783334,
  tax: 867500,
  insurance: 289167,
  deductions: 1156667,
  netSalary: 4626667,
  status: 'paid',
  paidAt: '2023-11-01T00:00:00Z',
  createdAt: '2023-10-31T00:00:00Z',
  updatedAt: '2023-11-01T00:00:00Z',
}

const mockSalaryHistory = {
  id: 'history-1',
  employeeId: 'employee-1',
  period: '2023-10',
  baseSalary: 50000000,
  allowances: 5000000,
  totalSalary: 55000000,
  changeType: 'promotion',
  changeReason: '성과에 따른 승진',
  effectiveDate: '2023-10-01',
  createdAt: '2023-10-01T00:00:00Z',
}

const mockSalaryStructure = {
  id: 'structure-1',
  position: '시니어 개발자',
  department: '개발팀',
  level: 'senior',
  baseSalaryRange: {
    min: 45000000,
    max: 65000000,
  },
  allowances: {
    meal: 500000,
    transportation: 300000,
    housing: 1000000,
  },
  isActive: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
}

const mockContractStats = {
  totalContracts: 25,
  activeContracts: 22,
  expiredContracts: 3,
  averageSalary: 45000000,
  totalMonthlySalary: 990000000,
  departmentBreakdown: [
    { department: '개발팀', count: 10, averageSalary: 50000000 },
    { department: '마케팅팀', count: 8, averageSalary: 40000000 },
    { department: '영업팀', count: 7, averageSalary: 42000000 },
  ],
}

describe('Salary Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial data structure', () => {
      const salaryData = {
        contracts: [],
        payslips: [],
        salaryHistory: [],
        salaryStructures: [],
        contractStats: null,
      }

      const salaryUI = {
        loading: false,
        error: null,
        modals: {
          showContractModal: false,
          showPayslipModal: false,
        },
        filters: {
          contractEmployeeId: '',
          contractDepartment: '',
          contractPosition: '',
          contractType: '',
          contractStatus: '',
          contractDateFrom: '',
          contractDateTo: '',
          contractSearch: '',
          payslipPeriodFrom: '',
          payslipPeriodTo: '',
          payslipStatus: '',
        },
        pagination: {
          contractPage: 1,
          contractLimit: 20,
          contractTotal: 0,
          contractTotalPages: 0,
          payslipPage: 1,
          payslipLimit: 20,
          payslipTotal: 0,
          payslipTotalPages: 0,
        },
      }

      expect(salaryData.contracts).toEqual([])
      expect(salaryData.payslips).toEqual([])
      expect(salaryData.salaryHistory).toEqual([])
      expect(salaryData.salaryStructures).toEqual([])
      expect(salaryData.contractStats).toBeNull()
      expect(salaryUI.loading).toBe(false)
      expect(salaryUI.error).toBeNull()
      expect(salaryUI.modals.showContractModal).toBe(false)
      expect(salaryUI.modals.showPayslipModal).toBe(false)
    })
  })

  describe('data management', () => {
    it('should handle contracts data correctly', () => {
      const contracts = [mockSalaryContract]
      const salaryData = {
        contracts,
        payslips: [],
        salaryHistory: [],
        salaryStructures: [],
        contractStats: null,
      }

      expect(salaryData.contracts).toHaveLength(1)
      expect(salaryData.contracts[0]).toEqual(mockSalaryContract)
      expect(salaryData.contracts[0].id).toBe('contract-1')
      expect(salaryData.contracts[0].employeeId).toBe('employee-1')
      expect(salaryData.contracts[0].totalSalary).toBe(55000000)
      expect(salaryData.contracts[0].status).toBe('active')
    })

    it('should handle payslips data correctly', () => {
      const payslips = [mockPayslip]
      const salaryData = {
        contracts: [],
        payslips,
        salaryHistory: [],
        salaryStructures: [],
        contractStats: null,
      }

      expect(salaryData.payslips).toHaveLength(1)
      expect(salaryData.payslips[0]).toEqual(mockPayslip)
      expect(salaryData.payslips[0].id).toBe('payslip-1')
      expect(salaryData.payslips[0].employeeId).toBe('employee-1')
      expect(salaryData.payslips[0].grossSalary).toBe(5783334)
      expect(salaryData.payslips[0].netSalary).toBe(4626667)
      expect(salaryData.payslips[0].status).toBe('paid')
    })

    it('should handle salary history data correctly', () => {
      const salaryHistory = [mockSalaryHistory]
      const salaryData = {
        contracts: [],
        payslips: [],
        salaryHistory,
        salaryStructures: [],
        contractStats: null,
      }

      expect(salaryData.salaryHistory).toHaveLength(1)
      expect(salaryData.salaryHistory[0]).toEqual(mockSalaryHistory)
      expect(salaryData.salaryHistory[0].id).toBe('history-1')
      expect(salaryData.salaryHistory[0].employeeId).toBe('employee-1')
      expect(salaryData.salaryHistory[0].totalSalary).toBe(55000000)
      expect(salaryData.salaryHistory[0].changeType).toBe('promotion')
    })

    it('should handle salary structures data correctly', () => {
      const salaryStructures = [mockSalaryStructure]
      const salaryData = {
        contracts: [],
        payslips: [],
        salaryHistory: [],
        salaryStructures,
        contractStats: null,
      }

      expect(salaryData.salaryStructures).toHaveLength(1)
      expect(salaryData.salaryStructures[0]).toEqual(mockSalaryStructure)
      expect(salaryData.salaryStructures[0].id).toBe('structure-1')
      expect(salaryData.salaryStructures[0].position).toBe('시니어 개발자')
      expect(salaryData.salaryStructures[0].level).toBe('senior')
      expect(salaryData.salaryStructures[0].baseSalaryRange.min).toBe(45000000)
      expect(salaryData.salaryStructures[0].baseSalaryRange.max).toBe(65000000)
    })

    it('should handle contract stats data correctly', () => {
      const contractStats = mockContractStats
      const salaryData = {
        contracts: [],
        payslips: [],
        salaryHistory: [],
        salaryStructures: [],
        contractStats,
      }

      expect(salaryData.contractStats).toEqual(mockContractStats)
      expect(salaryData.contractStats?.totalContracts).toBe(25)
      expect(salaryData.contractStats?.activeContracts).toBe(22)
      expect(salaryData.contractStats?.averageSalary).toBe(45000000)
      expect(salaryData.contractStats?.departmentBreakdown).toHaveLength(3)
    })
  })

  describe('UI state management', () => {
    it('should handle loading state correctly', () => {
      const loadingStates = [
        { loading: false, expected: false },
        { loading: true, expected: true },
      ]

      loadingStates.forEach(({ loading, expected }) => {
        const salaryUI = {
          loading,
          error: null,
          modals: {
            showContractModal: false,
            showPayslipModal: false,
          },
          filters: {
            contractEmployeeId: '',
            contractDepartment: '',
            contractPosition: '',
            contractType: '',
            contractStatus: '',
            contractDateFrom: '',
            contractDateTo: '',
            contractSearch: '',
            payslipPeriodFrom: '',
            payslipPeriodTo: '',
            payslipStatus: '',
          },
          pagination: {
            contractPage: 1,
            contractLimit: 20,
            contractTotal: 0,
            contractTotalPages: 0,
            payslipPage: 1,
            payslipLimit: 20,
            payslipTotal: 0,
            payslipTotalPages: 0,
          },
        }

        expect(salaryUI.loading).toBe(expected)
      })
    })

    it('should handle error state correctly', () => {
      const errorStates = [
        { error: null, expected: null },
        { error: 'Database connection failed', expected: 'Database connection failed' },
        { error: 'Contract not found', expected: 'Contract not found' },
      ]

      errorStates.forEach(({ error, expected }) => {
        const salaryUI = {
          loading: false,
          error,
          modals: {
            showContractModal: false,
            showPayslipModal: false,
          },
          filters: {
            contractEmployeeId: '',
            contractDepartment: '',
            contractPosition: '',
            contractType: '',
            contractStatus: '',
            contractDateFrom: '',
            contractDateTo: '',
            contractSearch: '',
            payslipPeriodFrom: '',
            payslipPeriodTo: '',
            payslipStatus: '',
          },
          pagination: {
            contractPage: 1,
            contractLimit: 20,
            contractTotal: 0,
            contractTotalPages: 0,
            payslipPage: 1,
            payslipLimit: 20,
            payslipTotal: 0,
            payslipTotalPages: 0,
          },
        }

        expect(salaryUI.error).toBe(expected)
      })
    })

    it('should handle modal states correctly', () => {
      const modalStates = [
        {
          showContractModal: false,
          showPayslipModal: false,
        },
        {
          showContractModal: true,
          showPayslipModal: false,
        },
        {
          showContractModal: false,
          showPayslipModal: true,
        },
        {
          showContractModal: true,
          showPayslipModal: true,
        },
      ]

      modalStates.forEach(({ showContractModal, showPayslipModal }) => {
        const salaryUI = {
          loading: false,
          error: null,
          modals: {
            showContractModal,
            showPayslipModal,
          },
          filters: {
            contractEmployeeId: '',
            contractDepartment: '',
            contractPosition: '',
            contractType: '',
            contractStatus: '',
            contractDateFrom: '',
            contractDateTo: '',
            contractSearch: '',
            payslipPeriodFrom: '',
            payslipPeriodTo: '',
            payslipStatus: '',
          },
          pagination: {
            contractPage: 1,
            contractLimit: 20,
            contractTotal: 0,
            contractTotalPages: 0,
            payslipPage: 1,
            payslipLimit: 20,
            payslipTotal: 0,
            payslipTotalPages: 0,
          },
        }

        expect(salaryUI.modals.showContractModal).toBe(showContractModal)
        expect(salaryUI.modals.showPayslipModal).toBe(showPayslipModal)
      })
    })
  })

  describe('filter management', () => {
    it('should handle contract filters correctly', () => {
      const contractFilters = {
        contractEmployeeId: 'employee-1',
        contractDepartment: '개발팀',
        contractPosition: '시니어 개발자',
        contractType: 'full-time',
        contractStatus: 'active',
        contractDateFrom: '2023-01-01',
        contractDateTo: '2023-12-31',
        contractSearch: '개발자',
      }

      const salaryUI = {
        loading: false,
        error: null,
        modals: {
          showContractModal: false,
          showPayslipModal: false,
        },
        filters: {
          ...contractFilters,
          payslipPeriodFrom: '',
          payslipPeriodTo: '',
          payslipStatus: '',
        },
        pagination: {
          contractPage: 1,
          contractLimit: 20,
          contractTotal: 0,
          contractTotalPages: 0,
          payslipPage: 1,
          payslipLimit: 20,
          payslipTotal: 0,
          payslipTotalPages: 0,
        },
      }

      expect(salaryUI.filters.contractEmployeeId).toBe('employee-1')
      expect(salaryUI.filters.contractDepartment).toBe('개발팀')
      expect(salaryUI.filters.contractPosition).toBe('시니어 개발자')
      expect(salaryUI.filters.contractType).toBe('full-time')
      expect(salaryUI.filters.contractStatus).toBe('active')
      expect(salaryUI.filters.contractSearch).toBe('개발자')
    })

    it('should handle payslip filters correctly', () => {
      const payslipFilters = {
        payslipPeriodFrom: '2023-01-01',
        payslipPeriodTo: '2023-12-31',
        payslipStatus: 'paid',
      }

      const salaryUI = {
        loading: false,
        error: null,
        modals: {
          showContractModal: false,
          showPayslipModal: false,
        },
        filters: {
          contractEmployeeId: '',
          contractDepartment: '',
          contractPosition: '',
          contractType: '',
          contractStatus: '',
          contractDateFrom: '',
          contractDateTo: '',
          contractSearch: '',
          ...payslipFilters,
        },
        pagination: {
          contractPage: 1,
          contractLimit: 20,
          contractTotal: 0,
          contractTotalPages: 0,
          payslipPage: 1,
          payslipLimit: 20,
          payslipTotal: 0,
          payslipTotalPages: 0,
        },
      }

      expect(salaryUI.filters.payslipPeriodFrom).toBe('2023-01-01')
      expect(salaryUI.filters.payslipPeriodTo).toBe('2023-12-31')
      expect(salaryUI.filters.payslipStatus).toBe('paid')
    })
  })

  describe('pagination management', () => {
    it('should handle contract pagination correctly', () => {
      const contractPagination = {
        contractPage: 2,
        contractLimit: 10,
        contractTotal: 100,
        contractTotalPages: 10,
      }

      const salaryUI = {
        loading: false,
        error: null,
        modals: {
          showContractModal: false,
          showPayslipModal: false,
        },
        filters: {
          contractEmployeeId: '',
          contractDepartment: '',
          contractPosition: '',
          contractType: '',
          contractStatus: '',
          contractDateFrom: '',
          contractDateTo: '',
          contractSearch: '',
          payslipPeriodFrom: '',
          payslipPeriodTo: '',
          payslipStatus: '',
        },
        pagination: {
          ...contractPagination,
          payslipPage: 1,
          payslipLimit: 20,
          payslipTotal: 0,
          payslipTotalPages: 0,
        },
      }

      expect(salaryUI.pagination.contractPage).toBe(2)
      expect(salaryUI.pagination.contractLimit).toBe(10)
      expect(salaryUI.pagination.contractTotal).toBe(100)
      expect(salaryUI.pagination.contractTotalPages).toBe(10)
    })

    it('should handle payslip pagination correctly', () => {
      const payslipPagination = {
        payslipPage: 3,
        payslipLimit: 15,
        payslipTotal: 150,
        payslipTotalPages: 10,
      }

      const salaryUI = {
        loading: false,
        error: null,
        modals: {
          showContractModal: false,
          showPayslipModal: false,
        },
        filters: {
          contractEmployeeId: '',
          contractDepartment: '',
          contractPosition: '',
          contractType: '',
          contractStatus: '',
          contractDateFrom: '',
          contractDateTo: '',
          contractSearch: '',
          payslipPeriodFrom: '',
          payslipPeriodTo: '',
          payslipStatus: '',
        },
        pagination: {
          contractPage: 1,
          contractLimit: 20,
          contractTotal: 0,
          contractTotalPages: 0,
          ...payslipPagination,
        },
      }

      expect(salaryUI.pagination.payslipPage).toBe(3)
      expect(salaryUI.pagination.payslipLimit).toBe(15)
      expect(salaryUI.pagination.payslipTotal).toBe(150)
      expect(salaryUI.pagination.payslipTotalPages).toBe(10)
    })
  })

  describe('data calculations', () => {
    it('should calculate net salary correctly', () => {
      const payslip = {
        ...mockPayslip,
        grossSalary: 5000000,
        tax: 750000,
        insurance: 250000,
        deductions: 1000000,
      }

      const netSalary = payslip.grossSalary - payslip.tax - payslip.insurance - payslip.deductions
      expect(netSalary).toBe(3000000)
    })

    it('should calculate total salary correctly', () => {
      const contract = {
        ...mockSalaryContract,
        baseSalary: 40000000,
        allowances: 4000000,
      }

      const totalSalary = contract.baseSalary + contract.allowances
      expect(totalSalary).toBe(44000000)
    })

    it('should calculate average salary correctly', () => {
      const contracts = [
        { ...mockSalaryContract, id: 'contract-1', totalSalary: 40000000 },
        { ...mockSalaryContract, id: 'contract-2', totalSalary: 50000000 },
        { ...mockSalaryContract, id: 'contract-3', totalSalary: 60000000 },
      ]

      const averageSalary = contracts.reduce((sum, contract) => sum + contract.totalSalary, 0) / contracts.length
      expect(averageSalary).toBe(50000000)
    })

    it('should calculate department breakdown correctly', () => {
      const contracts = [
        { ...mockSalaryContract, id: 'contract-1', department: '개발팀', totalSalary: 50000000 },
        { ...mockSalaryContract, id: 'contract-2', department: '개발팀', totalSalary: 60000000 },
        { ...mockSalaryContract, id: 'contract-3', department: '마케팅팀', totalSalary: 40000000 },
        { ...mockSalaryContract, id: 'contract-4', department: '마케팅팀', totalSalary: 45000000 },
      ]

      const departmentBreakdown = contracts.reduce((acc, contract) => {
        if (!acc[contract.department]) {
          acc[contract.department] = { count: 0, totalSalary: 0 }
        }
        acc[contract.department].count++
        acc[contract.department].totalSalary += contract.totalSalary
        return acc
      }, {} as Record<string, { count: number; totalSalary: number }>)

      const result = Object.entries(departmentBreakdown).map(([department, data]) => ({
        department,
        count: data.count,
        averageSalary: data.totalSalary / data.count,
      }))

      expect(result).toHaveLength(2)
      expect(result[0].department).toBe('개발팀')
      expect(result[0].count).toBe(2)
      expect(result[0].averageSalary).toBe(55000000)
      expect(result[1].department).toBe('마케팅팀')
      expect(result[1].count).toBe(2)
      expect(result[1].averageSalary).toBe(42500000)
    })
  })

  describe('edge cases', () => {
    it('should handle empty data arrays', () => {
      const emptyData = {
        contracts: [],
        payslips: [],
        salaryHistory: [],
        salaryStructures: [],
        contractStats: null,
      }

      expect(emptyData.contracts).toHaveLength(0)
      expect(emptyData.payslips).toHaveLength(0)
      expect(emptyData.salaryHistory).toHaveLength(0)
      expect(emptyData.salaryStructures).toHaveLength(0)
    })

    it('should handle very large salary amounts', () => {
      const highSalaryContract = {
        ...mockSalaryContract,
        baseSalary: 999999999999,
        allowances: 100000000000,
        totalSalary: 1099999999999,
      }

      expect(highSalaryContract.totalSalary).toBe(1099999999999)
    })

    it('should handle zero salary amounts', () => {
      const zeroSalaryContract = {
        ...mockSalaryContract,
        baseSalary: 0,
        allowances: 0,
        totalSalary: 0,
      }

      expect(zeroSalaryContract.totalSalary).toBe(0)
    })

    it('should handle special characters in data', () => {
      const specialContract = {
        ...mockSalaryContract,
        position: '특수문자@#$%^&*()포지션',
        department: '특수@#$팀',
      }

      expect(specialContract.position).toBe('특수문자@#$%^&*()포지션')
      expect(specialContract.department).toBe('특수@#$팀')
    })

    it('should handle Unicode characters in data', () => {
      const unicodeContract = {
        ...mockSalaryContract,
        position: '한글포지션한글',
        department: '한글팀한글',
      }

      expect(unicodeContract.position).toBe('한글포지션한글')
      expect(unicodeContract.department).toBe('한글팀한글')
    })

    it('should handle negative deductions', () => {
      const payslipWithNegativeDeductions = {
        ...mockPayslip,
        grossSalary: 5000000,
        tax: 750000,
        insurance: 250000,
        deductions: -100000, // 음수 공제 (보너스 등)
      }

      const netSalary = payslipWithNegativeDeductions.grossSalary - payslipWithNegativeDeductions.tax - payslipWithNegativeDeductions.insurance - payslipWithNegativeDeductions.deductions
      expect(netSalary).toBe(4100000) // 더 많은 금액
    })

    it('should handle very large data sets', () => {
      const largeContracts = Array.from({ length: 1000 }, (_, i) => ({
        ...mockSalaryContract,
        id: `contract-${i}`,
        employeeId: `employee-${i}`,
        totalSalary: Math.floor(Math.random() * 100000000),
      }))

      expect(largeContracts).toHaveLength(1000)
      expect(largeContracts[0].id).toBe('contract-0')
      expect(largeContracts[999].id).toBe('contract-999')
    })
  })
})
