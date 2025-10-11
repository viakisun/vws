import type { ParticipationAssignment, SalaryHistory } from '$lib/types'
import { writable } from 'svelte/store'
import { logAudit, persons, projects } from './core'

// 참여율 및 급여 변동 관리
export const participationAssignments = writable<ParticipationAssignment[]>([])
export const salaryHistory = writable<SalaryHistory[]>([])

// 월별 인건비 배분 데이터 타입
interface MonthlyAllocation {
  projectId: string
  personId: string
  allocatedAmount: number
  participationRate: number
  month: string
  // 추가 속성들
  projectCode?: string
  projectTitle?: string
  personName?: string
  baseSalary?: number
  workingRatio?: number
  currency?: string
}

// 월별 인건비 배분표
export const monthlySalaryAllocations = writable<Record<string, MonthlyAllocation[]>>({})

// 참여율 배정
export function assignParticipation(
  projectId: string,
  personId: string,
  dateFrom: string,
  dateTo: string,
  ratePct: number,
): string {
  const assignment: ParticipationAssignment = {
    id: crypto.randomUUID(),
    employeeId: personId, // personId를 employeeId로 매핑
    projectId,
    participationRate: ratePct, // ratePct를 participationRate로 매핑
    startDate: dateFrom, // dateFrom을 startDate로 매핑
    endDate: dateTo, // dateTo를 endDate로 매핑
    role: 'researcher', // 기본 역할 설정
    status: 'active', // 기본 상태 설정
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // 추가 속성들 (기존 코드와의 호환성을 위해 유지)
    personId,
    dateFrom,
    dateTo,
    ratePct,
  }

  participationAssignments.update((assignments) => [...assignments, assignment])
  logAudit('create', 'participation_assignment', assignment.id, {}, assignment)

  // 월별 배분표 재계산
  recalculateMonthlyAllocations()

  return assignment.id
}

// 참여율 수정
export function updateParticipation(
  assignmentId: string,
  updates: Partial<ParticipationAssignment>,
): void {
  participationAssignments.update((assignments) => {
    const index = assignments.findIndex((a) => a.id === assignmentId)
    if (index === -1) return assignments

    const oldAssignment = assignments[index]
    const updatedAssignment = {
      ...oldAssignment,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    const newAssignments = [...assignments]
    newAssignments[index] = updatedAssignment

    logAudit('update', 'participation_assignment', assignmentId, oldAssignment, updatedAssignment)

    // 월별 배분표 재계산
    recalculateMonthlyAllocations()

    return newAssignments
  })
}

// 급여 변동 등록
export function addSalaryChange(
  personId: string,
  effectiveFrom: string,
  baseSalary: number,
  currency: string = 'KRW',
): string {
  const salaryRecord: SalaryHistory = {
    id: crypto.randomUUID(),
    employeeId: personId, // personId를 employeeId로 매핑
    effectiveDate: effectiveFrom, // effectiveFrom을 effectiveDate로 매핑
    salary: baseSalary, // baseSalary를 salary로 매핑
    currency,
    changeReason: 'salary_adjustment', // 기본 변경 사유
    approvedBy: 'system', // 기본 승인자
    createdAt: new Date().toISOString(),
    // 추가 속성들 (기존 코드와의 호환성을 위해 유지)
    personId,
    effectiveFrom,
    baseSalary,
    updatedAt: new Date().toISOString(),
  }

  salaryHistory.update((history) => [...history, salaryRecord])
  logAudit('create', 'salary_history', salaryRecord.id, {}, salaryRecord)

  // 월별 배분표 재계산
  recalculateMonthlyAllocations()

  return salaryRecord.id
}

// 월별 인건비 배분표 계산
export function recalculateMonthlyAllocations(): void {
  // 모든 프로젝트와 참여 배정을 가져와서 월별로 계산
  const _allocations: Record<string, unknown[]> = {}

  participationAssignments.subscribe((assignments) => {
    salaryHistory.subscribe((salaries) => {
      projects.subscribe((projectList) => {
        persons.subscribe((personList) => {
          // 월별로 그룹화하여 계산
          const monthlyData: Record<string, MonthlyAllocation[]> = {}

          assignments.forEach((assignment) => {
            const project = projectList.find((p) => p.id === assignment.projectId)
            const person = personList.find((p) => p.id === assignment.personId)

            if (!project || !person) return

            // 배정 기간의 각 월에 대해 계산
            const startDate = assignment.dateFrom ? new Date(assignment.dateFrom) : new Date()
            const endDate = assignment.dateTo ? new Date(assignment.dateTo) : new Date()

            const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
            const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1)

            while (currentDate <= endMonth) {
              const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

              if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = []
              }

              // 해당 월의 급여 정보 가져오기
              const monthlySalary = getSalaryForMonth(person.id, currentDate, salaries)

              // 해당 월의 근무일 수 계산
              const workingDays = getWorkingDaysInMonth(currentDate, startDate, endDate)
              const totalDays = getDaysInMonth(currentDate)
              const workingRatio = workingDays / totalDays

              // 인건비 계산
              const monthlyAllocation: MonthlyAllocation = {
                projectId: project.id,
                projectCode: project.code,
                projectTitle: project.title,
                personId: person.id,
                personName: person.name,
                participationRate: assignment.ratePct || 0,
                baseSalary: monthlySalary,
                workingRatio,
                allocatedAmount: monthlySalary * ((assignment.ratePct || 0) / 100) * workingRatio,
                currency: 'KRW',
                month: monthKey,
              }

              monthlyData[monthKey].push(monthlyAllocation)

              // 다음 달로 이동
              currentDate.setMonth(currentDate.getMonth() + 1)
            }
          })

          monthlySalaryAllocations.set(monthlyData)
        })()
      })()
    })()
  })()
}

