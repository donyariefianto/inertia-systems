export const themeState = $state({
  mode: 'light',
  colorTheme: 'default',
})

export function initTheme() {
  if (typeof window === 'undefined') return
  const stored = localStorage.getItem('theme-state')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      themeState.mode = parsed.mode || 'light'
      themeState.colorTheme = parsed.colorTheme || 'default'
    } catch (e) {
      console.error('Gagal memuatkan state tema:', e)
    }
  }
  applyTheme()
}

export function toggleDarkMode() {
  themeState.mode = themeState.mode === 'dark' ? 'light' : 'dark'
  applyTheme()
}

export function setThemeColor(color: string) {
  themeState.colorTheme = color
  applyTheme()
}

function applyTheme() {
  if (typeof window === 'undefined') return
  const root = document.documentElement

  // 1. Handle Dark Mode
  root.classList.toggle('dark', themeState.mode === 'dark')

  // 2. Handle 3 Varian Warna (Cleanup & Apply)
  // Menghapuskan semua kelas yang bermula dengan 'theme-' secara bersih
  const currentClasses = Array.from(root.classList)
  currentClasses.forEach((c) => {
    if (c.startsWith('theme-')) root.classList.remove(c)
  })

  if (themeState.colorTheme !== 'default') {
    root.classList.add(`theme-${themeState.colorTheme}`)
  }

  localStorage.setItem(
    'theme-state',
    JSON.stringify({
      mode: themeState.mode,
      colorTheme: themeState.colorTheme,
    })
  )
}
