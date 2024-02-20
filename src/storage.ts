import { DirectConnection, Document } from '@hocuspocus/server'
import { Enchanted } from './enchanted'
import { Y } from '@syncedstore/core'

interface IStorage {
  connect(
    documentName: string,
    callback: (doc: Document) => void
  ): Promise<void>
  disconnect(): Promise<void>
}

class Storage implements IStorage {
  private static instance: IStorage

  private server: Enchanted | undefined
  private connection: DirectConnection | undefined

  public async connect(
    documentName: string,
    callback: (doc: Document) => void
  ) {
    for (let i = 0; i < 100; i++)
      if (this.server) break
      else await new Promise(resolve => setTimeout(resolve, 1000))
    if (this.server) {
      this.connection = await this.server.openDirectConnection(documentName, {})
      if (this.connection)
        await this.connection
          .transact(doc => {
            console.log('connect:transacting', documentName)
            callback(doc)
          })
          .then(() => {
            this.disconnect()
          })
    } else throw new Error('Storage unavailable')
  }

  public async openConnection(
    documentName: string,
    callback: (doc: Document) => void
  ) {
    for (let i = 0; i < 100; i++)
      if (this.server) break
      else await new Promise(resolve => setTimeout(resolve, 1000))
    if (this.server) {
      this.connection = await this.server.openDirectConnection(documentName, {})
      if (this.connection)
        return await this.connection.transact(doc => {
          console.log('openConnection:transacting', documentName)
          callback(doc)
        })
    } else throw new Error('Storage unavailable')
  }

  // method to read a yMap value from a document
  public async readMap(documentName: string, map: string, key: string) {
    if (!documentName || !map || !key) return
    console.log('readMap', documentName, map, key)
    let mapResult: any
    await this.connect(documentName, doc => {
      mapResult = doc.getMap(map).get(key)
    })

    return mapResult
  }

  // method to write a yMap value to a document
  public async writeMap(
    documentName: string,
    map: string,
    key: string,
    value: unknown
  ) {
    if (!documentName || !map || !key || !value)
      throw new Error('Invalid parameters')
    console.log('writeMap', documentName, map, key, value)
    await this.connect(documentName, doc => {
      doc.getMap(map).set(key, value)
    })
  }

  // method to delete a yMap value from a document
  public async deleteMap(documentName: string, map: string, key: string) {
    if (!documentName || !map || !key) throw new Error('Invalid parameters')
    console.log('deleteMap', documentName, map, key)
    await this.connect(documentName, doc => {
      doc.getMap(map).delete(key)
    })
  }

  // method to read a yArray value from a document
  public async readArrayAt(documentName: string, array: string, index: number) {
    if (!documentName || !array || !index) throw new Error('Invalid parameters')
    console.log('readArrayAt', documentName, array, index)
    let arrayResult
    await this.connect(documentName, doc => {
      arrayResult = doc.getArray(array).get(index)
    })

    return arrayResult
  }

  // method to write a yArray value to a document
  public async writeArrayAt(
    documentName: string,
    array: string,
    index: number,
    value: unknown
  ) {
    if (!documentName || !array || !index || !value)
      throw new Error('Invalid parameters')
    console.log('writeArrayAt', documentName, array, index, value)
    await this.connect(documentName, doc => {
      doc.getArray(array).insert(index, [value])
    })
  }

  // method to delete a yArray value from a document
  public async deleteArrayAt(
    documentName: string,
    array: string,
    index: number
  ) {
    if (!documentName || !array || !index) throw new Error('Invalid parameters')
    console.log('deleteArrayAt', documentName, array, index)
    await this.connect(documentName, doc => {
      doc.getArray(array).delete(index, 1)
    })
  }

  public async readArrayLength(documentName: string, array: string) {
    if (!documentName || !array) throw new Error('Invalid parameters')
    console.log('readArrayLength', documentName, array)
    let arrayResult
    await this.connect(documentName, doc => {
      arrayResult = doc.getArray(array).length
    })

    return arrayResult
  }

  public async pushToArray(
    documentName: string,
    array: string,
    value: unknown
  ) {
    if (!documentName || !array || !value) throw new Error('Invalid parameters')
    console.log('pushToArray', documentName, array, value)
    await this.connect(documentName, doc => {
      doc.getArray(array).push([value])
    })
    console.log('pushed to array')
  }

  public async getArray(documentName: string, array: string) {
    if (!documentName || !array) throw new Error('Invalid parameters')
    console.log('getArray', documentName, array)
    let arrayResult
    await this.connect(documentName, doc => {
      arrayResult = doc.getArray(array)
    })

    return arrayResult
  }

  // method to read a yText value from a document
  public async readText(documentName: string, text: string) {
    console.log('readText', documentName, text)
    let textResult
    await this.connect(documentName, doc => {
      textResult = doc.getText(text).toString()
    })

    return textResult
  }

  // method to write a yText value to a document
  public async writeText(documentName: string, text: string, value: string) {
    console.log('writeText', documentName, text, value)
    await this.connect(documentName, doc => {
      doc.getText(text).insert(0, value)
    })
  }

  // method to delete a yText value from a document
  public async deleteText(documentName: string, text: string) {
    console.log('deleteText', documentName, text)
    await this.connect(documentName, doc => {
      doc.getText(text).delete(0, doc.getText(text).length)
    })
  }

  // method to read a yXmlFragment value from a document
  public async readXml(documentName: string, xml: string) {
    console.log('readXml', documentName, xml)
    let xmlResult
    await this.connect(documentName, doc => {
      xmlResult = doc.getXmlFragment(xml).toString()
    })

    return xmlResult
  }

  public async disconnect() {
    this.connection?.disconnect()
  }

  public static getInstance(): Storage {
    if (!Storage.instance) Storage.instance = new Storage()

    return <Storage>Storage.instance
  }

  setServer(server: Enchanted) {
    this.server = server
  }
}

export default Storage
