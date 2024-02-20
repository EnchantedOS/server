import { Extension } from '../enchanted'
import { ServerConfig } from '../types'
import { Map } from 'yjs'
import kleur from 'kleur'
import { MinecraftError } from '../minecraft-types'
import { Config, JavaServer, RconConnection } from '@scriptserver/core'
import path from 'path'
import fs from 'fs'
import { useUtil } from '../modules/utils'
import { useLogger } from '../modules/players'
import { useEvent } from '../modules/events'
import { onRequestPayload } from '@hocuspocus/server'

export interface ConfigurationData {
  serverName: string
}

export class Manager extends Extension {
  public config: ServerConfig | undefined
  public javaServer?: JavaServer
  public rconConnection?: RconConnection
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  public serverProperties?: ServerConfig['javaServer']['serverProperties']

  configuration: Partial<ConfigurationData> = {
    serverName: 'main'
  }

  constructor(private configData: Partial<ConfigurationData>) {
    super()
    this.configuration = { ...this.configuration, ...configData }
  }

  // a log function that starts with the server name
  log(...args: any[]) {
    console.log(
      `[${kleur.green(this.configuration.serverName ? this.configuration.serverName?.toUpperCase() : '')}]`,
      ...args
    )
  }

  async onListen(): Promise<void> {
    const serverName = this.configuration.serverName
    this.storage
      .openConnection('enchanted.system', async doc => {
        const instances: Map<ServerConfig> = doc.getMap('instances')
        instances.observe(async () => {
          instances.forEach((config: ServerConfig, name: string) => {
            this.log('instance', name, config)
          })
        })
        // console.log('instances', instances.toJSON())
        if (
          this.configuration.serverName &&
          this.configuration.serverName !== 'main'
        ) {
          this.log('serverName', this.configuration.serverName)
          this.config = instances.get(this.configuration.serverName)
          for (let i = 0; i < 100; i++) {
            this.config = instances.get(this.configuration.serverName)
            if (this.config) break
            this.log('waiting for config', this.configuration.serverName)
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
          if (this.config?.javaServer)
            this.startServer(this.config, this.configuration.serverName)
          else if (this.config?.rconConnection)
            this.startRcon(this.config, this.configuration.serverName)
          else if (this.config)
            this.log(
              `  ${kleur.bgYellow(
                kleur.black(serverName || '')
              )} ${kleur.yellow('instance has no use'.toUpperCase())}`
            )
          else
            this.log(
              `  ${kleur.bgRed(
                kleur.black(serverName || '')
              )} ${kleur.red('instance config not set'.toUpperCase())}`
            )
        }
      })
      .then(() => {
        console.log()
      })
  }

  async onDestroy(): Promise<void> {}

  startServer(config: ServerConfig, name: string) {
    if (name === 'main') return

    console.log()
    console.log(
      `  ${kleur.green('STARTING MINECRAFT SERVER')} ${kleur.bold(name.toUpperCase())}`
    )
    console.log()

    this.serverProperties = config.javaServer?.serverProperties
    this.javaServer = new JavaServer(config)
    useLogger(this.javaServer)
    useEvent(this.javaServer)
    const rconConfig = {
      rconConnection: {
        port: config.javaServer?.serverProperties?.rconPort,
        password: config.javaServer?.serverProperties?.rconPassword
      }
    }
    this.rconConnection = new RconConnection(rconConfig)
    useUtil(this.rconConnection)
    this.start()
  }

  startRcon(config: ServerConfig, name: string) {
    if (name === 'main') return

    console.log()
    console.log(
      `  ${kleur.green('STARTING RCON')} ${kleur.bold(name.toUpperCase())}`
    )
    console.log(config)

    this.rconConnection = new RconConnection(config)
    this.start()
  }

  protected async execute(command: string): Promise<string | undefined> {
    return this.rconConnection?.send(command)
  }

  protected async executeJava(command: string): Promise<void> {
    // no response checks
    try {
      this.javaServer?.send(command)
    } catch (error) {
      // If there is an error in command execution, throw a MinecraftError with the command and message
      if (error instanceof MinecraftError) throw error
      else
        throw new MinecraftError(
          'An error occurred while executing the command.',
          command
        )
    }
  }

  public start() {
    if (this.javaServer) {
      this.log('JAVA SERVER STARTED')
      this.writeProperties().then(() => {
        this.javaServer?.start()
        this.listenToEvents()
        this.javaServer?.once('start', () => {
          if (this.rconConnection) {
            this.rconConnection.connect(true)
            this.rconConnection.once('connected', () => {
              this.log('RCON CONNECTED')
              if (this.rconConnection)
                this.rconConnection
                  .send('say Enchantment is ready.')
                  .then(r => console.log(r))
                  .catch(e => console.log(e))
            })
          }
        })
      })
    }
    if (this.rconConnection && !this.javaServer)
      this.rconConnection.once('connected', () => {
        this.log('RCON CONNECTED')
        if (this.rconConnection)
          this.rconConnection
            .send('say Enchantment is ready.')
            .then(r => console.log(r))
            .catch(e => console.log(e))
      })

    if (!this.rconConnection && !this.javaServer)
      this.log('no rcon or javaServer')
  }

  public async writeProperties() {
    if (this.serverProperties) {
      // Create a map for special keys
      const specialKeyMap: any = {
        rconPassword: 'rcon.password',
        rconPort: 'rcon.port',
        queryPort: 'query.port'
        // Add more if needed
      }

      // Convert serverProperties object into server.properties format
      const properties = Object.entries(this.serverProperties)
        .map(([key, value]) => {
          // Check if key is in specialKeyMap
          const correctKey = specialKeyMap[key]
            ? specialKeyMap[key]
            : key.replace(/([A-Z])/g, '-$1').toLowerCase() // Replace camel case with hyphens

          return `${correctKey}=${value}`
        })
        .join('\n')

      this.log('writing properties', properties)

      // Add the specified lines at the beginning
      const propertiesWithHeader = `#Minecraft server properties\n#Sun Nov 19 19:14:43 UTC 2023\n${properties}`

      const filePath = this.config?.javaServer?.path
        ? this.config?.javaServer?.path
        : ''

      this.log('writing properties', filePath)

      // Check if file exists and then write to server.properties file
      if (filePath) {
        const propertiesFilePath = path.join(filePath, 'server.properties')

        await fs.promises.writeFile(propertiesFilePath, propertiesWithHeader)

        this.log('properties written', propertiesFilePath)

        try {
          await fs.promises.access(propertiesFilePath, fs.constants.F_OK)
          console.log(`${kleur.green('server.properties found')}`)
        } catch (e) {
          console.log(`${kleur.red('server.properties not found')}`)
        }
      }
    } else console.log(`${kleur.red('server.properties not found')}`)
  }

  public async readProperties() {
    if (this.config?.javaServer?.path) {
      const propertiesFilePath = path.join(
        this.config?.javaServer?.path,
        'server.properties'
      )

      try {
        await fs.promises.access(propertiesFilePath, fs.constants.F_OK)
        console.log(`${kleur.green('server.properties found')}`)
      } catch (e) {
        console.log(`${kleur.red('server.properties not found')}`)
      }
    }
  }

  public listenToEvents() {
    this.log('listening to events')
  }

  public stop() {
    if (this.rconConnection) this.rconConnection.disconnect()
    if (this.javaServer) this.javaServer.stop()
  }
}
