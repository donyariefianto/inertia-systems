export const themeState = $state({
  mode: 'light',
  colorTheme: 'default'
});

export function initTheme() {
  if (typeof window === 'undefined') return;
  const stored = localStorage.getItem('theme-state');
  if (stored) {
    const parsed = JSON.parse(stored);
    themeState.mode = parsed.mode || 'light';
    themeState.colorTheme = parsed.colorTheme || 'default';
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    themeState.mode = prefersDark ? 'dark' : 'light';
  }
  applyTheme();
}

export function toggleDarkMode() {
  themeState.mode = themeState.mode === 'dark' ? 'light' : 'dark';
  applyTheme();
}

export function setThemeColor(colorTheme: string) {
  themeState.colorTheme = colorTheme;
  applyTheme();
}

function applyTheme() {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  
  root.classList.toggle('dark', themeState.mode === 'dark');
  
  root.className = root.className.replace(/\btheme-\S+/g, '');
  if (themeState.colorTheme !== 'default') {
    root.classList.add(`theme-${themeState.colorTheme}`);
  }
  
  localStorage.setItem('theme-state', JSON.stringify({ mode: themeState.mode, colorTheme: themeState.colorTheme }));
}