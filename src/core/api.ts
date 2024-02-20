import { ConfigurationData, Manager } from './manager'
import { LootGiveResult, LootSpawnResult } from '../minecraft-types'

// @ts-ignore
export class Api extends Manager {
  constructor(private configData: Partial<ConfigurationData>) {
    // @ts-ignore
    super()
    this.configuration = { ...this.configuration, ...configData }
  }

  /**
   * Gives or takes an advancement or its criterion from one or more players.
   * @param {string} action 'grant' or 'revoke'
   * @param {string} target A player name, target selector, or UUID
   * @param {string} advancement A resource location of the advancement (optional)
   * @param {string} criterion A valid criterion of the advancement (optional)
   * @returns {Promise<void>} A promise that resolves when the command is executed
   */
  async advancement(
    action: string,
    target: string,
    advancement: string,
    criterion: string
  ): Promise<string | undefined> {
    if (!['grant', 'revoke'].includes(action))
      throw new Error('Action must be "grant" or "revoke".')

    if (!target) throw new Error('Target is required.')

    let cmd = `advancement ${action} ${target}`
    if (advancement) {
      cmd += ` only ${advancement}`
      if (criterion) cmd += ` ${criterion}`
    } else cmd += ` everything`

    return this.execute(cmd)
  }

  // Get the total value of the specified attribute
  async getAttribute(
    target: string,
    attribute: string,
    scale?: number
  ): Promise<string | undefined> {
    const command = `attribute ${target} ${attribute} get${scale !== undefined ? ` ${scale}` : ''}`

    return this.execute(command)
  }

  // Get the base value of the specified attribute
  async getAttributeBase(
    target: string,
    attribute: string,
    scale?: number
  ): Promise<string | undefined> {
    const command = `attribute ${target} ${attribute} base get${scale !== undefined ? ` ${scale}` : ''}`

    return this.execute(command)
  }

  // Set the base value of the specified attribute
  async setAttributeBase(
    target: string,
    attribute: string,
    value: number
  ): Promise<Promise<string> | undefined> {
    const command = `attribute ${target} ${attribute} base set ${value}`

    return this.execute(command)
  }

  // Add an attribute modifier
  async addAttributeModifier(
    target: string,
    attribute: string,
    uuid: string,
    name: string,
    value: number,
    operation: string
  ): Promise<Promise<string> | undefined> {
    const command = `attribute ${target} ${attribute} modifier add ${uuid} ${name} ${value} ${operation}`

    return this.execute(command)
  }

  // Remove an attribute modifier
  async removeAttributeModifier(
    target: string,
    attribute: string,
    uuid: string
  ): Promise<Promise<string> | undefined> {
    const command = `attribute ${target} ${attribute} modifier remove ${uuid}`

    return this.execute(command)
  }

  // Get the value of a specific attribute modifier
  async getAttributeModifierValue(
    target: string,
    attribute: string,
    uuid: string,
    scale?: number
  ): Promise<Promise<string> | undefined> {
    const command = `attribute ${target} ${attribute} modifier value get ${uuid}${scale !== undefined ? ` ${scale}` : ''}`

    return this.execute(command)
  }

  async ban(target: string, reason?: string): Promise<string | undefined> {
    const cmd = `ban ${target} ${reason || ''}`
    await this.execute(cmd)

    return await this.execute(cmd)
  }

  async banIp(target: string, reason?: string): Promise<string | undefined> {
    const cmd = `ban-ip ${target} ${reason || ''}`

    return await this.execute(cmd)
  }

  async banList(type: 'ips' | 'players' = 'players'): Promise<string[]> {
    const cmd = `banlist ${type}`
    const result = await this.execute(cmd)
    // Parse result and return the list of banned players/IPs
    const list = this.parseBanListResult(result?.trim() || '')

    return this.parseBanListResult(result?.trim() || '')
  }

  private parseBanListResult(rawResult: string): string[] {
    // Parse the raw result string to extract banned player names or IP addresses
    // Implement the parsing logic here
    return [] // placeholder for actual parsed list
  }

  async bossbarAdd(id: string, name: string): Promise<void> {
    await this.execute(`bossbar add ${id} ${name}`)
  }

  async bossbarGet(
    id: string,
    property: 'max' | 'players' | 'value' | 'visible'
  ): Promise<string> {
    const rawResult = await this.execute(`bossbar get ${id} ${property}`)
    if (!rawResult?.includes(' has the following bossbar data: '))
      throw new Error(
        `bossbarGet: Could not retrieve property '${property}' for bossbar with ID ${id}`
      )

    return rawResult?.split(' has the following bossbar data: ')[1]
  }

  async bossbarList(): Promise<string[] | undefined> {
    const rawResult = await this.execute('bossbar list')
    if (rawResult?.startsWith('There are no boss bars')) return []

    // @ts-ignore
    const result = rawResult?.match(/bossbars: (.+)$/)[1].split(', ')

    if (result) return result
  }

  async bossbarRemove(id: string): Promise<void> {
    await this.execute(`bossbar remove ${id}`)
  }

  async bossbarSet(
    id: string,
    property: string,
    value: string | number | boolean | string[]
  ): Promise<void> {
    const stringValue = Array.isArray(value)
      ? value.join(' ')
      : value.toString()
    await this.execute(`bossbar set ${id} ${property} ${stringValue}`)
  }

