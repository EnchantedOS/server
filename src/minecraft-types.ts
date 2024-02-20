// Basic Enums for clearer type distinction
export enum GameMode {
  Survival = 'survival',
  Creative = 'creative',
  Adventure = 'adventure',
  Spectator = 'spectator'
}
export enum Difficulty {
  Peaceful = 'peaceful',
  Easy = 'easy',
  Normal = 'normal',
  Hard = 'hard'
}
export enum WeatherType {
  Clear = 'clear',
  Rain = 'rain',
  Thunder = 'thunder'
}
export enum WhitelistAction {
  Add = 'add',
  Remove = 'remove',
  On = 'on',
  Off = 'off'
}
export enum BanAction {
  Ban = 'ban',
  BanIP = 'ban-ip',
  Pardon = 'pardon',
  PardonIP = 'pardon-ip',
  Banlist = 'banlist'
}
export enum TitleAction {
  Title = 'title',
  Subtitle = 'subtitle',
  Actionbar = 'actionbar',
  Clear = 'clear',
  Reset = 'reset'
}

// Primitive Types
export type Coordinate = { x: number; y: number; z: number }
export type Rotation = { yRot: number; xRot: number }

// Tags, Characteristics, and Selectors
export type Tag = string // Consider differentiating between entity tags, item tags, etc.

export type PlayerSelector = '@a' | '@r' | '@p' | '@e' | '@s'
export interface SelectorWithTags {
  selector: PlayerSelector
  tags?: Tag[]
}
// Enhanced Selector types
export type EntityTarget = string | Coordinate | SelectorWithTags // Player name, entity selector, Coordinates, or SelectorWithTags

export interface SelectorWithScores {
  selector: PlayerSelector
  scores?: Record<string, number>
}

// Expanded Entity Management Types
export type EntityType = string // Example: 'zombie' or 'minecraft:horse'
export interface Entity {
  entityType: EntityType
  position?: Coordinate
  nbtData?: string // Consider creating a more specific type for NBT data
}

// Command Result and Error Handling
export interface CommandResult {
  success: boolean
  message?: string
}
export class MinecraftError extends Error {
  constructor(
    message: string,
    public command?: string
  ) {
    super(message)
    this.name = 'MinecraftError'
  }
}

// Enhanced World Management Types
export type LootType =
  | 'spawn'
  | 'give'
  | 'replace_entity'
  | 'replace_block'
  | 'replace_item'
export type BorderAction =
  | 'add'
  | 'center'
  | 'damage'
  | 'get'
  | 'set'
  | 'warning'
export interface LootSpawnResult {
  successCount: number
  numberOfItemStacks: number
}
export interface LootGiveResult {
  successCount: number
  numberOfItemStacksPerPlayer: number
}

// Advanced Player Interactions
export interface PlayerInteraction {
  targets: EntityTarget
  command: string // Extend to specific command types for more safety
  message?: string // Consider replacing with a more structured text component
}

export type ServerCommand = string // Consider a more structured approach to server commands

// Server Administration Types
export type RconCommand = ServerCommand
export type RconResult = CommandResult
export interface BanExecuteResult {
  success: boolean
  reason?: string
}
export interface BanListResult {
  bans: string[]
}
export class MinecraftBanError extends MinecraftError {}

// Achievements, Items, and Gameplay Features
export type Achievement = string // Consider structuring achievements more specifically
export type ItemStack = string // NBT format, consider a more specific type structure
export type QuestName = string // Consider expanding on quest-related types
export type SkillId = string // Consider a more detailed skill system implementation

// Environment and Event Management
export type TimeAction = 'set' | 'add' | 'query'
export type EventAction = 'interact' | 'use' | 'attack'
export type EventActionResult = 'allow' | 'deny'

// Scoreboards, Teams, and Score Management
export interface ScoreboardObjective {
  name: string
  criteria: string
  displayName?: string
}
export interface ScoreboardPlayer {
  name: string
  objective: string
  score?: number
}
export type ScoreboardOperation =
  | 'add'
  | 'remove'
  | 'reset'
  | 'set'
  | 'enable'
  | 'operation'

// Extending Functionality for Commands and Server Management
export type FunctionId = string // Enhanced to support more specific function referencing
export type ServerFunction =
  | FunctionId
  | { functionId: FunctionId; arguments: string[] }

// Additional Improvements on Attributes, Modifiers, and Environmental Settings
export type AttributeModifier = {
  uuid: string
  name: string
  amount: number
  operation: 'add' | 'multiply' | 'multiply_base'
}
export type WorldSetting = {
  difficulty?: Difficulty
  gameMode?: GameMode
  spawnPosition?: Coordinate
  weather?: WeatherType
  time?: number
  seed?: string
} // Consider expanding this for more world settings

// Biomes, Structures, Blocks, and More
export type Biome = string // Detailed representation could enhance usability
export type Structure = string // Expand to include more specific structure types or properties
export type Block = string // Consider a more structured approach to block types and states
export type BlockState = string // JSON format for details
