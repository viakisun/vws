/**
 * Salary Store - Unified State Management
 * 급여 관리 모듈의 중앙 집중식 상태 관리
 *
 * HR 모듈의 hrStore와 동일한 패턴으로 구성:
 * - data: 핵심 데이터 (contracts, payslips, employees 등)
 * - ui: UI 상태 (modals, loading, filters)
 * - statistics: 통계 데이터
 */

import type { Payslip, SalaryHistory, SalaryStructure } from '$lib/types/salary'
import type { SalaryContract, SalaryContractStats } from '$lib/types/salary-contracts'

// ============================================================================
// State Interfaces
// ============================================================================

interface SalaryData {
  contracts: SalaryContract[]
  payslips: Payslip[]
  salaryHistory: SalaryHistory[]
  salaryStructures: SalaryStructure[]
  contractStats: SalaryContractStats | null
}

interface SalaryUI {
  loading: boolean
  error: string | null
  modals: {
    showContractModal: boolean
    showPayslipModal: boolean
  }
  filters: {
    // Contract filters
    contractEmployeeId: string
    contractDepartment: string
    contractPosition: string
    contractType: string
    contractStatus: string
    contractDateFrom: string
    contractDateTo: string
    contractSearch: string
    // Payslip filters
    payslipPeriodFrom: string
    payslipPeriodTo: string
    payslipStatus: string
  }
  pagination: {
    contractPage: number
    contractLimit: number
    contractTotal: number
    payslipPage: number
    payslipLimit: number
  }
}

interface SalaryStatistics {
  currentPeriod: string
  previousPeriod: string
  currentMonth: {
    totalEmployees: number
    totalGrossSalary: number
    totalNetSalary: number
    totalDeductions: number
    status: string
  }
  previousMonth: {
    totalEmployees: number
    totalGrossSalary: number
    totalNetSalary: number
    totalDeductions: number
    status: string
  }
  departmentStats: Record<
    string,
    {
      employeeCount: number
      totalGrossSalary: number
      averageGrossSalary: number
    }
  >
}

interface Selected {
  contract: SalaryContract | null
  payslip: Payslip | null
  employeeId: string | null
  period: string | null
}

// ============================================================================
// Initial State
// ============================================================================

const initialData: SalaryData = {
  contracts: [],
  payslips: [],
  salaryHistory: [],
  salaryStructures: [],
  contractStats: null,
}

const initialUI: SalaryUI = {
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
    payslipPage: 1,
    payslipLimit: 20,
  },
}

const getCurrentPeriod = (): string => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const getPreviousPeriod = (): string => {
  const now = new Date()
  const prev = new Date(now.getFullYear(), now.getMonth() - 1)
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
}

const initialStatistics: SalaryStatistics = {
  currentPeriod: getCurrentPeriod(),
  previousPeriod: getPreviousPeriod(),
  currentMonth: {
    totalEmployees: 0,
    totalGrossSalary: 0,
    totalNetSalary: 0,
    totalDeductions: 0,
    status: 'draft',
  },
  previousMonth: {
    totalEmployees: 0,
    totalGrossSalary: 0,
    totalNetSalary: 0,
    totalDeductions: 0,
    status: 'draft',
  },
  departmentStats: {},
}

const initialSelected: Selected = {
  contract: null,
  payslip: null,
  employeeId: null,
  period: null,
}

// ============================================================================
// Store Class
// ============================================================================

class SalaryStore {
  data = $state<SalaryData>(initialData)
  ui = $state<SalaryUI>(initialUI)
  statistics = $state<SalaryStatistics>(initialStatistics)
  selected = $state<Selected>(initialSelected)

  // ==========================================================================
  // Computed Properties
  // ==========================================================================

  get filteredContracts() {
    return this.data.contracts.filter((contract) => {
      const f = this.ui.filters
      if (f.contractEmployeeId && contract.employeeId !== f.contractEmployeeId) return false
      if (f.contractDepartment && contract.department !== f.contractDepartment) return false
      if (f.contractPosition && contract.position !== f.contractPosition) return false
      if (f.contractType && contract.contractType !== f.contractType) return false
      if (f.contractStatus && contract.status !== f.contractStatus) return false
      if (f.contractDateFrom && contract.startDate < f.contractDateFrom) return false
      if (f.contractDateTo && contract.startDate > f.contractDateTo) return false
      if (f.contractSearch) {
        const searchLower = f.contractSearch.toLowerCase()
        const searchableText =
          `${contract.employeeName} ${contract.employeeIdNumber} ${contract.department} ${contract.position}`.toLowerCase()
        if (!searchableText.includes(searchLower)) return false
      }
      return true
    })
  }

  get activeContracts() {
    const today = new Date().toISOString().split('T')[0]
    return this.data.contracts.filter(
      (contract) =>
        contract.status === 'active' &&
        contract.startDate <= today &&
        (!contract.endDate || contract.endDate >= today),
    )
  }

  get filteredPayslips() {
    return this.data.payslips
      .filter((payslip) => {
        const f = this.ui.filters
        if (f.payslipPeriodFrom && payslip.period < f.payslipPeriodFrom) return false
        if (f.payslipPeriodTo && payslip.period > f.payslipPeriodTo) return false
        if (f.payslipStatus && payslip.status !== f.payslipStatus) return false
        return true
      })
      .sort((a, b) => b.period.localeCompare(a.period))
  }