  /**
   * Clears items from player inventory.
   * @param target Specifies the target player(s). If not specified, defaults to the player executing the command.
   * @param item Specifies the item to be cleared. If not specified, all items are cleared.
   * @param data Specifies the data value of the item to be cleared. Special value -1 clears all data values.
   * @param maxCount Specifies the maximum number of items to be cleared. Special value -1 clears all specified items.
   */
  clear(
    target?: string,
    item?: string,
    data?: number,
    maxCount?: number
  ): Promise<number> {
    let command = 'clear'

    if (target) command += ` ${target}`

    if (item) command += ` ${item}`

    if (data !== undefined) command += ` ${data}`

    if (maxCount !== undefined) command += ` ${maxCount}`

    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        const output = await this.execute(command)

        // Processing the output and extracting the success count or throwing errors as necessary.
        if (output?.startsWith('No items were cleared')) resolve(0)
        else {
          const clearedCountMatch = output?.match(/(\d+) items cleared from/)
          if (clearedCountMatch) resolve(parseInt(clearedCountMatch[1]))
          else reject(new Error('Unexpected output from the clear command'))
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  async clone(
    sourceBegin: { x: number; y: number; z: number },
    sourceEnd: { x: number; y: number; z: number },
    destination: { x: number; y: number; z: number },
    maskMode: 'replace' | 'masked' = 'replace',
    cloneMode: 'force' | 'move' | 'normal' = 'normal'
  ): Promise<void> {
    // Construct the basic clone command
    const cmd =
      `clone ${sourceBegin.x} ${sourceBegin.y} ${sourceBegin.z} ${sourceEnd.x} ${sourceEnd.y} ${sourceEnd.z} ` +
      `${destination.x} ${destination.y} ${destination.z} ${maskMode} ${cloneMode}`

    const response = await this.execute(cmd)

    // Check response for a success or failure message
    if (response?.startsWith('Successfully cloned'))
      console.log('Clone successful:', response)
    else console.error('Clone failed:', response)
  }

  /**
   * Makes an entity take damage from a specific cause or entity.
   *
   * @param target - The target selector specifying which entity/entities to damage.
   * @param amount - The amount of damage to deal.
   * @param damageType - (Optional) The type of damage to deal.
   * @param location - (Optional) The coordinates where the damage originates if not dealt by an entity.
   * @param damager - (Optional) The entity causing the damage.
   * @param cause - (Optional) The cause of the damage, such as the skeleton that shot the arrow.
   */
  async damageEntity(
    target: string,
    amount: number,
    damageType?: string,
    location?: string,
    damager?: string,
    cause?: string
  ): Promise<void> {
    if (amount < 0.0)
      throw new Error('Amount of damage must be greater than or equal to 0.')

    let command = `damage ${target} ${amount}`

    if (damageType) command += ` ${damageType}`

    if (location) command += ` at ${location}`

    if (damager) command += ` by ${damager}`

    if (cause) command += ` from ${cause}`

    // This is a placeholder for however you send commands to your Minecraft server.
    const result = await this.execute(command)

    // Check the result, throw an error, or perform any other result handling as necessary.
    // Placeholder implementation - Adjust this to match your actual result handling logic:
    if (
      result?.toLowerCase().includes('failed') ||
      result?.toLowerCase().includes('error')
    )
      throw new Error(result)

    // If command execution is successful, you can process the result or return here.
    // This method is configured to return nothing (Promise<void>) on success.
  }

  // Method for "/data get ..." command
  async getData(
    target: 'block' | 'entity' | 'storage',
    targetPosOrUuid: string,
    path?: string,
    scale?: number
  ): Promise<string | undefined> {
    let command = `data get ${target} ${targetPosOrUuid}`
    if (path) command += ` ${path}`
    if (scale !== undefined) command += ` ${scale}`

    const result = await this.execute(command)
    // Parse the result and handle success / error cases as required
    // The parsing logic will depend on the format of the result coming from the server
    // For example, if the server responds with a string message, you should parse it accordingly
    // eslint-disable-next-line newline-before-return
    return await this.execute(command) // Or return a parsed object if needed
  }

  // Method for "/data merge ..." command
  async mergeData(
    target: 'block' | 'entity' | 'storage',
    targetPosOrUuid: string,
    nbtData: string
  ): Promise<void> {
    const command = `data merge ${target} ${targetPosOrUuid} ${nbtData}`
    await this.execute(command)
    // Handling of the response would be needed here as well
  }

  // Method for "/data modify ..." command - this is a simplified example, the actual implementation would need to be more complex to handle all subcommands
  async modifyData(
    target: 'block' | 'entity' | 'storage',
    targetPosOrUuid: string,
    targetPath: string,
    operation: 'set' | 'merge' | 'remove' | 'insert' | 'append' | 'prepend',
    source: 'value' | 'from' | 'string',
    valueOrSourcePosOrUuid?: string,
    sourcePath?: string,
    index?: number
  ): Promise<void> {
    let command = `data modify ${target} ${targetPosOrUuid} ${targetPath} ${operation} ${source}`
    if (source !== 'value') command += ` ${valueOrSourcePosOrUuid}`
    if (sourcePath) command += ` ${sourcePath}`
    if (index !== undefined) command += ` ${index}`
    if (source === 'value') command += ` ${valueOrSourcePosOrUuid}`

    await this.execute(command)
    // Handling of the response would be needed here as well
  }

  // Method for "/data remove ..." command
  async removeData(
    target: 'block' | 'entity' | 'storage',
    targetPosOrUuid: string,
    path: string
  ): Promise<void> {
    const command = `data remove ${target} ${targetPosOrUuid} ${path}`
    await this.execute(command)
    // Handling of the response would be needed here as well
  }

  /**
   * Enables or disables data packs on the Minecraft server.
   *
   * @param action The action to perform ("enable" or "disable").
   * @param name The name of the data pack.
   * @param existing The name of an existing enabled data pack (optional).
   * @returns A promise that resolves to the number of packs loaded, or rejects with an error message if the action fails.
   */
  async datapack(
    action: 'enable' | 'disable',
    name: string,
    existing?: string
  ): Promise<number> {
    let cmd = `datapack ${action} ${name}`
    if (existing) cmd += ` ${existing}`

    const response = await this.execute(cmd)

    // Handle failure cases based on Java Edition Output specification
    if (response?.startsWith('Failed'))
      throw new Error(`datapack action '${action}' failed: ${response}`)

    // If success, parse the number of packs loaded and return it
    if (action === 'enable' || action === 'disable') {
      const matchResult = response?.match(/(\d+) packs? (loaded|disabled)/)
      if (matchResult && matchResult[1]) return parseInt(matchResult[1])
    }

    // If the list action is successful, return the count of data packs
    if (response?.startsWith('There are ')) {
      const matchResult = response?.match(/(:\s)(\d+)/)
      if (matchResult && matchResult[2]) return parseInt(matchResult[2])
    }

    throw new Error(`Unexpected response received: ${response}`)
  }

  async startDebugSession(): Promise<string> {
    try {
      const rawResult = await this.execute('debug start')
      const successMessage = 'Started debug profiling session.'
      if (rawResult?.includes(successMessage))
        return 'Debug session started successfully.'
      else throw new Error('Failed to start debug session.')
    } catch (error) {
      return Promise.reject(error)
    }
  }

  async stopDebugSession(): Promise<{ message: string; averageTps?: number }> {
    try {
      const rawResult = await this.execute('debug stop')
      const match = rawResult?.match(/^Stopped after (.+) ms \((.+) tps\)$/)
      if (match) {
        const averageTps = parseFloat(match[2])

        return {
          message: 'Debug profiling session stopped successfully.',
          averageTps
        }
      } else throw new Error('Failed to stop debug session.')
    } catch (error) {
      return Promise.reject(error)
    }
  }

  async debugFunction(functionName: string): Promise<number> {
    try {
      const cmd = `debug function ${functionName}`
      const rawResult = await this.execute(cmd)
      const match = rawResult?.match(
        /^Executed (\d+) commands from function '(\w+:\w+)'/
      )
      if (match) {
        const executedCommandCount = parseInt(match[1], 10)

        return executedCommandCount
      } else throw new Error(`Failed to debug function ${functionName}.`)
    } catch (error) {
      return Promise.reject(error)
    }
  }

  async setDefaultGameMode(
    mode: 'survival' | 'creative' | 'adventure' | 'spectator'
  ): Promise<void> {
    const validModes = ['survival', 'creative', 'adventure', 'spectator']
    if (!validModes.includes(mode))
      throw new Error(
        'Invalid game mode. Must be one of the following: survival, creative, adventure, spectator'
      )

    const command = `defaultgamemode ${mode}`
    const result = await this.execute(command)

    if (result?.startsWith('Changed the default game mode'))
      console.log(`Default game mode changed to ${mode}`)
    else
      throw new Error(
        `Failed to change default game mode to ${mode}: ${result}`
      )
  }

  async deop(target: string): Promise<void> {
    if (!target) throw new Error('deop: Target must be specified.')

    const command = `deop ${target}`
    try {
      const response = await this.execute(command)

      // The success message is not specified, but we're assuming that any response
      // without an error message is a success.
      if (response?.match(/(\w+) is not an op|Error/) != null)
        throw new Error(`Failed to de-op player ${target}: ${response}`)
    } catch (error) {
      if (error instanceof Error) throw new Error(error.message)
      else throw error
    }
  }

  /**
   * Sets the difficulty of the Minecraft game.
   * Resolves with `true` if successful, rejects with an error otherwise.
   *
   * @param {string} difficulty - The new difficulty to set (peaceful, easy, normal, hard).
   * @returns {Promise<boolean>}
   */
  async setDifficulty(difficulty: string): Promise<boolean> {
    // Validate the difficulty level
    const validDifficulties = [
      'peaceful',
      'easy',
      'normal',
      'hard',
      'p',
      'e',
      'n',
      'h',
      '0',
      '1',
      '2',
      '3'
    ]
    if (!validDifficulties.includes(difficulty))
      throw new Error(
        "Invalid difficulty level. Accepted values are 'peaceful', 'easy', 'normal', or 'hard'."
      )

    // Construct the command
    const command = `difficulty ${difficulty}`

    // Send command via RCON connection and get the raw result
    const rawResult = await this.execute(command)

    // Parse the output for success or failure
    if (rawResult?.startsWith('Changed the difficulty to'))
      return true // Difficulty change was successful
    else throw new Error(`Failed to change the difficulty: ${rawResult}`)
  }

  async effect(
    action: 'give' | 'clear',
    target: string,
    effect?: string,
    seconds?: number,
    amplifier?: number,
    hideParticles?: boolean
  ): Promise<void> {
    // Construct the base command
    let cmd = `effect ${action} ${target}`

    // Append additional arguments based on the action
    if (action === 'give') {
      if (!effect)
        throw new Error('Effect name must be provided when giving an effect.')

      cmd += ` ${effect}`
      if (seconds !== undefined) {
        cmd += ` ${seconds}`
        if (amplifier !== undefined) {
          cmd += ` ${amplifier}`
          if (hideParticles !== undefined) cmd += ` ${hideParticles}`
        }
      }
    } else if (action === 'clear' && effect)
      // Only append the effect if specified when clearing effects
      cmd += ` ${effect}`

    // Send the command to the Minecraft server
    const rawResult = await this.execute(cmd)

    // Parse the response and handle error cases
    if (rawResult?.startsWith('No effect'))
      throw new Error('No effect was found with the specified name.')
    else if (rawResult?.startsWith('No entity was found'))
      throw new Error('No target entity was found.')

    // If command executed successfully, return without error
    // Additional parsing may be required based on the server's response format
  }

  /**
   * Adds an enchantment to the item held by the target player.
   * @param target The target selector or player name.
   * @param enchantment The enchantment ID.
   * @param level The enchantment level. (Optional)
   * @returns Promise<void>
   */
  async enchant(
    target: string,
    enchantment: string,
    level?: number
  ): Promise<void> {
    // Construct the Minecraft enchant command
    let cmd = `enchant ${target} ${enchantment}`
    if (level !== undefined) cmd += ` ${level}`

    // Send the command via the RCON connection
    const rawResult = await this.execute(cmd)

    // Match the result for success or failure
    if (rawResult?.startsWith('No entity was found'))
      throw new Error(`No entity found for selector ${target}`)
    else if (rawResult?.startsWith('Could not enchant the item'))
      throw new Error(`Could not enchant the item held by ${target}`)
    else if (rawResult?.match(/(\w+) has been enchanted with (\w+)/)) {
      // Enchantment succeeded
    } else throw new Error(`Unexpected server response: ${rawResult}`)
  }

  async executeForEntity(
    entityType: string,
    command: string
  ): Promise<string | undefined> {
    const cmd = `execute as @e[type=${entityType}] run ${command}`
    try {
      const result = await this.execute(cmd)

      return await this.execute(cmd)
    } catch (error) {
      throw new Error(
        `Failed to execute command for entity ${entityType}: ${error}`
      )
    }
  }

  async teleportEntity(
    entityType: string,
    target: string,
    x: number,
    y: number,
    z: number
  ): Promise<string | undefined> {
    const cmd = `execute as @e[type=${entityType},name=${target}] run tp @s ${x} ${y} ${z}`
    try {
      const result = await this.execute(cmd)

      return result
    } catch (error) {
      throw new Error(`Failed to teleport entity: ${error}`)
    }
  }

  async giveItemToPlayer(
    playerName: string,
    itemID: string,
    count: number
  ): Promise<string | undefined> {
    const cmd = `execute as ${playerName} run give @s ${itemID} ${count}`
    try {
      const result = await this.execute(cmd)

      return result
    } catch (error) {
      throw new Error(`Failed to give item to player: ${error}`)
    }
  }

  async summonEntity(
    entityType: string,
    x: number,
    y: number,
    z: number
  ): Promise<string | undefined> {
    const cmd = `execute run summon ${entityType} ${x} ${y} ${z}`
    try {
      return await this.execute(cmd)
    } catch (error) {
      throw new Error(`Failed to summon entity: ${error}`)
    }
  }

  async testForBlock(
    x: number,
    y: number,
    z: number,
    blockID: string
  ): Promise<boolean> {
    const cmd = `execute if block ${x} ${y} ${z} ${blockID} run say Block found`
    try {
      const result = await this.execute(cmd)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      // eslint-disable-next-line newline-before-return
      return result.includes('Block found')
    } catch (error) {
      throw new Error(`Failed to test for block: ${error}`)
    }
  }

  async playSoundForAll(
    soundID: string,
    x: number,
    y: number,
    z: number,
    volume: number,
    pitch: number
  ): Promise<string | undefined> {
    const cmd = `execute run playsound ${soundID} master @a ${x} ${y} ${z} ${volume} ${pitch}`
    try {
      const result = await this.execute(cmd)

      return result
    } catch (error) {
      throw new Error(`Failed to play sound: ${error}`)
    }
  }

  // Executes a Minecraft command at the position of a specific entity.
  async executeAtEntity(
    entityType: string,
    command: string
  ): Promise<string | undefined> {
    const cmd = `execute at @e[type=${entityType}] run ${command}`
    try {
      return await this.execute(cmd)
    } catch (error) {
      throw new Error(
        `Failed to execute command at entity ${entityType}: ${error}`
      )
    }
  }

  // Executes a Minecraft command as a specific entity.
  async executeAsEntity(
    entityType: string,
    command: string
  ): Promise<string | undefined> {
    const cmd = `execute as @e[type=${entityType}] run ${command}`
    try {
      return await this.execute(cmd)
    } catch (error) {
      throw new Error(
        `Failed to execute command as entity ${entityType}: ${error}`
      )
    }
  }

  // Executes a Minecraft command if a certain block is found at a specific position.
  async executeIfBlock(
    x: number,
    y: number,
    z: number,
    block: string,
    command: string
  ): Promise<string | undefined> {
    const cmd = `execute if block ${x} ${y} ${z} ${block} run ${command}`
    try {
      return await this.execute(cmd)
    } catch (error) {
      throw new Error(
        `Failed to execute command if block ${block} is present at ${x} ${y} ${z}: ${error}`
      )
    }
  }

  // Executes a Minecraft command facing a certain direction from an entity.
  async executeFacingEntity(
    entityType: string,
    facingEntityType: string,
    command: string
  ): Promise<string | undefined> {
    const cmd = `execute as @e[type=${entityType}] facing entity @e[type=${facingEntityType}] eyes run ${command}`
    try {
      return await this.execute(cmd)
    } catch (error) {
      throw new Error(
        `Failed to execute command facing entity type ${facingEntityType} from ${entityType}: ${error}`
      )
    }
  }

  // Stores the success of a command in a scoreboard objective.
  async storeSuccessInScoreboard(
    entityType: string,
    command: string,
    objective: string,
    scoreHolder: string
  ): Promise<string | undefined> {
    const cmd = `execute as @e[type=${entityType}] store success score ${scoreHolder} ${objective} run ${command}`
    try {
      return await this.execute(cmd)
    } catch (error) {
      throw new Error(
        `Failed to store command success in scoreboard objective ${objective}: ${error}`
      )
    }
  }

  // Executes a command only if an entity exists.
  async executeIfEntity(
    entityType: string,
    command: string
  ): Promise<string | undefined> {
    const cmd = `execute if entity @e[type=${entityType}] run ${command}`
    try {
      return await this.execute(cmd)
    } catch (error) {
      throw new Error(
        `Failed to execute command if entity ${entityType} exists: ${error}`
      )
    }
  }

  // Rotates an entity to face a specific position before executing a command.
  async executeRotatedToPosition(
    entityType: string,
    x: number,
    y: number,
    z: number,
    command: string
  ): Promise<string | undefined> {
    const cmd = `execute as @e[type=${entityType}] rotated as @e[type=${entityType}] facing ${x} ${y} ${z} run ${command}`
    try {
      return await this.execute(cmd)
    } catch (error) {
      throw new Error(
        `Failed to execute command rotated to face position ${x} ${y} ${z}: ${error}`
      )
    }
  }

  /**
   * Modifies the experience of a target player.
   * @param action 'add' to add experience, 'set' to set experience, 'query' to get current experience
   * @param target Selector for the player(s) to modify experience for
   * @param amount The amount of experience to add or set. Negative to remove
   * @param type 'levels' for experience levels, 'points' for experience points
   * @returns A promise that resolves when the command execution is complete.
   */
  async experience(
    action: 'add' | 'set' | 'query',
    target: string,
    amount?: number,
    type: 'levels' | 'points' = 'points'
  ): Promise<string> {
    let command = `experience ${action} ${target}`
    if (action !== 'query') command += ` ${amount} ${type}`
    else command += ` ${type}`

    try {
      const result = await this.execute(command)
      if (result?.startsWith('No player was found'))
        throw new Error(`No player found for target: ${target}`)

      // Handle the output for 'query' action.
      if (action === 'query') {
        const match = result?.match(
          /^(\w+) has the following entity data: (.+)$/
        )
        if (match && match[2]) return match[2] // Return the queried amount of experience
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      return result // For 'add' and 'set' actions, or if no specific output is required.
    } catch (error) {
      throw error // Re-throw the error to be handled by the caller.
    }
  }

  async fill(
    fromX: number,
    fromY: number,
    fromZ: number,
    toX: number,
    toY: number,
    toZ: number,
    block: string,
    mode: 'replace' | 'destroy' | 'hollow' | 'keep' | 'outline' = 'replace',
    filterBlock?: string
  ): Promise<number> {
    let command = `fill ${fromX} ${fromY} ${fromZ} ${toX} ${toY} ${toZ} ${block}`

    if (mode !== 'replace') command += ` ${mode}`
    // When mode is 'replace', optionally add the filterBlock
    else if (filterBlock) command += ` ${mode} ${filterBlock}`

    try {
      const rawResult = await this.execute(command)
      if (rawResult?.startsWith('Failed'))
        // Command failed, possibly due to invalid arguments or conditions not met
        throw new Error(`Fill command failed with error: ${rawResult}`)
      else {
        // Output when successful will include the number of blocks changed
        const match = rawResult?.match(/(\d+) blocks have been changed/)
        if (match && match[1])
          return parseInt(match[1]) // Return the number of blocks changed
        else throw new Error(`Unexpected success response: ${rawResult}`)
      } // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
    } catch (error: never) {
      // If sending the command results in an error, throw it
      throw new Error(`Error executing fill command: ${error.message}`)
    }
  }

  async fillBiome(
    from: { x: number; y: number; z: number },
    to: { x: number; y: number; z: number },
    biome: string,
    filter?: string
  ): Promise<number> {
    // Construct the command string
    const fromPos = `${from.x} ${from.y} ${from.z}`
    const toPos = `${to.x} ${to.y} ${to.z}`
    let cmd = `fillbiome ${fromPos} ${toPos} ${biome}`

    // Append the replace filter if it's provided
    if (filter) cmd += ` replace ${filter}`

    // Send the command to the Minecraft server
    const rawResult = await this.execute(cmd)

    // Parse the result and determine success or failure
    if (rawResult?.startsWith('No entities were found'))
      throw new Error(`fillBiome: Invalid biome or position specified`)
    else if (rawResult?.includes('commands.fillbiome.success')) {
      // Success! Extract the number of cells whose biomes have been replaced
      const match = rawResult?.match(/(\d+)(?= biome cells were changed)/)
      if (match) return parseInt(match[1])
    }

    // If we reach here, the command was not successful for an unknown reason
    throw new Error('fillBiome: Failed to execute the command successfully')
  }

  // Utility method for sending commands to the server and receiving responses
  private async sendCommand(command: string): Promise<string> {
    // Implement the actual server command sending and response handling here
    // For now, this is just a placeholder return to indicate that an implementation is needed.
    // eslint-disable-next-line prefer-promise-reject-errors
    return Promise.reject(
      'sendCommand method needs implementation to interact with the server'
    )
  }

  async executeFunction(
    name: string,
    argument?: string[],
    sourcePos?: string,
    source?: string,
    storage?: string,
    path?: string
  ): Promise<number> {
    // Construct the command
    let cmd = `function ${name}`

    // Append arguments if provided
    if (argument && arguments.length > 0) cmd += ` ${argument.join(' ')}`

    // Source position (block_pos)
    if (sourcePos) cmd += ` block ${sourcePos}`

    // Source entity or storage and path
    if (source && path) cmd += ` entity ${source} ${path}`
    else if (storage && path) cmd += ` storage ${storage} ${path}`

    // Send the command to the Minecraft server and wait for the result
    // eslint-disable-next-line no-useless-catch
    try {
      const rawResult = await this.execute(cmd)

      // Handle command failure
      if (rawResult?.startsWith('Failed'))
        throw new Error(`Function command failed: ${rawResult}`)

      // Handle command success; result indicates the number of commands executed
      const successCountMatch = rawResult?.match(/Success count is (\d+)/)
      if (successCountMatch && successCountMatch[1])
        return parseInt(successCountMatch[1])

      // Fallback for unexpected results
      throw new Error(`Unexpected result from function command: ${rawResult}`)
    } catch (error) {
      // Re-throw the error to be handled by the caller
      throw error
    }
  }

  async setGameMode(gamemode: string, target: string = '@s'): Promise<void> {
    // Construct the command
    const cmd = `gamemode ${gamemode} ${target}`

    const response = await this.execute(cmd)

    // Check if the command succeeded
    const successPattern = new RegExp(
      `Changed the game mode of (${target}|[a-zA-Z0-9_]+) to ${gamemode}`,
      'i'
    )
    if (response && !successPattern.test(response))
      // If the response didn't indicate success, throw an error with the response
      throw new Error(`setGameMode: Command failed with response: ${response}`)
  }

  /**
   * Sets or queries a game rule value on the Minecraft server.
   * @param ruleName The name of the game rule to set or query.
   * @param value Optional value to set for the game rule. If not provided, the current value will be queried.
   * @returns A promise that resolves with the current or new value of the game rule.
   */
  async gameRule(ruleName: string, value?: boolean | number): Promise<string> {
    let command = `gamerule ${ruleName}`
    if (value !== undefined) command += ` ${value}`

    const rawResult = await this.execute(command)
    if (rawResult?.startsWith('No game rule called'))
      throw new Error(`Invalid game rule: ${ruleName}`)

    if (!rawResult) throw new Error('Unexpected empty response from server.')

    const result = this.parseOutputForGameRule(rawResult)

    return result
  }

  /**
   * Parses the raw output from the Minecraft server for the game rule command.
   * @param rawOutput The raw output string from the Minecraft server.
   * @returns The parsed value of the game rule.
   */
  private parseOutputForGameRule(rawOutput: string): string {
    // Here, you can implement a more complex parsing logic based on your server output.
    // This is just a simple example.
    const match = rawOutput.match(
      /^(?:Game rule |The value of )(?:\w+)(?: (?:is|has been) )(.+)$/
    )
    if (!match) throw new Error('Unexpected output format.')

    return match[1]
  }

  async giveItem(
    target: string,
    item: string,
    count: number = 1,
    dataTag: string | null = null
  ): Promise<string> {
    let cmd = `give ${target} ${item} ${count}`
    if (dataTag) cmd += ` ${dataTag}`

    try {
      const result = await this.execute(cmd)
      // This simplistic error check might need to be enhanced based on the actual output format of your server.
      if (result?.startsWith('Given'))
        // If the give command is successful, the server usually says "Given [item] to [player]".
        return result // Fulfill the promise with the success message.
      else throw new Error(result) // If not successful, include server's response in error.
    } catch (error: any) {
      throw new Error(`Error giving item to ${target}: ${error.message}`)
    }
  }

  /**
   * Replace items in the inventory slot of an entity.
   * @param selector The entity selector or player name.
   * @param slot The slot to replace the item in.
   * @param itemID The ID of the item to place in the slot.
   * @param count The number of items to place.
   * @return Promise that resolves with the command output.
   */
  async itemReplaceEntity(
    selector: string,
    slot: string,
    itemID: string,
    count?: number
  ): Promise<string | undefined> {
    const countPart = count ? ` ${count}` : ''
    const command = `item replace entity ${selector} ${slot} with ${itemID}${countPart}`

    // eslint-disable-next-line no-useless-catch
    try {
      const result = await this.execute(command)

      if (
        result?.includes("doesn't have the specified slot") ||
        result?.includes('no entity was found') ||
        result?.includes('exceeds the stack limit') ||
        result?.includes('Unparseable')
      )
        throw new Error(`Command failed with message: ${result}`)

      return result
    } catch (error) {
      // Handle specific errors if necessary
      throw error
    }
  }

  async startJfrProfiling(): Promise<void> {
    const command = 'jfr start'
    try {
      const result = await this.execute(command)
      if (result === 'A JFR profiler has already been started')
        throw new Error('JFR profiling is already running.')
    } catch (error) {
      // Handle exceptions or rejections that occur during the command execution.
      console.error(error)
      throw error
    }
  }

  async stopJfrProfiling(): Promise<void> {
    const command = 'jfr stop'
    try {
      const result = await this.execute(command)
      if (result === "There's no JFR profiler running")
        throw new Error('No JFR profiling session is currently running.')
    } catch (error) {
      // Handle exceptions or rejections that occur during the command execution.
      console.error(error)
      throw error
    }
  }

  /**
   * Kicks a player off the server with an optional reason.
   *
   * @param target The player to kick. This can be a player name, selector, or UUID.
   * @param reason The optional reason for the kick. Defaults to "Kicked by an operator" if unspecified.
   * @returns A Promise that resolves if the player is successfully kicked, or rejects with an error message.
   */
  async kick(
    target: string,
    reason: string = 'Kicked by an operator'
  ): Promise<void> {
    // Construct the command with the required reason
    const command = `kick ${target} ${reason}`
    const response = await this.execute(command)

    // Parse the server response to determine if the kick was successful
    if (response?.startsWith('Kicked')) {
      // Resolve the promise indicating the player was successfully kicked
    }
    // The command failed to kick the player, throw an error with the Minecraft server's response
    else throw new Error(`Failed to kick player: ${response}`)
  }

  /**
   * Kills entities in the game.
   * @param {string} [target] The target selector for the entities to be killed.
   * @returns {Promise<void>} A promise that resolves when the command is executed.
   */
  async kill(target?: string): Promise<void> {
    // Construct the command with the optional target selector
    const command = target ? `kill ${target}` : 'kill'

    // Send the command via RCON and await the response
    const rawResponse = await this.execute(command)

    // Process the response to check for success or failure
    if (rawResponse?.startsWith('No entity was found'))
      throw new Error('kill command failed: Invalid target selector')

    if (rawResponse?.includes('Killed '))
      // The command was successful if the response includes 'Killed'
      return // Resolve the promise

    // If the response does not indicate a success, throw an error
    throw new Error(`kill command failed: ${rawResponse}`)
  }

  /**
   * Lists players on the server. If `uuids` parameter is set to true, the player UUIDs are also included.
   * @param {boolean} uuids - If true, includes the UUIDs of the players.
   * @returns {Promise<string>} A promise that resolves with the list of player names, optionally including UUIDs.
   */
  async listPlayers(uuids: boolean = false): Promise<string> {
    const command = uuids ? 'list uuids' : 'list'
    const rawResult = await this.execute(command)

    // Parse the resulting output based on the command's success message format
    if (uuids) {
      // Matches the output that includes UUIDs (e.g., "There are 2/20 players online: Notch (12345-67890-abcd-...)")
      const match = rawResult?.match(
        /There are \d+\/\d+ players online: ((?:\w+ \(\w+-\w+-\w+-\w+-\w+\)(?:, )?)*)/
      )
      if (match && match[1]) return match[1]
    } else {
      // Matches the output without UUIDs (e.g., "There are 2/20 players online: Notch, Jeb_")
      const match = rawResult?.match(/There are \d+\/\d+ players online: (.*)/)
      if (match && match[1]) return match[1]
    }

    // If the rawResult doesn't match any expected output, handle the error
    throw new Error(
      'Failed to list players or no players are currently online.'
    )
  }

  // An async method to handle the /locate command for Minecraft Java Edition
  async locate(
    type: 'structure' | 'biome' | 'poi',
    target: string
  ): Promise<{ x: number; y?: number; z: number; distance?: number }> {
    const command = `/locate ${type} ${target}`
    const rawResult = await this.execute(command)

    // Example successful response: "The nearest Mansion is at [123, ~, 456] (789 blocks away)"
    // Example failure response: "Could not locate structure within reasonable distance"
    // Utilize regex to capture the output message for both success and failure.

    // Check if the locate was successful by matching the known success pattern
    const successMatch = rawResult?.match(
      /The nearest .+ is at \[(\d+), (~|\d+), (\d+)\] \((\d+) blocks away\)/
    )
    if (successMatch)
      return {
        x: parseInt(successMatch[1]),
        y: type === 'biome' ? parseInt(successMatch[2]) : undefined, // Y coordinate is only relevant for biomes
        z: parseInt(successMatch[3]),
        distance: parseInt(successMatch[4])
      }

    // If not successful, throw an error with an appropriate message
    throw new Error(`Failed to locate ${type}: ${target} - ${rawResult}`)
  }

  async lootSpawn(
    lootTable: string,
    x: number,
    y: number,
    z: number,
    tool?: string
  ): Promise<LootSpawnResult> {
    const toolArgument = tool ? `{${tool}}` : ''
    const command = `loot spawn ${x} ${y} ${z} ${lootTable} ${toolArgument}`
    // eslint-disable-next-line no-useless-catch
    try {
      const rawResult = await this.execute(command)
      if (rawResult?.startsWith('Failed'))
        throw new Error('lootSpawn command failed')

      // Parse successCount and numberOfItemStacks from the output message.
      const successCount = 1 // To be parsed from the output.
      const numberOfItemStacks = 1 // To be parsed from the output.

      return {
        successCount,
        numberOfItemStacks
      }
    } catch (error) {
      throw error
    }
  }

  async lootGive(
    lootTable: string,
    targetSelector: string,
    tool?: string
  ): Promise<LootGiveResult> {
    const toolArgument = tool ? `{${tool}}` : ''
    const command = `loot give ${targetSelector} ${lootTable} ${toolArgument}`
    // eslint-disable-next-line no-useless-catch
    try {
      const rawResult = await this.execute(command)
      if (rawResult?.startsWith('Failed'))
        throw new Error('lootGive command failed')

      // Parse successCount and numberOfItemStacksPerPlayer from the output message.
      const successCount = 1 // To be parsed from the output.
      const numberOfItemStacksPerPlayer = 1 // To be parsed from the output.

      return {
        successCount,
        numberOfItemStacksPerPlayer
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Grants operator status to a player.
   * @param {string | string[]} targets A player name or a player-type target selector.
   * @returns {Promise<void>} A promise that resolves if the operation is successful.
   */
  async opPlayer(targets: string | string[]): Promise<void> {
    // Convert targets to a string list if it is not already one.
    const targetList = Array.isArray(targets) ? targets : [targets]

    // Create a command for each target and send them.
    for (const target of targetList) {
      const command = `op ${target}`
      // Attempt to send the command to the server.
      const rawResult = await this.execute(command)
      // Match the output to check for success or failure.
      if (rawResult?.match(/^No such player \(could be offline\)$/))
        // Player could be offline or not found.
        throw new Error(
          `ExtensionApi.opPlayer: Player ${target} not found or offline.`
        )
      else if (!rawResult?.startsWith('Made '))
        // If the result doesn't start with "Made ", it's an unexpected failure.
        throw new Error(
          `ExtensionApi.opPlayer: Unexpected failure for player ${target}. Output: ${rawResult}`
        )

      // If the command outputs "Made <player> a server operator", the operation is successful.
      // The method will resolve implicitly if this is the case.
    }
  }

  /**
   * Removes a player's UUID from the server's banlist.
   * @param {string} username - The username of the player to unban.
   * @returns {Promise<void>} - A promise that resolves if the command was successful.
   */
  async pardon(username: string): Promise<void> {
    const command = `pardon ${username}`
    try {
      const result = await this.execute(command)
      if (result && result.startsWith('Unbanned player')) {
        // Command was successful
        // Resolve the promise
      } else throw new Error(result) // Something went wrong, throw an error with the server's response
    } catch (error) {
      throw new Error(`Could not pardon player ${username}: ${error}`)
    }
  }

  /**
   * Removes an IP address from the server's IP banlist.
   * @param {string} ipAddress - The IP address to unban.
   * @returns {Promise<void>} - A promise that resolves if the command was successful.
   */
  async pardonIp(ipAddress: string): Promise<void> {
    const command = `pardon-ip ${ipAddress}`
    try {
      const result = await this.execute(command)
      if (result && result.startsWith('Unbanned IP address')) {
        // Command was successful
        // Resolve the promise
      } else throw new Error(result) // Something went wrong, throw an error with the server's response
    } catch (error) {
      throw new Error(`Could not pardon IP address ${ipAddress}: ${error}`)
    }
  }

  // Method to send the particle command to the Minecraft server
  async createParticle(
    particleName: string,
    position: { x: number; y: number; z: number },
    delta: { dx: number; dy: number; dz: number },
    speed: number,
    count: number,
    displayMode: 'force' | 'normal' = 'normal',
    viewers?: string
  ): Promise<void> {
    const posString = this.constructPosString(position)
    const deltaString = `${delta.dx} ${delta.dy} ${delta.dz}`
    const viewersString = viewers ? ` ${viewers}` : ''
    const command = `particle ${particleName} ${posString} ${deltaString} ${speed} ${count} ${displayMode}${viewersString}`

    const output = await this.execute(command)

    if (output?.startsWith('Failed')) throw new Error('Particle command failed')
  }

  // Utility method to construct position string with tilde and caret notation support
  private constructPosString(position: {
    x: number | string
    y: number | string
    z: number | string
  }): string {
    let { x, y, z } = position
    x = typeof x === 'number' ? `~${x}` : x
    y = typeof y === 'number' ? `~${y}` : y
    z = typeof z === 'number' ? `~${z}` : z

    return `${x} ${y} ${z}`
  }

  // Starts performance profiling
  async startPerfProfiling(): Promise<string | undefined> {
    try {
      return await this.execute('perf start')
      // Since we expect the command to only return a result after 10 seconds,
      // we may choose to not act on the result immediately, or to set a timeout to check the result.
      // Implement additional logic based on startProfilingResult if necessary
    } catch (error: any) {
      // Handle any errors that occur while attempting to start profiling
      throw new Error(`Error starting perf profiling: ${error.message}`)
    }
  }

  // Stops performance profiling early if it has been started
  async stopPerfProfiling(): Promise<string | undefined> {
    try {
      const stopProfilingResult = await this.execute('perf stop')
      // Process stopProfilingResult if there is an expected output upon successful stop
      // Otherwise, just resolve as the command should have stopped profiling
      // eslint-disable-next-line newline-before-return
      return stopProfilingResult // Might contain path to profiling output
    } catch (error: any) {
      // Handle any errors that occur while attempting to stop profiling
      throw new Error(`Error stopping perf profiling: ${error?.message}`)
    }
  }

  // Places a configured feature
  async placeFeature(
    feature: string,
    pos?: { x: number; y: number; z: number }
  ): Promise<void> {
    let cmd = `place feature ${feature}`
    if (pos) cmd += ` ${pos.x} ${pos.y} ${pos.z}`

    await this.processCommand(cmd)
  }

  // Places a jigsaw
  async placeJigsaw(
    pool: string,
    target: string,
    maxDepth: number,
    pos?: { x: number; y: number; z: number }
  ): Promise<void> {
    let cmd = `place jigsaw ${pool} ${target} ${maxDepth}`
    if (pos) cmd += ` ${pos.x} ${pos.y} ${pos.z}`

    await this.processCommand(cmd)
  }

  // Places a configured structure feature
  async placeStructure(
    structure: string,
    pos?: { x: number; y: number; z: number }
  ): Promise<void> {
    let cmd = `place structure ${structure}`
    if (pos) cmd += ` ${pos.x} ${pos.y} ${pos.z}`

    await this.processCommand(cmd)
  }

  // Places a structure template
  async placeTemplate(
    template: string,
    pos?: { x: number; y: number; z: number },
    rotation?: 'none' | 'clockwise_90' | 'counterclockwise_90' | '180',
    mirror?: 'none' | 'front_back' | 'left_right',
    integrity?: number,
    seed?: number
  ): Promise<void> {
    let cmd = `place template ${template}`
    if (pos) cmd += ` ${pos.x} ${pos.y} ${pos.z}`

    if (rotation) cmd += ` ${rotation}`

    if (mirror) cmd += ` ${mirror}`

    if (integrity !== undefined) cmd += ` ${integrity}`

    if (seed !== undefined) cmd += ` ${seed}`

    await this.processCommand(cmd)
  }

  // Process command with the Minecraft server and handle the output
  private async processCommand(command: string): Promise<void> {
    const response = await this.execute(command)
    if (response === 'Failed' || response?.match(/^(Error|Unparseable|Failed)/))
      throw new Error(`Command failed: ${response}`)

    // Successful response handling if needed
  }

  /**
   * Plays a specified sound to a player, at a location, with a specific volume and pitch.
   * @param sound - Specifies the sound to play.
   * @param source - Specifies the music category the sound falls under.
   * @param target - The target player(s) to hear the sound.
   * @param position - The coordinates to play the sound from (optional).
   * @param volume - The distance the sound can be heard. Defaults to 1 (optional).
   * @param pitch - Specifies the pitch and speed of the sound. Defaults to 1 (optional).
   * @param minVolume - The volume for targets outside the sound's normal audible sphere (optional).
   * @returns A promise that resolves when the command is sent.
   */
  async playSound(
    sound: string,
    source: string,
    target: string,
    position?: { x: number; y: number; z: number },
    volume?: number,
    pitch?: number,
    minVolume?: number
  ): Promise<void> {
    let cmd = `playsound ${sound} ${source} ${target}`

    if (position) cmd += ` ${position.x} ${position.y} ${position.z}`

    if (volume !== undefined) cmd += ` ${volume}`

    if (pitch !== undefined) cmd += ` ${pitch}`

    if (minVolume !== undefined) cmd += ` ${minVolume}`

    await this.execute(cmd)
  }

  /**
   * Draws a random value within the specified range. Optionally, you can specify a sequence.
   * @param announceResult - Whether to announce result to all players or not. Use 'value' for private, 'roll' for public.
   * @param range - The range of random numbers to generate.
   * @param sequence - The namespace ID of the random number sequence to be used.
   */
  async drawRandomNumber(
    announceResult: 'value' | 'roll',
    range: string,
    sequence?: string
  ): Promise<number> {
    let command = `/random ${announceResult} ${range}`
    if (sequence) command += ` ${sequence}`

    const output = await this.execute(command) // Assuming executeCommand is a method that sends the command and parses the response.
    const match = output?.match(/^\w+: (\d+)$/)
    if (match) return parseInt(match[1])
    else throw new Error('Failed to draw a random number.')
  }

  /**
   * Resets the random number sequence. Optionally, you can provide a seed and flags to include the world seed and sequence ID.
   * @param sequence - The namespace ID of the random number sequence to be used or '*' to reset all.
   * @param seed - The seed value used to reset the sequence.
   * @param includeWorldSeed - Whether to incorporate the world seed value.
   * @param includeSequenceId - Whether to include the ID of the random number sequence.
   */
  async resetRandomSequence(
    sequence: string,
    seed?: number,
    includeWorldSeed?: boolean,
    includeSequenceId?: boolean
  ): Promise<number> {
    let command = `/random reset ${sequence}`
    if (seed !== undefined) command += ` ${seed}`

    if (includeWorldSeed !== undefined) command += ` ${includeWorldSeed}`

    if (includeSequenceId !== undefined) command += ` ${includeSequenceId}`

    const output = await this.execute(command) // Assuming executeCommand is a method that sends the command and parses the response.
    const match = output?.match(/^\w+: (\d+)$/)
    if (match) return parseInt(match[1])
    else throw new Error('Failed to reset the random number sequence.')
  }

  // A TypeScript typed method as requested to handle 'recipe' commands
  async changeRecipeStatus(
    action: 'give' | 'take',
    targets: string,
    recipe?: string
  ): Promise<number> {
    let command = `recipe ${action} ${targets}`
    if (recipe) command += ` ${recipe}`
    else command += ` *`

    try {
      // Send command via rcon and wait for the result
      const result = await this.execute(command)

      // Parse the result to identify whether the command was successful
      if (result?.startsWith('Given') || result?.startsWith('Taken')) {
        // Parse the number of recipes given/taken from the output
        const match = result.match(/(\d+) recipes?/)
        if (match && match[1])
          return parseInt(match[1]) // Return the success count
        // If no number is found, but the command was still successful, return 1
        else return 1
      } else if (result === 'No recipe matches the given name')
        throw new Error(`No recipe with the name "${recipe}" exists.`)
      // Handle other types of failure messages
      else throw new Error(`${result}`)
    } catch (e) {
      // Handle errors (like connection issues, or invalid command syntax)
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        `An error occurred while processing the 'recipe' command: ${e.message}`
      )
    }
  }

  async reload(): Promise<void> {
    // Command to reload data packs
    const command = 'reload'
    // Send the command to the server
    const result = await this.execute(command)

    // Process the output, assuming if the command includes "reloaded" it was successful,
    // this may vary based on your server's output message
    if (!result?.includes('reloaded'))
      throw new Error('Reload failed: ' + result)
  }

  async makeEntityRideVehicle(
    target: string,
    vehicle: string
  ): Promise<string> {
    // eslint-disable-next-line no-useless-catch
    try {
      const command = `ride ${target} mount ${vehicle}`
      const rawResult = await this.execute(command)

      // Handling expected success message pattern
      if (rawResult?.includes('Now riding'))
        return 'Success: Entity is now riding the vehicle.'

      // Handling expected failure messages
      if (
        rawResult?.includes('Could not find that entity') ||
        rawResult?.includes('No entity was found')
      )
        throw new Error(
          'Failure: The specified entity or vehicle could not be found.'
        )

      return 'Failure: An unexpected error occurred'
    } catch (error) {
      throw error
    }
  }

  async dismountEntity(target: string): Promise<string> {
    try {
      const command = `ride ${target} dismount`
      const rawResult = await this.execute(command)

      // Handling expected success message pattern
      if (rawResult?.includes('Dismounted'))
        return 'Success: Entity has been dismounted.'

      // Handling expected failure messages
      if (
        rawResult?.includes('Could not find that entity') ||
        rawResult?.includes('No entity was found')
      )
        throw new Error(
          'Failure: The specified entity could not be found or was not riding.'
        )

      return 'Failure: An unexpected error occurred'
    } catch (error) {
      throw error
    }
  }

  /**
   * Executes the save-all command.
   * @param flush If true, the server saves all chunks to the storage device immediately.
   * @returns A promise that resolves when the operation is complete.
   */
  async saveAll(flush: boolean = false): Promise<void> {
    const command = `save-all${flush ? ' flush' : ''}`
    const output = await this.execute(command)
    if (output?.includes('Failed'))
      throw new Error('Save-all operation failed.')
  }

  /**
   * Executes the save-off command.
   * Disables server writing to the world files.
   * @returns A promise that resolves when the operation is complete.
   */
  async saveOff(): Promise<void> {
    const output = await this.execute('save-off')
    if (output?.includes('Failed'))
      throw new Error('Save-off operation failed.')
  }

  /**
   * Executes the save-on command.
   * Enables server writing to the world files.
   * @returns A promise that resolves when the operation is complete.
   */
  async saveOn(): Promise<void> {
    const output = await this.execute('save-on')
    if (output?.includes('Failed')) throw new Error('Save-on operation failed.')
  }

  /**
   * Broadcasts a message to all players on the server.
   * @param message The message to broadcast.
   * @returns A promise that resolves when the command has been executed.
   */
  async say(message: string): Promise<void> {
    try {
      // Ensure the message is a string and not empty
      if (typeof message !== 'string' || message.trim() === '')
        throw new Error('Message cannot be empty.')

      // Send the say command to the Minecraft server
      const result = await this.execute(`say ${message}`)

      // Check for success. We'll assume any response without an error is a success because say command
      // does not provide a detailed output other than being executed. If needed, check for specific
      // output if your server setup provides that.
      if (result?.startsWith('Broadcasting: ')) {
        // Success
      } else throw new Error('Failed to broadcast message.')
    } catch (error) {
      // If an error occurs, reject the promise and forward the error.
      return Promise.reject(error)
    }
  }

  /**
   * Schedules a function to execute after a specified delay in a Minecraft server.
   * @param functionName - The name of the function to be executed.
   * @param time - The time delay before the function execution, with unit (d, s, or t).
   * @param mode - Whether to append or replace the schedule ('append' or 'replace').
   * @return A promise that resolves when the operation is successful.
   */
  async scheduleFunction(
    functionName: string,
    time: string,
    mode: 'append' | 'replace' = 'replace'
  ): Promise<void> {
    const command = `schedule function ${functionName} ${time} ${mode}`
    const result = await this.execute(command)

    // Sample Output Processing
    if (result?.startsWith('Failed'))
      throw new Error(`Failed to schedule function: ${command}`)

    // Additional success condition checks can be added based on your server's response formats.

    // If successful, no action needed.
  }

  /**
   * Clears a scheduled function execution.
   * @param functionName - The name of the function whose schedule should be cleared.
   * @return A promise that resolves when the operation is successful.
   */
  async clearSchedule(functionName: string): Promise<void> {
    const command = `schedule clear ${functionName}`
    const result = await this.execute(command)

    // Sample Output Processing
    if (
      result?.startsWith('Failed') ||
      result?.match(/schedule for .+ can't be found/)
    )
      throw new Error(`Failed to clear schedule for function: ${functionName}`)

    // Additional success condition checks can be added based on your server's response formats.

    // If successful, no action needed.
  }

  async listScoreboardObjectives(): Promise<string[]> {
    const command = `scoreboard objectives list`
    const rawResult = await this.execute(command)
    // Parse the rawResult to extract objectives and return them
    // Assume the server returns a list of objectives or an indication that there are no objectives
    // Implement the actual parsing based on the server's response format
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // eslint-disable-next-line newline-before-return
    return rawResult?.split('\n') // Example parsing, adjust as necessary
  }

  async addScoreboardObjective(
    objective: string,
    criteria: string,
    displayName?: string
  ): Promise<void> {
    let command = `scoreboard objectives add ${objective} ${criteria}`
    if (displayName) command += ` ${displayName}`
    await this.execute(command)
    // Handle response
  }

  async removeScoreboardObjective(objective: string): Promise<void> {
    const command = `scoreboard objectives remove ${objective}`
    await this.execute(command)
    // Handle response
  }

  async setScoreboardDisplay(slot: string, objective?: string): Promise<void> {
    let command = `scoreboard objectives setdisplay ${slot}`
    if (objective) command += ` ${objective}`
    await this.execute(command)
  }

  async modifyScoreboardObjectiveDisplayname(
    objective: string,
    displayName: string
  ): Promise<void> {
    const command = `scoreboard objectives modify ${objective} displayname ${displayName}`
    await this.execute(command)
  }

  async modifyScoreboardObjectiveRendertype(
    objective: string,
    rendertype: string
  ): Promise<void> {
    const command = `scoreboard objectives modify ${objective} rendertype ${rendertype}`
    await this.execute(command)
  }

  async listScoreboardPlayers(target?: string): Promise<string[]> {
    let command = `scoreboard players list`
    if (target) command += ` ${target}`

    const rawResult = await this.execute(command)
    // Parse the rawResult to extract players and return them
    // Assume the server returns a list of players or an indication that there are no players
    // Implement the actual parsing based on the server's response format
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // eslint-disable-next-line newline-before-return
    return rawResult?.split('\n') // Example parsing, adjust as necessary
  }

  async getScoreboardPlayerScore(
    target: string,
    objective: string
  ): Promise<number> {
    const command = `scoreboard players get ${target} ${objective}`
    const rawResult = await this.execute(command)
    // Extract and convert the score from rawResult
    // Implement the actual parsing based on the server's response format

    return parseInt(<string>rawResult) // Example parsing, adjust as necessary
  }

  async getSeed(): Promise<number> {
    // Sending the 'seed' command to the server
    const rawResult = await this.execute('seed')

    // Extracting the seed from the command output using regex
    const match = rawResult?.match(/^Seed: \[([0-9]+)\]$/)

    // If we have a match and captured the seed, parse it to a number and return it
    if (match && match[1]) return parseInt(match[1])
    // If the result does not match the expected output, throw an error

    return 0
  }

  /**
   * Sets a block at a specific location to a new block state,
   * with an optional mode to handle the block change.
   *
   * @param {number} x - The x-coordinate of the block.
   * @param {number} y - The y-coordinate of the block.
   * @param {number} z - The z-coordinate of the block.
   * @param {string} blockState - The block state to set (e.g., `minecraft:oak_planks`).
   * @param {('destroy' | 'keep' | 'replace')} mode - How to handle the block change (optional).
   * @returns {Promise<void>} A promise that resolves when the command is complete.
   */
  async setBlock(
    x: number,
    y: number,
    z: number,
    blockState: string,
    mode?: 'destroy' | 'keep' | 'replace'
  ): Promise<void> {
    // Construct the setblock command string
    const cmd = `setblock ${x} ${y} ${z} ${blockState}${mode ? ` ${mode}` : ''}`

    // Send the setblock command to the Minecraft server
    const rawResult = await this.execute(cmd)

    // Parse the success or failure from the output
    if (rawResult?.startsWith('Changed the block')) {
      // Command was successful, resolve the promise
    }
    // Command failed, reject the promise
    // else throw new Error(`Failed to set block: ${rawResult}`)
  }

  async setIdleTimeout(minutes: number): Promise<string> {
    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 2147483647)
      throw new Error(
        'Minutes must be a 32-bit integer between 0 and 2147483647.'
      )

    try {
      // Construct the Minecraft command
      const command = `setidletimeout ${minutes}`

      // Send the command to the server
      const result = await this.execute(command)

      // Check for the success condition in the result
      if (result?.startsWith('Set the idle kick timer'))
        return 'Idle timeout successfully set.'
      else
        throw new Error(
          'Failed to set idle timeout. Server response: ' + result
        )
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      throw new Error('Error setting idle timeout: ' + error?.message)
    }
  }

  /**
   * Sets the world spawn point in Minecraft.
   * @param x X-coordinate of the new spawn point.
   * @param y Y-coordinate of the new spawn point.
   * @param z Z-coordinate of the new spawn point.
   * @param angle Yaw angle to spawn with (optional).
   */
  async setWorldSpawn(
    x?: number,
    y?: number,
    z?: number,
    angle?: number
  ): Promise<void> {
    let command = 'setworldspawn'

    if (x !== undefined && y !== undefined && z !== undefined)
      command += ` ${x} ${y} ${z}`

    if (angle !== undefined) command += ` ${angle}`

    const result = await this.execute(command)

    // Check for success message from the server and handle output accordingly
    if (result?.startsWith('Set the world spawn point to')) {
      // The command was successful, resolve the promise
    }
    // The command failed, throw an error with the result from the server
    else throw new Error(`Failed to set world spawn: ${result}`)
  }

  // Set the spawn point for a player.
  async setSpawnPoint(
    targets: string = '@a',
    pos?: { x: number; y: number; z: number },
    angle?: number
  ): Promise<void> {
    let command = 'spawnpoint'

    command += ` ${targets}`

    if (pos)
      // If the positions are specified, append them to the command
      command += ` ${pos.x} ${pos.y} ${pos.z}`

    if (angle !== undefined)
      // If angle is specified, append it to the command
      command += ` ${angle}`

    try {
      // Send the spawnpoint command to the server via RCON
      const response = await this.execute(command)

      // Handle the command output and respond accordingly
      if (response?.startsWith('Unparseable') || response?.startsWith('Failed'))
        // The command was not successful, so throw an error
        throw new Error(`SetSpawnPoint command failed: ${response}`)
      else if (response?.startsWith('Successful')) {
        // The spawn point was set successfully, nothing to do
      }
      // If we have a different output, log it
      else
        console.log(
          `Unexpected response from setSpawnPoint command: ${response}`
        )
    } catch (error: any) {
      // If an error occurs in sending the command, throw it
      throw new Error(`Error setting spawn point: ${error.message}`)
    }
  }

  async spectate(target: string, player?: string): Promise<void> {
    // Construct the base command
    let cmd = `spectate ${target}`
    if (player)
      // If a player is specified, add them to the command
      cmd += ` ${player}`

    try {
      // Send the command to the RCON connection and wait for the result
      const rawResult = await this.execute(cmd)

      // Check the result for common failure messages
      if (rawResult?.match(/^Unparseable/))
        throw new Error(
          'The arguments provided to the spectate command were unparseable.'
        )
      else if (rawResult?.match(/^Failed/))
        throw new Error(
          'The spectate command failed to resolve the target or the player is not online/same/not in spectator mode.'
        )

      // If no known errors are matched, assume success and resolve the promise
      // No additional action is needed unless specific output handling is desired
    } catch (error) {
      // If an error occurs, reject the promise with the error message
      throw error
    }
  }

  /**
   * Teleports entities to random surface locations within an area.
   * @param x The x-coordinate of the center of the area to spread targets to.
   * @param z The z-coordinate of the center of the area to spread targets to.
   * @param spreadDistance The minimum distance between targets.
   * @param maxRange The maximum distance from the center of the area to spread targets.
   * @param respectTeams Specifies whether to keep teams together.
   * @param targets Specifies the targets to spread.
   * @param under (Java Edition only) The maximum height for resulting positions.
   * @returns A promise that resolves when the command execution is complete.
   */
  async spreadPlayers(
    x: number,
    z: number,
    spreadDistance: number,
    maxRange: number,
    respectTeams: boolean,
    targets: string,
    under?: number
  ): Promise<void> {
    let command = `spreadplayers ${x} ${z} ${spreadDistance} ${maxRange} ${respectTeams ? 'true' : 'false'} ${targets}`

    // Add optional 'under' parameter for Java Edition.
    if (typeof under === 'number') command += ` under ${under}`

    const result = await this.execute(command)

    // Assume a successful response contains "Successfully"
    if (!result || !result.includes('Successfully'))
      throw new Error('Failed to spread players: ' + result)
  }

  async stop(): Promise<void> {
    await this.execute('stop')

    // The 'stop' command always succeeds and does not provide a specific success message.
    // So we interpret
  }

  async stopSound(
    target: string,
    source?: string,
    sound?: string
  ): Promise<void> {
    let command = `stopsound ${target}`
    if (source) command += ` ${source}`

    if (sound) command += ` ${sound}`

    const response = await this.execute(command)

    // Analyze the response and handle it accordingly
    if (response?.startsWith('No player was found'))
      throw new Error('No matching players found.')
    else if (response?.startsWith('Stopped sound')) {
      // Sound stopped successfully, nothing to return
    } else throw new Error('An unexpected error occurred.')
  }

  /**
   * Summons an entity on the server at the specified location with optional NBT data.
   * @param entityType The entity ID to summon.
   * @param x The x-coordinate where the entity should be summoned.
   * @param y The y-coordinate where the entity should be summoned.
   * @param z The z-coordinate where the entity should be summoned.
   * @param nbtData Optional NBT data to apply to the entity upon summoning.
   * @return A promise that resolves on success or failure of the command.
   */
  async summon(
    entityType: string,
    x: number,
    y: number,
    z: number,
    nbtData?: string
  ): Promise<string> {
    // Construct the summon command with optional NBT data
    let command = `summon ${entityType} ${x} ${y} ${z}`
    if (nbtData) command += ` ${nbtData}`

    // Send the command to the server using the RCON connection
    const rawResult = await this.execute(command)

    // Check if the command was executed successfully
    if (rawResult?.startsWith('Summoned new'))
      return 'Entity summoned successfully.'
    else if (rawResult?.startsWith('Unable to summon'))
      throw new Error('Failed to summon entity: ' + rawResult)
    // Handle any other unexpected output
    else throw new Error('Unexpected output from summon command: ' + rawResult)
  }

  // Method to handle the /tag command for different actions
  // async tagEntity(
  //   targets: string,
  //   action: 'add' | 'remove' | 'list',
  //   tagName?: string
  // ): Promise<{ action: string; tagName: string | undefined }> {
  //   let command: string
  //
  //   if (action === 'list') command = `tag ${targets} list`
  //   else if (tagName) command = `tag ${targets} ${action} ${tagName}`
  //   else throw new Error('tagName must be provided for add/remove actions')
  //
  //   const rawResult = await this.execute(command)
  //
  //   // Handle the output based on the action
  //   switch (action) {
  //     case 'list':
  //       // Match output for listing tags and parse accordingly
  //       // eslint-disable-next-line no-case-declarations
  //       const listMatch = rawResult?.match(
  //         /^(\w+) has the following tags: (.+)$/
  //       )
  //       if (listMatch) return listMatch[2].split(', ').map(tag => tag.trim())
  //       else if (rawResult?.match(/^(\w+) has no tags$/)) return [] // Entity has no tags
  //
  //       break
  //     case 'add':
  //     case 'remove':
  //       // Check for successful addition or removal of a tag
  //       if (rawResult?.startsWith(`Tag '${tagName}' added to`))
  //         return { action: 'added', tagName }
  //       else if (rawResult?.startsWith(`Tag '${tagName}' removed from`))
  //         return { action: 'removed', tagName }
  //       else if (rawResult?.match(/^No entity was found$/))
  //         throw new Error(`TagError: No entity found for targets: ${targets}`)
  //       else if (
  //         rawResult?.match(/^The entity already has that tag$/) ||
  //         rawResult?.match(/^The entity doesn't have that tag$/)
  //       )
  //         return { action: 'none', reason: rawResult }
  //
  //       break
  //   }
  //
  //   // If the result does not match any expected pattern, throw an error
  //   throw new Error(`Unexpected result from tag command: ${rawResult}`)
  // }

  async listTeams(teamName?: string): Promise<string | Error> {
    let cmd = 'team list'
    if (teamName) cmd += ` ${teamName}`

    try {
      const response = await this.execute(cmd)
      if (response?.startsWith('No team was found'))
        throw new Error('No team was found')

      if (!response) return 'No teams found'

      return response
    } catch (error: any) {
      return error
    }
  }

  async addTeam(teamName: string, displayName?: string): Promise<void | Error> {
    let cmd = `team add ${teamName}`
    if (displayName) cmd += ` ${JSON.stringify(displayName)}` // Assuming the displayName is in proper JSON format.

    try {
      const response = await this.execute(cmd)
      if (response?.startsWith('A team with the name'))
        throw new Error('A team with the name already exists')
    } catch (error: any) {
      return error
    }
  }

  async modifyTeamOption(
    teamName: string,
    option: string,
    value: string | boolean | number
  ): Promise<void | Error> {
    const cmd = `team modify ${teamName} ${option} ${value}`

    try {
      const response = await this.execute(cmd)
      if (response?.startsWith('Team option is the same as current'))
        throw new Error('Team option is the same as current')
    } catch (error: any) {
      return error
    }
  }

  async removeTeam(teamName: string): Promise<void | Error> {
    const cmd = `team remove ${teamName}`

    try {
      const response = await this.execute(cmd)
      if (response?.startsWith('No team was found'))
        throw new Error('No team was found')
    } catch (error: any) {
      return error
    }
  }

  async teleport(
    targets: string,
    x: number,
    y: number,
    z: number,
    yRot?: number,
    xRot?: number
  ): Promise<void> {
    // Construct the base teleport command with the specified coordinates.
    let cmd = `teleport ${targets} ${x} ${y} ${z}`

    // Optionally append the rotation arguments to the command if they are provided.
    if (yRot !== undefined && xRot !== undefined) cmd += ` ${yRot} ${xRot}`

    // Send the teleport command using the RCON connection and await the result.
    const result = await this.execute(cmd)

    // Parse the command output and resolve or reject the promise accordingly.
    if (result?.startsWith('Teleported')) {
      // If the output indicates a successful teleport, resolve the promise.
    } else throw new Error(`Failed to teleport: ${result}`)
  }

  // Method to send a private message
  async sendMessage(target: string, message: string): Promise<number> {
    // Construct the command
    const cmd = `msg ${target} ${message}`

    try {
      // Send the command and capture the output
      const rawResult = await this.execute(cmd)

      // Check for no targeted players
      if (rawResult?.match(/^No player was found$/))
        throw new Error(`sendMessage: No players found with target ${target}`)

      // Check for success and get the number of targeted players
      const match = rawResult?.match(/^Your whisper to (\w+) was successful/)
      if (match)
        // On success, return the number of targeted players
        // This assumes a successful command outputs a confirmation message
        // You might need to adjust the regular expression based on the actual server output
        return 1 // Assuming msg always targets a single player
      // If there's no match, assume the command failed
      else
        throw new Error(
          `sendMessage: Command failed with response ${rawResult}`
        )
    } catch (error) {
      // If an error occurs while sending the command, log the error and rethrow
      console.error(`sendMessage: Error sending command - ${error}`)
      throw error
    }
  }

  async tellRaw(target: string, jsonMessage: string): Promise<void> {
    try {
      const response = await this.execute(`tellraw ${target} ${jsonMessage}`)

      // Check if the command succeeded; the specifics here will depend on the
      // format of the response from your RCON connection
      if (response?.startsWith('Error'))
        // Handle any errors based on the response
        throw new Error(response)

      // If no error, the promise resolves successfully
    } catch (error) {
      // Here you would handle and log the error or throw it to be caught by the caller
      throw error
    }
  }

  /**
   * Changes or queries the world's game time.
   *
   * @param action - The specific action to perform: 'add', 'set', 'query'.
   * @param value - For 'add' and 'set', it specifies the time to add or set. For 'query', it must be 'daytime', 'gametime', or 'day'.
   * @returns A Promise that resolves once the command has been executed.
   */
  async time(
    action: 'add' | 'set' | 'query',
    value: string | number
  ): Promise<any> {
    let cmd: string
    switch (action) {
      case 'add':
        cmd = `time add ${value}`
        break
      case 'set':
        cmd = `time set ${value}`
        break
      case 'query':
        cmd = `time query ${value}`
        break
      default:
        throw new Error(`Unknown action '${action}' for time command`)
    }

    try {
      const result = await this.execute(cmd)

      return this.parseTimeCommandResult(result)
    } catch (error) {
      throw error
    }
  }

  /**
   * Parses the result string of the 'time' command.
   *
   * @param result - The result string from executing the 'time' command.
   * @returns The parsed result or throws an error if no valid data is found.
   */
  private parseTimeCommandResult(result: string | undefined): any {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (result.startsWith('Error:')) throw new Error(result)

    // Check for success messages and extract relevant data.
    // An actual implementation would depend on the known possible success messages.
    // This is an example of how you might handle the success message for the 'query' action.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const queryMatch = result.match(/^The time is (\d+)$/)
    if (queryMatch) return { time: parseInt(queryMatch[1]) }

    // If result cannot be parsed, throw an error.
    throw new Error(`Unexpected result format: ${result}`)
  }

  /**
   * Shows a title, subtitle or action bar message to the specified target(s).
   * Targets are specified using the Minecraft selector syntax.
   * @param target - The player(s) to display the title to.
   * @param action - The type of title command: 'title', 'subtitle', or 'actionbar'.
   * @param message - The raw JSON text component for the message.
   */
  async showTitle(
    target: string,
    action: 'title' | 'subtitle' | 'actionbar',
    message: string
  ): Promise<void> {
    const command = `title ${target} ${action} ${message}`
    await this.execute(command)
  }

  /**
   * Sets the title fade in, stay, and fade out times for the specified target(s).
   * @param target - The player(s) to set the title times for.
   * @param fadeIn - The time in ticks for the title to fade in.
   * @param stay - The time in ticks the title stays on screen.
   * @param fadeOut - The time in ticks for the title to fade out.
   */
  async setTitleTimes(
    target: string,
    fadeIn: number,
    stay: number,
    fadeOut: number
  ): Promise<void> {
    const command = `title ${target} times ${fadeIn} ${stay} ${fadeOut}`
    await this.execute(command)
  }

  /**
   * Clears the current title from the target(s) screen.
   * @param target - The player(s) to clear the title for.
   */
  async clearTitle(target: string): Promise<void> {
    const command = `title ${target} clear`
    await this.execute(command)
  }

  /**
   * Resets the title feature for the specified target(s) to default.
   * @param target - The player(s) to reset the title for.
   */
  async resetTitle(target: string): Promise<void> {
    const command = `title ${target} reset`
    await this.execute(command)
  }

  /**
   * Changes the executor player's score in a scoreboard objective with a "trigger" criterion.
   * @param objective The scoreboard objective to be modified.
   * @param action Can be 'add' to add a value or 'set' to set a value.
   * @param value The value to set or add to the scoreboard objective. (Optional for 'add' action, required for 'set')
   */
  async triggerObjective(
    objective: string,
    action: 'add' | 'set',
    value?: number
  ): Promise<number> {
    if (!objective) throw new Error('Objective is required')

    if (action === 'set' && value === undefined)
      throw new Error('Value is required when action is set')

    // Construct the trigger command
    let cmd = `trigger ${objective} `
    switch (action) {
      case 'add':
        cmd += `add ${value ?? 1}` // If no value is specified for 'add', default to 1
        break
      case 'set':
        cmd += `set ${value}` // For 'set', value must be provided and is not optional
        break
      default:
        throw new Error('Invalid action specified')
    }

    // Send the command to the Minecraft server and wait for the result
    const result = await this.execute(cmd)

    // Interpret the result based on the possible responses
    if (result?.match(/^Triggered .+/)) {
      // Command executed successfully, now extract the score
      const scoreMatch = result?.match(/\d+$/) // Extract the integer at the end of the message
      const score = scoreMatch ? parseInt(scoreMatch[0]) : null
      if (score === null)
        throw new Error(
          'Failed to retrieve the new score from the command output'
        )

      return score
    } else if (result?.match(/^No trigger objective was found$/))
      throw new Error(
        `Objective ${objective} does not exist or is not a trigger type`
      )
    else if (
      result?.match(/^You can only use trigger for a trigger objective$/)
    )
      throw new Error(`Objective ${objective} is not enabled for the player`)
    // Handle other potential error messages from the command output
    else throw new Error(result)
  }

  // Method to set the weather with optional duration.
  async setWeather(
    type: 'clear' | 'rain' | 'thunder',
    duration?: number | string
  ): Promise<void> {
    let command = `weather ${type}`
    if (duration !== undefined) command += ` ${duration}`

    const response = await this.execute(command)

    // Check response and throw an error if the command failed.
    if (!response?.startsWith('Changed the weather to '))
      throw new Error(`Failed to set weather: ${response}`)
  }

  // Method to query the current weather in Bedrock Edition.
  async queryWeather(): Promise<string> {
    const command = `weather query`
    const response = await this.execute(command)

    // Check response and throw an error if the command failed.
    if (response?.startsWith('The current weather state is ')) {
      // Parse the result from response
      const match = response.match(/^The current weather state is (\w+)$/)
      if (match && match[1]) return match[1]
    }

    throw new Error(`Failed to query weather: ${response}`)
  }

  async whitelist(
    action: 'on' | 'off' | 'reload' | 'list' | 'add' | 'remove',
    player?: string
  ): Promise<string> {
    let command = 'whitelist ' + action

    if (action === 'add' || action === 'remove') {
      if (!player)
        throw new Error(`Player name must be specified for whitelist ${action}`)

      command += ` ${player}`
    }

    try {
      const rawResult = await this.execute(command)

      if (!rawResult) throw new Error('No response from server')

      if (
        rawResult?.startsWith('Player added to whitelist') ||
        rawResult?.startsWith('Player removed from whitelist') ||
        rawResult === 'Whitelist is empty' ||
        rawResult === 'Whitelist reloaded' ||
        rawResult?.startsWith('Turned on the whitelist') ||
        rawResult?.startsWith('Turned off the whitelist')
      )
        return rawResult // Success message
      else if (
        rawResult?.startsWith('Player is already whitelisted') ||
        rawResult?.startsWith('Player is not whitelisted') ||
        rawResult?.startsWith('Could not add player to whitelist') ||
        rawResult?.startsWith('Could not remove player from whitelist') ||
        rawResult?.startsWith('Whitelist is already turned on') ||
        rawResult?.startsWith('Whitelist is already turned off')
      )
        throw new Error(rawResult) // Known error message
      else throw new Error('Unknown response or error from server')
    } catch (error) {
      throw new Error(`Failed to execute whitelist command: ${error}`)
    }
  }

  async worldborderAdd(
    distance: number,
    time?: number
  ): Promise<string | undefined> {
    const cmd = `worldborder add ${distance}${time !== undefined ? ` ${time}` : ''}`
    const rawResult = await this.execute(cmd)

    // Additional processing could be done here to handle the result
    return rawResult
  }

  async worldborderCenter(x: number, z: number): Promise<string | undefined> {
    const cmd = `worldborder center ${x} ${z}`
    const rawResult = await this.execute(cmd)

    // Additional processing could be done here to handle the result
    return rawResult
  }

  async worldborderDamageAmount(
    damagePerBlock: number
  ): Promise<string | undefined> {
    const cmd = `worldborder damage amount ${damagePerBlock}`
    const rawResult = await this.execute(cmd)

    // Additional processing could be done here to handle the result
    return rawResult
  }

  async worldborderDamageBuffer(distance: number): Promise<string | undefined> {
    const cmd = `worldborder damage buffer ${distance}`
    const rawResult = await this.execute(cmd)

    // Additional processing could be done here to handle the result
    return rawResult
  }

  async worldborderGet(): Promise<number> {
    const cmd = `worldborder get`
    const rawResult = await this.execute(cmd)

    // Assuming the result is parsed to extract the diameter
    const match = rawResult?.match(/\d+/)
    if (match) return parseInt(match[0])
    else throw new Error('Failed to get worldborder size')
  }

  async worldborderSet(
    distance: number,
    time?: number
  ): Promise<string | undefined> {
    const cmd = `worldborder set ${distance}${time !== undefined ? ` ${time}` : ''}`
    const rawResult = await this.execute(cmd)

    // Additional processing could be done here to handle the result
    return rawResult
  }

  async worldborderWarningDistance(
    distance: number
  ): Promise<string | undefined> {
    const cmd = `worldborder warning distance ${distance}`
    const rawResult = await this.execute(cmd)

    // Additional processing could be done here to handle the result
    return rawResult
  }

  async worldborderWarningTime(time: number): Promise<string | undefined> {
    const cmd = `worldborder warning time ${time}`
    const rawResult = await this.execute(cmd)

    // Additional processing could be done here to handle the result
    return rawResult
  }
}
