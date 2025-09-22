import { writable } from 'svelte/store'

export type Toast = { id: string; message: string; type?: 'success' | 'error' | 'info' }

export const toasts = writable<Toast[]>([])

export function pushToast(message: string, type: Toast['type'] = 'info') {
  const id = Math.random().toString(36).slice(2)
  toasts.update(t => [...t, { id, message, type }])
  setTimeout(() => {
    toasts.update(t => t.filter(x => x.id !== id))
  }, 3000)
}
