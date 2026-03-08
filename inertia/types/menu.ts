export type SelectOption = {
  label: string
  value: string
}

export type CalculationOperation =
  | 'ADD'
  | 'SUBTRACT'
  | 'MULTIPLY'
  | 'DIVIDE'
  | 'MODULO'
  | 'PERCENTAGE'
  | 'SUM'
  | 'AVG'
  | 'MIN'
  | 'MAX'
  | 'COUNT'
  | 'COUNT_DISTINCT'

export type CalculationConfig = {
  enable_calc: boolean
  operation: CalculationOperation
  fields: string
  precision?: number
}

export type FieldConfig = {
  name: string
  label: string
  type: string
  export?: boolean
  required?: boolean
  unique?: boolean
  readonly?: boolean
  show_up?: boolean
  format?: any
  precision?: number
  locale?: string
  width?: string
  options?: SelectOption[]
  relation_collection?: string
  relation_key?: string
  relation_display?: string
  relation_enable_autopopulate?: boolean
  relation_autopopulate_map?: string
  calculation?: CalculationConfig
  sub_fields?: FieldConfig[]
  _isCollapsed?: boolean
}

export type MenuConfig = {
  endpoint?: string
  collectionName?: string
  fields?: FieldConfig[]
}

export type MenuNode = {
  id: string
  name: string
  icon: string
  type?: 'group' | 'tableview'
  path?: string
  export?: boolean
  locked?: boolean
  permissions?: string[]
  sub_sidemenu?: MenuNode[]
  expanded?: boolean
  config?: MenuConfig
}
