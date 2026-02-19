import type { HttpContext } from '@adonisjs/core/http'

export default class FrontendsController {
  async login({ inertia, session }: HttpContext) {
    if (session.get('user_id')) {
      return inertia.location('/')
    }
    return inertia.render('login')
  }
  async home({ inertia }: HttpContext) {
    return inertia.render('homes')
  }
}
