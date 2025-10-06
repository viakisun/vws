/**
 * Sales Helper Functions
 * 상태별, 타입별 라벨 및 색상 변환 유틸리티
 */

// ============================================================================
// Status Colors
// ============================================================================

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'success',
    inactive: 'error',
    prospecting: 'info',
    proposal: 'warning',
    negotiation: 'primary',
    'closed-won': 'success',
    'closed-lost': 'error',
    pending: 'warning',
    paid: 'success',
    overdue: 'error',
  }
  return colors[status] || 'default'
}

// ============================================================================
// Status Labels
// ============================================================================

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: '활성',
    inactive: '비활성',
    prospecting: '탐색',
    proposal: '제안',
    negotiation: '협상',
    'closed-won': '성사',
    'closed-lost': '실패',
    pending: '대기',
    paid: '완료',
    overdue: '연체',
  }
  return labels[status] || status
}

// ============================================================================
// Type Labels
// ============================================================================

export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    customer: '고객',
    supplier: '공급업체',
    both: '고객/공급업체',
    sales: '매출',
    purchase: '매입',
  }
  return labels[type] || type
}
