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

router
  .group(() => {
    router.get('/security/setup', '#controllers/backends_controller.setupAuth')
    router.post('/security/confirm', '#controllers/backends_controller.confirmAuth')
    router.patch('/menu', '#controllers/backends_controller.patchMenu')

    router.get(
      'collections-aggregation/:col',
      '#controllers/backends_controller.aggreateCollectionData'
    )
    router.post(
      'collections-aggregation/:col',
      '#controllers/backends_controller.aggregateCollectionData'
    )
    router.get('collections/:col', '#controllers/backends_controller.getCollectionData')
    router.get('collections/:col/:id', '#controllers/backends_controller.getCollectionDataDetail')
    router.post('collections/:col/', '#controllers/backends_controller.createCollectionData')
    // .use(middleware.speDispatcher())
    router.put('collections/:col/:id', '#controllers/backends_controller.updateCollectionData')
    // .use(middleware.speDispatcher())
    router.delete('collections/:col/:id', '#controllers/backends_controller.deleteCollectionData')
    // .use(middleware.speDispatcher())
    router.delete('collections/:col', '#controllers/backends_controller.deleteCollection')
  })
  .prefix('api')
  .use(middleware.auth())

router.post('/language', ({ session, response, request }) => {
  const { locale } = request.only(['locale'])
  session.put('locale', locale)
  return response.redirect().back()
})

router.ws('/ws/:channels', '#controllers/websockets_controller.onMessage')
router.get('/test-toast', async ({ session, response }) => {
  session.flash('success', 'Data berhasil disimpan ke database!')
  session.flash('error', 'Gagal memproses permintaan, silakan coba lagi.')
  session.flash('warning', 'Sesi Anda akan segera berakhir.')
  session.flash('info', 'Sistem akan melakukan maintenance malam ini.')

  return response.ok({ status: true })
})
