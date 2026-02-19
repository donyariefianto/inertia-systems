import { writable } from 'svelte/store'

// State splash screen dengan opsi konfigurasi
export const splashConfig = writable<{
  visible: boolean
  duration: number
  logo?: string
}>({
  visible: true,
  duration: 1500,
  logo: '/logo.svg', // opsional
})

if (typeof window !== 'undefined') {
  splashConfig.subscribe((config) => {
    if (config.visible) {
      setTimeout(() => {
        splashConfig.update((c) => ({ ...c, visible: false }))
      }, config.duration)
    }
  })
}
