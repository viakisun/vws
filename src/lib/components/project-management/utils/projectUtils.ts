/**
 * 프로젝트(Project) 관련 유틸리티 함수
 * ProjectDetailView에서 사용하는 프로젝트 데이터 처리 함수들
 */

/**
 * 프로젝트 필드 접근 유틸리티 - camelCase와 snake_case 모두 지원
 */
export function getProjectField<T>(
  project: Record<string, any>,
  camelCase: string,
  snakeCase: string,
  defaultValue: T,
): T {
  return project?.[camelCase] || project?.[snakeCase] || defaultValue
}

/**
 * 프로젝트 시작일 가져오기
 */
export function getProjectStartDate(project: Record<string, any>): string {
  return getProjectField(project, 'startDate', 'start_date', '')
}

/**
 * 프로젝트 종료일 가져오기
 */
export function getProjectEndDate(project: Record<string, any>): string {
  return getProjectField(project, 'endDate', 'end_date', '')
}

/**
 * 프로젝트 코드 가져오기
 */
export function getProjectCode(project: Record<string, any>): string {
  return getProjectField(project, 'code', 'project_code', '')
}

/**
 * 프로젝트 설명 가져오기
 */
export function getProjectDescription(project: Record<string, any>): string {
  return getProjectField(project, 'description', 'description', '')
}

/**
 * 프로젝트 상태 가져오기
 */
export function getProjectStatus(project: Record<string, any>): string {
  return getProjectField(project, 'status', 'status', '')
}

/**
 * 프로젝트 후원 유형 가져오기
 */
export function getProjectSponsorType(project: Record<string, any>): string {
  return getProjectField(project, 'sponsorType', 'sponsor_type', '')
}

/**
 * 프로젝트 이름 가져오기
 */
export function getProjectName(project: Record<string, any>): string {
  return getProjectField(project, 'name', 'project_name', '')
}

/**
 * 프로젝트 ID 가져오기
 */
export function getProjectId(project: Record<string, any>): string | number {
  return getProjectField(project, 'id', 'project_id', '')
}

/**
 * 프로젝트 총 예산 가져오기
 */
export function getProjectTotalBudget(project: Record<string, any>): number {
  return getProjectField(project, 'totalBudget', 'total_budget', 0)
}

/**
 * 프로젝트 상태 배지 색상 반환
 */
export function getProjectStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    planning: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return statusColors[status] || 'bg-gray-100 text-gray-800'
}

/**
 * 프로젝트 상태 한글명 반환
 */
export function getProjectStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    planning: '계획 중',
    active: '진행 중',
    on_hold: '보류',
    completed: '완료',
    cancelled: '취소',
  }

  return statusLabels[status] || status
}

/**
 * 프로젝트 기간 계산 (일수)
 */
export function calculateProjectDuration(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0

  const start = new Date(startDate)
  const end = new Date(endDate)

  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * 프로젝트 진행률 계산
 */
export function calculateProjectProgress(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0

  const start = new Date(startDate)
  const end = new Date(endDate)
  const now = new Date()

  // 시작 전
  if (now < start) return 0

  // 종료 후
  if (now > end) return 100

  // 진행 중
  const totalDuration = end.getTime() - start.getTime()
  const currentDuration = now.getTime() - start.getTime()

  return Math.round((currentDuration / totalDuration) * 100)
}

/**
 * 프로젝트 남은 기간 계산 (일수)
 */
export function calculateProjectRemainingDays(endDate: string): number {
  if (!endDate) return 0

  const end = new Date(endDate)
  const now = new Date()

  if (now > end) return 0

  const diffTime = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * 프로젝트가 활성 상태인지 확인
 */
export function isProjectActive(project: Record<string, any>): boolean {
  const status = getProjectStatus(project)
  return status === 'active'
}

/**
 * 프로젝트가 완료 상태인지 확인
 */
export function isProjectCompleted(project: Record<string, any>): boolean {
  const status = getProjectStatus(project)
  return status === 'completed'
}

/**
 * 프로젝트 검증: 필수 필드 체크
 */
export function validateProject(project: Record<string, any>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!getProjectName(project)) {
    errors.push('프로젝트 이름이 필요합니다')
  }

  if (!getProjectCode(project)) {
    errors.push('프로젝트 코드가 필요합니다')
  }

  if (!getProjectStartDate(project)) {
    errors.push('시작일이 필요합니다')
  }

  if (!getProjectEndDate(project)) {
    errors.push('종료일이 필요합니다')
  }

  const startDate = new Date(getProjectStartDate(project))
  const endDate = new Date(getProjectEndDate(project))
  if (startDate > endDate) {
    errors.push('시작일은 종료일보다 이전이어야 합니다')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * 날짜 문자열을 입력 필드용 포맷으로 변환 (YYYY-MM-DD)
 */
export function formatDateForInput(dateStr: string): string {
  if (!dateStr) return ''

  try {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  } catch {
    return ''
  }
}

/**
 * 숫자 입력 핸들러 유틸리티
 */
export function handleNumberInput(e: Event, callback: (value: string) => void): void {
  const target = e.target as HTMLInputElement
  let value = target.value.replace(/[^0-9]/g, '')

  // 빈 값이면 0으로 설정하지 않고 빈 문자열 유지
  if (value === '') {
    callback('')
    return
  }

  // 숫자로 변환하여 앞의 0 제거
  value = String(Number(value))
  callback(value)
}
