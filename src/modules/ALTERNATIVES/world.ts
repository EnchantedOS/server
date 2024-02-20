// Import or define types (Coordinate, CommandResult, MinecraftError).
// For the sake of this example, I'll assume they are imported.

import {
  Coordinate,
  MinecraftError,
  WeatherType,
  BlockState,
  TimeAction
} from '../../minecraft-types'
import { Minecraft } from './extension-minecraft'

/**
 * Gets the online players.
 * @returns {Promise<{online: number, max: number, players: string[] | undefined}>} A promise that resolves with the online players.
 */
export class World extends Minecraft {
  /**
   * Sets the center of the world border.
   * @param {Coordinate} center - The coordinates of the new center.
   * @returns {Promise<void>} A promise that resolves when the command is executed.
   */
  async setWorldBorderCenter(center: Coordinate): Promise<void> {
    const command = `worldborder center ${center.x} ${center.z}`
    await this.executeWorldManagementCommand(command)
  }

  /**
   * Sets the size of the world border.
   * @param {number} size - The new size of the world border.
   * @param {number} [time] - The time in seconds for the world border to reach its new size. This is optional.
   * @returns {Promise<void>} A promise that resolves when the command is executed.
   */
  async setWorldBorderSize(size: number, time?: number): Promise<void> {
    const command = `worldborder set ${size}${time ? ' ' + time : ''}`
    await this.executeWorldManagementCommand(command)
  }

  /**
   * Sets the amount of damage players receive when outside the world border.
   * @param {number} amount - The new amount of damage.
   * @param {number} [buffer] - The distance outside the world border a player can be before taking damage. This is optional.
   * @returns {Promise<void>} A promise that resolves when the command is executed.
   */
  async setWorldBorderDamage(amount: number, buffer?: number): Promise<void> {
    await this.executeWorldManagementCommand(
      `worldborder damage amount ${amount}`
    )
    if (buffer !== undefined)
      await this.executeWorldManagementCommand(
        `worldborder damage buffer ${buffer}`
      )
  }

  /**
   * Sets the warning distance or time for the world border.
   * @param {number} distance - The new warning distance.
   * @param {number} [time] - The new warning time. This is optional.
   * @returns {Promise<void>} A promise that resolves when the command is executed.
   */
  async setWorldBorderWarning(distance: number, time?: number): Promise<void> {
    await this.executeWorldManagementCommand(
      `worldborder warning distance ${distance}`
    )
    if (time !== undefined)
      await this.executeWorldManagementCommand(
        `worldborder warning time ${time}`
      )
  }

  /**
   * Gets the current size of the world border.
   * @returns {Promise<number>} A promise that resolves with the current size of the world border.
   */
  async getWorldBorderSize(): Promise<number> {
    const result = await this.execute('worldborder get')

    // eslint-disable-next-line radix
    return parseInt(<string>result, 10) // Parsing assumes the server's response is directly the size.
  }

  /**
   * Sets the time in the Minecraft world.
   * @param {TimeAction} timeAction - The action to perform on the time.
   * @param {string | number} [value] - The value to set the time to. This is optional.
   * @returns {Promise<void>} A promise that resolves when the command is executed.
   */
  async setTime(
    timeAction: TimeAction,
    value?: string | number
  ): Promise<void> {
    const command = `time ${timeAction}${value !== undefined ? ' ' + value : ''}`
    await this.executeWorldManagementCommand(command)
  }

  /**
   * Sets the weather in the Minecraft world.
   * @param {WeatherType} weatherType - The type of weather to set.
   * @param {number} [duration] - The duration for which the weather should last. This is optional.
   * @returns {Promise<void>} A promise that resolves when the command is executed.
   */
  async setWeather(weatherType: WeatherType, duration?: number): Promise<void> {
    const command = `weather ${weatherType}${duration ? ' ' + duration : ''}`
    await this.executeWorldManagementCommand(command)
  }

  /**
   * Sets the world spawn point.
   * @param {Coordinate} location - The coordinates of the new spawn point.
   * @param {number} [angle] - The angle at which players will spawn. This is optional.
   * @returns {Promise<void>} A promise that resolves when the command is executed.
   */
  async setWorldSpawn(location: Coordinate, angle?: number): Promise<void> {
    const command = `setworldspawn ${location.x} ${location.y} ${location.z}${angle ? ' ' + angle : ''}`
    await this.executeWorldManagementCommand(command)
  }

  /**
   * Sets the state of a block.
   * @param {Coordinate} position - The coordinates of the block.
   * @param {BlockState} blockState - The new state of the block.
   * @param {'destroy' | 'keep' | 'replace'} [oldBlockHandling] - How to handle the existing block. This is optional and defaults to 'replace'.
   * @returns {Promise<void>} A promise that resolves when the command is executed.
   */
  async setBlockState(
    position: Coordinate,
    blockState: BlockState,
    oldBlockHandling?: 'destroy' | 'keep' | 'replace'
  ): Promise<void> {
    const command = `setblock ${position.x} ${position.y} ${position.z} ${blockState} ${oldBlockHandling ?? 'replace'}`
    await this.executeWorldManagementCommand(command)
  }

  /**
   * Executes a world management command and handles errors.
   * @param {string} command - The command to execute.
   * @returns {Promise<void>} A promise that resolves when the command is executed.
   * @throws {MinecraftError} Will throw a MinecraftError if the command execution fails.
   * @private
   */
  private async executeWorldManagementCommand(command: string): Promise<void> {
    const result = await this.execute(command)
    const successMessagePrefixes = ['Changed', 'Set', 'The world spawn'] // Update if necessary.
    if (!successMessagePrefixes.some(prefix => result?.startsWith(prefix)))
      throw new MinecraftError(
        `World Management Command failed: ${result}`,
        command
      )
  }
}
