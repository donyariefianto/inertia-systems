import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { EncryptionService } from '#services/encryption_service'
import MongoService from '#services/mongo_service'

export default class InertiaShareMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const userSession = ctx.session.get('user_id')
    const locale = ctx.session.get('locale', 'en')
    let encryptedSidebar = null

    if (userSession) {
      try {
        // 1. Ambil Data Menu dari MongoDB
        const collections = MongoService.collection('systems')
        const data = await collections.findOne({ id: 'fixed_menu' })

        // 2. Definisi Menu Statis
        const FIXED_DASHBOARD = {
          id: 'fixed_dashboard',
          name: 'Dashboard',
          icon: 'fas fa-home',
          sub_sidemenu: [
            {
              id: '1.1',
              name: 'Dashboard',
              icon: 'fas fa-chart-line',
              type: 'chartview',
              path: 'systems/dashboard',
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

        // 3. Penggabungan (Merge)
        const sidemenu = data
          ? [FIXED_DASHBOARD, ...data.sidemenu, FIXED_SETTINGS]
          : [FIXED_DASHBOARD, FIXED_SETTINGS]

        // 4. Enkripsi Data
        encryptedSidebar = EncryptionService.encrypt(JSON.stringify({ name: 'menu', sidemenu }))
      } catch (error) {
        console.error('❌ Middleware Sidebar Error:', error)
      }
    }

    // 5. Bagikan secara Global
    ctx.inertia.share({
      user: userSession || null,
      sidebar: encryptedSidebar,
      flash: ctx.session.flashMessages.all(),
    })

    return next()
  }
}
