export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

let toastList = $state<Toast[]>([])

export const toast = {
  get all() {
    return toastList
  },
  add(message: string, type: ToastType = 'success', duration: number = 5000) {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2)
    toastList = [...toastList, { id, message, type }]
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id)
      }, duration)
    }
  },
  remove(id: string) {
    toastList = toastList.filter((t) => t.id !== id)
  },
  clearAll() {
    toastList = []
  },
}
