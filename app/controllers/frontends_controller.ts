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
      return inertia.render('homes')
    } catch (error) {
      console.error('🔥 [HomeController Error]:', error)
      return inertia.render('errors/server_error')
    }
  }
}
