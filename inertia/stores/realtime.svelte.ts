import { Transmit } from '@adonisjs/transmit-client'
import { toast } from '~/utils/toast.svelte'

let transmit: Transmit | null = null

export const realtime = {
  init(userId: number) {
    if (transmit) return
    transmit = new Transmit({
      baseUrl: window.location.origin,
    })
    const subscription = transmit.subscription(`user/${userId}`)
    subscription.onMessage((data: any) => {
      if (data.message) {
        toast.add(data.message, data.type || 'info')
      }
    })
    subscription.create()
  },

  stop() {
    if (transmit) {
      transmit = null
    }
  },
}
