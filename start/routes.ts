/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

router.on('/').renderInertia('landing')
router.get('/login', '#controllers/frontends_controller.login')
router.post('/login', '#controllers/backends_controller.login')
router.delete('/logout', '#controllers/backends_controller.logout')

router
  .group(() => {
    router.get('/', '#controllers/frontends_controller.home')
    router.get('/*', '#controllers/backends_controller.navigation_handler')
  })
  .use(middleware.auth())
  .use(middleware.inertiaShare())
  .prefix('systems')

router.post('/language', ({ session, response, request }) => {
  const { locale } = request.only(['locale'])
  session.put('locale', locale)
  return response.redirect().back()
})
