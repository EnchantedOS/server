import { Minecraft } from './extension-minecraft'
import { EntityTarget, MinecraftError, Attribute } from './minecraft-types'

export class Attributes extends Minecraft {
  /**
   * Get the value of the specified attribute.
   * @param {EntityTarget} target - The target entity from which to get the attribute.
   * @param {Attribute} attribute - The attribute to get.
   * @param {number} [scale] - The scale to apply to the attribute value. This is optional.
   * @returns {Promise<number>} A promise that resolves with the attribute value.
   * @throws {MinecraftError} Will throw a MinecraftError if the command execution fails.
   */
  async getAttribute(
    target: EntityTarget,
    attribute: Attribute,
    scale?: number
  ): Promise<number> {
    const command = `attribute ${target} ${attribute} get${scale !== undefined ? ` ${scale}` : ''}`
    const rawResult = await this.execute(command)
    if (rawResult?.match(/^Could not get attribute/))
      throw new MinecraftError('Failed to get attribute', command)

    return parseFloat(rawResult?.match(/(\d+\.?\d*)/)?.[0] || '')
  }

  /**
   * Get the base value of the specified attribute.
   * @param {EntityTarget} target - The target entity from which to get the attribute base.
   * @param {Attribute} attribute - The attribute to get the base of.
   * @param {number} [scale] - The scale to apply to the attribute base value. This is optional.
   * @returns {Promise<number>} A promise that resolves with the attribute base value.
   * @throws {MinecraftError} Will throw a MinecraftError if the command execution fails.
   */
  async getAttributeBase(
    target: EntityTarget,
    attribute: Attribute,
    scale?: number
  ): Promise<number> {
    const command = `attribute ${target} ${attribute} base get${scale !== undefined ? ` ${scale}` : ''}`
    const rawResult = await this.execute(command)
    if (rawResult?.match(/^Could not get attribute base/))
      throw new MinecraftError('Failed to get attribute base', command)

    return parseFloat(rawResult?.match(/(\d+\.?\d*)/)?.[0] || '')
  }

  /**
   * Set the base value of the specified attribute.
   * @param {EntityTarget} target - The target entity on which to set the attribute base.
   * @param {Attribute} attribute - The attribute to set the base of.
   * @param {number} value - The value to set as the attribute base.
   * @returns {Promise<void>} A promise that resolves when the command is executed.
   * @throws {MinecraftError} Will throw a MinecraftError if the command execution fails.
   */
  async setAttributeBase(
    target: EntityTarget,
    attribute: Attribute,
    value: number
  ): Promise<void> {
    const command = `attribute ${target} ${attribute} base set ${value}`
    const rawResult = await this.execute(command)
    if (rawResult?.match(/^Could not set attribute base/))
      throw new MinecraftError('Failed to set attribute base', command)
  }

  /**
   * Add an attribute modifier.
   * @param {EntityTarget} target - The target entity on which to add the attribute modifier.
   * @param {Attribute} attribute - The attribute to which to add the modifier.
   * @param {string} uuid - The UUID of the modifier.
   * @param {string} name - The name of the modifier.
   * @param {number} value - The value of the modifier.
   * @param {'add' | 'multiply' | 'multiply_base'} operation - The operation of the modifier.
   * @returns {Promise<void>} A promise that resolves when the command is executed.
   * @throws {MinecraftError} Will throw a MinecraftError if the command execution fails.
   */
  async addAttributeModifier(
    target: EntityTarget,
    attribute: Attribute,
    uuid: string,
    name: string,
    value: number,
    operation: 'add' | 'multiply' | 'multiply_base'
  ): Promise<void> {
    const command = `attribute ${target} ${attribute} modifier add ${uuid} ${name} ${value} ${operation}`
    const rawResult = await this.execute(command)
    if (rawResult?.match(/^Could not add attribute modifier/))
      throw new MinecraftError('Failed to add attribute modifier', command)
  }

  /**
   * Remove an attribute modifier.
   * @param {EntityTarget} target - The target entity from which to remove the attribute modifier.
   * @param {Attribute} attribute - The attribute from which to remove the modifier.
   * @param {string} uuid - The UUID of the modifier to remove.
   * @returns {Promise<void>} A promise that resolves when the command is executed.
   * @throws {MinecraftError} Will throw a MinecraftError if the command execution fails.
   */
  async removeAttributeModifier(
    target: EntityTarget,
    attribute: Attribute,
    uuid: string
  ): Promise<void> {
    const command = `attribute ${target} ${attribute} modifier remove ${uuid}`
    const rawResult = await this.execute(command)
    if (rawResult?.match(/^Could not remove attribute modifier/))
      throw new MinecraftError('Failed to remove attribute modifier', command)
  }

  /**
   * Get the value of a specific attribute modifier.
   * @param {EntityTarget} target - The target entity from which to get the attribute modifier value.
   * @param {Attribute} attribute - The attribute from which to get the modifier value.
   * @param {string} uuid - The UUID of the modifier to get the value of.
   * @param {number} [scale] - The scale to apply to the modifier value. This is optional.
   * @returns {Promise<number>} A promise that resolves with the modifier value.
   * @throws {MinecraftError} Will throw a MinecraftError if the command execution fails.
   */
  async getAttributeModifierValue(
    target: EntityTarget,
    attribute: Attribute,
    uuid: string,
    scale?: number
  ): Promise<number> {
    const command = `attribute ${target} ${attribute} modifier value get ${uuid}${scale !== undefined ? ` ${scale}` : ''}`
    const rawResult = await this.execute(command)
    if (rawResult?.match(/^Could not get attribute modifier value/))
      throw new MinecraftError(
        'Failed to get attribute modifier value',
        command
      )

    return parseFloat(rawResult?.match(/(\d+\.?\d*)/)?.[0] || '')
  }
}