  // ==========================================================================
  // Data Setters
  // ==========================================================================

  setContracts(contracts: SalaryContract[], total?: number) {
    this.data.contracts = contracts
    if (total !== undefined) {
      this.ui.pagination.contractTotal = total
    }
  }

  setPayslips(payslips: Payslip[]) {
    this.data.payslips = payslips
    this.updateStatistics()
  }

  setContractStats(stats: SalaryContractStats) {
    this.data.contractStats = stats
  }

  setSalaryHistory(history: SalaryHistory[]) {
    this.data.salaryHistory = history
  }

  setSalaryStructures(structures: SalaryStructure[]) {
    this.data.salaryStructures = structures
  }

  // ==========================================================================
  // UI State Management
  // ==========================================================================

  setLoading(loading: boolean) {
    this.ui.loading = loading
  }

  setError(error: string | null) {
    this.ui.error = error
  }

  clearError() {
    this.ui.error = null
  }

  // Modal Management
  openContractModal(contract?: SalaryContract) {
    this.ui.modals.showContractModal = true
    this.selected.contract = contract || null
  }

  closeContractModal() {
    this.ui.modals.showContractModal = false
    this.selected.contract = null
  }

  openPayslipModal(payslip?: Payslip) {
    this.ui.modals.showPayslipModal = true
    this.selected.payslip = payslip || null
  }

  closePayslipModal() {
    this.ui.modals.showPayslipModal = false
    this.selected.payslip = null
  }

  // Filter Management
  setContractFilter(filter: Partial<SalaryUI['filters']>) {
    this.ui.filters = { ...this.ui.filters, ...filter }
  }

  resetContractFilter() {
    this.ui.filters.contractEmployeeId = ''
    this.ui.filters.contractDepartment = ''
    this.ui.filters.contractPosition = ''
    this.ui.filters.contractType = ''
    this.ui.filters.contractStatus = ''
    this.ui.filters.contractDateFrom = ''
    this.ui.filters.contractDateTo = ''
    this.ui.filters.contractSearch = ''
  }

  setPayslipFilter(filter: Partial<SalaryUI['filters']>) {
    this.ui.filters = { ...this.ui.filters, ...filter }
  }

  resetPayslipFilter() {
    this.ui.filters.payslipPeriodFrom = ''
    this.ui.filters.payslipPeriodTo = ''
    this.ui.filters.payslipStatus = ''
  }

  // Pagination
  setContractPage(page: number) {
    this.ui.pagination.contractPage = page
  }

  setPayslipPage(page: number) {
    this.ui.pagination.payslipPage = page
  }

  // Selected Items
  selectEmployee(employeeId: string | null) {
    this.selected.employeeId = employeeId
  }

  selectPeriod(period: string | null) {
    this.selected.period = period
  }

  // ==========================================================================
  // Statistics Update
  // ==========================================================================

  private updateStatistics() {
    const currentPeriod = getCurrentPeriod()
    const previousPeriod = getPreviousPeriod()

    const currentPayslips = this.data.payslips.filter((p) => p.period === currentPeriod)
    const previousPayslips = this.data.payslips.filter((p) => p.period === previousPeriod)

    // Current month stats
    this.statistics.currentMonth = {
      totalEmployees: currentPayslips.length,
      totalGrossSalary: currentPayslips.reduce((sum, p) => sum + (p.totalPayments || 0), 0),
      totalNetSalary: currentPayslips.reduce((sum, p) => sum + (p.netSalary || 0), 0),
      totalDeductions: currentPayslips.reduce((sum, p) => sum + (p.totalDeductions || 0), 0),
      status: currentPayslips.length > 0 ? 'calculated' : 'draft',
    }

    // Previous month stats
    this.statistics.previousMonth = {
      totalEmployees: previousPayslips.length,
      totalGrossSalary: previousPayslips.reduce((sum, p) => sum + (p.totalPayments || 0), 0),
      totalNetSalary: previousPayslips.reduce((sum, p) => sum + (p.netSalary || 0), 0),
      totalDeductions: previousPayslips.reduce((sum, p) => sum + (p.totalDeductions || 0), 0),
      status: previousPayslips.length > 0 ? 'calculated' : 'draft',
    }

    // Department stats
    const deptStats: Record<
      string,
      { employeeCount: number; totalGrossSalary: number; averageGrossSalary: number }
    > = {}
    currentPayslips.forEach((p) => {
      const dept = p.department || '부서없음'
      if (!deptStats[dept]) {
        deptStats[dept] = { employeeCount: 0, totalGrossSalary: 0, averageGrossSalary: 0 }
      }
      deptStats[dept].employeeCount++
      deptStats[dept].totalGrossSalary += p.totalPayments || 0
    })

    Object.keys(deptStats).forEach((dept) => {
      const stat = deptStats[dept]
      stat.averageGrossSalary =
        stat.employeeCount > 0 ? stat.totalGrossSalary / stat.employeeCount : 0
    })

    this.statistics.departmentStats = deptStats
  }
}

// ============================================================================
// Export Store Instance
// ============================================================================

export const salaryStore = new SalaryStore()
