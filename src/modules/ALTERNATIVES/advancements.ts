import { Minecraft } from './extension-minecraft'
import {
  Advancement,
  AdvancementAction,
  AdvancementTarget,
  Criterion,
  MinecraftError
} from './minecraft-types'

/**
 * Class representing the advancements in Minecraft.
 * @extends {Minecraft}
 */
export class Advancements extends Minecraft {
  /**
   * Grants or takes an advancement or its criterion from one or more players.
   * @param {AdvancementAction} action - The action to be performed. It can be 'grant' or 'revoke'.
   * @param {AdvancementTarget} target - The target on which the action is to be performed. It can be a player name, target selector, or UUID.
   * @param {Advancement} [advancement] - The resource location of the advancement. This is optional.
   * @param {Criterion} [criterion] - A valid criterion of the advancement. This is optional.
   * @returns {Promise<void>} A promise that resolves when the command is executed.
   * @throws {Error} Will throw an error if the action is not 'grant' or 'revoke'.
   * @throws {MinecraftError} Will throw a MinecraftError if the command execution fails.
   */
  async manageAdvancement(
    action: AdvancementAction,
    target: AdvancementTarget,
    advancement?: Advancement,
    criterion?: Criterion
  ): Promise<void> {
    if (!['grant', 'revoke'].includes(action))
      throw new Error('Advancement action must be "grant" or "revoke".')

    let command = `advancement ${action} ${target}`
    if (advancement) {
      command += ` only ${advancement}`
      if (criterion) command += ` ${criterion}`
    } else command += ` everything`

    try {
      await this.execute(command)
    } catch (error) {
      throw new MinecraftError('Failed to execute advancement command', command)
    }
  }
}
