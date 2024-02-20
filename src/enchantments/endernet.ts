import { Api } from '../core/api'
import kleur from 'kleur'
import { onStatelessPayload } from '@hocuspocus/server'

export class Endernet extends Api {
  log(...args: any[]) {
    console.log(
      kleur.blue(`[${this.configuration.serverName}/Endernet]`),
      ...args
    )
  }

  async onStateless(payload: onStatelessPayload): Promise<any> {
    this.log('onStateless', payload)
  }

  public listenToEvents() {
    if (this.javaServer) {
      this.javaServer.on('uuid', async data => {
        const ticket = // random 5 digit ticket
          Math.floor(10000 + Math.random() * 90000).toString()
        await this.createToken({
          ticket,
          uuid: data.uuid,
          username: data.player
        })
        this.log('info', `Created ticket ${ticket} for ${data.uuid}`)
      })
      this.javaServer.on('login', async data => {
        this.log('info', `Login from ${data.player}`)
        await this.execute(
          `tellraw ${data.player} {"text":"Welcome to the server, ${data.player}!","color":"green"}`
        )
        const ticket = await this.getTicket(data.player)
        await this.execute(
          `tellraw ${data.player} {"text":"Your ticket is ${ticket}","color":"green"}`
        )
      })
      this.javaServer.on('chat', async data => {
        this.log('info', `Chat from ${data.player}: ${data.message}`)
        await this.storage.pushToArray('enchanted.chat', 'chat', data)
        await this.damageEntity(data.player, 1)
        await this.giveItemToPlayer(data.player, 'minecraft:diamond', 1)
        const seed = await this.getSeed()
        await this.showTitle(data.player, 'actionbar', seed.toString())
        await this.setTitleTimes(data.player, 20, 100, 20)
        this.log(await this.storage.readArrayLength('enchanted.chat', 'chat'))
      })
    }
  }
}
