/**
 * Represents a stateless message.
 *
 */
export type StatelessMessage = { type: string; payload: any }

export type AppConfig = {
  single?: boolean
  auth?: boolean
  op?: boolean
  icon: string
  title: string
  app: string
}
export interface ServerConfig {
  name?: string
  title?: string
  port?: number
  enchantments?: string[]
  apps?: AppConfig[]
  javaServer?: {
    path: string
    jar: string
    args?: string[]
    pipeStdout?: boolean
    pipeStdin?: boolean
    flavorSpecific?: {
      [flavor: string]: {
        startedRegExp: RegExp
        stoppedRegExp: RegExp
      }
    }
    serverProperties?: {
      enableCommandBlock?: boolean
      motd?: string
      difficulty?: string
      maxPlayers?: number
      viewDistance?: number
      broadcastRconToOps?: boolean
      enableRcon?: boolean
      rconPort?: number
      rconPassword?: string
      resourcePack?: string
      requireResourcePack?: boolean
      serverIp?: string
      serverPort?: number
      whiteList?: boolean
      broadcastConsoleToOps?: boolean
      simulationDistance?: number
      resourcePackPrompt?: string
      enableQuery?: boolean
      queryPort?: number
      initialEnabledPacks?: string
      resourcePackSha1?: string
      spawnProtection?: number
      enforceWhitelist?: boolean
      enableJmxMonitoring?: boolean
      levelSeed?: string
      gamemode?: string
      generatorSettings?: string
      enforceSecureProfile?: boolean
      levelName?: string
      pvp?: boolean
      generateStructures?: boolean
      maxChainedNeighborUpdates?: number
      networkCompressionThreshold?: number
      maxTickTime?: number
      useNativeTransport?: boolean
      onlineMode?: boolean
      enableStatus?: boolean
      allowFlight?: boolean
      initialDisabledPacks?: string
      allowNether?: boolean
      syncChunkWrites?: boolean
      opPermissionLevel?: number
      preventProxyConnections?: boolean
      hideOnlinePlayers?: boolean
      entityBroadcastRangePercentage?: number
      playerIdletimeout?: number
      forceGamemode?: boolean
      rateLimit?: number
      hardcore?: boolean
      spawnNpcs?: boolean
      spawnAnimals?: boolean
      logIps?: boolean
      functionPermissionLevel?: number
      levelType?: string
      textFilteringConfig?: string
      spawnMonsters?: boolean
      maxWorldSize?: number
    }
  }
  rconConnection?: {
    port: number
    password: string
  }
}

/**
 * Represents a Minecraft color.
 *
 */
export type MinecraftColor = {
  code: string
  hex: string
  rgb: { r: number; g: number; b: number }
}

/**
 * Represents a list of Minecraft color.
 */
export const Colors: MinecraftColor[] = [
  {
    code: 'black',
    hex: '#000000',
    rgb: { r: 0, g: 0, b: 0 }
  },
  {
    code: 'dark_blue',
    hex: '#0000AA',
    rgb: { r: 0, g: 0, b: 170 }
  },
  {
    code: 'dark_green',
    hex: '#00AA00',
    rgb: { r: 0, g: 170, b: 0 }
  },
  {
    code: 'dark_aqua',
    hex: '#00AAAA',
    rgb: { r: 0, g: 170, b: 170 }
  },
  {
    code: 'dark_red',
    hex: '#AA0000',
    rgb: { r: 170, g: 0, b: 0 }
  },
  {
    code: 'dark_purple',
    hex: '#AA00AA',
    rgb: { r: 170, g: 0, b: 170 }
  },
  {
    code: 'gold',
    hex: '#FFAA00',
    rgb: { r: 255, g: 170, b: 0 }
  },
  {
    code: 'gray',
    hex: '#AAAAAA',
    rgb: { r: 170, g: 170, b: 170 }
  },
  {
    code: 'dark_gray',
    hex: '#555555',
    rgb: { r: 85, g: 85, b: 85 }
  },
  {
    code: 'blue',
    hex: '#5555FF',
    rgb: { r: 85, g: 85, b: 255 }
  },
  {
    code: 'green',
    hex: '#55FF55',
    rgb: { r: 85, g: 255, b: 85 }
  },
  {
    code: 'aqua',
    hex: '#55FFFF',
    rgb: { r: 85, g: 255, b: 255 }
  },
  {
    code: 'red',
    hex: '#FF5555',
    rgb: { r: 255, g: 85, b: 85 }
  },
  {
    code: 'light_purple',
    hex: '#FF55FF',
    rgb: { r: 255, g: 85, b: 255 }
  },
  {
    code: 'yellow',
    hex: '#FFFF55',
    rgb: { r: 255, g: 255, b: 85 }
  },
  {
    code: 'white',
    hex: '#FFFFFF',
    rgb: { r: 255, g: 255, b: 255 }
  }
]

