export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'primary' | 'destructive' | 'warning'
}

let active = $state<boolean>(false)
let options = $state<ConfirmOptions | null>(null)
let resolvePromise: (value: boolean) => void

export const Confirm = {
  get isActive() {
    return active
  },
  get config() {
    return options
  },

  show(cfg: ConfirmOptions): Promise<boolean> {
    options = {
      confirmText: 'Lanjutkan',
      cancelText: 'Batal',
      type: 'primary',
      ...cfg,
    }
    active = true

    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  },

  answer(val: boolean) {
    active = false
    resolvePromise(val)
  },
}