// 특정 월의 급여 정보 가져오기
function getSalaryForMonth(personId: string, month: Date, salaries: SalaryHistory[]): number {
  // 해당 월에 유효한 급여 정보 찾기
  const validSalaries = salaries
    .filter((s) => s.personId === personId)
    .filter((s) => s.effectiveFrom && new Date(s.effectiveFrom) <= month)
    .sort((a, b) => {
      const aDate = a.effectiveFrom ? new Date(a.effectiveFrom).getTime() : 0
      const bDate = b.effectiveFrom ? new Date(b.effectiveFrom).getTime() : 0
      return bDate - aDate
    })

  return validSalaries.length > 0 ? validSalaries[0].baseSalary || 0 : 0
}

// 특정 월의 근무일 수 계산
function getWorkingDaysInMonth(month: Date, startDate: Date, endDate: Date): number {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0)

  const effectiveStart = startDate > monthStart ? startDate : monthStart
  const effectiveEnd = endDate < monthEnd ? endDate : monthEnd

  if (effectiveStart > effectiveEnd) return 0

  return Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

// 특정 월의 총 일수
function getDaysInMonth(month: Date): number {
  return new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
}

// 프로젝트별 월별 인건비 집계
export function getProjectMonthlyAllocations(
  projectId: string,
  month: string,
): MonthlyAllocation[] {
  let allocations: MonthlyAllocation[] = []

  monthlySalaryAllocations.subscribe((monthlyData) => {
    allocations = monthlyData[month]?.filter((a) => a.projectId === projectId) || []
  })()

  return allocations
}

// 프로젝트별 총 인건비 계산
export function getProjectTotalPersonnelCost(
  projectId: string,
  startMonth: string,
  endMonth: string,
): number {
  let totalCost = 0

  monthlySalaryAllocations.subscribe((monthlyData) => {
    const startDate = new Date(startMonth + '-01')
    const endDate = new Date(endMonth + '-01')

    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      const monthAllocations = monthlyData[monthKey] || []

      const projectAllocations = monthAllocations.filter((a) => a.projectId === projectId)
      const monthTotal = projectAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0)

      totalCost += monthTotal

      currentDate.setMonth(currentDate.getMonth() + 1)
    }
  })()

  return totalCost
}

// 개인별 월별 참여 현황
export function getPersonMonthlyParticipation(
  personId: string,
  month: string,
): MonthlyAllocation[] {
  let participations: MonthlyAllocation[] = []

  monthlySalaryAllocations.subscribe((monthlyData) => {
    participations = monthlyData[month]?.filter((a) => a.personId === personId) || []
  })()

  return participations
}

// 개인별 총 참여율 계산 (특정 월)
export function getPersonTotalParticipationRate(personId: string, month: string): number {
  const participations = getPersonMonthlyParticipation(personId, month)
  return participations.reduce((sum, p) => sum + p.participationRate, 0)
}

// 참여율 초과 경고 체크
export function checkParticipationOverload(
  personId: string,
  month: string,
): {
  overloaded: boolean
  totalRate: number
  threshold: number
} {
  const totalRate = getPersonTotalParticipationRate(personId, month)
  const threshold = 100 // 100% 초과 시 경고

  return {
    overloaded: totalRate > threshold,
    totalRate,
    threshold,
  }
}

