import { Minecraft } from './extension-minecraft'
import { Coordinate, Rotation, TitleDisplayTimes } from './minecraft-types'

/**
 * Queries the current day in the Minecraft world.
 * @returns {Promise<number>} A promise that resolves with the current day.
 */
export class Interactions extends Minecraft {
  /**
   * Sends a text message to a player.
   * @param {string} target - The name of the player to send the message to.
   * @param {string} message - The message to send.
   * @returns {Promise<void>} A promise that resolves when the message is sent.
   */
  async sendMessage(target: string, message: string): Promise<void> {
    const command = `tell ${target} ${message}`
    await this.execute(command)
  }

  /**
   * Teleports a player to a location.
   * @param {string} target - The name of the player to teleport.
   * @param {Coordinate} location - The location to teleport the player to.
   * @param {Rotation} [rotation] - The rotation to apply to the player after teleportation. This is optional.
   * @returns {Promise<void>} A promise that resolves when the player is teleported.
   */
  async teleport(
    target: string,
    location: Coordinate,
    rotation?: Rotation
  ): Promise<void> {
    let command = `tp ${target} ${location.x} ${location.y} ${location.z}`
    if (rotation) command += ` ${rotation.yRot} ${rotation.xRot}`

    await this.execute(command)
  }

  /**
   * Shows a title to a player.
   * @param {string} target - The name of the player to show the title to.
   * @param {string} title - The title to show.
   * @param {string} [subtitle] - The subtitle to show. This is optional.
   * @param {TitleDisplayTimes} [times] - The display times for the title. This is optional.
   * @returns {Promise<void>} A promise that resolves when the title is shown.
   */
  async showTitle(
    target: string,
    title: string,
    subtitle?: string,
    times?: TitleDisplayTimes
  ): Promise<void> {
    if (times) await this.setTitleTimes(target, times)

    await this.execute(`title ${target} title {"text":"${title}"}`)
    if (subtitle)
      await this.execute(`title ${target} subtitle {"text":"${subtitle}"}`)
  }

  /**
   * Sets the title display times.
   * @param {string} target - The name of the player to set the title display times for.
   * @param {TitleDisplayTimes} times - The display times to set.
   * @returns {Promise<void>} A promise that resolves when the title display times are set.
   */
  async setTitleTimes(target: string, times: TitleDisplayTimes): Promise<void> {
    const command = `title ${target} times ${times.fadeIn} ${times.stay} ${times.fadeOut}`
    await this.execute(command)
  }

  /**
   * Clears the title from the player's screen.
   * @param {string} target - The name of the player to clear the title for.
   * @returns {Promise<void>} A promise that resolves when the title is cleared.
   */
  async clearTitle(target: string): Promise<void> {
    const command = `title ${target} clear`
    await this.execute(command)
  }

  /**
   * Resets the title settings to their default values.
   * @param {string} target - The name of the player to reset the title settings for.
   * @returns {Promise<void>} A promise that resolves when the title settings are reset.
   */
  async resetTitle(target: string): Promise<void> {
    const command = `title ${target} reset`
    await this.execute(command)
  }

  /**
   * Shows an action bar message to a player.
   * @param {string} target - The name of the player to show the action bar message to.
   * @param {string} message - The message to show.
   * @returns {Promise<void>} A promise that resolves when the action bar message is shown.
   */
  async showActionbar(target: string, message: string): Promise<void> {
    const command = `title ${target} actionbar {"text":"${message}"}`
    await this.execute(command)
  }

  /**
   * Sends a JSON-formatted message using tellraw.
   * @param {string} target - The name of the player to send the message to.
   * @param {string} jsonMessage - The JSON-formatted message to send.
   * @returns {Promise<void>} A promise that resolves when the message is sent.
   */
  async tellRaw(target: string, jsonMessage: string): Promise<void> {
    const command = `tellraw ${target} ${jsonMessage}`
    await this.execute(command)
  }

  /**
   * Gets the online players.
   * @returns {Promise<{online: number, max: number, players: string[] | undefined}>} A promise that resolves with the online players.
   */
  async getOnline() {
    const result = await this.scriptServer?.rconConnection.send('list')
    const online = result?.match(
      /^There are (\d+) of a max of (\d+) players online:\s?(.+)?$/
    )

    if (!online)
      throw new Error('util.getOnline: Could not parse list command result')

    return {
      online: parseInt(online[1], 10),
      max: parseInt(online[2], 10),
      players: online[3]?.split(',')
    }
  }
}
