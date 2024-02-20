import { JavaServer } from '@scriptserver/core'

export function useLogger(javaServer: JavaServer) {
  javaServer.on('chat', event => {
    console.log(event)
  })
  javaServer.on('login', event => {
    console.log(event)
  })
  javaServer.on('logout', event => {
    console.log(event)
  })
  javaServer.on('achievement', event => {
    console.log(event)
  })
  javaServer.on('teleported', event => {
    console.log(event)
  })
  javaServer.on('uuid', event => {
    console.log(event)
  })
  javaServer.on('done', event => {
    console.log(event)
  })
  javaServer.on('taken', event => {
    console.log(event)
  })
  javaServer.on('cleared', event => {
    console.log(event)
  })
  javaServer.on('slain', event => {
    console.log(event)
  })
}
