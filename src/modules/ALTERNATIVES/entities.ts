import { Minecraft } from './extension-minecraft'
import { CommandResult, Entity, EntityTarget } from './minecraft-types'

/**
 * Class representing the entities in Minecraft.
 * @extends {Minecraft}
 */
export class Entities extends Minecraft {
  /**
   * Summon an entity at a specified location with optional NBT data.
   * @param {Entity} entity - The entity to summon.
   * @returns {Promise<CommandResult>} A promise that resolves with the result of the summon command.
   */
  async summon(entity: Entity): Promise<CommandResult> {
    let command = `summon ${entity.entityType}`
    if (entity.position)
      command += ` ${entity.position.x} ${entity.position.y} ${entity.position.z}`

    if (entity.nbtData) command += ` ${entity.nbtData}`

    const result = await this.execute(command)

    return this.parseCommandResult(result || '')
  }

  /**
   * Kill one or more entities.
   * @param {EntityTarget} target - The target entities to kill.
   * @returns {Promise<CommandResult>} A promise that resolves with the result of the kill command.
   */
  async kill(target: EntityTarget): Promise<CommandResult> {
    const command = `kill ${target}`
    const result = await this.execute(command)

    return this.parseCommandResult(result || '')
  }

  /**
   * Modify the properties or behavior of entities.
   * @param {Entity} entity - The entity to modify.
   * @param {string[]} modifications - The modifications to apply.
   * @returns {Promise<CommandResult>} A promise that resolves with the result of the modify command.
   */
  async modifyEntity(
    entity: Entity,
    modifications: string[]
  ): Promise<CommandResult> {
    const commands = modifications.map(
      mod => `data merge entity ${entity.entityType} ${mod}`
    )

    const results: CommandResult[] = []
    for (const cmd of commands) {
      const result = await this.execute(cmd)
      results.push(this.parseCommandResult(result || ''))
    }

    return this.aggregateCommandResults(results)
  }

  /**
   * Parse the result of a command.
   * @param {string} rawResult - The raw result string to parse.
   * @returns {CommandResult} The parsed command result.
   * @private
   */
  private parseCommandResult(rawResult: string): CommandResult {
    if (rawResult.startsWith('Error'))
      return { success: false, message: rawResult }

    return { success: true, message: rawResult }
  }

  /**
   * Aggregate multiple command results.
   * @param {CommandResult[]} results - The command results to aggregate.
   * @returns {CommandResult} The aggregated command result.
   * @private
   */
  private aggregateCommandResults(results: CommandResult[]): CommandResult {
    return results.reduce<CommandResult>(
      (prev, curr) => ({
        success: prev.success && curr.success,
        message: (prev.message || '') + '\n' + curr.message
      }),
      { success: true, message: '' }
    )
  }
}
