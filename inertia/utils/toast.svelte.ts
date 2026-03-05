export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

let toastList = $state<Toast[]>([])

export const toastStore = {
  get items() {
    return toastList
  },

  add(message: string, type: ToastType = 'success') {
    const id = crypto.randomUUID()
    toastList.push({ id, message, type })
    setTimeout(() => {
      this.remove(id)
    }, 5000)
  },

  remove(id: string) {
    toastList = toastList.filter((t) => t.id !== id)
  },
}
