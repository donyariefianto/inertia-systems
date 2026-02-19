import type { HttpContext } from '@adonisjs/core/http'
import { EncryptionService } from '#services/encryption_service'
import MongoService from '#services/mongo_service'

export default class FrontendsController {
  async login({ inertia, session, response }: HttpContext) {
    if (session.get('user_id')) {
      return response.redirect().toPath('/systems')
    }
    return inertia.render('login')
  }
  async home({ inertia }: HttpContext) {
    try {
      const collections = MongoService.collection('systems')
      let data = await collections.findOne({ id: 'fixed_menu' })
      let result = {},
        FIXED_DASHBOARD = {
          id: 'fixed_dashboard',
          name: 'Dashboard',
          icon: 'fas fa-home',
          sub_sidemenu: [
            {
              id: '1.1',
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
        },
        FIXED_SETTINGS = {
          id: 'fixed_settings',
          name: 'Settings',
          icon: 'fas fa-cogs',
          permissions: ['admin'],
          sub_sidemenu: [
            {
              id: '8.1',
              name: 'User Management',
              icon: 'fas fa-users-cog',
              type: 'tableview',
              path: 'settings/users',
              config: {
                endpoint: '/api/collections/users',
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
                    options: ['admin', 'warehouse', 'finance', 'user'],
                    required: true,
                  },
                  {
                    name: 'status',
                    label: 'Status Akun',
                    type: 'select',
                    options: ['Active', 'Inactive', 'Suspended'],
                    default: 'Active',
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
              id: '8.2',
              name: 'App Config',
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
                    default: 'TB Sahabat System',
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
      if (data) {
        result = {
          name: 'menu',
          sidemenu: [FIXED_DASHBOARD, ...data.sidemenu, FIXED_SETTINGS],
        }
      } else {
        result = {
          name: 'menu',
          sidemenu: [FIXED_DASHBOARD, FIXED_SETTINGS],
        }
      }
      const encryptedSidebar = EncryptionService.encrypt(JSON.stringify(result))

      // 3. RENDER DENGAN INERTIA
      // Pastikan key 'sidebar' dikirim secara eksplisit
      return inertia.render('homes', {
        user: {},
        sidebar: encryptedSidebar, // Berisi { nonce, ciphertext }
        stats: {
          total_users: 150,
          active_sessions: 12,
        },
      })
    } catch (error) {
      console.error('CRITICAL: Gagal menyiapkan data home controller:', error)

      // Fallback: Kirim tanpa sidebar jika enkripsi gagal agar tidak loop/crash
      return inertia.render('homes', {
        user: {},
        sidebar: null,
      })
    }
  }
}
