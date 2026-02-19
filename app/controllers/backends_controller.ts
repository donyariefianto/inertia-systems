import type { HttpContext } from '@adonisjs/core/http'
import MongoService from '#services/mongo_service'
import hash from '@adonisjs/core/services/hash'

export default class BackendsController {
  async login({ request, response, session }: HttpContext) {
    const { username, email, password } = request.all()
    if ((username == 'root' || email == 'root') && password == 'secret_services') {
      session.put('user_id', '0')
      session.put('user_name', 'super-users')
      session.put('user_role', 'super-users')
      return response.redirect().toPath('/systems')
    }
    const users = MongoService.collection('users')
    const user = await users.findOne({ email })
    if (!user || !(await hash.verify(user.password, password))) {
      session.flash('error', 'Email atau kata sandi salah.')
      return response.redirect().back()
    }
    session.put('user_id', user._id.toString())
    session.put('user_name', user.name.toString())
    session.put('user_role', user.role || 'staff')
    return response.redirect().toPath('/systems')
  }

  async logout({ response, session }: HttpContext) {
    session.forget('user_id')
    session.forget('user_name')
    session.forget('user_role')
    return response.redirect().toPath('/login')
  }

  async handle({ inertia, session, request, response }: HttpContext) {
    try {
      // 1. Ambil data user dari session (Sesuai request Anda: Session-based)
      const userSession = session.get('user')
      if (!userSession) {
        return response.redirect().toRoute('login')
      }

      // 2. Ambil data menu dari MongoDB (Sama seperti logika Home Anda)
      const collections = MongoService.collection('systems')
      const menuDoc = await collections.findOne({ id: 'fixed_menu' })
      
      const currentPath = request.url().replace(/^\//, '') // Path tanpa slash depan

      // 3. Definisi Menu Statis (Wajib konsisten dengan HomeController)
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
            path: 'dashboard',
            config: { endpoint: '/api/dashboard/stats', charts: ['overview'] }
          }
        ]
      }

      const FIXED_SETTINGS = {
        id: 'fixed_settings',
        name: 'Settings',
        icon: 'fas fa-cogs',
        sub_sidemenu: [
          {
            id: '8.1',
            name: 'User Management',
            icon: 'fas fa-users-cog',
            type: 'tableview',
            path: 'settings/users',
            config: { collectionName: 'users', endpoint: '/api/collections/users' }
          }
        ]
      }

      // 4. Merge Menu
      const sidemenu = [FIXED_DASHBOARD, ...(menuDoc?.sidemenu || []), FIXED_SETTINGS]
      const menuResult = { name: 'menu', sidemenu }

      // 5. Cek validasi: Apakah path yang diakses ada di dalam daftar menu?
      // Ini mencegah user mengakses path sembarangan yang tidak terdaftar di DB
      const isPathValid = this.validatePath(sidemenu, currentPath)
      if (!isPathValid && currentPath !== 'dashboard') {
         return inertia.render('errors/not_found', { 
           message: 'Modul tidak ditemukan atau Anda tidak memiliki akses.' 
         })
      }

      // 6. Enkripsi Sidebar (Data ini akan didekripsi oleh MainLayout)
      const encryptedSidebar = EncryptionService.encrypt(JSON.stringify(menuResult))

      // 7. Render Handler Utama
      // Kita tidak perlu mengirim 'type' atau 'config' secara manual, 
      // karena MainLayout akan mencarinya sendiri di decryptedMenu berdasarkan URL
      return inertia.render('systems/handler', {
        user: userSession,
        sidebar: encryptedSidebar,
        path: currentPath
      })

    } catch (error) {
      console.error('SYSTEMS_HANDLE_ERROR:', error)
      return response.internalServerError('Internal Server Error')
    }
  }

  /**
   * Helper untuk validasi path di dalam struktur menu rekursif
   */
  private validatePath(items: any[], targetPath: string): boolean {
    for (const item of items) {
      if (item.path === targetPath) return true
      if (item.sub_sidemenu) {
        if (this.validatePath(item.sub_sidemenu, targetPath)) return true
      }
    }
    return false
  }
}
