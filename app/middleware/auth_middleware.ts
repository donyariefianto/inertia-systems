import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { UtilService } from '#services/util_service'

export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const userId = ctx.session.get('user_id')
    const user = await UtilService.getProfiles(userId)
    if (!user) {
      ctx.session.forget('user_id')
      ctx.session.forget('user_name')
      ctx.session.forget('user_role')
      if (ctx.request.header('x-inertia')) {
        return ctx.response.redirect().toPath('/login')
      }
      return ctx.response.redirect('/login')
    }
    const output = await next()
    return output
  }
}
