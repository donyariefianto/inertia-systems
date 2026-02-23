import { page } from '@inertiajs/svelte'
import { get } from 'svelte/store'

export const i18nStates = $state({
  get locale() {
    return (get(page).props as any).locale || 'id'
  },
  get dict() {
    return (get(page).props as any).translations || {}
  },
})

let _locale = $state('id')
let _dict = $state<Record<string, any>>({})

page.subscribe(($page) => {
  if (!$page || !$page.props) {
    return
  }
  const props = $page.props as any
  if (props.locale) {
    _locale = props.locale
  }
  if (props.translations) {
    _dict = props.translations
  }
})

export function t(key: string, params: Record<string, any> = {}): any {
  const dict = i18nState.dict
  if (!dict) return key

  let value = dict[key]
  if (value === undefined) {
    value = key.split('.').reduce((acc, part) => {
      return acc && typeof acc === 'object' ? acc[part] : undefined
    }, dict)
  }
  if (value === undefined || value === null) {
    return key
  }
  if (typeof value === 'string') {
    return value.replace(/{(\w+)}/g, (match, prop) => {
      return params[prop] !== undefined ? String(params[prop]) : match
    })
  }
  return value
}

export const i18nState = {
  get locale() {
    return _locale
  },
  get dict() {
    return _dict
  },
}
