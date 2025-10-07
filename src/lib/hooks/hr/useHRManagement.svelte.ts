/**
 * useHRManagement Hook
 *
 * HR 비즈니스 로직을 캡슐화한 Hook
 * Clean Architecture: Business Logic Layer
 */

import { hrStore } from '$lib/stores/hr/hrStore.svelte'
import * as hrService from '$lib/services/hr/hr-service'
import type { Employee, Department, Position } from '$lib/types/hr'
import { logger } from '$lib/utils/logger'

export function useHRManagement() {
  const store = hrStore

  // ============================================================================
  // Data Loading
  // ============================================================================

  async function loadAllData() {
    store.setLoading(true)
    store.clearError()

    try {
      const data = await hrService.loadAllHRData()

      store.setEmployees(data.employees || [])
      store.setDepartments(data.departments || [])
      store.setPositions(data.positions || [])
      store.setExecutives(data.executives || [])
      store.setJobTitles(data.jobTitles || [])
      store.setLeaveRequests(data.leaveRequests || [])
    } catch (error) {
      logger.error('Failed to load HR data:', error)
      store.setError('데이터를 불러오는데 실패했습니다.')
    } finally {
      store.setLoading(false)
    }
  }

  // ============================================================================
  // Employee Actions
  // ============================================================================

  async function createEmployee() {
    const result = await hrService.createEmployee(store.forms.employee)

    if (result.success) {
      await reloadEmployees()
      store.closeEmployeeModal()
      alert('직원이 성공적으로 등록되었습니다.')
    } else {
      alert(result.error || '직원 등록에 실패했습니다.')
    }
  }

  async function updateEmployee() {
    if (!store.selected.employee) return

    const result = await hrService.updateEmployee(
      store.selected.employee.id,
      store.forms.employee
    )

    if (result.success) {
      await reloadEmployees()
      store.closeEmployeeModal()
      alert('직원 정보가 성공적으로 수정되었습니다.')
    } else {
      alert(result.error || '직원 정보 수정에 실패했습니다.')
    }
  }

  async function deleteEmployee(id: string) {
    const result = await hrService.deleteEmployee(id)

    if (result.success) {
      await reloadEmployees()
      store.closeDeleteConfirm()
      alert('직원이 삭제되었습니다.')
    } else {
      alert(result.error || '직원 삭제에 실패했습니다.')
    }
  }

  async function reloadEmployees() {
    const result = await hrService.loadEmployees()
    if (result.success && result.data) {
      store.setEmployees(result.data)
    }
  }

  // ============================================================================
  // Department Actions
  // ============================================================================

  async function createDepartment() {
    const result = await hrService.createDepartment(store.forms.department)

    if (result.success) {
      await reloadDepartments()
      store.closeDepartmentModal()
      alert('부서가 성공적으로 생성되었습니다.')
    } else {
      alert(result.error || '부서 생성에 실패했습니다.')
    }
  }

  async function updateDepartment() {
    if (!store.selected.department) return

    const result = await hrService.updateDepartment(
      store.selected.department.id,
      store.forms.department
    )

    if (result.success) {
      await reloadDepartments()
      store.closeDepartmentModal()
      alert('부서 정보가 성공적으로 수정되었습니다.')
    } else {
      alert(result.error || '부서 정보 수정에 실패했습니다.')
    }
  }

  async function deleteDepartment(id: string) {
    const result = await hrService.deleteDepartment(id)

    if (result.success) {
      await reloadDepartments()
      store.closeDeleteConfirm()
      alert('부서가 삭제되었습니다.')
    } else {
      alert(result.error || '부서 삭제에 실패했습니다.')
    }
  }

  async function reloadDepartments() {
    const result = await hrService.loadDepartments()
    if (result.success && result.data) {
      store.setDepartments(result.data)
    }
  }

  // ============================================================================
  // Position Actions
  // ============================================================================

  async function createPosition() {
    const result = await hrService.createPosition(store.forms.position)

    if (result.success) {
      await reloadPositions()
      store.closePositionModal()
      alert('직급이 성공적으로 생성되었습니다.')
    } else {
      alert(result.error || '직급 생성에 실패했습니다.')
    }
  }

  async function updatePosition() {
    if (!store.selected.position) return

    const result = await hrService.updatePosition(
      store.selected.position.id,
      store.forms.position
    )

    if (result.success) {
      await reloadPositions()
      store.closePositionModal()
      alert('직급 정보가 성공적으로 수정되었습니다.')
    } else {
      alert(result.error || '직급 정보 수정에 실패했습니다.')
    }
  }

  async function deletePosition(id: string) {
    const result = await hrService.deletePosition(id)

    if (result.success) {
      await reloadPositions()
      store.closeDeleteConfirm()
      alert('직급이 삭제되었습니다.')
    } else {
      alert(result.error || '직급 삭제에 실패했습니다.')
    }
  }

  async function reloadPositions() {
    const result = await hrService.loadPositions()
    if (result.success && result.data) {
      store.setPositions(result.data)
    }
  }

  // ============================================================================
  // Leave Request Actions
  // ============================================================================

  async function approveLeaveRequest(id: string) {
    const result = await hrService.approveLeaveRequest(id)

    if (result.success) {
      await reloadLeaveRequests()
      alert('휴가 신청이 승인되었습니다.')
    } else {
      alert(result.error || '휴가 승인에 실패했습니다.')
    }
  }

  async function rejectLeaveRequest(id: string, reason: string) {
    const result = await hrService.rejectLeaveRequest(id, reason)

    if (result.success) {
      await reloadLeaveRequests()
      alert('휴가 신청이 거절되었습니다.')
    } else {
      alert(result.error || '휴가 거절에 실패했습니다.')
    }
  }

  async function reloadLeaveRequests() {
    const result = await hrService.loadLeaveRequests()
    if (result.success && result.data) {
      store.setLeaveRequests(result.data)
    }
  }

  // ============================================================================
  // Delete Handler
  // ============================================================================

  async function handleDelete() {
    const { type, item } = store.selected.itemToDelete || {}
    if (!type || !item) return

    switch (type) {
      case 'employee':
        await deleteEmployee(item.id)
        break
      case 'department':
        await deleteDepartment(item.id)
        break
      case 'position':
        await deletePosition(item.id)
        break
      default:
        logger.error('Unknown delete type:', type)
    }
  }

  // ============================================================================
  // Save Handler
  // ============================================================================

  async function handleSave(type: string) {
    switch (type) {
      case 'employee':
        if (store.selected.employee) {
          await updateEmployee()
        } else {
          await createEmployee()
        }
        break
      case 'department':
        if (store.selected.department) {
          await updateDepartment()
        } else {
          await createDepartment()
        }
        break
      case 'position':
        if (store.selected.position) {
          await updatePosition()
        } else {
          await createPosition()
        }
        break
      default:
        logger.error('Unknown save type:', type)
    }
  }

  // ============================================================================
  // Filtered Data
  // ============================================================================

  const filteredEmployees = $derived.by(() => {
    let employees = store.data.employees

    // Search filter
    if (store.filters.searchTerm) {
      const term = store.filters.searchTerm.toLowerCase()
      employees = employees.filter(
        (emp) =>
          emp.name.toLowerCase().includes(term) ||
          emp.employee_id.toLowerCase().includes(term) ||
          emp.email?.toLowerCase().includes(term) ||
          emp.phone?.includes(term)
      )
    }

    // Status filter
    if (store.filters.status !== 'all') {
      employees = employees.filter((emp) => emp.status === store.filters.status)
    }

    // Department filter
    if (store.filters.department !== 'all') {
      employees = employees.filter((emp) => emp.department_id === store.filters.department)
    }

    // Position filter
    if (store.filters.position !== 'all') {
      employees = employees.filter((emp) => emp.position_id === store.filters.position)
    }

    // Employment type filter
    if (store.filters.employmentType !== 'all') {
      employees = employees.filter((emp) => emp.employment_type === store.filters.employmentType)
    }

    // Level filter
    if (store.filters.level !== 'all') {
      employees = employees.filter((emp) => emp.level === store.filters.level)
    }

    return employees
  })

  // ============================================================================
  // Statistics
  // ============================================================================

  const statistics = $derived.by(() => {
    const employees = store.data.employees
    const activeEmployees = employees.filter(e => e.status === 'active')

    return {
      total: employees.length,
      active: activeEmployees.length,
      inactive: employees.filter(e => e.status === 'inactive').length,
      onLeave: employees.filter(e => e.status === 'on-leave').length,
      departmentCount: store.data.departments.length,
      positionCount: store.data.positions.length,
      avgTenure: store.averageTenure,
      byDepartment: store.data.departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        count: activeEmployees.filter(e => e.department_id === dept.id).length,
      })),
      byPosition: store.data.positions.map(pos => ({
        id: pos.id,
        name: pos.name,
        count: activeEmployees.filter(e => e.position_id === pos.id).length,
      })),
    }
  })

  // ============================================================================
  // Return Hook API
  // ============================================================================

  return {
    // Store
    store,

    // Actions
    loadAllData,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    createPosition,
    updatePosition,
    deletePosition,
    approveLeaveRequest,
    rejectLeaveRequest,
    handleDelete,
    handleSave,

    // Computed
    filteredEmployees,
    statistics,
  }
}