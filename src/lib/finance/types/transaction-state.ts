/**
 * TransactionManagement 컴포넌트의 상태 타입 정의
 */

/**
 * 계좌별 업로드 상태
 */
export interface AccountUploadState {
  isUploading: boolean
  progress: number
  selectedFile: File | null
  uploadResult: any
}

/**
 * 계좌별 삭제 상태
 */
export interface AccountDeleteState {
  isDeleting: boolean
  confirmAccountNumber: string
  showDeleteConfirm: boolean
}

/**
 * 인라인 편집 데이터
 */
export interface InlineEditData {
  description: string
  categoryId: string
}

/**
 * 필터링된 통계 데이터
 */
export interface FilteredStatistics {
  totalIncome: number
  totalExpense: number
  netAmount: number
  count: number
}

/**
 * 계좌별 업로드 상태 맵
 */
export type AccountUploadStates = Record<string, AccountUploadState>

/**
 * 계좌별 삭제 상태 맵
 */
export type AccountDeleteStates = Record<string, AccountDeleteState>
