import { red } from 'kolorist'
import { has } from 'lodash-es'
import type { ConfigKeys } from '../core/config.js'
import { getConfig, resolveConfig, setConfigs } from '../core/config.js'
import { KnownError } from '../core/error.js'

export interface ConfigCLIOptions {
  '--'?: string[]
  host?: string
  locale?: string
  model?: string
  apiKey?: string
  apiOrg?: string
  proxy?: string
  timeout?: number
}

export interface AIConfigOptions {
  mode: string
  keyValue: string[] // inputs key=value
  options: ConfigCLIOptions
}

export default function aiconfig({ mode, keyValue, options }: AIConfigOptions) {
  return (async () => {
    const keyValues = await resolveConfig(keyValue, options)
    if (mode === 'get') {
      const config = await getConfig({}, true)
      if (!keyValues.length) {
        Object.entries(config).forEach(([key, value]) => {
          console.log(`${key}=${value ?? ''}`)
        })
        return
      }

      for (const [key] of keyValues) {
        if (has(config, key))
          console.log(`${key}=${config[key as ConfigKeys]}`)
      }
      return
    }

    if (mode === 'set') {
      await setConfigs(keyValues as [string, string][])
      return
    }

    throw new KnownError(`Invalid mode: ${mode}`)
  })().catch((error) => {
    console.error(`${red('✖')} ${error.message}`)
    process.exit(1)
  })
}
