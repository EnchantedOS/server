import RedisClient, { RedisOptions } from 'ioredis'
import {
  Redis,
  Configuration,
  RedisInstance
} from '@hocuspocus/extension-redis'

export class Redix extends Redis {
  serverPub: RedisInstance
  serverSub: RedisInstance

  public constructor(configuration: Partial<Configuration>) {
    super(configuration)

    const { port, host, options, redis, createClient } = this.configuration
    this.serverPub =
      typeof createClient === 'function'
        ? createClient()
        : redis
          ? redis.duplicate()
          : new RedisClient(port, host, options as RedisOptions)
    this.serverSub =
      typeof createClient === 'function'
        ? createClient()
        : redis
          ? redis.duplicate()
          : new RedisClient(port, host, options as RedisOptions)

    this.serverSub.subscribe('server-control')
    this.serverSub.on('messageBuffer', this.handleServerMessage)
  }

  public publishServerControlMessage(action: string, documentName?: string) {
    const controlMessage = {
      action,
      documentName
    }

    const messageBuffer = Buffer.from(JSON.stringify(controlMessage))

    return this.serverPub.publishBuffer('server-control', messageBuffer)
  }

  private handleServerMessage = async (channel: Buffer, data: Buffer) => {
    const controlMessage = JSON.parse(data.toString())

    if (
      controlMessage.action === 'closeAllConnections' &&
      controlMessage.documentName
    ) {
      // Logic to disconnect clients from a specific document
    }
  }

  async onDestroy() {
    await super.onDestroy()
    this.serverPub.disconnect(false)
    this.serverSub.disconnect(false)
  }
}
