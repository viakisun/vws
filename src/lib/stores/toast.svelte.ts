/**
 * Toast Notification Store
 *
 * 토스트 알림을 관리하는 전역 상태
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

class ToastStore {
  toasts = $state<Toast[]>([])

  show(type: ToastType, message: string, duration = 3000) {
    const id = `toast-${Date.now()}-${Math.random()}`
    const toast: Toast = { id, type, message, duration }

    this.toasts.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id)
      }, duration)
    }
  }

  success(message: string, duration?: number) {
    this.show('success', message, duration)
  }

  error(message: string, duration?: number) {
    this.show('error', message, duration)
  }

  warning(message: string, duration?: number) {
    this.show('warning', message, duration)
  }

  info(message: string, duration?: number) {
    this.show('info', message, duration)
  }

  remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id)
  }

  clear() {
    this.toasts = []
  }
}

export const toastStore = new ToastStore()
