import { Minecraft } from './extension-minecraft'
import {
  ScoreboardObjective,
  ScoreboardPlayer,
  ScoreboardOperation,
  MinecraftError
} from './minecraft-types'

/**
 * Class representing the scoreboard in Minecraft.
 * @extends {Minecraft}
 */
export class Scoreboard extends Minecraft {
  /**
   * Lists all scoreboard objectives or objectives for a specific team.
   * @param {string} [teamName] - The name of the team. This is optional.
   * @returns {Promise<string[] | undefined>} A promise that resolves with the list of objectives.
   */
  async listObjectives(teamName?: string): Promise<string[] | undefined> {
    const command = teamName
      ? `scoreboard objectives list ${teamName}`
      : 'scoreboard objectives list'
    const rawResult = await this.execute(command)

    // Assume the server returns a list or an indication that there are no objectives
    if (rawResult === 'No objectives were found') return []

    // Parse the objectives from the rawResult using a custom parsing method if necessary
    return rawResult?.split('\n').map(line => line.trim()) // Example parsing
  }

  /**
   * Adds a new scoreboard objective.
   * @param {ScoreboardObjective} objective - The objective to add.
   * @returns {Promise<void>} A promise that resolves when the objective is added.
   * @throws {MinecraftError} Will throw a MinecraftError if the command execution fails.
   */
  async addObjective(objective: ScoreboardObjective): Promise<void> {
    const command = `scoreboard objectives add ${objective.name} ${objective.criteria} ${objective.displayName || ''}`
    const rawResult = await this.execute(command)

    if (
      !rawResult?.startsWith(
        `Added new objective '${objective.name}' successfully`
      )
    )
      throw new MinecraftError('Failed to add a new objective', command)
  }

  /**
   * Removes an existing scoreboard objective.
   * @param {string} objectiveName - The name of the objective to remove.
   * @returns {Promise<void>} A promise that resolves when the objective is removed.
   * @throws {MinecraftError} Will throw a MinecraftError if the command execution fails.
   */
  async removeObjective(objectiveName: string): Promise<void> {
    const command = `scoreboard objectives remove ${objectiveName}`
    const rawResult = await this.execute(command)

    if (!rawResult?.startsWith(`Removed objective '${objectiveName}'`))
      throw new MinecraftError('Failed to remove objective', command)
  }

  /**
   * Sets the display slot of an objective.
   * @param {string} slot - The slot to set.
   * @param {string} [objectiveName] - The name of the objective. This is optional.
   * @returns {Promise<void>} A promise that resolves when the display slot is set.
   */
  async setDisplaySlot(slot: string, objectiveName?: string): Promise<void> {
    const command = `scoreboard objectives setdisplay ${slot} ${objectiveName || ''}`
    await this.execute(command) // No result parsing needed if we don't expect output
  }

  /**
   * Modifies an objective's display name.
   * @param {string} objectiveName - The name of the objective.
   * @param {string} displayName - The new display name.
   * @returns {Promise<void>} A promise that resolves when the display name is modified.
   */
  async modifyObjectiveDisplayName(
    objectiveName: string,
    displayName: string
  ): Promise<void> {
    const command = `scoreboard objectives modify ${objectiveName} displayname ${displayName}`
    await this.execute(command) // No result parsing needed if we don't expect output
  }

  /**
   * Modifies an objective's render type.
   * @param {string} objectiveName - The name of the objective.
   * @param {string} renderType - The new render type.
   * @returns {Promise<void>} A promise that resolves when the render type is modified.
   */
  async modifyObjectiveRenderType(
    objectiveName: string,
    renderType: string
  ): Promise<void> {
    const command = `scoreboard objectives modify ${objectiveName} rendertype ${renderType}`
    await this.execute(command) // No result parsing needed if we don't expect output
  }

  /**
   * Lists players on a scoreboard or a specific player's scores.
   * @param {string} [target] - The target player. This is optional.
   * @returns {Promise<string[] | undefined>} A promise that resolves with the list of players.
   */
  async listPlayers(target?: string): Promise<string[] | undefined> {
    const command = `scoreboard players list ${target || ''}`
    const rawResult = await this.execute(command)

    // Parse the players from the rawResult if required
    return rawResult?.split('\n').map(line => line.trim()) // Example parsing
  }

  /**
   * Gets a player's score in an objective.
   * @param {string} target - The target player.
   * @param {string} objective - The objective.
   * @returns {Promise<number>} A promise that resolves with the player's score.
   * @throws {MinecraftError} Will throw a MinecraftError if the command execution fails.
   */
  async getPlayerScore(target: string, objective: string): Promise<number> {
    const command = `scoreboard players get ${target} ${objective}`
    const rawResult = await this.execute(command)

    const match = rawResult?.match(/\d+/)
    if (match) return parseInt(match[0], 10)
    else throw new MinecraftError('Failed to get player score', command)
  }

  /**
   * Modifies a player's score.
   * @param {ScoreboardPlayer} player - The player whose score to modify.
   * @param {ScoreboardOperation} operation - The operation to perform on the score.
   * @returns {Promise<void>} A promise that resolves when the player's score is modified.
   */
  async modifyPlayerScore(
    player: ScoreboardPlayer,
    operation: ScoreboardOperation
  ): Promise<void> {
    const operationCommand =
      operation === 'reset' ? operation : `${operation} ${player.score}`
    const command = `scoreboard players ${operationCommand} ${player.name} ${player.objective}`
    await this.execute(command) // No result parsing needed if we don't expect output
  }
}
