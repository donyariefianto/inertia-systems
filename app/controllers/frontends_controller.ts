import type { HttpContext } from '@adonisjs/core/http'

export default class FrontendsController {
  async showLogin({ inertia }: HttpContext) {
    return inertia.render('login')
  }
}