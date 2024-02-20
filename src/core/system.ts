import { Extension } from '../enchanted'
import { ServerConfig } from '../types'
import { YMap } from 'yjs/dist/src/types/YMap'
import { spawn, ChildProcess } from 'child_process'
import {
  onAuthenticatePayload,
  onConnectPayload,
  onRequestPayload,
  onStatelessPayload
} from '@hocuspocus/server'
import kleur from 'kleur'

export interface ConfigurationData {
  serverName: string
}

export class System extends Extension {
  configuration: Partial<ConfigurationData> = {
    serverName: 'main'
  }

  // Map to store the running instances
  runningInstances: Map<string, ChildProcess> = new Map()

  // instanceConfigs: Map<string, ServerConfig> = new Map()

  constructor(private configData: Partial<ConfigurationData>) {
    super()
    this.configuration = { ...this.configuration, ...configData }
  }

  // a log function that starts with the server name
  log(...args: any[]) {
    console.log(
      kleur.blue(`[${this.configuration.serverName}/System]`),
      ...args
    )
  }

  async connected(): Promise<void> {
    // this.log('Connected clients: ', this.server?.getConnectionsCount())
  }

  async onStateless(payload: onStatelessPayload): Promise<any> {
    this.log('onStateless', payload.payload)

    const payloads = JSON.parse(payload.payload)

    if (payloads.payload && payloads.payload.ticket) {
      const token = await this.getToken(payloads.payload.ticket)
      this.log(token)
      if (token)
        payload.connection.sendStateless(
          JSON.stringify({
            type: 'credentials',
            payload: {
              token
            }
          })
        )
    }
  }

  async onListen(): Promise<void> {
    this.storage
      .openConnection('enchanted.system', doc => {
        const instances: YMap<ServerConfig> = doc.getMap('instances')

        if (this.configuration.serverName === 'main') {
          instances.forEach((config, name) => {
            this.log('starting instance', name, config)
            this.startInstance(config, name)
          })

          // instances.clear()
          //
          // const mainConfig = {
          //   name: this.configuration.serverName,
          //   port: 3044,
          //   apps: [
          //     {
          //       single: true,
          //       title: 'Login',
          //       app: 'userApp',
          //       icon: 'https://minotar.net/avatar/steve/64'
          //     },
          //     {
          //       title: 'Endernet',
          //       auth: true,
          //       app: 'endernetApp',
          //       icon: '/items/ender_eye.png'
          //     },
          //     {
          //       single: true,
          //       op: true,
          //       title: 'Server',
          //       app: 'serverApp',
          //       icon: '/items/repeater.png'
          //     }
          //   ]
          // }
          //
          // instances.set('main', mainConfig)
          //
          // this.instanceConfigs.set('main', mainConfig)
          //
          // const config: ServerConfig = {
          //   name: 'survival',
          //   title: 'Vanilla World',
          //   port: 3045,
          //   javaServer: {
          //     path: '/Users/janis/Developer/Games/mc',
          //     jar: 'server.jar',
          //     args: [],
          //     pipeStdin: false,
          //     pipeStdout: true,
          //     serverProperties: {
          //       enableCommandBlock: true,
          //       motd: 'An Enchanted Server',
          //       difficulty: 'easy',
          //       maxPlayers: 20,
          //       viewDistance: 10,
          //       broadcastRconToOps: true,
          //       enableRcon: true,
          //       rconPort: 25575,
          //       rconPassword: 'a-super-secure-password',
          //       resourcePack: '',
          //       requireResourcePack: false,
          //       serverIp: '',
          //       serverPort: 25565,
          //       whiteList: false,
          //       broadcastConsoleToOps: true,
          //       simulationDistance: 10,
          //       resourcePackPrompt: '',
          //       enableQuery: false,
          //       queryPort: 25565,
          //       initialEnabledPacks: '',
          //       resourcePackSha1: '',
          //       spawnProtection: 16,
          //       enforceWhitelist: false,
          //       enableJmxMonitoring: false,
          //       levelSeed: '',
          //       gamemode: 'survival',
          //       generatorSettings: '',
          //       enforceSecureProfile: false,
          //       levelName: 'world',
          //       pvp: true,
          //       generateStructures: true,
          //       maxChainedNeighborUpdates: 5,
          //       networkCompressionThreshold: 256,
          //       maxTickTime: 60000,
          //       useNativeTransport: true,
          //       onlineMode: true,
          //       enableStatus: true,
          //       allowFlight: false,
          //       initialDisabledPacks: '',
          //       allowNether: true,
          //       syncChunkWrites: true,
          //       opPermissionLevel: 4,
          //       preventProxyConnections: false,
          //       hideOnlinePlayers: false
          //     }
          //   },
          //   rconConnection: {
          //     port: 25575,
          //     password: 'a-super-secure-password'
          //   }
          // }
          // instances.set('survival', config)

          instances.observe(() => {
            // console.log('instances changed')
            instances.forEach((config, name) => {
              if (config) {
                // Check if the instance is already running
                if (!this.runningInstances.has(name)) {
                  this.log('starting instance', name, config)
                  this.startInstance(config, name)
                }
              } else this.stopInstance(name)
            })
          })
        }
      })
      .then(() => {})
  }

