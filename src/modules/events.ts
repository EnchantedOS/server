import { JavaServer, JavaServerEvents } from '@scriptserver/core'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import get from 'lodash.get'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import defaultsDeep from './dd.js'

export interface EventConfig {
  initialized: boolean
  flavorSpecific: {
    [flavor: string]: {
      parseChatEvent: (consoleOutput: string) => {
        player: string
        message: string
      } | void
      parseLoginEvent: (consoleOutput: string) => {
        player: string
        ip: string
      } | void
      parseLogoutEvent: (consoleOutput: string) => {
        player: string
        reason: string
      } | void
      parseAchievementEvent: (consoleOutput: string) => {
        player: string
        achievement: string
      } | void
    }
  }
}

declare module '@scriptserver/core/dist/JavaServer' {
  interface JavaServerEvents {
    chat: (event: {
      player: string
      message: string
      timestamp: number
    }) => void
    overloaded: (event: {
      msBehind: number
      ticksBehind: number
      timestamp: number
    }) => void
    terminal: (event: { message: string; timestamp: number }) => void
    login: (event: {
      player: string
      ip: string
      timestamp: number
      x: number
      y: number
      z: number
    }) => void
    teleported: (event: {
      player: string
      timestamp: number
      x: number
      y: number
      z: number
    }) => void
    logout: (event: {
      player: string
      reason: string
      timestamp: number
    }) => void
    uuid: (event: { player: string; uuid: string; timestamp: number }) => void
    done: (event: { seconds: string; timestamp: number }) => void
    taken: (event: {
      player: string
      amount: number
      timestamp: number
    }) => void
    cleared: (event: {
      player: string
      amount: number
      timestamp: number
    }) => void
    slain: (event: {
      player: string
      by: string
      killer: string
      timestamp: number
    }) => void
    achievement: (event: {
      player: string
      achievement: string
      timestamp: number
    }) => void
  }
}

declare module '@scriptserver/core/dist/Config' {
  interface Config {
    event: EventConfig
  }
}

