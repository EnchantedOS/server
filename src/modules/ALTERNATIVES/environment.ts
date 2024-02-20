import { Minecraft } from './extension-minecraft'
import {
  Difficulty,
  MinecraftError,
  TimeAction,
  WeatherType
} from './minecraft-types'

/**
 * Class representing the environment in Minecraft.
 * @extends {Minecraft}
 */
export class Environment extends Minecraft {
  /**
   * Sets the weather in the Minecraft world.
   * @param {WeatherType} type - The type of weather to set.
   * @param {number} [duration] - The duration for which the weather should last. This is optional.
   * @returns {Promise<string | undefined>} A promise that resolves with the result of the weather command.
   */
  public async setWeather(
    type: WeatherType,
    duration?: number
  ): Promise<string | undefined> {
    const command = `weather ${type}${duration !== undefined ? ` ${duration}` : ''}`

    return await this.execute(command)
  }

  /**
   * Sets the time in the Minecraft world.
   * @param {TimeAction} action - The action to perform on the time.
   * @param {string | number} value - The value to set the time to.
   * @returns {Promise<string | undefined>} A promise that resolves with the result of the time command.
   */
  public async setTime(
    action: TimeAction,
    value: string | number
  ): Promise<string | undefined> {
    const command = `time ${action} ${value}`

    return await this.execute(command)
  }

  /**
   * Gets the current time in the Minecraft world.
   * @returns {Promise<number>} A promise that resolves with the current time.
   */
  public getTime(): Promise<number> {
    return this.execute('time query daytime').then(result => {
      const match = result?.match(/The time is (\d+)/)
      if (!match) throw new MinecraftError('Invalid time query result')

      return parseInt(match[1])
    })
  }

  /**
   * Changes the difficulty in the Minecraft world.
   * @param {Difficulty} difficulty - The difficulty to set.
   * @returns {Promise<string | undefined>} A promise that resolves with the result of the difficulty command.
   */
  public async changeDifficulty(
    difficulty: Difficulty
  ): Promise<string | undefined> {
    const command = `difficulty ${difficulty}`

    return await this.execute(command)
  }

  /**
   * Queries the current difficulty in the Minecraft world.
   * @returns {Promise<Difficulty>} A promise that resolves with the current difficulty.
   */
  public async queryDifficulty(): Promise<Difficulty> {
    return this.execute('difficulty query').then(result => {
      const match = result?.match(/The difficulty is (\w+)/)
      if (!match) throw new MinecraftError('Invalid difficulty query result')

      return match[1] as Difficulty
    })
  }

  /**
   * Queries the current weather in the Minecraft world.
   * @returns {Promise<WeatherType>} A promise that resolves with the current weather.
   */
  public async queryWeather(): Promise<WeatherType> {
    return this.execute('weather query').then(result => {
      const match = result?.match(/The weather is now (\w+)/)
      if (!match) throw new MinecraftError('Invalid weather query result')

      return match[1] as WeatherType
    })
  }

  /**
   * Queries the current time in the Minecraft world.
   * @returns {Promise<number>} A promise that resolves with the current time.
   */
  public async queryTime(): Promise<number> {
    return this.execute('time query').then(result => {
      const match = result?.match(/The time is (\d+)/)
      if (!match) throw new MinecraftError('Invalid time query result')

      return parseInt(match[1])
    })
  }

  /**
   * Queries the current daytime in the Minecraft world.
   * @returns {Promise<number>} A promise that resolves with the current daytime.
   */
  public async queryDayTime(): Promise<number> {
    return this.execute('time query daytime').then(result => {
      const match = result?.match(/The time is (\d+)/)
      if (!match) throw new MinecraftError('Invalid time query result')

      return parseInt(match[1])
    })
  }

  /**
   * Queries the current day in the Minecraft world.
   * @returns {Promise<number>} A promise that resolves with the current day.
   */
  public async queryDay(): Promise<number> {
    return this.execute('time query day').then(result => {
      const match = result?.match(/The time is (\d+)/)
      if (!match) throw new MinecraftError('Invalid time query result')

      return parseInt(match[1])
    })
  }
}