  async onDestroy(): Promise<void> {
    this.runningInstances.forEach(instance => {
      instance.kill()
    })
  }

  // async onConnect({
  //   documentName,
  //   connection,
  //   socketId
  // }: onConnectPayload): Promise<void> {
  //   const entityIDs = ['tokens', 'permissions', 'settings']
  //   const entityTypes = ['user', 'enchanted']
  //   const [entityType, entityID] = documentName.split('.')
  //
  //   if (entityIDs.includes(entityID) && !entityTypes.includes(entityType))
  //     throw new Error(
  //       `AUTH: Suspicious document request denied ${documentName} from ${socketId}`
  //     )
  //
  //   if (entityType === 'enchanted' && entityID === 'login') {
  //     connection.requiresAuthentication = false
  //     connection.isAuthenticated = false
  //     connection.readOnly = true
  //   }
  // }

  startInstance(config: ServerConfig, name: string) {
    // console.log('starting instance', name)
    if (name === 'main') return

    // console.log(`Starting runner: ${name}`)
    const instance = spawn(
      'ts-node',
      [
        '/Users/janis/Developer/Docker/reality-compose/enchanted/src/server.ts',
        '--name',
        name,
        '--extensions',
        config.enchantments
          ? 'redis,system,sqlite,endernet,' + config.enchantments.join(',')
          : 'redis,system,sqlite,endernet',
        '--ws-port',
        config.port + '',
        '--secret',
        this.secret
      ],
      { stdio: 'pipe' }
    )

    // this.storage
    //   .openConnection(`enchanted.${name}`, doc => {
    //     const logs = doc.getArray('logs')
    //     instance?.stdout?.on('data', data => {
    //       if (data) {
    //         logs.push([Date.now(), JSON.stringify(data.toString())])
    //         this.log(data.toString())
    //       }
    //     })
    //   })
    //   .then(() => {
    //     // console.log('connected', r)
    //   })

    instance?.stdout?.on('data', async data => {
      if (data && data.toString()) {
        // strip data from newline chars
        const strippedData = data.toString().replace(/(\r\n|\n|\r)/gm, '')
        if (strippedData) this.log(strippedData)
      }
    })

    // Store the running instance in the map
    this.runningInstances.set(name, instance)
    // this.instanceConfigs.set(name, config)
  }

  // async onStateless(payload: onStatelessPayload): Promise<any> {
  //   console.log('onStateless', payload)
  // }

  stopInstance(name: string) {
    console.log(`Stopping runner: ${name}`)
    const instance = this.runningInstances.get(name)
    if (instance) instance.kill()
    this.runningInstances.delete(name)
  }
}
