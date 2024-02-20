import { Minecraft } from './extension-minecraft'
import { BanListResult, BanType, MinecraftBanError } from './minecraft-types'

export class Ban extends Minecraft {
  /**
   * Bans a player.
   * @param {string} target - The name of the player to ban.
   * @param {string} [reason] - The reason for the ban. This is optional.
   * @returns {Promise<string | undefined>} A promise that resolves with the result of the ban command.
   * @throws {MinecraftBanError} Will throw a MinecraftBanError if the command execution fails.
   */
  async ban(target: string, reason?: string): Promise<string | undefined> {
    const command = `ban ${target} ${reason || ''}`.trim()
    try {
      return await this.execute(command)
    } catch (error) {
      throw new MinecraftBanError('Failed to ban player', command)
    }
  }

  /**
   * Bans an IP.
   * @param {string} target - The IP to ban.
   * @param {string} [reason] - The reason for the ban. This is optional.
   * @returns {Promise<string | undefined>} A promise that resolves with the result of the ban command.
   * @throws {MinecraftBanError} Will throw a MinecraftBanError if the command execution fails.
   */
  async banIp(target: string, reason?: string): Promise<string | undefined> {
    const command = `ban-ip ${target} ${reason || ''}`.trim()
    try {
      return await this.execute(command)
    } catch (error) {
      throw new MinecraftBanError('Failed to ban IP', command)
    }
  }

  /**
   * Removes a player from the banlist.
   * @param {string} target - The name of the player to pardon.
   * @returns {Promise<string | undefined>} A promise that resolves with the result of the pardon command.
   * @throws {MinecraftBanError} Will throw a MinecraftBanError if the command execution fails.
   */
  async pardon(target: string): Promise<string | undefined> {
    const command = `pardon ${target}`
    try {
      return await this.execute(command)
    } catch (error) {
      throw new MinecraftBanError('Failed to pardon player', command)
    }
  }

  /**
   * Removes an IP from the banlist.
   * @param {string} target - The IP to pardon.
   * @returns {Promise<string | undefined>} A promise that resolves with the result of the pardon command.
   * @throws {MinecraftBanError} Will throw a MinecraftBanError if the command execution fails.
   */
  async pardonIp(target: string): Promise<string | undefined> {
    const command = `pardon-ip ${target}`
    try {
      return await this.execute(command)
    } catch (error) {
      throw new MinecraftBanError('Failed to pardon IP', command)
    }
  }

  /**
   * Gets the banlist of players or IPs.
   * @param {BanType} [type='players'] - The type of banlist to retrieve. This is optional and defaults to 'players'.
   * @returns {Promise<BanListResult>} A promise that resolves with the banlist.
   * @throws {MinecraftBanError} Will throw a MinecraftBanError if the command execution fails.
   */
  async listBans(type: BanType = 'players'): Promise<BanListResult> {
    const command = `banlist ${type}`
    try {
      const result = await this.execute(command)
      const bans = this.parseBanListResult(result)

      return { bans }
    } catch (error) {
      throw new MinecraftBanError('Failed to retrieve ban list', command)
    }
  }

  /**
   * Parses the raw result of the ban list command.
   * @param {string | undefined} rawResult - The raw result string to parse.
   * @returns {string[]} The parsed banlist.
   * @private
   */
  private parseBanListResult(rawResult: string | undefined): string[] {
    // Parse the raw result string to extract banned player names or IP addresses
    const bans = rawResult
      ?.split('\n')[1] // Assuming the second line contains the list
      .split(', ')
      .map(ban => ban.trim())

    return bans || []
  }

  /**
   * Executes a command and handles errors specific to ban management.
   * @param {string} command - The command to execute.
   * @returns {Promise<string | undefined>} A promise that resolves with the result of the command.
   * @throws {MinecraftBanError} Will throw a MinecraftBanError if the command execution fails.
   * @protected
   * @override
   */
  protected async execute(command: string): Promise<string | undefined> {
    try {
      return await super.execute(command)
    } catch (error) {
      throw new MinecraftBanError(
        `Error executing command: ${command}`,
        command
      )
    }
  }
}
