import type { HttpContext } from '@adonisjs/core/http'

export default class BackendsController {
  async login({ request, auth, response }: HttpContext) {
    // const { email, password } = request.only(['email', 'password'])
    try {
      // await auth.attempt(email, password)
      return response.redirect('/')
    } catch {
      return response.redirect().back()
    }
  }

  async logout({ auth, response }: HttpContext) {
    // await auth.logout()
    return response.redirect('/login')
  }
}