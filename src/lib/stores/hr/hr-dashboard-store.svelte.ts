import { logger } from '$lib/utils/logger'
import { formatDateForDisplay, getCurrentUTC } from '$lib/utils/date-handler'
import { formatEmployeeName } from '$lib/utils/format'
import type { Department, Employee, Executive, JobTitle, Position } from '$lib/types'

export class HRDashboardStore {
  // 기본 상태
  employees = $state<Employee[]>([])
  departments = $state<Department[]>([])
  positions = $state<Position[]>([])
  executives = $state<Executive[]>([])
  jobTitles = $state<JobTitle[]>([])

  // 로딩 상태
  loading = $state(true)
  error = $state<string | null>(null)
  executiveLoading = $state(false)
  _jobTitleLoading = $state(false)

  // 안전한 퍼센트 계산 유틸리티
  private safePct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0)

  // T/O (정원) 정보
  get teamTO(): Record<string, number> {
    const toMap: Record<string, number> = {}
    if (this.departments) {
      this.departments.forEach((dept: Department) => {
        toMap[dept.name] = dept.max_employees || 0
      })
    }
    return toMap
  }

  // 반응형 데이터 (데이터베이스 기반)
  get totalEmployees() {
    // 재직중인 직원만 카운트 (이사 제외)
    const activeEmployeeCount =
      this.employees?.filter((emp: Employee) => emp.status === 'active').length || 0
    return activeEmployeeCount
  }

  get _totalAllEmployees() {
    // 모든 직원 카운트 (재직자 + 퇴사자, 이사 제외)
    return this.employees?.length || 0
  }

  get _totalTO() {
    // 부서별 T/O 카운트를 단순히 합산
    return Object.values(this.teamTO).reduce((sum: number, to: number) => sum + to, 0)
  }

  get _totalDepartments() {
    return [...new Set(this.employees?.map((emp: Employee) => emp.department) || [])].length
  }

  // 부서별 직원 데이터 (T/O 포함)
  get departmentData() {
    if (
      !this.employees ||
      this.employees.length === 0 ||
      !this.departments ||
      this.departments.length === 0
    )
      return []

    // 모든 직원 카운트 (이사 포함)
    const deptCounts = this.employees.reduce(
      (acc: Record<string, number>, emp: Employee) => {
        acc[emp.department] = (acc[emp.department] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // departments 데이터를 기반으로 부서별 데이터 생성 (부서없음 포함)
    const deptData = this.departments.map((dept: Department) => {
      const currentCount = deptCounts[dept.name] || 0
      const departmentTO = this.teamTO[dept.name] || 0
      const percentage = this.safePct(currentCount, this.totalEmployees)

      return {
        department: dept.name,
        count: currentCount,
        to: departmentTO,
        percentage,
        // T/O 대비 현재 인원 비율
        toPercentage: departmentTO > 0 ? Math.round((currentCount / departmentTO) * 100) : 0,
        // T/O 상태 (여유/충족/초과)
        toStatus:
          departmentTO === 0
            ? 'unlimited'
            : currentCount > departmentTO
              ? 'over'
              : currentCount === departmentTO
                ? 'full'
                : 'available',
      }
    })

    // 부서 정렬 순서: 대표 → 전략기획실 → 연구소 → 각 팀들 → 부서없음
    return deptData.sort((a, b) => {
      const order: { [key: string]: number } = {
        대표: 1,
        전략기획실: 2,
        연구소: 3,
        부서없음: 999,
      }

      const aOrder = order[a.department] || 100
      const bOrder = order[b.department] || 100

      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }

      // 같은 우선순위 내에서는 알파벳 순
      return a.department.localeCompare(b.department)
    })
  }

  // 최근 활동 데이터
  get recentActivities() {
    const activities: Array<{
      type: string
      title: string
      description: string
      time: string
      icon: unknown
      color: string
      metadata?: Record<string, unknown>
    }> = []

    // 데이터가 없으면 빈 배열 반환
    if (!this.employees || this.employees.length === 0) {
      return activities
    }

    // 최근 입사자 (최근 3개월 이내)
    const threeMonthsAgo = new Date(getCurrentUTC())
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const recentHires = this.employees.filter(
      (emp: Employee) =>
        emp.status === 'active' && emp.hire_date && new Date(emp.hire_date) >= threeMonthsAgo,
    )

    recentHires
      .sort(
        (a: Employee, b: Employee) =>
          new Date(b.hire_date).getTime() - new Date(a.hire_date).getTime(),
      )
      .slice(0, 3)
      .forEach((emp: Employee) => {
        const daysSinceHire = Math.floor(
          (new Date().getTime() - new Date(emp.hire_date).getTime()) / (1000 * 60 * 60 * 24),
        )
        const hireDate = formatDateForDisplay(emp.hire_date, 'KOREAN')
        activities.push({
          type: 'hire',
          title: '신규 입사',
          description: `${formatEmployeeName(emp)}님이 ${hireDate}에 ${emp.department} ${emp.position}로 입사했습니다. (${daysSinceHire}일 경과)`,
          time: emp.hire_date,
          icon: null, // 아이콘은 컴포넌트에서 처리
          color: 'text-green-600',
          metadata: {
            daysSinceHire,
            department: emp.department,
            position: emp.position,
            employeeName: formatEmployeeName(emp),
          },
        })
      })

    // 퇴직 예정자 (1개월 이내)
    const oneMonthFromNow = new Date(getCurrentUTC())
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)

    this.employees
      .filter(
        (emp: Employee) =>
          emp.status === 'active' &&
          emp.termination_date &&
          new Date(emp.termination_date) > new Date() && // 미래 날짜
          new Date(emp.termination_date) <= oneMonthFromNow, // 1개월 이내
      )
      .sort(
        (a: Employee, b: Employee) =>
          new Date(a.termination_date!).getTime() - new Date(b.termination_date!).getTime(),
      )
      .slice(0, 3)
      .forEach((emp: Employee) => {
        const daysLeft = Math.ceil(
          (new Date(emp.termination_date || '').getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        )
        const isContract = emp.employment_type === 'contract'
        const terminationDate = formatDateForDisplay(emp.termination_date || '', 'KOREAN')
        activities.push({
          type: 'termination_pending',
          title: isContract ? '계약 만료 예정' : '퇴직 예정',
          description: `${formatEmployeeName(emp)}님(${emp.department} ${emp.position})이 ${terminationDate}에 ${isContract ? '계약 만료' : '퇴직'} 예정입니다. (${daysLeft}일 남음)`,
          time: emp.termination_date || '',
          icon: null,
          color: 'text-orange-600',
          metadata: {
            daysLeft,
            employmentType: emp.employment_type,
            department: emp.department,
            employeeName: formatEmployeeName(emp),
            position: emp.position,
          },
        })
      })

    // 최근 퇴사자 (최근 3개월 이내)
    const threeMonthsAgoForTermination = new Date(getCurrentUTC())
    threeMonthsAgoForTermination.setMonth(threeMonthsAgoForTermination.getMonth() - 3)

    this.employees
      .filter(
        (emp: Employee) =>
          emp.status === 'terminated' &&
          emp.termination_date &&
          new Date(emp.termination_date) >= threeMonthsAgoForTermination,
      )
      .sort(
        (a: Employee, b: Employee) =>
          new Date(b.termination_date!).getTime() - new Date(a.termination_date!).getTime(),
      )
      .slice(0, 3)
      .forEach((emp: Employee) => {
        const daysSinceTermination = Math.floor(
          (new Date().getTime() - new Date(emp.termination_date || '').getTime()) /
            (1000 * 60 * 60 * 24),
        )
        const terminationDate = formatDateForDisplay(emp.termination_date || '', 'KOREAN')
        activities.push({
          type: 'termination',
          title: '퇴사 완료',
          description: `${formatEmployeeName(emp)}님(${emp.department} ${emp.position})이 ${terminationDate}에 퇴사했습니다. (${daysSinceTermination}일 경과)`,
          time: emp.termination_date || '',
          icon: null,
          color: 'text-red-600',
          metadata: {
            daysSinceTermination,
            department: emp.department,
            employeeName: formatEmployeeName(emp),
            position: emp.position,
          },
        })
      })

    // 부서별 인원 변화 (최근 입사/퇴사로 인한 변화)
    const departmentChanges = this.employees.reduce(
      (acc: Record<string, { hires: Employee[]; terminations: Employee[] }>, emp: Employee) => {
        if (!acc[emp.department]) {
          acc[emp.department] = { hires: [], terminations: [] }
        }

        if (emp.status === 'active' && emp.hire_date && new Date(emp.hire_date) >= threeMonthsAgo) {
          acc[emp.department].hires.push(emp)
        }
        if (
          emp.status === 'terminated' &&
          emp.termination_date &&
          new Date(emp.termination_date) >= threeMonthsAgoForTermination
        ) {
          acc[emp.department].terminations.push(emp)
        }

        return acc
      },
      {},
    )

    // 변화가 있는 부서 정보 추가
    Object.entries(departmentChanges).forEach(
      ([dept, changes]: [string, { hires: Employee[]; terminations: Employee[] }]) => {
        if (changes.hires.length > 0 || changes.terminations.length > 0) {
          const netChange = changes.hires.length - changes.terminations.length
          if (netChange !== 0) {
            let description = `${dept} 부서: `
            if (changes.hires.length > 0) {
              description += `입사 ${changes.hires.length}명(${changes.hires.map(formatEmployeeName).join(', ')})`
            }
            if (changes.terminations.length > 0) {
              if (changes.hires.length > 0) description += ', '
              description += `퇴사 ${changes.terminations.length}명(${changes.terminations.map(formatEmployeeName).join(', ')})`
            }
            description += ` (순증감: ${netChange > 0 ? '+' : ''}${netChange}명)`

            activities.push({
              type: 'department_change',
              title: '부서 인원 변화',
              description: description,
              time: new Date().toISOString(),
              icon: null,
              color: netChange > 0 ? 'text-blue-600' : 'text-red-600',
              metadata: {
                department: dept,
                netChange,
                hires: changes.hires,
                terminations: changes.terminations,
              },
            })
          }
        }
      },
    )

    // 시간순 정렬 후 최대 8개 반환
    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8)
  }

  // 데이터 로딩 메서드들
  async fetchEmployees() {
    try {
      this.loading = true
      this.error = null
      const response = await fetch('/api/employees?status=all')
      if (response.ok) {
        const result = (await response.json()) as Record<string, unknown>
        this.employees = (result.data as Employee[]) || (result.employees as Employee[]) || []
      } else {
        this.error = '직원 데이터를 불러오는데 실패했습니다.'
      }
    } catch (err) {
      this.error = '직원 데이터를 불러오는데 실패했습니다.'
      logger.error('Error fetching employees:', err)
    } finally {
      this.loading = false
    }
  }

  async fetchDepartments() {
    try {
      const response = await fetch('/api/departments')
      if (response.ok) {
        const result = (await response.json()) as Record<string, unknown>
        this.departments =
          (result.data as Department[]) || (result.departments as Department[]) || []
      }
    } catch (err) {
      logger.error('Error fetching departments:', err)
    }
  }

  async fetchPositions() {
    try {
      const response = await fetch('/api/positions')
      if (response.ok) {
        const result = (await response.json()) as Record<string, unknown>
        this.positions = (result.data as Position[]) || (result.positions as Position[]) || []
      }
    } catch (err) {
      logger.error('Error fetching positions:', err)
    }
  }

  async fetchExecutives() {
    try {
      this.executiveLoading = true
      const response = await fetch('/api/executives')
      if (response.ok) {
        const result = (await response.json()) as Record<string, unknown>
        this.executives = (result.data as Executive[]) || (result.executives as Executive[]) || []
      }
    } catch (err) {
      logger.error('Error fetching executives:', err)
    } finally {
      this.executiveLoading = false
    }
  }

  async fetchJobTitles() {
    try {
      this._jobTitleLoading = true
      const response = await fetch('/api/job-titles')
      if (response.ok) {
        const result = (await response.json()) as Record<string, unknown>
        this.jobTitles = (result.data as JobTitle[]) || (result.jobTitles as JobTitle[]) || []
      }
    } catch (err) {
      logger.error('Error fetching job titles:', err)
    } finally {
      this._jobTitleLoading = false
    }
  }

  // 초기화 메서드
  async initialize() {
    await Promise.all([
      this.fetchEmployees(),
      this.fetchDepartments(),
      this.fetchPositions(),
      this.fetchExecutives(),
      this.fetchJobTitles(),
    ])
  }
}

// 싱글톤 인스턴스 생성
export const hrDashboardStore = new HRDashboardStore()
