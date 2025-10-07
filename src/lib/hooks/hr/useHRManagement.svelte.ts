/**
 * useHRManagement Hook
 *
 * HR 비즈니스 로직을 캡슐화한 Hook
 * Clean Architecture: Business Logic Layer
 */

import { hrStore, type HRStore } from '$lib/stores/hr/hrStore.svelte'
import * as hrService from '$lib/services/hr/hr-service'
import type { Employee, Department, Position } from '$lib/types/hr'
import { logger } from '$lib/utils/logger'
import { pushToast } from '$lib/stores/toasts'

export function useHRManagement() {
  const store: HRStore = hrStore

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
      pushToast('직원이 성공적으로 등록되었습니다.', 'success')
    } else {
      pushToast(result.error || '직원 등록에 실패했습니다.', 'error')
    }
  }

  async function updateEmployee() {
    if (!store.selected.editingEmployee) return

    const result = await hrService.updateEmployee(
      store.selected.editingEmployee.id,
      store.forms.employee,
    )

    if (result.success) {
      await reloadEmployees()
      store.closeEmployeeModal()
      pushToast('직원 정보가 성공적으로 수정되었습니다.', 'success')
    } else {
      pushToast(result.error || '직원 정보 수정에 실패했습니다.', 'error')
    }
  }

  async function deleteEmployee(id: string) {
    const result = await hrService.deleteEmployee(id)

    if (result.success) {
      await reloadEmployees()
      store.closeDeleteConfirm()
      pushToast('직원이 삭제되었습니다.', 'success')
    } else {
      pushToast(result.error || '직원 삭제에 실패했습니다.', 'error')
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
      pushToast('부서가 성공적으로 생성되었습니다.', 'success')
    } else {
      pushToast(result.error || '부서 생성에 실패했습니다.', 'error')
    }
  }

  async function updateDepartment() {
    if (!store.selected.editingDepartment) return

    const result = await hrService.updateDepartment(
      store.selected.editingDepartment.id,
      store.forms.department,
    )

    if (result.success) {
      await reloadDepartments()
      store.closeDepartmentModal()
      pushToast('부서 정보가 성공적으로 수정되었습니다.', 'success')
    } else {
      pushToast(result.error || '부서 정보 수정에 실패했습니다.', 'error')
    }
  }

  async function deleteDepartment(id: string) {
    const result = await hrService.deleteDepartment(id)

    if (result.success) {
      await reloadDepartments()
      store.closeDeleteConfirm()
      pushToast('부서가 삭제되었습니다.', 'success')
    } else {
      pushToast(result.error || '부서 삭제에 실패했습니다.', 'error')
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
      pushToast('직급이 성공적으로 생성되었습니다.', 'success')
    } else {
      pushToast(result.error || '직급 생성에 실패했습니다.', 'error')
    }
  }

  async function updatePosition() {
    if (!store.selected.editingPosition) return

    const result = await hrService.updatePosition(
      store.selected.editingPosition.id,
      store.forms.position,
    )

    if (result.success) {
      await reloadPositions()
      store.closePositionModal()
      pushToast('직급 정보가 성공적으로 수정되었습니다.', 'success')
    } else {
      pushToast(result.error || '직급 정보 수정에 실패했습니다.', 'error')
    }
  }

  async function deletePosition(id: string) {
    const result = await hrService.deletePosition(id)

    if (result.success) {
      await reloadPositions()
      store.closeDeleteConfirm()
      pushToast('직급이 삭제되었습니다.', 'success')
    } else {
      pushToast(result.error || '직급 삭제에 실패했습니다.', 'error')
    }
  }

  async function reloadPositions() {
    const result = await hrService.loadPositions()
    if (result.success && result.data) {
      store.setPositions(result.data)
    }
  }

  // ============================================================================
  // JobTitle Actions
  // ============================================================================

  async function createJobTitle() {
    const result = await hrService.createJobTitle(store.forms.jobTitle)

    if (result.success) {
      await reloadJobTitles()
      store.closeJobTitleModal()
      pushToast('직책이 성공적으로 생성되었습니다.', 'success')
    } else {
      pushToast(result.error || '직책 생성에 실패했습니다.', 'error')
    }
  }

  async function updateJobTitle() {
    if (!store.selected.editingJobTitle) return

    const result = await hrService.updateJobTitle(
      store.selected.editingJobTitle.id,
      store.forms.jobTitle,
    )

    if (result.success) {
      await reloadJobTitles()
      store.closeJobTitleModal()
      pushToast('직책이 성공적으로 수정되었습니다.', 'success')
    } else {
      pushToast(result.error || '직책 수정에 실패했습니다.', 'error')
    }
  }

  async function deleteJobTitle() {
    if (!store.selected.itemToDelete) return

    const result = await hrService.deleteJobTitle(store.selected.itemToDelete.item.id)

    if (result.success) {
      await reloadJobTitles()
      store.closeDeleteConfirm()
      pushToast('직책이 성공적으로 삭제되었습니다.', 'success')
    } else {
      pushToast(result.error || '직책 삭제에 실패했습니다.', 'error')
    }
  }

  async function reloadJobTitles() {
    const result = await hrService.loadJobTitles()
    if (result.success && result.data) {
      store.setJobTitles(result.data)
    }
  }

  // ============================================================================
  // Leave Request Actions
  // ============================================================================

  async function approveLeaveRequest(id: string) {
    const result = await hrService.approveLeaveRequest(id)

    if (result.success) {
      await reloadLeaveRequests()
      pushToast('휴가 신청이 승인되었습니다.', 'success')
    } else {
      pushToast(result.error || '휴가 승인에 실패했습니다.', 'error')
    }
  }

  async function rejectLeaveRequest(id: string, reason: string) {
    const result = await hrService.rejectLeaveRequest(id, reason)

    if (result.success) {
      await reloadLeaveRequests()
      pushToast('휴가 신청이 거절되었습니다.', 'success')
    } else {
      pushToast(result.error || '휴가 거절에 실패했습니다.', 'error')
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

  async function handleDelete(action: 'delete' | 'archive' = 'delete') {
    const { type, item } = store.selected.itemToDelete || {}
    if (!type || !item) return

    // 퇴사 처리 (archive) - 직원만 해당
    if (action === 'archive' && type === 'employee') {
      const today = new Date().toISOString().split('T')[0]
      store.forms.employee = {
        ...item,
        status: 'terminated',
        termination_date: today,
      }
      await updateEmployee()
      return
    }

    // 완전 삭제
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
      case 'jobTitle':
        await deleteJobTitle()
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
        if (store.selected.editingEmployee) {
          await updateEmployee()
        } else {
          await createEmployee()
        }
        break
      case 'department':
        if (store.selected.editingDepartment) {
          await updateDepartment()
        } else {
          await createDepartment()
        }
        break
      case 'position':
        if (store.selected.editingPosition) {
          await updatePosition()
        } else {
          await createPosition()
        }
        break
      case 'jobTitle':
        if (store.selected.editingJobTitle) {
          await updateJobTitle()
        } else {
          await createJobTitle()
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

    // 기본적으로 퇴직자 제외 (terminated 상태 필터링)
    employees = employees.filter((emp) => emp.status !== 'terminated')

    // Search filter
    if (store.filters.searchTerm) {
      const term = store.filters.searchTerm.toLowerCase()
      employees = employees.filter(
        (emp) =>
          `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(term) ||
          emp.employee_id.toLowerCase().includes(term) ||
          emp.email?.toLowerCase().includes(term) ||
          emp.phone?.includes(term),
      )
    }

    // Status filter
    if (store.filters.status !== 'all') {
      employees = employees.filter((emp) => emp.status === store.filters.status)
    }

    // Department filter
    if (store.filters.department !== 'all') {
      employees = employees.filter((emp) => emp.department === store.filters.department)
    }

    // Position filter
    if (store.filters.position !== 'all') {
      employees = employees.filter((emp) => emp.position === store.filters.position)
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
    const activeEmployees = employees.filter((e) => e.status === 'active')

    return {
      total: employees.length,
      active: activeEmployees.length,
      inactive: employees.filter((e) => e.status === 'inactive').length,
      onLeave: employees.filter((e) => e.status === 'on-leave').length,
      departmentCount: store.data.departments.length,
      positionCount: store.data.positions.length,
      avgTenure: store.averageTenure,
      byDepartment: store.data.departments.map((dept) => ({
        id: dept.id,
        name: dept.name,
        count: activeEmployees.filter((e) => e.department === dept.name).length,
      })),
      byPosition: store.data.positions.map((pos) => ({
        id: pos.id,
        name: pos.name,
        count: activeEmployees.filter((e) => e.position === pos.name).length,
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

    // Computed - Getter functions to avoid closure issues
    get filteredEmployees() {
      return filteredEmployees
    },
    get statistics() {
      return statistics
    },
  }
}
