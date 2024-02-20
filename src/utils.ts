import { ServerConfig } from './types'
import path from 'path'
import fs from 'fs'
import extract from 'extract-zip'
const axios = require('axios')

interface VersionManifest {
  latest: {
    release: string
  }
  versions: Array<{
    id: string
    type: string
    url: string
  }>
}

interface VersionDetails {
  downloads: {
    server: {
      sha1: string
      size: number
      url: string
    }
  }
}

const doesFileExist = async (filePath: string): Promise<boolean> => {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK)

    return true
  } catch {
    return false
  }
}
const downloadFile = async (url: string, path: string): Promise<void> => {
  const response = await axios({
    method: 'get',
    url,
    responseType: 'stream'
  })

  const writer = fs.createWriteStream(path)
  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}
export const fetchLatestServerUrl = async (): Promise<string> => {
  // Fetch the version manifest
  // @ts-ignore
  const versionManifestResponse = await axios.get<VersionManifest>(
    'https://launchermeta.mojang.com/mc/game/version_manifest.json'
  )
  const latestVersionId = versionManifestResponse.data.latest.release
  const latestVersionInfo = versionManifestResponse.data.versions.find(
    (version: { id: any }) => version.id === latestVersionId
  )

  console.log('Latest version info:', latestVersionInfo)

  if (!latestVersionInfo) throw new Error('Unable to find latest version info.')

  // Fetch the version details to get the server JAR URL
  // @ts-ignore
  const versionDetailsResponse = await axios.get<VersionDetails>(
    latestVersionInfo.url
  )

  return versionDetailsResponse.data.downloads.server.url
}
const downloadLatestServerJar = async (path: string): Promise<void> => {
  const latestServerUrl = await fetchLatestServerUrl()
  console.log('Latest server JAR URL:', latestServerUrl)
  console.log('Downloading latest server JAR...')
  await downloadFile(latestServerUrl, path)
  console.log('Download of the latest server JAR completed!')
}
export const checkAndDownloadServerJar = async (
  config: ServerConfig
): Promise<void> => {
  const javaServerConfig = config.javaServer
  const jarPath = `${javaServerConfig?.path}/${javaServerConfig?.jar}`

  const fileExists = await doesFileExist(jarPath)

  if (!fileExists) {
    console.log('Server JAR not found, downloading the latest version...')
    await downloadLatestServerJar(jarPath)
  } else console.log('Server JAR already exists, proceeding.')
}
export const acceptEula = async (
  minecraftFolderPath: string
): Promise<void> => {
  const eulaPath = path.join(minecraftFolderPath, 'eula.txt')

  fs.writeFileSync(eulaPath, 'eula=true\n')
  console.log('EULA has been accepted in eula.txt.')
}
export const prepareMinecraftServer = async (
  config: ServerConfig
): Promise<void> => {
  // Check if serverProperties exists in config
  if (config.serverProperties) {
    // Create a map for special keys
    const specialKeyMap: any = {
      rconPassword: 'rcon.password',
      rconPort: 'rcon.port',
      queryPort: 'query.port'
      // Add more if needed
    }

    // Convert serverProperties object into server.properties format
    const properties = Object.entries(config.serverProperties)
      .map(([key, value]) => {
        // Check if key is in specialKeyMap
        const correctKey = specialKeyMap[key]
          ? specialKeyMap[key]
          : key.replace(/([A-Z])/g, '-$1').toLowerCase() // Replace camel case with hyphens

        return `${correctKey}=${value}`
      })
      .join('\n')

    // Add the specified lines at the beginning
    const propertiesWithHeader = `#Minecraft server properties\n#Sun Nov 19 19:14:43 UTC 2023\n${properties}`

    const filePath = config.javaServer?.path ? config.javaServer?.path : ''

    // Check if world/level.dat exists and then if not do await downloadWorld()
    // const worldPath = path.join(filePath, 'world/level.dat')
    // try {
    //   await fs.promises.access(worldPath, fs.constants.F_OK)
    //   console.log('world already exists, proceeding.')
    // } catch (e) {
    //   console.log('world not found, downloading...')
    //   await downloadWorld()
    // }

    // Check if file exists and then write to server.properties file
    if (filePath) {
      const propertiesFilePath = path.join(filePath, 'server.properties')

      await fs.promises.writeFile(propertiesFilePath, propertiesWithHeader)

      try {
        await fs.promises.access(propertiesFilePath, fs.constants.F_OK)
        console.log('overwriting server.properties...')
      } catch (e) {
        console.log('creating server.properties...')
      }
    }
  }
}

export const downloadWorld = async () => {
  const filePath = process.env.MC_PATH || '/app/minecraft'
  try {
    console.log('downloading world...')
    await downloadFile(
      'https://files.janis.io/world.zip',
      filePath + '/world.zip'
    )
    console.log('unzipping world...')
    await extract(filePath + '/world.zip', { dir: filePath + '/world' })
    console.log('world has been unzipped')
  } catch (err) {
    // handle any errors
    console.error(err)
  }
}
export const updateBluemapConfigFile = (filePath: string): void => {
  fs.readFile(filePath, 'utf8', function (err, data) {
    if (err) {
      console.log('Error reading file:', err)

      return
    }

    const updatedData = data.replace(
      'accept-download: false',
      'accept-download: true'
    )

    fs.writeFile(filePath, updatedData, 'utf8', function (err) {
      if (err) console.log('Error writing file:', err)
    })
  })
}
