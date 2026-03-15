import MongoService from '#services/mongo_service'
import hash from '@adonisjs/core/services/hash'
import transmit from '@adonisjs/transmit/services/main'
import { ObjectId } from 'mongodb'

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
            dashboardId: null,
            collectionName: 'dashboard_settings',
            endpoint: '/api/collections/dashboard_settings',
            fields: [
              {
                name: 'name',
                label: 'Name',
                type: 'text',
                required: true,
                readonly: false,
                width: '50',
                show_up: true,
              },
              {
                name: 'widgets',
                label: 'Widgets',
                type: 'any',
                required: true,
                width: '50',
                show_up: true,
              },
            ],
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
                readonly: false,
                width: '50',
                show_up: true,
              },
              {
                name: 'password',
                label: 'Password',
                type: 'password',
                required: true,
                width: '50',
                show_up: true,
              },
              {
                name: 'email',
                label: 'Email',
                type: 'email',
                required: true,
                width: '50',
                show_up: true,
              },
              {
                name: 'status',
                label: 'Status Akun',
                type: 'select',
                required: true,
                width: '50',
                show_up: true,
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
                name: 'role',
                label: 'Role',
                type: 'select',
                required: true,
                width: '50',
                show_up: true,
                options: [
                  {
                    label: 'Admin',
                    value: 'admin',
                  },
                  {
                    label: 'User',
                    value: 'user',
                  },
                  {
                    label: 'Moderator',
                    value: 'moderator',
                  },
                  {
                    label: 'Operator',
                    value: 'operator',
                  },
                ],
              },
              {
                name: 'last_login',
                label: 'Terakhir Login',
                type: 'datetime',
                readonly: true,
                width: '50',
                show_up: true,
              },
              {
                name: 'mfa_enabled',
                label: 'MFA',
                type: 'boolean',
                required: false,
                readonly: false,
                width: '50',
                show_up: false,
              },
              {
                name: 'mfa_type',
                label: 'MFA Type',
                type: 'select',
                show_up: false,
                width: '50',
                options: [
                  {
                    label: 'Google Authenticator',
                    value: 'totp',
                  },
                  {
                    label: 'Email OTP Verification',
                    value: 'email',
                  },
                ],
              },
              {
                name: 'totp_secret_key',
                label: 'TOTP code',
                type: 'text',
                required: false,
                readonly: true,
                width: '100',
                show_up: false,
              },
            ],
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
  static async getProfiles(uid) {
    const collections = MongoService.collection('users')
    const user = await collections?.findOne({
      $or: [{ _id: new ObjectId(uid) }, { id: uid }],
    })
    return user
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
      if (field.type === 'object_group') return []
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

      case 'any':
        if (typeof value === 'string') {
          try {
            return JSON.parse(value) // Parse jika dikirim sebagai string dari editor
          } catch (e) {
            return value // Return string asli jika bukan valid JSON
          }
        }
        return value

      case 'date':
      case 'datetime':
        return value ? value : null

      case 'relation':
        return isNaN(Number(value)) ? value : Number(value)

      case 'object_group':
        const cleanedObj: any = {}
        const sourceObj = typeof value === 'object' && !Array.isArray(value) ? value : {}

        if (field.sub_fields) {
          for (const sf of field.sub_fields) {
            cleanedObj[sf.name] = await this.castValue(sourceObj[sf.name], sf)
          }
        }
        return cleanedObj

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
