import { page } from '@inertiajs/svelte'

export const i18nState = $state({
  locale: 'id',
  dict: {} as Record<string, any>,
})

/**
 * Inisialisasi/Update kamus bahasa dari props Inertia
 */
export function updateTranslations() {
  const props = page.props as any
  if (props.translations) {
    i18nState.locale = props.locale || 'id'
    i18nState.dict = props.translations
  }
}

/**
 * Fungsi $t (Translate) - Mendukung nested keys (e.g., 'auth.login')
 */
export function t(key: string): string {
  const keys = key.split('.')
  let value = i18nState.dict

  for (const k of keys) {
    if (value && value[k]) {
      value = value[k]
    } else {
      return key // Fallback ke key asli jika tidak ditemukan
    }
  }
  return value as unknown as string
}
