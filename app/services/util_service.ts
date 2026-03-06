import MongoService from '#services/mongo_service'
import hash from '@adonisjs/core/services/hash'
import transmit from '@adonisjs/transmit/services/main'

interface FieldConfig {
  name: string
  type: string
  sub_fields?: FieldConfig[]
  options?: { label: string; value: any }[]
}

export class UtilService {
  static async sideMenu() {
    const collections = MongoService.collection('systems')
    const data = await collections.findOne({ id: 'fixed_menu' })

    const FIXED_DASHBOARD = {
      id: 'fixed_dashboard',
      name: 'Dashboard',
      icon: 'fas fa-home',
      type: 'group',
      sub_sidemenu: [
        {
          id: 'fixed_dashboard_1',
          name: 'Dashboard',
          icon: 'fas fa-chart-line',
          type: 'chartview',
          path: 'dashboard',
          permissions: ['admin', 'user'],
          config: {
            endpoint: '/api/dashboard/stats',
            charts: ['overview', 'performance'],
            refreshInterval: 30000,
          },
        },
      ],
    }

    const FIXED_SETTINGS = {
      id: 'fixed_settings',
      name: 'Settings',
      icon: 'fas fa-cogs',
      permissions: ['admin'],
      type: 'group',
      sub_sidemenu: [
        {
          id: 'fixed_settings_1',
          name: 'User Management',
          icon: 'fas fa-users-cog',
          type: 'tableview',
          path: 'settings/users',
          config: {
            endpoint: 'users',
            collectionName: 'users',
            fields: [
              {
                name: 'username',
                label: 'Username',
                type: 'text',
                required: true,
                unique: true,
              },
              {
                name: 'email',
                label: 'Email',
                type: 'email',
                required: true,
                unique: true,
              },
              {
                name: 'role',
                label: 'Role',
                type: 'select',
                required: true,
                readonly: false,
                width: '100',
                show_up: false,
                options: [
                  {
                    label: 'Admin',
                    value: 'admin',
                  },
                  {
                    label: 'Staff',
                    value: 'staff',
                  },
                  {
                    label: 'Finance',
                    value: 'finance',
                  },
                  {
                    label: 'User',
                    value: 'user',
                  },
                ],
              },
              {
                name: 'status',
                label: 'Status Akun',
                type: 'select',
                required: true,
                readonly: false,
                width: '100',
                show_up: false,
                options: [
                  {
                    label: 'Active',
                    value: 'active',
                  },
                  {
                    label: 'Inactive',
                    value: 'inactive',
                  },
                  {
                    label: 'Suspended',
                    value: 'suspended',
                  },
                ],
              },
              {
                name: 'last_login',
                label: 'Terakhir Login',
                type: 'datetime',
                readonly: true,
              },
            ],
            operations: {
              create: true,
              read: true,
              update: true,
              delete: true,
              reset_password: true,
            },
          },
        },
        {
          id: 'fixed_settings_2',
          name: 'Settings & Config',
          icon: 'fas fa-sliders-h',
          type: 'settings',
          path: 'settings/config',
          config: {
            endpoint: '/api/settings/general',
            collectionName: 'app_config',
            fields: [
              {
                name: 'app_name',
                label: 'Nama Aplikasi',
                type: 'text',
                default: 'AION System',
              },
              {
                name: 'app_short_name',
                label: 'Nama Pendek Aplikasi',
                type: 'text',
                default: 'AION',
              },
              {
                name: 'maintenance_mode',
                label: 'Mode Maintenance',
                type: 'boolean',
                default: false,
              },
              {
                name: 'timezone',
                label: 'Zona Waktu Default',
                type: 'select',
                options: ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'],
                default: 'Asia/Jakarta',
              },
            ],
          },
        },
      ],
    }

    return data
      ? [FIXED_DASHBOARD, ...data.sidemenu, FIXED_SETTINGS]
      : [FIXED_DASHBOARD, FIXED_SETTINGS]
  }
  static async getFieldsMenu(collection) {
    const menu = await this.sideMenu()
    for (const group of menu) {
      if (group.sub_sidemenu && Array.isArray(group.sub_sidemenu)) {
        const foundItem = group.sub_sidemenu.find(
          (item: any) => item.config?.collectionName === collection
        )
        if (foundItem && foundItem.config?.fields) {
          return foundItem.config.fields
        }
      }
    }
    return null
  }
  static async castValue(value: any, field: FieldConfig): Promise<any> {
    if (value === undefined || value === null) {
      if (field.type === 'number' || field.type === 'currency') return 0
      if (field.type === 'boolean') return false
      if (field.type === 'repeater') return []
      return null
    }

    switch (field.type) {
      case 'number':
      case 'currency':
        const sanitizedNum = typeof value === 'string' ? value.replace(/[^0-9.-]/g, '') : value
        return sanitizedNum === '' ? 0 : Number(sanitizedNum)

      case 'boolean':
        return String(value).toLowerCase() === 'true' || value === 1 || value === true

      case 'email':
        return String(value).toLowerCase().trim()

      case 'password':
        return await hash.make(value)

      case 'date':
      case 'datetime':
        return value ? value : null

      case 'relation':
        return isNaN(Number(value)) ? value : Number(value)

      case 'repeater':
        if (!Array.isArray(value)) return []
        return await Promise.all(
          value.map(async (row) => {
            const cleanedRow: any = {}

            if (field.sub_fields) {
              for (const sf of field.sub_fields) {
                cleanedRow[sf.name] = await this.castValue(row[sf.name], sf)
              }
            }
            return cleanedRow
          })
        )

      default:
        return typeof value === 'string' ? value.trim() : value
    }
  }
  static async sterilizePayload(body: Record<string, any>, fields: FieldConfig[]) {
    const sanitized: Record<string, any> = {}

    for (const field of fields) {
      sanitized[field.name] = await this.castValue(body[field.name], field)
    }

    return sanitized
  }
  static sendNotifications(
    userId: number,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) {
    transmit.broadcast(`user/${userId}`, { message, type })
  }
}
