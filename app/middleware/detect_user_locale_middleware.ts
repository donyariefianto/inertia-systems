import { I18n } from '@adonisjs/i18n'
import i18nManager from '@adonisjs/i18n/services/main'
import type { NextFn } from '@adonisjs/core/types/http'
import { type HttpContext, RequestValidator } from '@adonisjs/core/http'

export default class DetectUserLocaleMiddleware {
  static {
    RequestValidator.messagesProvider = (ctx) => {
      return ctx.i18n.createMessagesProvider()
    }
  }

  protected getRequestLocale(ctx: HttpContext) {
    const sessionLocale = ctx.session.get('locale')
    if (sessionLocale) return sessionLocale
    const userLanguages = ctx.request.languages()
    return i18nManager.getSupportedLocaleFor(userLanguages)
  }

  async handle(ctx: HttpContext, next: NextFn) {
    const detectedLanguage = this.getRequestLocale(ctx)
    const locale = detectedLanguage || i18nManager.defaultLocale
    const allTranslations = i18nManager.getTranslations()
    const currentDict = allTranslations[locale] || {}
    if ('inertia' in ctx) {
      ctx.inertia.share({
        locale: locale,
        translations: currentDict,
      })
    }

    ctx.i18n = i18nManager.locale(locale)
    ctx.containerResolver.bindValue(I18n, ctx.i18n)
    return await next()
  }
}

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    i18n: I18n
  }
}
