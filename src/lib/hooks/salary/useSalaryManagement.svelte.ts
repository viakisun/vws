/**
 * useSalaryManagement Hook - Master Hook
 * 급여 관리 전체 기능을 조율하는 마스터 훅
 */

import { useContracts } from './useContracts.svelte'
import { usePayslips } from './usePayslips.svelte'
import { useSalaryStats } from './useSalaryStats.svelte'

export function useSalaryManagement() {
  const contracts = useContracts()
  const payslips = usePayslips()
  const stats = useSalaryStats()

  /**
   * 모든 급여 데이터 로드
   */
  async function loadAllData() {
    await Promise.all([
      contracts.loadContracts(),
      contracts.loadContractStats(),
      payslips.loadPayslips(),
      stats.loadSalaryStructures(),
    ])
  }

  /**
   * 특정 직원의 급여 정보 전체 로드
   */
  async function loadEmployeeData(employeeId: string) {
    await Promise.all([
      contracts.loadEmployeeSalaryInfo(employeeId),
      payslips.loadEmployeePayslips(employeeId),
      payslips.loadSalaryHistory(employeeId),
    ])
  }

  /**
   * 통계 정보 조회
   */
  const statistics = $derived({
    dashboard: stats.getDashboardStats(),
    actionItems: stats.getActionItems(),
  })

  /**
   * 필터링된 데이터
   */
  const filtered = $derived({
    contracts: contracts.store.filteredContracts,
    payslips: payslips.store.filteredPayslips,
    activeContracts: contracts.store.activeContracts,
  })

  return {
    // Store access
    store: contracts.store,

    // Contracts
    contracts: {
      load: contracts.loadContracts,
      loadStats: contracts.loadContractStats,
      create: contracts.createContract,
      update: contracts.updateContract,
      delete: contracts.deleteContract,
      setFilter: contracts.setFilter,
      resetFilter: contracts.resetFilter,
      setPage: contracts.setPage,
    },

    // Payslips
    payslips: {
      load: payslips.loadPayslips,
      loadEmployee: payslips.loadEmployeePayslips,
      create: payslips.createPayslip,
      update: payslips.updatePayslip,
      delete: payslips.deletePayslip,
      download: payslips.downloadPayslip,
      upload: payslips.uploadPayslipTemplate,
      loadHistory: payslips.loadSalaryHistory,
      setFilter: payslips.setFilter,
      resetFilter: payslips.resetFilter,
      setPage: payslips.setPage,
    },

    // Statistics
    stats: {
      loadStructures: stats.loadSalaryStructures,
      createStructure: stats.createSalaryStructure,
      updateStructure: stats.updateSalaryStructure,
      deleteStructure: stats.deleteSalaryStructure,
      getDashboard: stats.getDashboardStats,
      getActionItems: stats.getActionItems,
    },

    // Combined operations
    loadAllData,
    loadEmployeeData,

    // Computed
    statistics,
    filtered,
  }
}