// 급여 변동 이력 가져오기
export function getSalaryHistory(personId: string): SalaryHistory[] {
  let history: SalaryHistory[] = []

  salaryHistory.subscribe((salaries) => {
    history = salaries
      .filter((s) => s.personId === personId)
      .sort((a, b) => {
        const aDate = a.effectiveFrom ? new Date(a.effectiveFrom).getTime() : 0
        const bDate = b.effectiveFrom ? new Date(b.effectiveFrom).getTime() : 0
        return bDate - aDate
      })
  })()

  return history
}

// 현재 유효한 급여 정보 가져오기
export function getCurrentSalary(personId: string): SalaryHistory | null {
  const history = getSalaryHistory(personId)
  return history.length > 0 ? history[0] : null
}

// 참여 배정 이력 가져오기
export function getParticipationHistory(personId: string): ParticipationAssignment[] {
  let history: ParticipationAssignment[] = []

  participationAssignments.subscribe((assignments) => {
    history = assignments
      .filter((a) => a.personId === personId)
      .sort((a, b) => {
        const aDate = a.dateFrom ? new Date(a.dateFrom).getTime() : 0
        const bDate = b.dateFrom ? new Date(b.dateFrom).getTime() : 0
        return bDate - aDate
      })
  })()

  return history
}

// 프로젝트별 참여자 목록
export function getProjectParticipants(projectId: string): ParticipationAssignment[] {
  let participants: ParticipationAssignment[] = []

  participationAssignments.subscribe((assignments) => {
    participants = assignments
      .filter((a) => a.projectId === projectId)
      .sort((a, b) => {
        const aDate = a.dateFrom ? new Date(a.dateFrom).getTime() : 0
        const bDate = b.dateFrom ? new Date(b.dateFrom).getTime() : 0
        return aDate - bDate
      })
  })()

  return participants
}

// 월별 인건비 배분표 생성 (CSV 형식)
export function generateMonthlyAllocationReport(month: string): string {
  let report = '프로젝트코드,프로젝트명,직원명,참여율,기본급여,근무비율,배분금액,통화\n'

  monthlySalaryAllocations.subscribe((monthlyData) => {
    const monthData = monthlyData[month] || []
    monthData.forEach((allocation) => {
      report += `${allocation.projectCode || ''},${allocation.projectTitle || ''},${allocation.personName || ''},${allocation.participationRate}%,${(allocation.baseSalary || 0).toLocaleString()},${((allocation.workingRatio || 0) * 100).toFixed(1)}%,${allocation.allocatedAmount.toLocaleString()},${allocation.currency || 'KRW'}\n`
    })
  })()

  return report
}

// 급여 변동 반영 (중도 인상/감봉)
export function applySalaryChange(
  personId: string,
  effectiveFrom: string,
  newSalary: number,
  reason: string,
): void {
  // 기존 급여 정보의 종료일 설정
  salaryHistory.update((history) => {
    return history.map((salary) => {
      if (salary.personId === personId && salary.updatedAt && !salary.updatedAt.includes('ended')) {
        return {
          ...salary,
          updatedAt: new Date().toISOString() + ' (ended)',
        }
      }
      return salary
    })
  })

  // 새로운 급여 정보 추가
  addSalaryChange(personId, effectiveFrom, newSalary)

  logAudit('salary_change', 'person', personId, { reason, newSalary, effectiveFrom }, {})
}

// 휴가/병가 반영 (참여율 조정)
export function applyLeaveAdjustment(
  personId: string,
  projectId: string,
  leaveStart: string,
  leaveEnd: string,
  leaveType: 'annual' | 'sick' | 'personal',
): void {
  // 휴가 기간 동안의 참여율을 0%로 조정
  const adjustment = {
    projectId,
    personId,
    dateFrom: leaveStart,
    dateTo: leaveEnd,
    ratePct: 0,
    leaveType,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // 기존 배정과 겹치는 부분 조정
  participationAssignments.update((assignments) => {
    return assignments.map((assignment) => {
      if (assignment.personId === personId && assignment.projectId === projectId) {
        // 휴가 기간과 겹치는 부분이 있는지 확인
        const assignmentStart = assignment.dateFrom ? new Date(assignment.dateFrom) : new Date()
        const assignmentEnd = assignment.dateTo ? new Date(assignment.dateTo) : new Date()
        const leaveStartDate = new Date(leaveStart)
        const leaveEndDate = new Date(leaveEnd)

        if (leaveStartDate <= assignmentEnd && leaveEndDate >= assignmentStart) {
          // 겹치는 기간이 있으면 조정 필요
          // 실제 구현에서는 더 복잡한 로직이 필요
          return assignment
        }
      }
      return assignment
    })
  })

  logAudit(
    'leave_adjustment',
    'participation',
    personId,
    { leaveType, leaveStart, leaveEnd },
    adjustment,
  )
}
