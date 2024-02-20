import {
  afterLoadDocumentPayload,
  afterStoreDocumentPayload,
  afterUnloadDocumentPayload,
  beforeBroadcastStatelessPayload,
  beforeHandleMessagePayload,
  Configuration,
  connectedPayload,
  Extension as HocuspocusExtension,
  Hocuspocus,
  onAuthenticatePayload,
  onAwarenessUpdatePayload,
  onChangePayload,
  onConfigurePayload,
  onConnectPayload,
  onDestroyPayload,
  onDisconnectPayload,
  onListenPayload,
  onLoadDocumentPayload,
  onRequestPayload,
  onStatelessPayload,
  onStoreDocumentPayload,
  onUpgradePayload
} from '@hocuspocus/server'

import {
  HocuspocusProvider,
  HocuspocusProviderConfiguration,
  HocuspocusProviderWebsocket
} from '@hocuspocus/provider'

import Storage from './storage'
import kleur from 'kleur'
import meta from '../package.json'
import jwt from 'jsonwebtoken'

class EnchantedProvider extends HocuspocusProvider {
  constructor(config: HocuspocusProviderConfiguration) {
    // Ensure to call the super constructor if Hocuspocus expects arguments
    super(config)
    console.log('EnchantedProvider constructor')
    // Your custom provider initialization code here
  }

  // Override or add new methods as necessary for your provider
}

// Extends the Hocuspocus class
class Enchanted extends Hocuspocus {
  private readonly secret: string = 'not-so-secret'
  private readonly provider: EnchantedProvider | undefined
  private storage: Storage = Storage.getInstance()

  constructor(configuration?: Partial<Configuration>, secret?: string) {
    super(configuration)
    if (secret) this.secret = secret

    this.provider = this.configuration.name
      ? new EnchantedProvider({
          name: 'enchanted.' + this.configuration.name,
          token: this.secret,
          websocketProvider: new HocuspocusProviderWebsocket({
            url: 'ws://localhost:' + this.configuration.port,
            WebSocketPolyfill: require('ws')
          })
        })
      : undefined

    this.configuration.extensions.forEach((extension: any) => {
      if (
        typeof extension.initialize === 'function' &&
        extension.initialize &&
        this.configuration.name
      )
        extension.initialize(this, this.provider, this.secret)
    })
  }

  public showBootScreen() {
    const name = this.configuration.name
      ? ` (${this.configuration.name.toUpperCase()})`
      : ''

    console.log(
      `  ${kleur.magenta(`ENCHANTED V${meta.version.toUpperCase()}${name}`)}${kleur.green(' RUNNING AT:')}`
    )
    console.log(`  > HTTP: ${kleur.cyan(`${this.httpURL.toUpperCase()}`)}`)
    console.log(`  > WEBSOCKET: ${this.webSocketURL.toUpperCase()}`)

    const extensions = this.configuration?.extensions
      .map(extension => {
        return (
          extension.extensionName?.toUpperCase() ??
          extension.constructor?.name?.toUpperCase()
        )
      })
      .filter(name => name)
      .filter(name => name !== 'OBJECT')

    if (!extensions.length) return

    const extensionsList = extensions.join(', ')
    console.log(`  EXTENSIONS: ${extensionsList}`)
  }
}

// Extends the Extension class of Hocuspocus
interface IExtension extends HocuspocusExtension {
  // Override or add new methods as necessary for your extension
  initialize(
    server: Enchanted,
    provider: EnchantedProvider,
    secret: string
  ): void
}

class Extension implements IExtension {
  protected server: Enchanted | undefined
  protected provider: EnchantedProvider | undefined
  protected storage: Storage
  protected secret: string = 'not-so-secret'

  constructor() {
    this.storage = Storage.getInstance()
  }

  async createToken(payload: jwt.JwtPayload): Promise<boolean> {
    const token = jwt.sign(payload, this.secret, {
      expiresIn: 3600
    })

    await this.storage.connect('enchanted.authentication', doc => {
      doc.getMap('ticket_tokens').set(payload.ticket, token)
      doc.getMap('ticket_uuids').set(payload.ticket, payload.uuid)
      doc.getMap('username_uuids').set(payload.username, payload.uuid)
      doc.getMap('uuid_usernames').set(payload.uuid, payload.username)
      doc.getMap('uuid_tickets').set(payload.uuid, payload.ticket)
      doc.getMap('token_uuids').set(token, payload.uuid)
    })

    return true
  }

  async getToken(ticket: string): Promise<string | undefined> {
    let token_
    await this.storage.connect('enchanted.authentication', doc => {
      const uuid = doc.getMap('ticket_uuids').get(ticket)
      const ticket_ = doc.getMap('uuid_tickets').get(uuid as string)
      const token = doc.getMap('ticket_tokens').get(ticket_ as string)

      if (ticket === ticket_) token_ = token
    })

    return token_
  }

  async getTicket(player: string) {
    let ticket
    await this.storage.connect('enchanted.authentication', doc => {
      const uuid = doc.getMap('username_uuids').get(player)
      ticket = doc.getMap('uuid_tickets').get(uuid as string)
    })

    return ticket
  }

  async getUuid(player: string) {
    let uuid
    await this.storage.connect('enchanted.authentication', doc => {
      uuid = doc.getMap('username_uuids').get(player)
    })

    return uuid
  }

  async getUsername(uuid: string) {
    let username
    await this.storage.connect('enchanted.authentication', doc => {
      username = doc.getMap('uuid_usernames').get(uuid)
    })

    return username
  }

  initialize(
    server: Enchanted,
    provider: EnchantedProvider,
    secret: string
  ): void {
    this.server = server
    this.provider = provider
    this.secret = secret
  }
}

// Exports the Singleton instance
const ServerSingleton = new Enchanted()

export {
  Enchanted,
  ServerSingleton as Server,
  HocuspocusExtension,
  EnchantedProvider,
  Extension,
  Storage,
  IExtension,
  afterLoadDocumentPayload,
  afterStoreDocumentPayload,
  afterUnloadDocumentPayload,
  beforeBroadcastStatelessPayload,
  beforeHandleMessagePayload,
  connectedPayload,
  onAuthenticatePayload,
  onAwarenessUpdatePayload,
  onChangePayload,
  onConfigurePayload,
  onConnectPayload,
  onDestroyPayload,
  onDisconnectPayload,
  onListenPayload,
  onLoadDocumentPayload,
  onRequestPayload,
  onStatelessPayload,
  onStoreDocumentPayload,
  onUpgradePayload
}
