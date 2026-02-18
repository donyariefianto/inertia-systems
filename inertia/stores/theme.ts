import { writable } from 'svelte/store'

export type ColorTheme = 'default' | 'forest' | 'ocean' // tambahkan sesuai keinginan
export type ThemeMode = 'light' | 'dark'

interface ThemeState {
  mode: ThemeMode
  colorTheme: ColorTheme
}

// Fungsi untuk mengaplikasikan state ke DOM
function applyTheme(state: ThemeState) {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  // Set mode (class dark)
  root.classList.toggle('dark', state.mode === 'dark')

  // Hapus semua class tema lama (yang dimulai dengan theme-)
  Array.from(root.classList).forEach(cls => {
    if (cls.startsWith('theme-')) root.classList.remove(cls)
  })

  // Tambahkan class tema baru jika bukan default
  if (state.colorTheme !== 'default') {
    root.classList.add(`theme-${state.colorTheme}`)
  }
}

// Mendapatkan state awal dari localStorage atau preferensi sistem
function getInitialState(): ThemeState {
  if (typeof window === 'undefined') {
    return { mode: 'light', colorTheme: 'default' }
  }

  const stored = localStorage.getItem('theme-state')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {}
  }

  // Deteksi preferensi sistem untuk mode
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return {
    mode: prefersDark ? 'dark' : 'light',
    colorTheme: 'default',
  }
}

// Inisialisasi store
const initialState = getInitialState()
export const themeState = writable<ThemeState>(initialState)

// Terapkan tema saat store berubah (hanya di browser)
if (typeof window !== 'undefined') {
  themeState.subscribe(state => {
    localStorage.setItem('theme-state', JSON.stringify(state))
    applyTheme(state)
  })
}

// Action functions
export const setMode = (mode: ThemeMode) => {
  themeState.update(state => ({ ...state, mode }))
}

export const setColorTheme = (colorTheme: ColorTheme) => {
  themeState.update(state => ({ ...state, colorTheme }))
}

export const toggleMode = () => {
  themeState.update(state => ({
    ...state,
    mode: state.mode === 'light' ? 'dark' : 'light',
  }))
}