/**
 * Enum representing the color codes used in Minecraft.
 * These color codes are used for formatting text in the game.
 *
 * @enum {string}
 */
export enum COLORS {
  BLACK = 'black',
  DARK_BLUE = 'dark_blue',
  DARK_GREEN = 'dark_green',
  DARK_AQUA = 'dark_aqua',
  DARK_RED = 'dark_red',
  DARK_PURPLE = 'dark_purple',
  GOLD = 'gold',
  GRAY = 'gray',
  DARK_GRAY = 'dark_gray',
  BLUE = 'blue',
  GREEN = 'green',
  AQUA = 'aqua',
  RED = 'red',
  LIGHT_PURPLE = 'light_purple',
  YELLOW = 'yellow',
  WHITE = 'white'
}

/**
 * Represents a transaction between two users.
 */
export type Transaction = {
  username_sender: string
  username_receiver: string
  amount_xp: number
  reason: string
}
/**
 * Represents a transfer of an item between two users.
 */
export type Transfer = {
  username_sender: string
  username_receiver: string
  item_id: string
  amount: number
  reason: string
}
/**
 * Represents a Position in 3D space.
 *
 * @typedef {Object} Position
 */
export type Position = { x: number; y: number; z: number }
/**
 * Represents a player in the game.
 */
export type Player = {
  username: string
  uuid: string
  xp: number // experience points (level)
  kills?: number
  online: boolean
  position: Position
  active?: boolean
  wanted?: boolean
  activity: number
  team_name: string
  last_seen: string
  operator?: boolean
  banned?: boolean
  muted?: boolean
}

export type PlayerActivity = {
  username: string
  activity: string
}

export type PlayerAchievement = {
  id: string
  username: string
  achievement: string
  timestamp: string
}

export type World = {
  time: number
  weather: string
}

export type Notification = {
  username?: string
  public?: boolean
  book_id?: string
  item_id?: string
  achievement_id?: string
  zone_id?: string
  team_id?: string
  message: string
  timestamp: string
  read: boolean
}

export type Broadcast = {
  message: string
  timestamp: string
}
/**
 * Represents a Ticket.
 *
 */
export type Ticket = { uuid: string; ticket: string; active: boolean }
/**
 * Represents a Credential object.
 */
export type Credential = { username: string; token: string }
/**
 * Represents a chat message.
 *
 */
export type ChatMessage = {
  username: string
  message: string
  timestamp: string
  color: string | undefined
}
/**
 * Represents the contents of an item with its details.
 *
 */
export type ItemContents = {
  username: string
  amount: number
  price: number | null
  min: number | null
}
/**
 * Represents an Item.
 */
export type Item = { id: string; name: string; values: ItemContents[] }
/**
 * Represents a team member.
 *
 */
export type TeamMember = { username: string; role: string }
/**
 * Represents a team in a multiplayer game.
 *
 */
export type Team = {
  id: string
  title: string
  description: string
  color: COLORS
  members: TeamMember[]
}
/**
 * Represents a game zone.
 *
 */
export type Zone = {
  id: string
  name: string
  team: string
  description: string
  teleport: boolean
  sale: boolean
  price: number
  positions: [Position, Position, Position, Position]
  center: Position
}
/**
 * Represents a book.
 *
 */
export type Book = {
  id: string
  title: string
  team: string | null
  date: string
  author: string
  sales: number
  pages: string
}

export type BookComment = {
  id: string
  username: string
  book_id: string
  comment: string
  timestamp: string
}

export type Report = {
  id: string
  title: string
  pages: string
  timestamp: string
}

/**
 * Represents a statistic value with a date and a numerical value.
 *
 */
export type StatisticValue = {
  date: string
  value: number
  multiplier?: number
}
/**
 * Represents a statistical data for a particular item.
 */
export type Statistic = {
  item: string
  average: number
  values: StatisticValue[]
}
/**
 * Represents a Bounty object.
 *
 */
export type Bounty = {
  username: string
  amount: number
  reason: string
}

export type Settings = {
  name: string
  value: string | number | boolean
}

export type Schem = {
  path: string
  name: string
}

/**
 * Represents an inventory item when extracted from rcon data.
 *
 * @interface InventoryItem
 */
export interface InventoryItem {
  slot: number
  id: string
  count: number
}

/**
 * Represents a configuration object that contains various options.
 * @interface Configuration
 */
export interface Configuration {
  myConfigurationOption: string
  myOptionalConfigurationOption: number | undefined
}
