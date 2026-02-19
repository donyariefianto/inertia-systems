import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const userId = ctx.session.get('user_id')
    if (!userId) {
      if (ctx.request.header('x-inertia')) {
        return ctx.response.redirect().toPath('/login')
      }
      return ctx.response.redirect('/login')
    }
    const output = await next()
    return output
  }
}
