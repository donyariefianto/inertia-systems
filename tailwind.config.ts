/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // penting agar class dark diaktifkan
  content: [
    './resources/views/**/*.edge',
    './inertia/**/*.{js,ts,svelte}',
  ],
  theme: {
    extend: {
      colors: {
        // Petakan CSS variables ke nama warna yang mudah diingat
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        muted: 'var(--color-muted)',
        accent: 'var(--color-accent)',
      },
    },
  },
  plugins: [],
}