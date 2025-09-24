import { writable } from 'svelte/store'

export interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
  actionText?: string
}

export interface NotificationSettings {
  budgetOverage: boolean
  goalDeadlines: boolean
  lowBalance: boolean
  dailyReminders: boolean
  emailNotifications: boolean
  pushNotifications: boolean
}

// 초기 알림 설정
const initialSettings: NotificationSettings = {
  budgetOverage: true,
  goalDeadlines: true,
  lowBalance: true,
  dailyReminders: true,
  emailNotifications: false,
  pushNotifications: true,
}

// 초기 알림 데이터
const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'warning',
    title: '예산 초과 경고',
    message: '인건비 예산을 80% 이상 사용했습니다.',
    timestamp: new Date().toISOString(),
    read: false,
    actionUrl: '/finance',
    actionText: '예산 확인',
  },
  {
    id: '2',
    type: 'info',
    title: '자금 일보 입력 마감',
    message: '오전 10시 30분까지 자금 일보 입력을 완료해주세요.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    actionUrl: '/finance',
    actionText: '입력하기',
  },
  {
    id: '3',
    type: 'error',
    title: '예산 초과',
    message: '마케팅 예산을 100% 초과했습니다.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    read: true,
    actionUrl: '/finance',
    actionText: '예산 조정',
  },
]

// 스토어 생성
export const notifications = writable<Notification[]>(initialNotifications)
export const notificationSettings = writable<NotificationSettings>(initialSettings)

// 알림 추가 함수
export function addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
  const newNotification: Notification = {
    ...notification,
    id: `notification-${Date.now()}`,
    timestamp: new Date().toISOString(),
    read: false,
  }

  notifications.update((current) => [newNotification, ...current])
}

// 알림 읽음 처리
export function markAsRead(notificationId: string) {
  notifications.update((current) =>
    current.map((notification) =>
      notification.id === notificationId ? { ...notification, read: true } : notification,
    ),
  )
}

// 모든 알림 읽음 처리
export function markAllAsRead() {
  notifications.update((current) =>
    current.map((notification) => ({ ...notification, read: true })),
  )
}

// 알림 삭제
export function deleteNotification(notificationId: string) {
  notifications.update((current) =>
    current.filter((notification) => notification.id !== notificationId),
  )
}

// 알림 설정 업데이트
export function updateNotificationSettings(settings: NotificationSettings) {
  notificationSettings.set(settings)
}

// 예산 초과 알림 체크
export function checkBudgetOverage(budgetCategories: unknown[]) {
  budgetCategories.forEach((category) => {
    const usage = (category.spent / category.amount) * 100

    if (usage >= 100) {
      addNotification({
        type: 'error',
        title: '예산 초과',
        message: `${category.name} 예산을 ${usage.toFixed(1)}% 초과했습니다.`,
        actionUrl: '/finance',
        actionText: '예산 확인',
      })
    } else if (usage >= 80) {
      addNotification({
        type: 'warning',
        title: '예산 경고',
        message: `${category.name} 예산을 ${usage.toFixed(1)}% 사용했습니다.`,
        actionUrl: '/finance',
        actionText: '예산 확인',
      })
    }
  })
}

// 목표 마감일 알림 체크
export function checkGoalDeadlines(budgetGoals: unknown[]) {
  const now = new Date()
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  budgetGoals.forEach((goal) => {
    const deadline = new Date(goal.deadline)
    const progress = (goal.currentAmount / goal.targetAmount) * 100

    if (deadline <= oneWeekFromNow && deadline > now && progress < 100) {
      const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

      addNotification({
        type: 'warning',
        title: '목표 마감일 임박',
        message: `${goal.name} 목표 마감까지 ${daysLeft}일 남았습니다. (진행률: ${progress.toFixed(1)}%)`,
        actionUrl: '/finance',
        actionText: '목표 확인',
      })
    }
  })
}

// 잔고 부족 알림 체크
export function checkLowBalance(bankAccounts: unknown[], transactions: unknown[]) {
  const monthlyExpense =
    transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + t.amount, 0) / 12 // 월평균 지출

  const totalBalance = bankAccounts.reduce((sum: number, account: any) => sum + account.balance, 0)

  if (totalBalance < monthlyExpense * 2) {
    addNotification({
      type: 'error',
      title: '잔고 부족 경고',
      message: `현재 잔고가 2개월 운영비보다 적습니다. (잔고: ${totalBalance.toLocaleString()}원)`,
      actionUrl: '/finance',
      actionText: '잔고 확인',
    })
  } else if (totalBalance < monthlyExpense * 3) {
    addNotification({
      type: 'warning',
      title: '잔고 주의',
      message: `현재 잔고가 3개월 운영비보다 적습니다. (잔고: ${totalBalance.toLocaleString()}원)`,
      actionUrl: '/finance',
      actionText: '잔고 확인',
    })
  }
}

// 자금 일보 입력 마감 알림
export function checkFundsReportDeadline() {
  const now = new Date()
  const deadline = new Date()
  deadline.setHours(10, 30, 0, 0)

  const timeUntilDeadline = deadline.getTime() - now.getTime()
  const minutesUntilDeadline = Math.floor(timeUntilDeadline / (1000 * 60))

  if (minutesUntilDeadline > 0 && minutesUntilDeadline <= 30) {
    addNotification({
      type: 'info',
      title: '자금 일보 입력 마감',
      message: `자금 일보 입력 마감까지 ${minutesUntilDeadline}분 남았습니다.`,
      actionUrl: '/finance',
      actionText: '입력하기',
    })
  }
}
