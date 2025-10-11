/**
 * Project Available Employees Hook
 * 프로젝트에 참여하지 않은 현직 직원 목록 제공
 *
 * 특징:
 * - useActiveEmployees 기반으로 클라이언트 측 필터링
 * - 프로젝트 멤버를 제외한 직원만 반환
 * - 캐싱 효과 활용
 */

import { useActiveEmployees } from './useActiveEmployees.svelte'

interface ProjectMember {
  employee_id: string
  id?: string
}

export function useProjectAvailableEmployees(projectMembers: ProjectMember[]) {
  const employeeHook = useActiveEmployees()

  // 프로젝트 멤버를 제외한 직원 목록
  const availableEmployees = $derived.by(() => {
    const memberEmployeeIds = new Set(projectMembers.map((m) => m.employee_id || m.id))
    return employeeHook.employees.filter((emp) => !memberEmployeeIds.has(emp.id))
  })

  return {
    get employees() {
      return availableEmployees
    },
    get loading() {
      return employeeHook.loading
    },
    get error() {
      return employeeHook.error
    },
    load: employeeHook.load,
    clearCache: employeeHook.clearCache,
  }
}
