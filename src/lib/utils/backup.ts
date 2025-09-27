import type { BudgetCategory, BudgetGoal } from '$lib/stores/budget'
import type { BankAccount, ExpectedTransaction, Transaction } from '$lib/stores/funds'
import type { Notification, NotificationSettings } from '$lib/stores/notifications'
import { formatDateForInput, getCurrentUTC } from '$lib/utils/date-handler'
import { logger } from '$lib/utils/logger'

export interface BackupData {
  version: string
  timestamp: string
  data: {
    bankAccounts: BankAccount[]
    transactions: Transaction[]
    expectedTransactions: ExpectedTransaction[]
    budgetCategories: BudgetCategory[]
    budgetGoals: BudgetGoal[]
    notifications: Notification[]
    notificationSettings: NotificationSettings
  }
}

// 데이터 백업
export function createBackup(
  bankAccounts: BankAccount[],
  transactions: Transaction[],
  expectedTransactions: ExpectedTransaction[],
  budgetCategories: BudgetCategory[],
  budgetGoals: BudgetGoal[],
  notifications: Notification[],
  notificationSettings: NotificationSettings,
): BackupData {
  return {
    version: '1.0.0',
    timestamp: getCurrentUTC(),
    data: {
      bankAccounts,
      transactions,
      expectedTransactions,
      budgetCategories,
      budgetGoals,
      notifications,
      notificationSettings,
    },
  }
}

// 백업 파일 다운로드
export function downloadBackup(backupData: BackupData) {
  const jsonString = JSON.stringify(backupData, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `workstream-backup-${formatDateForInput(getCurrentUTC())}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 백업 파일 검증
export function validateBackup(data: unknown): data is BackupData {
  if (!data || typeof data !== 'object') {
    return false
  }

  const dataObj = data as Record<string, unknown>
  if (!dataObj.version || !dataObj.timestamp || !dataObj.data) {
    return false
  }

  const requiredFields = [
    'bankAccounts',
    'transactions',
    'expectedTransactions',
    'budgetCategories',
    'budgetGoals',
    'notifications',
    'notificationSettings',
  ]

  const dataData = dataObj.data as Record<string, unknown>
  return requiredFields.every(
    (field) => Array.isArray(dataData[field]) || typeof dataData[field] === 'object',
  )
}

// 로컬 스토리지에 자동 백업
export function autoBackup(
  bankAccounts: BankAccount[],
  transactions: Transaction[],
  expectedTransactions: ExpectedTransaction[],
  budgetCategories: BudgetCategory[],
  budgetGoals: BudgetGoal[],
  notifications: Notification[],
  notificationSettings: NotificationSettings,
) {
  const backupData = createBackup(
    bankAccounts,
    transactions,
    expectedTransactions,
    budgetCategories,
    budgetGoals,
    notifications,
    notificationSettings,
  )

  try {
    localStorage.setItem('workstream-auto-backup', JSON.stringify(backupData))
    localStorage.setItem('workstream-backup-timestamp', backupData.timestamp)
  } catch (error) {
    logger.error('자동 백업 실패:', error)
  }
}

// 로컬 스토리지에서 자동 백업 복원
export function loadAutoBackup(): BackupData | null {
  try {
    const backupString = localStorage.getItem('workstream-auto-backup')
    if (!backupString) {
      return null
    }

    const backupData = JSON.parse(backupString)
    if (validateBackup(backupData)) {
      return backupData
    }
  } catch (error) {
    logger.error('자동 백업 로드 실패:', error)
  }

  return null
}

// 백업 파일 읽기
export function readBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const result = e.target?.result
        if (typeof result !== 'string') {
          throw new Error('파일 읽기 실패')
        }

        const backupData = JSON.parse(result)
        if (validateBackup(backupData)) {
          resolve(backupData)
        } else {
          reject(new Error('잘못된 백업 파일 형식입니다.'))
        }
      } catch (error) {
        reject(new Error('백업 파일 파싱 실패: ' + (error as Error).message))
      }
    }

    reader.onerror = () => {
      reject(new Error('파일 읽기 중 오류가 발생했습니다.'))
    }

    reader.readAsText(file)
  })
}

// 백업 복원 확인 메시지
export function getRestoreConfirmMessage(backupData: BackupData): string {
  const backupDate = new Date(backupData.timestamp).toLocaleString('ko-KR')
  const dataCount = {
    accounts: backupData.data.bankAccounts.length,
    transactions: backupData.data.transactions.length,
    expectedTransactions: backupData.data.expectedTransactions.length,
    budgetCategories: backupData.data.budgetCategories.length,
    budgetGoals: backupData.data.budgetGoals.length,
  }

  return `
다음 백업을 복원하시겠습니까?

백업 일시: ${backupDate}
버전: ${backupData.version}

포함된 데이터:
- 계좌: ${dataCount.accounts}개
- 거래내역: ${dataCount.transactions}개  
- 예상거래: ${dataCount.expectedTransactions}개
- 예산카테고리: ${dataCount.budgetCategories}개
- 예산목표: ${dataCount.budgetGoals}개

※ 현재 데이터는 모두 대체됩니다.
	`.trim()
}

// 백업 통계
export interface BackupStats {
  lastBackupTime: string | null
  backupSize: number
  totalRecords: number
}

export function getBackupStats(
  bankAccounts: BankAccount[],
  transactions: Transaction[],
  expectedTransactions: ExpectedTransaction[],
  budgetCategories: BudgetCategory[],
  budgetGoals: BudgetGoal[],
): BackupStats {
  const lastBackupTime = localStorage.getItem('workstream-backup-timestamp')
  const totalRecords =
    bankAccounts.length +
    transactions.length +
    expectedTransactions.length +
    budgetCategories.length +
    budgetGoals.length

  const backupData = createBackup(
    bankAccounts,
    transactions,
    expectedTransactions,
    budgetCategories,
    budgetGoals,
    [],
    {} as NotificationSettings,
  )
  const backupSize = JSON.stringify(backupData).length

  return {
    lastBackupTime,
    backupSize,
    totalRecords,
  }
}