const DEFAULT_EVENT_CONFIG: EventConfig = {
  initialized: false,
  flavorSpecific: {
    default: {
      parseChatEvent(consoleOutput) {
        const parsed = consoleOutput.match(/^\[.+?\]: <(\w+)> (.*)/i)
        if (parsed)
          return {
            player: parsed[1] as string,
            message: parsed[2] as string
          }
      },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      parseTerminalEvent(consoleOutput) {
        const parsed = consoleOutput.match(/]:(.*)/)
        if (parsed)
          return {
            player: null,
            message: parsed[1] as string
          }
      },
      parseOverloadedEvent(string: string) {
        // parse ticks behind and ms behind
        const parsed = string.match(
          /Can't keep up! Is the server overloaded\? Running (\d+)ms or (\d+) ticks behind/i
        )
        if (parsed && parsed.length >= 3)
          return {
            msBehind: parseInt(parsed[1]), // Extract the number of milliseconds behind
            ticksBehind: parseInt(parsed[2]) // Extract the number of ticks behind
          }
        // If the string doesn't match, we should probably return null or throw an error
        else return null
      },
      parseLoginEvent(string) {
        // [21:13:47] [Server thread/INFO]: rgby[/127.0.0.1:57522] logged in with entity id 938 at (817.3862453363921, 64.0, -1029.6262779765661)
        const parsed = string.match(
          /^\[.+?\]: (\w+)(\[\/([\d.:]+)\])? logged in.*?at \(([-.\d]+), ([-.\d]+), ([-.\d]+)\)/
        )
        if (parsed)
          return {
            player: parsed[1],
            ip: parsed[3],
            x: parseFloat(parsed[4]),
            y: parseFloat(parsed[5]),
            z: parseFloat(parsed[6])
          }
      },
      parseLogoutEvent(string) {
        const parsed = string.match(/^\[.+?\]: (\w+) lost connection: (.+)/)
        if (parsed)
          return {
            player: parsed[1],
            reason: parsed[2]
          }
      },
      parseAchievementEvent(string) {
        const parsed = string.match(
          /^\[.+?\]: (\w+) has made the advancement \[([\w\s]+)\]/
        )
        if (parsed)
          return {
            player: parsed[1],
            achievement: parsed[2]
          }
      },
      parseTeleportedEvent(string: string) {
        const stripped = string.match(
          /Teleported ([\w]+) to ([-.\d]+),\s([-.\d]+),\s([-.\d]+)/
        )
        if (stripped)
          return {
            player: stripped[1],
            x: Number(stripped[2]),
            y: Number(stripped[3]),
            z: Number(stripped[4])
          }
      },
      parseUuidEvent(string: string) {
        const stripped = string.match(
          /]:\sUUID\sof\splayer\s([\w]+)\sis\s([a-z0-9-]+)/
        )
        if (stripped)
          return {
            player: stripped[1],
            uuid: stripped[2]
          }
      },
      parseDoneEvent(string: string) {
        // Extract the number of seconds between parentheses before the exclamation mark
        const regex = /Done \(([\d.]+)s\)!/
        const match = string.match(regex)
        if (match)
          return {
            seconds: match[1]
          }
      },
      parseTakenEvent(string: string) {
        const stripped = string.match(
          /Gave\s-([\w]+)\sexperience\slevels\sto\s([\w]+)/
        )
        if (stripped)
          return {
            player: stripped[2],
            amount: Number(stripped[1])
          }
      },
      parseClearedEvent(string: string) {
        const stripped = string.match(
          /Removed\s([\w]+)\sitems\sfrom\splayer\s([\w]+)/
          // /Cleared\sthe\sinventory\sof\s([\w]+),\sremoving\s([\w]+)/
        )
        if (stripped)
          return {
            player: stripped[2],
            amount: Number(stripped[1])
          }
      },
      parseSlainEvent(string: string) {
        const stripped = string.match(/([\w]+).was.(.+).by.([\w]+)/)
        if (stripped)
          return {
            player: stripped[1],
            by: stripped[2],
            killer: stripped[3]
          }
      }
    }
  }
}

const EVENTS_MAP: [
  keyof JavaServerEvents,
  keyof EventConfig['flavorSpecific']
][] = [
  ['chat', 'parseChatEvent'],
  ['overloaded', 'parseOverloadedEvent'],
  ['login', 'parseLoginEvent'],
  ['logout', 'parseLogoutEvent'],
  ['achievement', 'parseAchievementEvent'],
  ['teleported', 'parseTeleportedEvent'],
  ['uuid', 'parseUuidEvent'],
  ['done', 'parseDoneEvent'],
  ['taken', 'parseTakenEvent'],
  ['cleared', 'parseClearedEvent'],
  ['slain', 'parseSlainEvent'],
  ['terminal', 'parseTerminalEvent']
]

export function useEvent(javaServer: JavaServer) {
  if (javaServer.config?.event?.initialized) return

  defaultsDeep(javaServer.config, { event: DEFAULT_EVENT_CONFIG })
  javaServer.config.event.initialized = true

  javaServer.on('console', consoleLine => {
    const result = EVENTS_MAP.reduce<null | {
      event: keyof JavaServerEvents
      payload: any
    }>((acc, event) => {
      if (acc) return acc

      const parseEvent = get(
        javaServer.config.event,
        `flavorSpecific.${javaServer.config.flavor}.${event[1]}`,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        javaServer.config.event.flavorSpecific.default[event[1]]
      )
      const matches = parseEvent(consoleLine)
      if (matches) return { event: event[0], payload: matches }

      return null
    }, null)

    if (result) {
      result.payload.timestamp = Date.now()
      javaServer.emit(result.event, result.payload)
    }
  })
}
