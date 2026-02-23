import type { HttpContext } from '@adonisjs/core/http'
import MongoService from '#services/mongo_service'

export default class WebsocketsController {
 private async getUsers(uid: string) {
  if (uid === '0') {
   return { id: '0', name: 'Super User', status: 'active', role: 'super-users' }
  }
  return MongoService.collection('users').findOne({ _id: uid })
 }
 public async onMessage({ request, params, ws, message }: HttpContext) {
  const uid = request.header('uid')
  const user = await this.getUsers(uid)
  if (user?.status !== 'active') return ws.close(1008, 'Unauthorized')
  const channels = params.channels
  try {
   ws.on('message', (message) => {
    ws.send('Received: ' + message.toString())
   })
   ws.on('close', () => {
    console.log('Connection closed')
   })
   ws.send(JSON.stringify({ id: ws.id, message: 'Connected to channels: ' + channels, user }))
  } catch (error) {
   ws.close(1008, 'Internal Server Error: ' + error.message)
  }
 }
}
