export const sanitizeField = (field: any): any => {
  const { name, label, type, required, unique, readonly, width, show_up } = field
  let clean: any = { name, label, type, required, unique, readonly, width, show_up: !!show_up }

  switch (type) {
    case 'number':
    case 'currency':
      clean.locale = field.locale || 'id-ID'
      clean.format = field.format || (type === 'currency' ? 'IDR' : 'decimal')
      clean.precision = Number(field.precision) || 0

      if (field.calculation?.enable_calc) {
        clean.calculation = {
          enable_calc: true,
          operation: field.calculation.operation,
          fields: field.calculation.fields,
        }
      } else {
        clean.calculation = {
          enable_calc: false,
          operation: null,
          fields: null,
        }
      }
      break

    case 'select':
      clean.options =
        field.options?.map((opt: any) => ({
          label: opt.label,
          value: opt.value,
        })) || []
      break

    case 'relation':
      clean.relation_collection = field.relation_collection
      clean.relation_key = field.relation_key
      clean.relation_display = field.relation_display
      clean.relation_enable_autopopulate = !!field.relation_enable_autopopulate
      if (clean.relation_enable_autopopulate) {
        clean.relation_autopopulate_map = field.relation_autopopulate_map
      }
      break

    case 'object_group':
    case 'repeater':
      clean.sub_fields = (field.sub_fields || []).map((sf: any) => sanitizeField(sf))
      break
  }

  return clean
}

export const prepareMenuPayload = (nodes: any[]): any[] => {
  return nodes.map((node) => {
    const cleanNode = { ...node }

    if (cleanNode.config) {
      cleanNode.config = {
        endpoint: cleanNode.config.endpoint,
        collectionName: cleanNode.config.collectionName,

        fields: (cleanNode.config.fields || []).map((f: any) => sanitizeField(f)),
      }
    }

    if (cleanNode.sub_sidemenu && cleanNode.sub_sidemenu.length > 0) {
      cleanNode.sub_sidemenu = prepareMenuPayload(cleanNode.sub_sidemenu)
    }

    delete cleanNode.expanded

    return cleanNode
  })
}

export const formatJsonUtility = (rawInput) => {
  try {
    if (!rawInput) return { data: '', error: false }
    const obj = typeof rawInput === 'string' ? JSON.parse(rawInput) : rawInput
    return {
      data: JSON.stringify(obj, null, 2),
      error: false,
      msg: 'JSON Valid',
    }
  } catch (err) {
    return {
      data: rawInput,
      error: true,
      msg: err.message,
    }
  }
}
