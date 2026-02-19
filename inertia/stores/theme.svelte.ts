// State global menggunakan Svelte 5 Runes
export const themeState = $state({
  mode: 'light', // 'light' | 'dark'
  color: 'default', // 'default' | 'theme-forest' | 'theme-ocean'
})

export function initTheme() {
  // Load dari localStorage jika ada
  const savedMode = localStorage.getItem('app-mode')
  const savedColor = localStorage.getItem('app-theme')

  if (savedMode) themeState.mode = savedMode
  if (savedColor) themeState.color = savedColor

  applyTheme()
}

export function toggleDarkMode() {
  themeState.mode = themeState.mode === 'dark' ? 'light' : 'dark'
  applyTheme()
}

export function setThemeColor(colorName) {
  themeState.color = colorName
  applyTheme()
}

function applyTheme() {
  const root = document.documentElement

  // Reset classes
  root.classList.remove('dark', 'theme-forest', 'theme-ocean')

  // Apply Dark Mode
  if (themeState.mode === 'dark') {
    root.classList.add('dark')
  }

  // Apply Color Theme
  if (themeState.color !== 'default') {
    root.classList.add(themeState.color)
  }

  // Save preferences
  localStorage.setItem('app-mode', themeState.mode)
  localStorage.setItem('app-theme', themeState.color)
}
