import { Enchanted, HocuspocusExtension } from './enchanted'
import Storage from './storage'
import { System } from './core/system'
import { Manager } from './core/manager'
import { Redix } from './core/redix'
import { Logger } from '@hocuspocus/extension-logger'
import { SQLite } from '@hocuspocus/extension-sqlite'
import { Endernet } from './enchantments/endernet'

// Helper function to fetch command line argument values by flag
const getArgValue = (flag: string, defaultValue: string) => {
  const index = process.argv.indexOf(flag)

  return index > -1 ? process.argv[index + 1] : defaultValue
}

// Fetch all command line argument values using the helper function
const [
  serverName,
  wsPort,
  wsAddress,
  redisHost,
  redisPort,
  dbPath,
  extensions,
  secret
] = [
  getArgValue('--name', 'main'),
  parseInt(getArgValue('--ws-port', '3044')),
  getArgValue('--ws-address', 'localhost'),
  getArgValue('--redis-host', 'localhost'),
  parseInt(getArgValue('--redis-port', '6379')),
  getArgValue('--db', 'db.sqlite'),
  getArgValue('--extensions', 'redis,system,sqlite'),
  getArgValue('--secret', 'not-so-secret')
]
// method to load extensions from extension list
const loadExtensions = (extensionList: string): HocuspocusExtension[] => {
  const extensionMappings: { [key: string]: HocuspocusExtension } = {
    redis: new Redix({ host: redisHost, port: redisPort }),
    logger: new Logger(),
    system: new System({
      serverName
    }),
    sqlite: new SQLite({ database: dbPath }),
    manager: new Manager({
      serverName
    }),
    endernet: new Endernet({ serverName })
  }

  // Fallback to logger extension if no valid extensions were provided
  // if (selectedExtensions.length === 0) selectedExtensions.push(new Logger())

  return extensionList.split(',').reduce((acc: HocuspocusExtension[], key) => {
    if (extensionMappings[key]) acc.push(extensionMappings[key])

    return acc
  }, [])
}

const server = async () =>
  new Enchanted(
    {
      name: serverName,
      port: wsPort,
      address: wsAddress,
      quiet: true,
      extensions: loadExtensions(extensions)
    },
    secret
  ).listen()

server().then(async serverInstance => {
  console.log('starting')
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  serverInstance.showBootScreen()
  const storage = Storage.getInstance()
  storage.setServer(serverInstance as Enchanted)
})
