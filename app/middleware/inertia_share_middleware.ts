import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { EncryptionService } from '#services/encryption_service'
import MongoService from '#services/mongo_service'
import { UtilService } from '#services/util_service'

export default class InertiaShareMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const userSession = ctx.session.get('user_id')
    const locale = ctx.session.get('locale', 'en')
    let encryptedSidebar = null,
      users = null

    if (userSession) {
      try {
        const sidemenu = await UtilService.sideMenu()
        encryptedSidebar = EncryptionService.encrypt(JSON.stringify({ name: 'menu', sidemenu }))
      } catch (error) {
        console.error('❌ Middleware Sidebar Error:', error)
      }
      if (userSession === '0') {
        users = {
          id: '0',
          email: 'donyariefianto98@gmail.com',
          roles: 'SU',
          mfa_type: 'email',
          mfa_enabled: true,
        }
      } else {
        const collections = MongoService.collection('users')
        users = await collections.findOne({ $or: [{ id: userSession }, { _id: userSession }] })
        if (!users) {
          return ctx.response.redirect('/login')
        }
      }
    }

    ctx.inertia.share({
      user: users,
      sidebar: encryptedSidebar,
      flash: ctx.session.flashMessages.all(),
      mfaMethods: [
        {
          type: 'email',
          label: 'Email Verification',
          icon: 'fas fa-envelope-open-text',
          desc: 'Kode OTP dikirim ke email terdaftar.',
          setupRequired: false,
        },
        {
          type: 'totp',
          label: 'Authenticator App',
          icon: 'fas fa-mobile-android',
          desc: 'Gunakan Google Authenticator atau Authy.',
          setupRequired: true,
        },
      ],
    })

    return next()
  }
}
