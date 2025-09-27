/**
 * 프로젝트 상태별 색상을 반환하는 유틸리티 함수
 */
export function getProjectStatusColor(
  status: 'planning' | 'active' | 'completed' | 'cancelled' | 'suspended',
): 'green' | 'red' | 'yellow' | 'blue' | 'gray' {
  switch (status) {
    case 'suspended':
      return 'yellow' // 지연/보류
    case 'cancelled':
      return 'red' // 취소
    case 'active':
      return 'blue' // 진행중
    case 'planning':
    case 'completed':
    default:
      return 'green' // 계획/완료
  }
}

/**
 * 프로젝트 상태별 한글 라벨을 반환하는 유틸리티 함수
 */
export function getProjectStatusLabel(
  status: 'planning' | 'active' | 'completed' | 'cancelled' | 'suspended',
): string {
  switch (status) {
    case 'planning':
      return '계획'
    case 'active':
      return '진행중'
    case 'completed':
      return '완료'
    case 'cancelled':
      return '취소'
    case 'suspended':
      return '지연'
    default:
      return status
  }
}

/**
 * 프로젝트 상태 필터 옵션을 반환하는 유틸리티 함수
 */
export function getProjectStatusFilterOptions() {
  return [
    { value: '', label: '상태: 전체' },
    { value: 'active', label: '진행중' },
    { value: 'planning', label: '계획' },
    { value: 'completed', label: '완료' },
    { value: 'cancelled', label: '취소' },
    { value: 'suspended', label: '지연' },
  ]
}
