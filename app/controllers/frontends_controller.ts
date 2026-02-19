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
  async home({ inertia, session }: HttpContext) {
    try {
      // 🛡️ Murni hanya mengambil data konten Dashboard
      // Data sidebar sudah otomatis dikirim oleh Middleware global

      const stats = {
        total_users: 150,
        active_sessions: 12,
        revenue: 45231.89,
        server_load: 34,
      }

      return inertia.render('homes', {
        stats,
        // Kita tidak perlu mengirim 'sidebar' di sini lagi
      })
    } catch (error) {
      console.error('🔥 [HomeController Error]:', error)
      return inertia.render('errors/server_error')
    }
  }
}
