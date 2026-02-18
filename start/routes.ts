/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
// router.on('/').renderInertia('home')

router.get('/', '#controllers/home_controller.index')
router.get('/login', '#controllers/frontends_controller.showLogin')
router.post('/login', '#controllers/backends_controller.login')
router.delete('/logout', '#controllers/backends_controller.logout')
